/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { MadaraGeneric } from "../generic/Madara";
import { MangaReadOrgParser } from "./parser";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://www.mangaread.org";

class MangaReadOrgExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      parser: new MangaReadOrgParser(),
      chapterEndpoint: 1,
    });
  }
}

export const MangaReadOrg = new MangaReadOrgExtension();
