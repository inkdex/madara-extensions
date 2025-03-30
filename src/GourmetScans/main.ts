import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://gourmetsupremacy.com";

class GourmetScansExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
            hasProtectedChapters: true,
            useListParameter: true,
        });
    }
}

export const GourmetScans = new GourmetScansExtension();
