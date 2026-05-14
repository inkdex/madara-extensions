import { type TestLogger } from "@paperback/types";

import { SamuraiScan } from "../SamuraiScan/main.js";
import sourceInfo from "../SamuraiScan/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("SamuraiScan tests", logger);
  registerDefaultTests(suite, SamuraiScan, sourceInfo);

  await suite.run();
}
