import { MadaraGeneric } from "../generic/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://mangadistrict.com";

class MangaDistrictExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      directoryPath: "title",
      searchMangaSelector: ".page-listing-item",
    });
  }
}

export const MangaDistrict = new MangaDistrictExtension();
