/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "LHTranslation";
pbConfig.description = "Extension that pulls content from lhtranslation.net.";
pbConfig.version = customVersion({ increasePrerelease: 1 });

export default pbConfig;
