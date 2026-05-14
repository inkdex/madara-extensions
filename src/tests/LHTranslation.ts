import { type TestLogger } from "@paperback/types";

import { LHTranslation } from "../LHTranslation/main.js";
import sourceInfo from "../LHTranslation/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("LHTranslation tests", logger);
  registerDefaultTests(suite, LHTranslation, sourceInfo);

  await suite.run();
}
