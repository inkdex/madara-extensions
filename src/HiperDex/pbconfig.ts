/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating, type SourceInfo, SourceIntents } from "@paperback/types";
import { getVersion } from "../generic/MadaraHelper";

export default {
  name: "HiperDex",
  description: "Extension that pulls content from hiperdex.com.",
  version: getVersion({ increasePrerelease: 1 }),
  icon: "icon.png",
  language: "🇬🇧",
  contentRating: ContentRating.ADULT,
  badges: [],
  capabilities:
    SourceIntents.MANGA_CHAPTERS |
    SourceIntents.DISCOVER_SECIONS |
    SourceIntents.SETTINGS_UI |
    SourceIntents.MANGA_SEARCH |
    SourceIntents.CLOUDFLARE_BYPASS_REQUIRED,
  developers: [
    {
      name: "Netsky",
      github: "https://github.com/TheNetsky",
    },
  ],
} satisfies SourceInfo;
