/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type SearchQuery, URL } from "@paperback/types";
import type { SearchFilterValue } from "@paperback/types/lib/compat/0.8/searchFilters";

import { MadaraGeneric } from "../generic/main";
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

  override constructSearchRequest(page: number, query: SearchQuery<SearchFilterValue[]>) {
    const urlBuilder = new URL(this.domain)
      .addPathComponent(
        `search/${query?.title ? this.sanitizeQuery(query.title).replaceAll(" ", "-") + "/" : ""}page/${page.toString()}`,
      )
      .setQueryItem("post_type", "wp-manga");

    const genreFilters = Object.keys(
      (query.metadata ?? []).find((x) => x.id === "genres")?.value ?? {},
    );

    if (genreFilters.length) {
      genreFilters.forEach((genre, i) => urlBuilder.setQueryItem(`genre[${i}]`, genre));
      urlBuilder.setQueryItem("op", "1");
    }

    return Application.scheduleRequest({
      url: urlBuilder.toString(),
      method: "GET",
    });
  }
}

export const Toonily = new ToonilyExtension();
