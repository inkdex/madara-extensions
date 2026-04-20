/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "MangaReadOrg";
pbConfig.description = "Extension that pulls content from mangaread.org.";
pbConfig.version = customVersion({ increasePrerelease: 3 });

export default pbConfig;
