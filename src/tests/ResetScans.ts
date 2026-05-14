import { type TestLogger } from "@paperback/types";

import { ResetScans } from "../ResetScans/main.js";
import sourceInfo from "../ResetScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ResetScans tests", logger);
  registerDefaultTests(suite, ResetScans, sourceInfo);

  await suite.run();
}
