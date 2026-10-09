/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "MangaOrigines";
pbConfig.description = "Extension that pulls content from mangas-origines.fr.";
pbConfig.language = "fr";
pbConfig.contentRating = ContentRating.EVERYONE;
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
