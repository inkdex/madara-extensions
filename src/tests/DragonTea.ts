import { type TestLogger } from "@paperback/types";

import { DragonTea } from "../DragonTea/main.js";
import sourceInfo from "../DragonTea/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("DragonTea tests", logger);
  registerDefaultTests(suite, DragonTea, sourceInfo);

  await suite.run();
}
