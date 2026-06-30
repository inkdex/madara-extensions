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

  // The full list lives in a `var CH=[...]` array (the DOM has only the first page); falls back to Madara markup.
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
    const match = html.match(/var\s+CH\s*=\s*(\[[\s\S]*?\])\s*;/);
    if (!match || !match[1]) {
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
      raws = JSON.parse(match[1]);
    } catch {
      return null;
    }

    const chapters: Chapter[] = [];
    for (let i = 0; i < raws.length; i++) {
      const raw = raws[i];
      if (!raw || !raw.url || raw.locked) {
        continue;
      }

      const chapterId = this.idCleaner(raw.url);
      if (!chapterId) {
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

// Splits an optional "Read <BookType>... <AltName>..." header from the body; no header means it's all synopsis.
export function parseSynopsis(synopsisText: string): ParsedSynopsis {
  const lines = synopsisText.split("\n");
  const firstLine = lines[0].trim();

  const readMatch = firstLine.match(/^Read\s+(.+)$/);
  if (!readMatch) {
    return { bookTypes: [], alternativeNames: [], synopsis: synopsisText.trim() };
  }

  const parts = readMatch[1].split(/\s*\/\s*/);

  const bookTypes: BookType[] = [];
  const alternativeNames: string[] = [];

  for (const part of parts) {
    const token = part.trim();
    if (!token) continue;

    let recognized = false;

    // BOOK_TYPES order matters: MangaToon must be matched before Manga.
    for (const bookType of BOOK_TYPES) {
      if (token === bookType) {
        if (!bookTypes.includes(bookType)) bookTypes.push(bookType);
        recognized = true;
        break;
      }

      if (token.startsWith(`${bookType} `)) {
        // Book type and the first alt name share one token, e.g. "Manhwa The Great Mage".
        if (!bookTypes.includes(bookType)) bookTypes.push(bookType);
        const altName = token.slice(bookType.length).trim();
        if (altName) alternativeNames.push(altName);
        recognized = true;
        break;
      }
    }

    if (!recognized) {
      alternativeNames.push(token);
    }
  }

  // A blank line separates header from body; without one, the body starts right after the header.
  let synopsisStartIndex = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "") {
      synopsisStartIndex = i + 1;
      break;
    }
  }
  if (synopsisStartIndex === -1) {
    synopsisStartIndex = lines.length > 1 ? 1 : lines.length;
  }

  const synopsis = lines.slice(synopsisStartIndex).join("\n").trim();

  return { bookTypes, alternativeNames, synopsis };
}

function normalizeTitle(title: string): string {
  return title.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Appends `parsedNames` to `existingNames`, deduplicating case- and whitespace-insensitively. */
export function mergeAlternativeNames(existingNames: string[], parsedNames: string[]): string[] {
  const seen = new Set(existingNames.map(normalizeTitle));
  const merged = [...existingNames];

  for (const name of parsedNames) {
    const key = normalizeTitle(name);
    if (!seen.has(key)) {
      seen.add(key);
      merged.push(name); // push the original, not the normalized key, to keep casing
    }
  }

  return merged;
}
