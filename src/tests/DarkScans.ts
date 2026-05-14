import { type TestLogger } from "@paperback/types";

import { DarkScans } from "../DarkScans/main.js";
import sourceInfo from "../DarkScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("DarkScans tests", logger);
  registerDefaultTests(suite, DarkScans, sourceInfo);

  await suite.run();
}
