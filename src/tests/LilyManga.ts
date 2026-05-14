import { type TestLogger } from "@paperback/types";

import { LilyManga } from "../LilyManga/main.js";
import sourceInfo from "../LilyManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("LilyManga tests", logger);
  registerDefaultTests(suite, LilyManga, sourceInfo);

  await suite.run();
}
