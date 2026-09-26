/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "LilyManga";
pbConfig.description = "Extension that pulls content from lilymanga.net.";
pbConfig.contentRating = ContentRating.MATURE;
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
