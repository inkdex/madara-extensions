import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "MangaScantrad",
    description: "Extension that pulls content from manga-scantrad.io.",
    version: "1.0.0-alpha.3",
    icon: "icon.png",
    language: "🇫🇷",
    contentRating: ContentRating.MATURE,
    badges: [
        {
            label: "French",
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
