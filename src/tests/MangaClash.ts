import { type TestLogger } from "@paperback/types";

import { MangaClash } from "../MangaClash/main.js";
import sourceInfo from "../MangaClash/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaClash tests", logger);
  registerDefaultTests(suite, MangaClash, sourceInfo);

  await suite.run();
}
