import { MadaraGeneric } from "../generic/Madara";
import { AzoraMoonParser } from "./parser";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://azoramoon.com";

class AzoraMoonExtension extends MadaraGeneric {
    constructor() {
        super({
            domain: DOMAIN,
            name: pbconfig.name,
            contentRating: pbconfig.contentRating,
            language: pbconfig.language,
            usePostIds: true,
            parser: new AzoraMoonParser(),
        });
    }
}

export const AzoraMoon = new AzoraMoonExtension();
