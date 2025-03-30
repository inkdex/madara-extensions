import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "AzoraMoon",
    description: "Extension that pulls content from azoramoon.com.",
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
