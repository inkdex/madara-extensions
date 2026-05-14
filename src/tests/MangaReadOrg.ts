import { type TestLogger } from "@paperback/types";

import { MangaReadOrg } from "../MangaReadOrg/main.js";
import sourceInfo from "../MangaReadOrg/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaReadOrg tests", logger);
  registerDefaultTests(suite, MangaReadOrg, sourceInfo);

  await suite.run();
}
