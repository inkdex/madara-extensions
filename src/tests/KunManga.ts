import { type TestLogger } from "@paperback/types";

import { KunManga } from "../KunManga/main.js";
import sourceInfo from "../KunManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("KunManga tests", logger);
  registerDefaultTests(suite, KunManga, sourceInfo);

  await suite.run();
}
