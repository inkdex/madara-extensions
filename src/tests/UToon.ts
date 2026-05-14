import { type TestLogger } from "@paperback/types";

import { UToon } from "../UToon/main.js";
import sourceInfo from "../UToon/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("UToon tests", logger);
  registerDefaultTests(suite, UToon, sourceInfo);

  await suite.run();
}
