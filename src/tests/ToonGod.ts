import { type TestLogger } from "@paperback/types";

import { ToonGod } from "../ToonGod/main.js";
import sourceInfo from "../ToonGod/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ToonGod tests", logger);
  registerDefaultTests(suite, ToonGod, sourceInfo);

  await suite.run();
}
