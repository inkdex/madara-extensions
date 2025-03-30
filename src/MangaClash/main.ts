import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://toonclash.com";

class MangaClashExtension extends MadaraGeneric {
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

export const MangaClash = new MangaClashExtension();
