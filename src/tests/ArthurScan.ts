import { type TestLogger } from "@paperback/types";

import { ArthurScan } from "../ArthurScan/main.js";
import sourceInfo from "../ArthurScan/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ArthurScan tests", logger);
  registerDefaultTests(suite, ArthurScan, sourceInfo);

  await suite.run();
}
