import { type TestLogger } from "@paperback/types";

import { LekManga } from "../LekManga/main.js";
import sourceInfo from "../LekManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("LekManga tests", logger);
  registerDefaultTests(suite, LekManga, sourceInfo);

  await suite.run();
}
