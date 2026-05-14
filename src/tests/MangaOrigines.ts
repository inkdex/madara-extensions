import { type TestLogger } from "@paperback/types";

import { MangaOrigines } from "../MangaOrigines/main.js";
import sourceInfo from "../MangaOrigines/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaOrigines tests", logger);
  registerDefaultTests(suite, MangaOrigines, sourceInfo);

  await suite.run();
}
