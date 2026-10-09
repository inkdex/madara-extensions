/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ContentRating,
  type Chapter,
  type SourceManga,
  type Tag,
  type TagSection,
} from "@paperback/types";
import type { CheerioAPI } from "cheerio";

import type { MadaraGeneric } from "../generic/main";
import { MadaraParser } from "../generic/parsers";

const getAuthorsByLabel = ($: CheerioAPI, label: string): string[] => {
  const values: string[] = [];
  $("#ori-sr-infos dl dt").each((_, dt) => {
    if ($(dt).text().trim() === label) {
      $(dt)
        .next("dd")
        .find("a")
        .each((_, a) => {
          values.push($(a).text().trim());
        });
    }
  });
  return values;
};

export class MangaOriginesParser extends MadaraParser {
  override async parseMangaDetails(
    $: CheerioAPI,
    mangaId: string,
    source: MadaraGeneric,
  ): Promise<SourceManga> {
    const title: string = Application.decodeHTMLEntities(
      $("div.post-title h1, div#manga-title h1").children().remove().end().text().trim(),
    );

    const secondaryTitleBox = $("h5:contains(Alternative), h5:contains(Alt Name(s))")
      .parent()
      .next();
    const secondaryTitles: string[] = [];

    for (const title of secondaryTitleBox
      .text()
      .trim()
      .split(/\s*[/,;]\s*/)) {
      if (title == "" || !title) {
        continue;
      }

      secondaryTitles.push(Application.decodeHTMLEntities(title?.trim()));
    }

    const author: string = getAuthorsByLabel($, "Scénario").join(", ");

    const artist: string = getAuthorsByLabel($, "Dessin").join(", ");

    const synopsis: string = Application.decodeHTMLEntities(
      $("div.ori-sr-syn-texte > p")
        .map((_, el) => $(el).text().trim())
        .get()
        .join("\n"),
    ).trim();

    const shareUrl: string = `${source.domain}/?p=${mangaId}`;

    const rating: number = Number($(".ori-sr-note-val").contents().first().text().trim()) / 5 || 0;

    const image: string = encodeURI(
      await this.getImageSrc($("div.ori-sr-cover img").first(), source),
    );

    const status: string = $("span.ori-sr-badge-statut").text().trim();

    let contentRating = source.defaultContentRating;

    const genres: Tag[] = [];
    for (const obj of $("div.ori-sr-genres a").toArray()) {
      const title = $(obj).text();
      const id = this.idCleaner($(obj).attr("href") ?? "");

      if (!title || !id) continue;

      // If item contains NSFW, set item to adult
      if (["adult", "mature"].includes(title.toLowerCase())) {
        contentRating = ContentRating.ADULT;
      }

      genres.push({ title: title, id: id });
    }
    const tagGroups: TagSection[] = [{ title: "genres", id: "genres", tags: genres }];

    return {
      mangaId,
      mangaInfo: {
        shareUrl: shareUrl,
        rating: rating,
        primaryTitle: title,
        secondaryTitles: secondaryTitles,
        thumbnailUrl: image,
        author: author,
        artist: artist,
        tagGroups: tagGroups,
        synopsis: synopsis,
        contentRating: contentRating,
        status: status,
      },
    };
  }

  override parseChapterList(
    $: CheerioAPI,
    sourceManga: SourceManga,
    source: MadaraGeneric,
  ): Chapter[] {
    const chapters: Chapter[] = [];
    const nodeArray = $("div.ori-chl-liste div.ori-chl-row").toArray();
    let nodesProcessed = 0;

    // For each available chapter..
    for (const obj of nodeArray) {
      const sortingIndex = nodeArray.length - nodesProcessed++;
      const id = this.idCleaner($("a", obj).first().attr("href") ?? "");
      const chapName = $("a", obj).eq(1).text().trim() ?? "";
      const chapNumRegex = id.match(
        /(?:chapter|ch|Chapitre.*?)(\d+\.?\d?(?:[-_]\d+)?)|(\d+\.?\d?(?:[-_]\d+)?)$/,
      );
      let chapNum: string | number =
        chapNumRegex && chapNumRegex[1]
          ? chapNumRegex[1].replace(/[-_,]/gm, ".")
          : (chapNumRegex?.[2] ?? "0");

      // make sure the chapter number is a number and not NaN
      chapNum = parseFloat(chapNum) ?? 0;
      let mangaTime: Date;
      const timeSelector = $(
        "span.ori-chl-date, span.chapter-release-date > a, span.chapter-release-date > span.c-new-tag > a",
        obj,
      )
        .text()
        .trim();
      if (typeof timeSelector !== "undefined") {
        // Firstly check if there is a NEW tag, if so parse the time from this
        const [d, m, y] = timeSelector.split("/").map(Number);
        mangaTime = new Date(Date.UTC(2000 + y, m - 1, d));
      } else {
        // Else get the date from the info box
        mangaTime = this.parseDate($("span.chapter-release-date > i", obj).text().trim());
      }

      // Check if the date is a valid date, else return the current date
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

  override async parseSearchResults($: CheerioAPI, source: MadaraGeneric) {
    const results = [];

    for (const obj of $(source.searchMangaSelector).toArray()) {
      const slug: string = ($(obj).attr("href") ?? "").replace(/\/$/, "").split("/").pop() ?? "";

      if (!slug) {
        throw new Error(`Unable to parse slug  (${slug})!`);
      }

      const title: string = $(".ori-card-title", obj).text().trim() ?? "";
      const image: string = encodeURI(await this.getImageSrc($("img", obj), source));
      const rating: string =
        $(source.searchRatingSelector, obj)
          .contents()
          .filter((_, el) => el.type === "text")
          .text()
          .trim() ?? "";
      const subtitle: string = $(".ori-card-sub", obj).text().trim();

      results.push({
        slug: slug,
        image: image,
        title: Application.decodeHTMLEntities(title),
        subtitle: Application.decodeHTMLEntities(
          subtitle ? `${subtitle} | ⭐${rating}` : `⭐${rating}`,
        ),
      });
    }

    return results;
  }

  override async parseSearchTags($: CheerioAPI): Promise<TagSection[]> {
    const genres: Tag[] = [];

    for (const obj of $("#ori-f-genres label").toArray()) {
      const title = $(".ori-flabel", obj).text().trim();
      const id = $("input", obj).attr("value") ?? "";

      if (!id || !title) continue;

      genres.push({ title: title, id: id });
    }
    console.log("genres:", genres);

    const TagSections: TagSection[] = [{ title: "Genres", id: "genres", tags: genres }];

    return TagSections;
  }
}
