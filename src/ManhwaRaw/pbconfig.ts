/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "ManhwaRaw";
pbConfig.description = "Extension that pulls content from manhwa-raw.com.";
pbConfig.language = "ko";
pbConfig.contentRating = ContentRating.ADULT;
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
