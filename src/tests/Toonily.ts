import { type TestLogger } from "@paperback/types";

import { Toonily } from "../Toonily/main.js";
import sourceInfo from "../Toonily/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Toonily tests", logger);
  registerDefaultTests(suite, Toonily, sourceInfo);

  await suite.run();
}
