import { MadaraGeneric } from "../generic/Madara";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://madaradex.org";

class MadaraDexExtension extends MadaraGeneric {
  constructor() {
    super({
      domain: DOMAIN,
      name: pbconfig.name,
      contentRating: pbconfig.contentRating,
      language: pbconfig.language,
      usePostIds: true,
      userAgent: "Paperback-iOS",
    });
  }
}

export const MadaraDex = new MadaraDexExtension();
