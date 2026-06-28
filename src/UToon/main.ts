/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

/* Adapted from Nicartjay's reference source:
 * https://github.com/Nicartjay/PaperbackExt/blob/0.9/stable/src/Utoon/main.ts */

import {
  type DiscoverSection,
  type DiscoverSectionItem,
  type PagedResults,
} from "@paperback/types";
import * as cheerio from "cheerio";

import { MadaraGeneric } from "../generic/main";
import { UToonParser } from "./parsers";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://utoon.net";

/**
 * UToon runs the custom "UTOON-ZAX" theme, but the standard WordPress request
 * flow is intact: search (`?s=…&post_type=wp-manga`), manga details and the
 * chapter list all live at the usual URLs, so the requests are handled by the
 * generic base and the markup is parsed by `UToonParser`. Discover reuses the
 * generic sections and flow as well, only swapping in the theme's `?orderby=`
 * sort params.
 */
class UToonExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: false,
      searchMangaSelector: "a.acard",
      chapterEndpoint: 3,
      directoryPath: "manga",
      parser: new UToonParser(),
    });
  }

  override async getDiscoverSectionItems(
    section: DiscoverSection,
    metadata: { page?: number } | undefined,
  ): Promise<PagedResults<DiscoverSectionItem>> {
    let param = "";
    const page = metadata?.page ?? 1;

    // The custom theme sorts via `?orderby=<id>` (it ignores Madara's `m_orderby`)
    // and only supports popular/new/alphabet, so the generic section ids are mapped
    // onto those — "currently_trending" has no equivalent and reuses "popular".
    switch (section.id) {
      case "new_series":
        param = "?orderby=new";
        break;
      case "recently_updated":
        param = ""; // No param = the default "recently updated" listing.
        break;
      case "currently_trending":
        param = "?orderby=popular";
        break;
      case "most_popular":
        param = "?orderby=popular";
        break;

      default:
        throw new Error("Invalid sectionId provided!");
    }

    const [_response, buffer] = await Application.scheduleRequest({
      url: `${this.domain}/temp_dirpath/page/${page}/${param}`,
      method: "GET",
    });

    const $ = cheerio.load(Application.arrayBufferToUTF8String(buffer));

    const items = await this.parser.parseDiscoverSections($, section, this);

    metadata = { page: page + 1 }; // Empty pages return 200, so the app stops once items run out.

    return {
      items,
      metadata,
    };
  }
}

export const UToon = new UToonExtension();
