/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  type SearchResultItem,
  type SearchQuery,
  type SortingOption,
  type PagedResults,
  URL,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { getUsePostIds } from "../generic/forms";
import { MadaraGeneric } from "../generic/main";
import type { MadaraSearchMetadata } from "../generic/models";
import { SORTING_OPTIONS, type Metadata } from "./models";
import { MangaOriginesParser } from "./parsers";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://mangas-origines.fr";

class MangaOriginesExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      searchMangaSelector: "a.ori-card.ori-cat-card",
      searchRatingSelector: ".ori-cat-note",
      parser: new MangaOriginesParser(),
      usePostIds: true,
      chapterEndpoint: 1,
    });
  }

  override async convertSlugToPostId(slug: string): Promise<number> {
    // Credit to the MadaraDex team :-D
    const [headResponse] = await Application.scheduleRequest({
      url: `${this.domain}/oeuvre/${slug}/`,
      method: "GET",
    });

    const postIdRegex = headResponse?.headers?.["link"]?.match(/\?p=(\d+)/);
    const postIdMatch = postIdRegex?.[1] ? Number(postIdRegex[1]) : NaN;
    if (!isNaN(postIdMatch)) {
      return postIdMatch;
    }

    // Move on to the alternative method of parsing
    const [, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/oeuvre/${slug}/`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    // Step 1: Try to get postId from shortlink
    const postId_1 = $('link[rel="shortlink"]')?.attr("href")?.split("/?p=")[1];
    if (postId_1) {
      const postId = Number(postId_1);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    // Step 2: If no number has been found, try to parse from data-post
    const postId_2 = $("a.wp-manga-action-button")?.attr("data-post");
    if (postId_2) {
      const postId = Number(postId_2);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    // Step 3: If no number has been found, try to parse from manga script
    const page = $.root().html();
    const match = page?.match(/manga_id["']?\s*:\s*["']?(\d+)/);
    if (match?.[1]) {
      const postId = Number(match[1]);
      if (!isNaN(postId)) {
        return postId;
      }
    }

    throw new Error(`Unable to fetch numeric postId for this item! slug:${slug}`);
  }

  override async getSortingOptions(): Promise<SortingOption[]> {
    return SORTING_OPTIONS;
  }

  override async getSearchResults(
    query: SearchQuery<MadaraSearchMetadata>,
    metadata: Metadata | undefined,
    sortingOption: SortingOption | undefined,
  ): Promise<PagedResults<SearchResultItem>> {
    const page = metadata?.page ?? 1;

    const [_response, buffer] = await this.constructSearchRequest(page, query, sortingOption);

    if (_response.status === 404) {
      return { items: [], metadata: undefined }; // Madara doesn't support last page checking, will return 404 on website!
    }

    const $ = cheerio.load(JSON.parse(Application.arrayBufferToUTF8String(buffer)).data.html);

    const results = await this.parser.parseSearchResults($, this);

    const usePostIds = getUsePostIds(this.usePostIds);
    const items: SearchResultItem[] = await Promise.all(
      results.map(async (result) => ({
        mangaId: usePostIds ? (await this.getPostAndSlug(result.slug)).postId : result.slug,
        imageUrl: result.image,
        title: result.title,
        subtitle: result.subtitle,
      })),
    );

    return {
      items: items,
      metadata: items.length > 0 ? { page: page + 1 } : undefined,
    };
  }

  override constructSearchRequest(
    page: number,
    query: SearchQuery<MadaraSearchMetadata>,
    sortingOption?: SortingOption,
  ) {
    const urlBuilder = new URL(this.domain)
      .addPathComponent("wp-admin")
      .addPathComponent("admin-ajax.php");

    const genres =
      query.metadata && query.metadata.genres
        ? Object.entries(query.metadata.genres)
            .filter((e) => e[1] == "included")
            .map((e) => e[0])
            .join(",")
        : "";

    const params: Record<string, string> = {
      action: "madara_child_catalogue",
      s: "",
      genres: genres,
      statut: "tous",
      note: "0",
      origine: "",
      tri: sortingOption ? sortingOption.id : "recents",
      chmin: "0",
      chmax: "0",
      page: String(page),
      auteur: "",
      artiste: "",
      annee: "",
      vue: "grille",
    };

    const body = Object.entries(params)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
      .join("&");

    return Application.scheduleRequest({
      url: urlBuilder.toString(),
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
      body: body,
    });
  }
}

export const MangaOrigines = new MangaOriginesExtension();
