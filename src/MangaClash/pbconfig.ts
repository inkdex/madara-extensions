import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "MangaClash",
    description: "Extension that pulls content from toonclash.com.",
    version: "1.0.0-alpha.1",
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
