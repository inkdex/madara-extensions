import { type TestLogger } from "@paperback/types";

import { PlatinumScans } from "../PlatinumScans/main.js";
import sourceInfo from "../PlatinumScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("PlatinumScans tests", logger);
  registerDefaultTests(suite, PlatinumScans, sourceInfo);

  await suite.run();
}
