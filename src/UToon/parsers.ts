/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import type { CheerioAPI } from "cheerio";

import { MadaraGeneric } from "../generic/main";
import { MadaraParser } from "../generic/parsers";
import { BOOK_TYPES, type BookType, type ParsedSynopsis } from "./models";

export class UToonParser extends MadaraParser {
  override async parseSearchResults($: CheerioAPI, source: MadaraGeneric) {
    const results: {
      slug: string;
      image: string;
      title: string;
      subtitle: string;
    }[] = [];
    const seen = new Set<string>();

    for (const obj of $("a.acard").toArray()) {
      const href = $(obj).attr("href") ?? "";
      const slug = href.replace(/\/$/, "").split("/").pop() ?? "";
      if (!slug || seen.has(slug)) {
        continue;
      }

      const img = $("img", obj).first();
      const title = $("div.ac-t", obj).first().text().trim() || (img.attr("alt") ?? "").trim();
      if (!title) {
        continue;
      }

      const subtitle = $("div.ac-ch", obj).first().text().trim();

      seen.add(slug);
      results.push({
        slug,
        image: encodeURI(await this.getImageSrc(img, source)),
        title: Application.decodeHTMLEntities(title),
        subtitle: subtitle ? Application.decodeHTMLEntities(subtitle) : "",
      });
    }

    return results;
  }

  override async parseDiscoverSections(
    $: CheerioAPI,
    section: DiscoverSection,
    source: MadaraGeneric,
  ): Promise<DiscoverSectionItem[]> {
    const items: DiscoverSectionItem[] = [];

    for (const card of await this.parseSearchResults($, source)) {
      const base = {
        mangaId: card.slug,
        imageUrl: card.image,
        title: card.title,
      };

      switch (section.type) {
        case DiscoverSectionType.featured:
          items.push({
            ...base,
            supertitle: card.subtitle,
            type: "featuredCarouselItem",
          });
          break;
        case DiscoverSectionType.prominentCarousel:
          items.push({
            ...base,
            subtitle: card.subtitle,
            type: "prominentCarouselItem",
          });
          break;
        default:
          items.push({
            ...base,
            subtitle: card.subtitle,
            type: "simpleCarouselItem",
          });
          break;
      }
    }

    return items;
  }

  override async parseMangaDetails(
    $: CheerioAPI,
    mangaId: string,
    source: MadaraGeneric,
  ): Promise<SourceManga> {
    const primaryTitle = Application.decodeHTMLEntities($("h1.htitle").first().text().trim());

    const secondaryTitles: string[] = [];
    $("div.halt-list span.halt-tag").each((_, el) => {
      const alt = Application.decodeHTMLEntities($(el).text().trim());
      if (alt && alt !== primaryTitle && !secondaryTitles.includes(alt)) {
        secondaryTitles.push(alt);
      }
    });

    // Poster, falling back to the hero background, then og:image.
    let thumbnailUrl = await this.getImageSrc($("div.poster img").first(), source);
    if (!thumbnailUrl) {
      const heroStyle = $("div.hero__bg").first().attr("style") ?? "";
      const bg = heroStyle.match(/url\(\s*['"]?([^'")]+)['"]?\s*\)/i);
      if (bg && bg[1]) {
        thumbnailUrl = bg[1].trim();
      }
    }
    if (!thumbnailUrl) {
      thumbnailUrl = ($('meta[property="og:image"]').first().attr("content") ?? "").trim();
    }
    thumbnailUrl = encodeURI(thumbnailUrl);

    const parsed = parseSynopsis(
      Application.decodeHTMLEntities($("div.syn, #syn").first().text().trim()),
    );
    const synopsis = parsed.synopsis;
    const allSecondaryTitles = mergeAlternativeNames(
      secondaryTitles,
      parsed.alternativeNames,
    ).filter((title) => title.toLowerCase() !== primaryTitle.toLowerCase());

    const info: Record<string, string> = {};
    $("div.sinfo-grid div.sir").each((_, el) => {
      const label = $(el).find("span.l").text().trim().toLowerCase();
      const value = $(el).find("span.v").text().trim();
      if (label) {
        info[label] = value;
      }
    });

    const author =
      info["author"] && !/^\d+$/.test(info["author"])
        ? Application.decodeHTMLEntities(info["author"])
        : "";

    const genreTags: Tag[] = [];
    const seenGenre = new Set<string>();
    const pushGenre = (name: string): void => {
      const title = name.trim();
      if (!title) {
        return;
      }
      const id = title.toLowerCase().replace(/\s+/g, "-");
      if (seenGenre.has(id)) {
        return;
      }
      seenGenre.add(id);
      genreTags.push({ id, title });
    };
    for (const el of $("div.genres a.genre").toArray()) {
      pushGenre($(el).text());
    }
    if (info["type"]) {
      pushGenre(info["type"]);
    }
    for (const bookType of parsed.bookTypes) {
      pushGenre(bookType);
    }
    const tagGroups: TagSection[] = [{ id: "genres", title: "Genres", tags: genreTags }];

    // Score is "out of 5"; Paperback expects a 0–1 fraction, so divide by 5.
    let rating = 0;
    const ratingValue = parseFloat($("div.rc-score .rc-num, #rAvg").first().text().trim());
    if (!isNaN(ratingValue)) {
      rating = Math.max(0, Math.min(1, ratingValue / 5));
    }

    return {
      mangaId,
      mangaInfo: {
        primaryTitle,
        secondaryTitles: allSecondaryTitles,
        thumbnailUrl,
        author,
        synopsis,
        rating,
        contentRating: source.defaultContentRating,
        status: this.parseStatus(info["status"] ?? ""),
        tagGroups,
        shareUrl: `${source.domain}/${await source.getDirectoryPath()}/${mangaId}`,
      },
    };
  }

