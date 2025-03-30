import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://manhuaplus.com";

class ManhuaPlusExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
            chapterDetailsSelector:
                "li.blocks-gallery-item > figure > img, div.page-break > img, div#chapter-video-frame > p > img, div.text-left > p > img",
        });
    }
}

export const ManhuaPlus = new ManhuaPlusExtension();
