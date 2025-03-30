import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "LekManga",
    description: "Extension that pulls content from lekmanga.net.",
    version: "1.0.0-alpha.1",
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
