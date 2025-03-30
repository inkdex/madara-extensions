import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://mangazin.org";

class MangaZinExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: false,
        });
    }
}

export const MangaZin = new MangaZinExtension();
