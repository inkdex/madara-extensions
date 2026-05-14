import { type TestLogger } from "@paperback/types";

import { MangaScantrad } from "../MangaScantrad/main.js";
import sourceInfo from "../MangaScantrad/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaScantrad tests", logger);
  registerDefaultTests(suite, MangaScantrad, sourceInfo);

  await suite.run();
}
