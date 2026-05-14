import { type TestLogger } from "@paperback/types";

import { AzoraMoon } from "../AzoraMoon/main.js";
import sourceInfo from "../AzoraMoon/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("AzoraMoon tests", logger);
  registerDefaultTests(suite, AzoraMoon, sourceInfo);

  await suite.run();
}
