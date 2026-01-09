import { ContentRating, type SourceInfo, SourceIntents } from "@paperback/types";
import { getVersion } from "../generic/MadaraHelper";

export default {
  name: "AzoraMoon",
  description: "Extension that pulls content from azoramoon.com.",
  version: getVersion(),
  icon: "icon.png",
  language: "🇦🇪",
  contentRating: ContentRating.EVERYONE,
  badges: [
    {
      label: "Arabic",
      textColor: "#ffffff",
      backgroundColor: "#808080",
    },
  ],
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
