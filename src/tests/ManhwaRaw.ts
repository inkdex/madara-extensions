import { type TestLogger } from "@paperback/types";

import { ManhwaRaw } from "../ManhwaRaw/main.js";
import sourceInfo from "../ManhwaRaw/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ManhwaRaw tests", logger);
  registerDefaultTests(suite, ManhwaRaw, sourceInfo);

  await suite.run();
}
