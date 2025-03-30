import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://samurai.wordoco.com";

class SamuraiScanExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
            chapterEndpoint: 1,
        });
    }
}

export const SamuraiScan = new SamuraiScanExtension();
