import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://theblank.net";

class TheBlankExtension extends MadaraGeneric {
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

export const TheBlank = new TheBlankExtension();
