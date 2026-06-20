import { type TestLogger } from "@paperback/types";

import { ManhwaClub } from "../ManhwaClub/main.js";
import sourceInfo from "../ManhwaClub/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("ManhwaClub tests", logger);
  registerDefaultTests(suite, ManhwaClub, sourceInfo);

  await suite.run();
}
