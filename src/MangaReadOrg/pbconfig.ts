import { ContentRating, type SourceInfo, SourceIntents } from "@paperback/types";
import { getVersion } from "../generic/MadaraHelper";

export default {
  name: "MangaReadOrg",
  description: "Extension that pulls content from mangaread.org.",
  version: getVersion({ increasePrerelease: 3 }),
  icon: "icon.png",
  language: "🇬🇧",
  contentRating: ContentRating.EVERYONE,
  badges: [],
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
