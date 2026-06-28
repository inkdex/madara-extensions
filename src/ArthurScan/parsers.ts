/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type Chapter,
  type DiscoverSection,
  type DiscoverSectionItem,
  DiscoverSectionType,
  type SourceManga,
} from "@paperback/types";
import type { CheerioAPI } from "cheerio";

import { getUsePostIds } from "../generic/forms";
import { MadaraGeneric } from "../generic/main";
import { MadaraParser } from "../generic/parsers";

// Overrides for ArthurScan's "Madara X" theme: `div.manga__item` search and
// discover markup, and Portuguese chapter dates.
export class ArthurScanParser extends MadaraParser {
  override async parseSearchResults($: CheerioAPI, source: MadaraGeneric) {
    const results = [];

    for (const obj of $(source.searchMangaSelector).toArray()) {
      const titleAnchor = $("div.post-title a", obj).first();

      const slug: string =
        (titleAnchor.attr("href") ?? $("a", obj).attr("href") ?? "")
          .replace(/\/$/, "")
          .split("/")
          .pop() ?? "";

      if (!slug) {
        throw new Error(`Unable to parse slug  (${slug})!`);
      }

      const title: string = titleAnchor.text().trim();
      const image: string = encodeURI(await this.getImageSrc($("img", obj), source));

      results.push({
        slug: slug,
        image: image,
        title: Application.decodeHTMLEntities(title),
        subtitle: "",
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

    for (const obj of $("div.manga__item").toArray()) {
      const titleAnchor = $("div.post-title a", obj).first();

      const slug: string =
        (titleAnchor.attr("href") ?? "").replace(/\/$/, "").split("/").pop() ?? "";
      const title: string = titleAnchor.text().trim();

      if (!slug || !title) {
        continue;
      }

      const image: string = encodeURI(
        (await this.getImageSrc($("img", obj).first(), source)) ?? "",
      );
      const subtitle: string = $("div.list-chapter span.chapter", obj).first().text().trim();

      const mangaId: string = getUsePostIds(source.usePostIds)
        ? (await source.getPostAndSlug(slug)).postId
        : slug;

      const base = {
        mangaId: mangaId,
        imageUrl: image,
        title: Application.decodeHTMLEntities(title),
      };

      switch (section.type) {
        case DiscoverSectionType.featured:
          items.push({
            ...base,
            supertitle: Application.decodeHTMLEntities(subtitle),
            type: "featuredCarouselItem",
          });
          break;

        case DiscoverSectionType.prominentCarousel:
          items.push({
            ...base,
            subtitle: Application.decodeHTMLEntities(subtitle),
            type: "prominentCarouselItem",
          });
          break;

        default:
          items.push({
            ...base,
            subtitle: Application.decodeHTMLEntities(subtitle),
            type: "simpleCarouselItem",
          });
          break;
      }
    }

    return items;
  }

  override parseChapterList(
    $: CheerioAPI,
    sourceManga: SourceManga,
    source: MadaraGeneric,
  ): Chapter[] {
    const chapters: Chapter[] = [];
    const nodeArray = $("li.wp-manga-chapter  ").toArray();
    let nodesProcessed = 0;

    for (const obj of nodeArray) {
      const sortingIndex = nodeArray.length - nodesProcessed++;
      const id = this.idCleaner($("a", obj).first().attr("href") ?? "");

      const chapName = $("a", obj).first().text().trim() ?? "";
      const chapNumRegex = id.match(
        /(?:chapter|ch.*?)(\d+\.?\d?(?:[-_]\d+)?)|(\d+\.?\d?(?:[-_]\d+)?)$/,
      );
      let chapNum: string | number =
        chapNumRegex && chapNumRegex[1]
          ? chapNumRegex[1].replace(/[-_]/gm, ".")
          : (chapNumRegex?.[2] ?? "0");
      chapNum = parseFloat(chapNum) ?? 0;

      const titleDate = $("span.chapter-release-date a", obj).attr("title");
      const dateText =
        titleDate && titleDate.trim()
          ? titleDate.trim()
          : $("span.chapter-release-date", obj).text().trim();
      let mangaTime = this.parseDate(dateText);
      if (!mangaTime.getTime()) mangaTime = new Date();

      if (!id || typeof id === "undefined" || id === "#") {
        console.log(
          `Could not parse out ID when getting chapters for mangaId:${sourceManga.mangaId} parsedId: ${id}`,
        );
        continue;
      }

      chapters.push({
        sourceManga: sourceManga,
        chapterId: id,
        langCode: source.language,
        chapNum: chapNum,
        title: chapName ? Application.decodeHTMLEntities(chapName) : "",
        publishDate: mangaTime,
        sortingIndex: sortingIndex,
        volume: 0,
      });
    }

    return chapters;
  }

  override parseDate = (date: string): Date => {
    const original = date.trim();
    const lower = original.toLowerCase();

    if (lower.includes("agora") || lower.includes("há poucos segundos")) {
      return new Date();
    }

    const timeUnits: Record<string, number> = {
      ano: 31556952000,
      anos: 31556952000,
      mês: 2592000000,
      mes: 2592000000,
      meses: 2592000000,
      semana: 604800000,
      semanas: 604800000,
      dia: 86400000,
      dias: 86400000,
      hora: 3600000,
      horas: 3600000,
      minuto: 60000,
      minutos: 60000,
      segundo: 1000,
      segundos: 1000,
    };

    const relativeMatch = lower.match(
      /(\d+)\s*(anos?|meses|m[êe]s|semanas?|dias?|horas?|minutos?|segundos?)/,
    );
    if (relativeMatch) {
      const [, numStr, unit] = relativeMatch;
      return new Date(Date.now() - Number(numStr) * timeUnits[unit]);
    }

    const months: Record<string, string> = {
      janeiro: "January",
      fevereiro: "February",
      março: "March",
      marco: "March",
      abril: "April",
      maio: "May",
      junho: "June",
      julho: "July",
      agosto: "August",
      setembro: "September",
      outubro: "October",
      novembro: "November",
      dezembro: "December",
    };

    let normalized = original;
    for (const [pt, en] of Object.entries(months)) {
      normalized = normalized.replace(new RegExp(pt, "gi"), en);
    }

    const parsed = new Date(normalized);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };
}
