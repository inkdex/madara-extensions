/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { type SearchQuery, URL } from "@paperback/types";
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
      mangaPathName: "serie",
    });
  }

  override constructSearchRequest(page: number, query: SearchQuery) {
    const urlBuilder = new URL(this.domain)
      .addPathComponent(
        `search/${query?.title ? this.sanitizeQuery(query.title).replaceAll(" ", "-") + "/" : ""}page/${page.toString()}`,
      )
      .setQueryItem("post_type", "wp-manga");

    const genreFilters = Object.keys(query.filters.find((x) => x.id === "genres")?.value ?? {});

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
