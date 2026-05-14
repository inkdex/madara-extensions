import { type TestLogger } from "@paperback/types";

import { GourmetScans } from "../GourmetScans/main.js";
import sourceInfo from "../GourmetScans/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("GourmetScans tests", logger);
  registerDefaultTests(suite, GourmetScans, sourceInfo);

  await suite.run();
}
