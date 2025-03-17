import { ContentRating, SourceInfo, SourceIntents } from "@paperback/types";

export default {
    name: "Toonily",
    description: "Extension that pulls content from Toonily.com.",
    version: "1.0.0-alpha.2",
    icon: "icon.png",
    language: "en",
    contentRating: ContentRating.ADULT,
    badges: [],
    capabilities: [
        SourceIntents.DISCOVER_SECIONS,
        SourceIntents.MANGA_SEARCH,
        SourceIntents.MANGA_CHAPTERS,
    ],
    developers: [
        {
            name: "Egwau",
        },
    ],
} satisfies SourceInfo;
