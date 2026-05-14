import { type TestLogger } from "@paperback/types";

import { ManhuaPlus } from "../ManhuaPlus/main.js";
import sourceInfo from "../ManhuaPlus/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ManhuaPlus tests", logger);
  registerDefaultTests(suite, ManhuaPlus, sourceInfo);

  await suite.run();
}
