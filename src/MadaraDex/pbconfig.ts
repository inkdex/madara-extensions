import { ContentRating, SourceIntents, type ExtensionInfo } from "@paperback/types";
import { getVersion } from "../generic/MadaraHelper";

export default {
  name: "MadaraDex",
  description: "Extension that pulls content from madaradex.org.",
  version: getVersion({ increasePrerelease: 1 }),
  icon: "icon.png",
  language: "🇬🇧",
  contentRating: ContentRating.ADULT,
  badges: [],
  capabilities:
    SourceIntents.CHAPTER_PROVIDING |
    SourceIntents.DISCOVER_SECIONS_PROVIDING |
    SourceIntents.SETTINGS_FORM_PROVIDING |
    SourceIntents.SEARCH_RESULTS_PROVIDING |
    SourceIntents.CLOUDFLARE_BYPASS_PROVIDING,
  developers: [
    {
      name: "Netsky",
      github: "https://github.com/TheNetsky",
    },
  ],
} satisfies ExtensionInfo;
