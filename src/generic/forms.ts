/* SPDX-License-Identifier: GPL-3.0-or-later */
/* Copyright © 2026 Inkdex */

import {
  ButtonRow,
  Form,
  type FormSectionElement,
  LabelRow,
  Section,
  ToggleRow,
} from "@paperback/types";
import { MadaraGeneric } from "./main";

// Util
function toBoolean(value: unknown): boolean | undefined {
  if (value === true || value === "true" || value === 1) return true;
  if (value === false || value === "false" || value === 0) return false;
  return undefined;
}

// Use postIds
export function getUsePostIds(sourcePreference?: boolean): boolean {
  // If the dev disabled postIds, don't let the user enable it
  if (sourcePreference === false) {
    return false;
  }

  return toBoolean(Application.getState("postIds")) ?? true;
}

export function setUsePostIds(value: boolean): void {
  Application.setState(value.toString(), "postIds");
}

// HQ Thumbnails
export function getUseHQThumbnails(): boolean {
  return toBoolean(Application.getState("hq_thumbnails")) ?? false;
}

export function setUseHQThumbnails(value: boolean): void {
  Application.setState(value.toString(), "hq_thumbnails");
}

// Parsed Directory Path
export function getParsedPath(domain: string): string {
  return Application.getState(`dirpath_${domain}`) as string;
}

export class MadaraSettings extends Form {
  source: MadaraGeneric;
  constructor(source: MadaraGeneric) {
    super();
    this.source = source;
  }

  override getSections(): FormSectionElement[] {
    return [
      Section(`${this.source.name} Settings`.replaceAll(" ", ""), [
        ToggleRow("postIds", {
          title: "Use Post IDs",
          value: getUsePostIds(),
          onValueChange: Application.Selector(this as MadaraSettings, "usePostIdsChange"),
          subtitle:
            "Enabling will make the source slower, but more reliable!\nCHANGING THIS OPTION WILL ERASE YOUR READING PROGRESS FOR THIS SOURCE!",
        }),

        ToggleRow("hqThumbnails", {
          title: "Enable HQ Thumbnails",
          value: getUseHQThumbnails(),
          onValueChange: Application.Selector(this as MadaraSettings, "useHQThumbnailsChange"),
          subtitle: "Enabling will make the sources use more bandwith",
        }),
      ]),
      Section("second", [
        ButtonRow("resetPath", {
          title: "Reset Stored Directory Path",
          onSelect: Application.Selector(this as MadaraSettings, "resetDirectoryPath"),
        }),
        LabelRow("resetStateLabel", {
          title: "",
          subtitle: `\nCurrent parsed path: "${getParsedPath(this.source.domain) ?? "overridden"}"\nClicking reset will reset the directory path.\nCan fix the homepage "request page not found" error!`,
        }),
      ]),
    ];
  }

  async usePostIdsChange(value: boolean): Promise<void> {
    setUsePostIds(value);
  }

  async useHQThumbnailsChange(value: boolean): Promise<void> {
    setUseHQThumbnails(value);
  }

  async resetDirectoryPath(): Promise<void> {
    Application.setState(`dirpath_${this.source.domain}`, this.source.domain);
  }
}
