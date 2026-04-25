/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { ContentRating } from "@paperback/types";

import { basePbConfig } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "HariManga";
pbConfig.description = "Extension that pulls content from https://harimanga.me.";
pbConfig.contentRating = ContentRating.MATURE;

export default pbConfig;
