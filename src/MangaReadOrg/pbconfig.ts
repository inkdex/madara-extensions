import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "MangaReadOrg",
    description: "Extension that pulls content from mangaread.org.",
    version: "1.0.0-alpha.2",
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
