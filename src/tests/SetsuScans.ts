import { type TestLogger } from "@paperback/types";

import { SetsuScans } from "../SetsuScans/main.js";
import sourceInfo from "../SetsuScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("SetsuScans tests", logger);
  registerDefaultTests(suite, SetsuScans, sourceInfo);

  await suite.run();
}
