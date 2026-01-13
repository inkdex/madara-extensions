import { MadaraGeneric } from "../generic/main";
import pbconfig from "./pbconfig";

const DOMAIN: string = "https://yaoiscan.com";

class YaoiScanExtension extends MadaraGeneric {
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

export const YaoiScan = new YaoiScanExtension();
