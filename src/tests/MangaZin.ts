import { type TestLogger } from "@paperback/types";

import { MangaZin } from "../MangaZin/main.js";
import sourceInfo from "../MangaZin/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaZin tests", logger);
  registerDefaultTests(suite, MangaZin, sourceInfo);

  await suite.run();
}
