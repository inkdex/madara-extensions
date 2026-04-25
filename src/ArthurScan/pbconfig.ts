/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "ArthurScan";
pbConfig.description = "Extension that pulls content from arthurscan.xyz.";
pbConfig.version = customVersion({ increasePrerelease: 1 });
pbConfig.language = "pt";
pbConfig.contentRating = ContentRating.MATURE;

export default pbConfig;
