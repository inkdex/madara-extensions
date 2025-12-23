import { MadaraGeneric } from "../generic/Madara";
import { Manga3asqParser } from "./parser";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://3asq.org";

class Manga3asqExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      parser: new Manga3asqParser(),
    });
  }
}

export const Manga3asq = new Manga3asqExtension();
