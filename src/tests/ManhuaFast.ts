import { type TestLogger } from "@paperback/types";

import { ManhuaFast } from "../ManhuaFast/main.js";
import sourceInfo from "../ManhuaFast/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ManhuaFast tests", logger);
  registerDefaultTests(suite, ManhuaFast, sourceInfo);

  await suite.run();
}
