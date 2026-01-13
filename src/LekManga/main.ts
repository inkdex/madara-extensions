/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { MadaraGeneric } from "../generic/main";
import { LekMangaParser } from "./parsers";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://lekmanga.net";

class LekMangaExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      parser: new LekMangaParser(),
      bypassPage: `${DOMAIN}/?s=&post_type=wp-manga`,
    });
  }
}

export const LekManga = new LekMangaExtension();
