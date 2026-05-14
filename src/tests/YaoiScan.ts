import { type TestLogger } from "@paperback/types";

import { YaoiScan } from "../YaoiScan/main.js";
import sourceInfo from "../YaoiScan/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("YaoiScan tests", logger);
  registerDefaultTests(suite, YaoiScan, sourceInfo);

  await suite.run();
}
