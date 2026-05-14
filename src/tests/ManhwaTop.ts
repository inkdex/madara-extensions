import { type TestLogger } from "@paperback/types";

import { ManhwaTop } from "../ManhwaTop/main.js";
import sourceInfo from "../ManhwaTop/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ManhwaTop tests", logger);
  registerDefaultTests(suite, ManhwaTop, sourceInfo);

  await suite.run();
}
