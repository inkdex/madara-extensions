import { MadaraGeneric } from "../generic/Madara";
import { LekMangaParser } from "./parser";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://lekmanga.net";

class LekMangaExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
            parser: new LekMangaParser(),
            bypassPage: `${DOMAIN}/?s=&post_type=wp-manga`,
        });
    }
}

export const LekManga = new LekMangaExtension();
