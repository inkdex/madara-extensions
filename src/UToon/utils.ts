/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

const BOOK_TYPES = ["MangaToon", "Manwha", "Manhwa", "Manhua", "Manga"] as const;
type BookType = (typeof BOOK_TYPES)[number];

interface ParsedSynopsis {
  bookTypes: BookType[];
  alternativeNames: string[];
  synopsis: string;
}

/**
 * Parses a synopsis string that may optionally begin with a "Read" header:
 *
 *   Read <BookType> [/ <BookType>]* <AltName> [/ <AltName>]*
 *
 *   <synopsis text>
 *
 * If no "Read" header is present, the entire string is treated as the synopsis.
 */
export function parseSynopsis(synopsisText: string): ParsedSynopsis {
  const lines = synopsisText.split("\n");
  const firstLine = lines[0].trim();

  // ── No "Read" header → entire text is the synopsis ──────────────────────
  const readMatch = firstLine.match(/^Read\s+(.+)$/);
  if (!readMatch) {
    return { bookTypes: [], alternativeNames: [], synopsis: synopsisText.trim() };
  }

  // ── Parse "BookType [/ BookType]* AltName [/ AltName]*" ─────────────────
  // Split on " / " separators to get individual tokens
  const parts = readMatch[1].split(/\s*\/\s*/);

  const bookTypes: BookType[] = [];
  const alternativeNames: string[] = [];

  for (const part of parts) {
    const token = part.trim();
    if (!token) continue;

    let recognized = false;

    // NOTE: MangaToon must be checked before Manga to avoid prefix collision
    for (const bookType of BOOK_TYPES) {
      if (token === bookType) {
        // Pure book-type token:  "... / Manga / ..."
        if (!bookTypes.includes(bookType)) bookTypes.push(bookType);
        recognized = true;
        break;
      }

      if (token.startsWith(`${bookType} `)) {
        // Book-type prefix + first alternative name in the same token:
        // e.g. "Manwha The Great Mage"  or  "Manga 대마법사의 귀환"
        if (!bookTypes.includes(bookType)) bookTypes.push(bookType);
        const altName = token.slice(bookType.length).trim();
        if (altName) alternativeNames.push(altName);
        recognized = true;
        break;
      }
    }

    if (!recognized) {
      // Pure alternative name token
      alternativeNames.push(token);
    }
  }

  // ── Extract synopsis: everything after the first blank line ───────────────
  let synopsisStartIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") {
      synopsisStartIndex = i + 1;
      break;
    }
  }
  // Fallback: no blank line separator → take everything from line 1 onward
  if (synopsisStartIndex === -1) {
    synopsisStartIndex = lines.length > 1 ? 1 : lines.length;
  }

  const synopsis = lines.slice(synopsisStartIndex).join("\n").trim();

  return { bookTypes, alternativeNames, synopsis };
}

/**
 * Normalises a title for comparison purposes only —
 * collapses whitespace and lowercases, but doesn't mutate the stored value.
 */
function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Merges two alternative-name lists, deduplicating case-insensitively.
 *
 * - `existingNames` is kept first, preserving its original casing.
 * - Titles from `parsedNames` are appended only if not already present.
 * - The comparison is case- and whitespace-insensitive ("the mage" === "The Mage").
 */
export function mergeAlternativeNames(existingNames: string[], parsedNames: string[]): string[] {
  // Seed the seen-set with every title already in the existing list
  const seen = new Set(existingNames.map(normalizeTitle));
  const merged = [...existingNames];

  for (const name of parsedNames) {
    const key = normalizeTitle(name);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(name); // preserve original casing from the parsed list
    }
  }

  return merged;
}
