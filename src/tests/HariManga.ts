import { type TestLogger } from "@paperback/types";

import { HariManga } from "../HariManga/main.js";
import sourceInfo from "../HariManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("HariManga tests", logger);
  registerDefaultTests(suite, HariManga, sourceInfo);

  await suite.run();
}
