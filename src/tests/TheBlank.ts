import { type TestLogger } from "@paperback/types";

import { TheBlank } from "../TheBlank/main.js";
import sourceInfo from "../TheBlank/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("TheBlank tests", logger);
  registerDefaultTests(suite, TheBlank, sourceInfo);

  await suite.run();
}
