import { type TestLogger } from "@paperback/types";

import { Manhuaus } from "../Manhuaus/main.js";
import sourceInfo from "../Manhuaus/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Manhuaus tests", logger);
  registerDefaultTests(suite, Manhuaus, sourceInfo);

  await suite.run();
}
