/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { URL, type SearchQuery, type SortingOption } from "@paperback/types";

import { MadaraGeneric } from "../generic/main";
import type { MadaraSearchMetadata } from "../generic/models";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://toonily.com";

class ToonilyExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      searchMangaSelector: "div.page-item-detail.manga",
      searchRatingSelector: "span#averagerate",
    });
  }

  override constructSearchRequest(
    page: number,
    query: SearchQuery<MadaraSearchMetadata>,
    sortingOption?: SortingOption,
  ) {
    const urlBuilder = new URL(this.domain)
      .addPathComponent(
        `search/${query?.title ? this.sanitizeQuery(query.title).replaceAll(" ", "-") + "/" : ""}page/${page.toString()}`,
      )
      .setQueryItem("post_type", "wp-manga");

    const genreFilters = Object.keys(query.metadata?.genres ?? {});

    if (genreFilters.length) {
      genreFilters.forEach((genre, i) => urlBuilder.setQueryItem(`genre[${i}]`, genre));
      urlBuilder.setQueryItem("op", "1");
    }

    if (sortingOption && sortingOption.id !== "relevance") {
      urlBuilder.setQueryItem("m_orderby", sortingOption.id);
    }

    return Application.scheduleRequest({
      url: urlBuilder.toString(),
      method: "GET",
    });
  }
}

export const Toonily = new ToonilyExtension();
