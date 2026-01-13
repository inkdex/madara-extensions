/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { MadaraGeneric } from "../generic/main";
import { AzoraMoonParser } from "./parsers";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://azoramoon.com";

class AzoraMoonExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      parser: new AzoraMoonParser(),
    });
  }
}

export const AzoraMoon = new AzoraMoonExtension();