  // Full list lives in a `var CH=[...]` array; the DOM has only the first page.
  override parseChapterList(
    $: CheerioAPI,
    sourceManga: SourceManga,
    source: MadaraGeneric,
  ): Chapter[] {
    const embedded = this.parseEmbeddedChapters($.root().html() ?? "", sourceManga, source);
    if (embedded !== null) {
      return embedded;
    }
    return super.parseChapterList($, sourceManga, source);
  }

  private parseEmbeddedChapters(
    html: string,
    sourceManga: SourceManga,
    source: MadaraGeneric,
  ): Chapter[] | null {
    const literal = extractArrayLiteral(html, /var\s+CH\s*=\s*/);
    if (literal === null) {
      return null;
    }

    let raws: {
      label?: string;
      url?: string;
      ago?: string;
      locked?: boolean;
      num?: number;
    }[];
    try {
      raws = JSON.parse(literal);
    } catch {
      return null;
    }

    const chapters: Chapter[] = [];
    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i];
      if (!raw || !raw.url || raw.locked) {
        continue;
      }

      let chapterId: string;
      try {
        chapterId = this.idCleaner(raw.url); // throws on a url with no path tail; skip it
      } catch {
        continue;
      }

      const title = Application.decodeHTMLEntities((raw.label ?? "").trim());

      let chapNum = typeof raw.num === "number" ? raw.num : 0;
      if (!chapNum) {
        const numMatch = title.match(/chapter[.\s-]*(\d+(?:\.\d+)?)/i);
        if (numMatch && numMatch[1]) {
          chapNum = parseFloat(numMatch[1]);
        }
      }

      let publishDate = this.parseDate(raw.ago ?? "");
      if (!publishDate.getTime()) {
        publishDate = new Date();
      }

      chapters.push({
        sourceManga,
        chapterId,
        langCode: source.language,
        chapNum,
        title,
        publishDate,
        sortingIndex: raws.length - i,
        volume: 0,
      });
    }

    return chapters;
  }

  private parseStatus(raw: string): string {
    switch (raw.trim().toUpperCase()) {
      case "COMPLETED":
        return "Completed";
      case "HIATUS":
        return "Hiatus";
      case "CANCELLED":
      case "CANCELED":
      case "DROPPED":
        return "Cancelled";
      default:
        return "Ongoing";
    }
  }
}

// Balanced-bracket scan for the `[...]` array literal after `assignment`, ignoring brackets inside
// JSON strings. Returns null if no well-formed array is found.
function extractArrayLiteral(html: string, assignment: RegExp): string | null {
  const match = html.match(assignment);
  if (match?.index === undefined) {
    return null;
  }

  const start = html.indexOf("[", match.index + match[0].length);
  if (start === -1) {
    return null;
  }

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < html.length; i++) {
    const c = html[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "[") depth++;
    else if (c === "]" && --depth === 0) return html.slice(start, i + 1);
  }
  return null;
}

// Splits an optional "Read <BookType>... <AltName>..." header from the body.
export function parseSynopsis(synopsisText: string): ParsedSynopsis {
  const full = synopsisText.trim();
  const lines = full.split("\n");
  const headerIndex = lines.findIndex((line) => line.trim() !== "");
  const readMatch = lines[headerIndex]?.trim().match(/^Read\s+(.+)$/);

  // Body starts after a blank separator, else right after the header line. If the header IS the
  // whole text (no body), don't parse it — that would swallow the description into alt names.
  const separatorIndex = lines.findIndex((line, i) => i > headerIndex && line.trim() === "");
  const bodyIndex = separatorIndex === -1 ? headerIndex + 1 : separatorIndex + 1;
  if (!readMatch || bodyIndex >= lines.length) {
    return { bookTypes: [], alternativeNames: [], synopsis: full };
  }

  const bookTypes: BookType[] = [];
  const alternativeNames: string[] = [];

  for (const part of readMatch[1].split(/\s*\/\s*/)) {
    const token = part.trim();
    if (!token) continue;

    // BOOK_TYPES is ordered so MangaToon matches before Manga.
    const bookType = BOOK_TYPES.find((bt) => token === bt || token.startsWith(`${bt} `));
    if (bookType) {
      if (!bookTypes.includes(bookType)) bookTypes.push(bookType);
      // Book type and the first alt name can share one token, e.g. "Manhwa The Great Mage".
      const altName = token.slice(bookType.length).trim();
      if (altName) alternativeNames.push(altName);
    } else {
      alternativeNames.push(token);
    }
  }

  const synopsis = lines.slice(bodyIndex).join("\n").trim();

  return { bookTypes, alternativeNames, synopsis };
}

// Appends `parsedNames` to `existingNames`, deduping case- and whitespace-insensitively.
export function mergeAlternativeNames(existingNames: string[], parsedNames: string[]): string[] {
  const normalize = (title: string) => title.trim().toLowerCase().replace(/\s+/g, " ");
  const seen = new Set(existingNames.map(normalize));
  const merged = [...existingNames];

  for (const name of parsedNames) {
    if (!seen.has(normalize(name))) {
      seen.add(normalize(name));
      merged.push(name); // keep original casing
    }
  }

  return merged;
}
