/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import { basePbConfig, customVersion } from "../generic/config";

let pbConfig = basePbConfig;

pbConfig.name = "ResetScans";
pbConfig.description = "Extension that pulls content from reset-scans.org.";
pbConfig.version = customVersion({ increasePrerelease: 2 });

export default pbConfig;
