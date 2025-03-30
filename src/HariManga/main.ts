import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://harimanga.me";

class HariMangaExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
        });
    }
}

export const HariManga = new HariMangaExtension();
