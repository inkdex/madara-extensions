import { type TestLogger } from "@paperback/types";

import { Manga3asq } from "../Manga3asq/main.js";
import sourceInfo from "../Manga3asq/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("Manga3asq tests", logger);
  registerDefaultTests(suite, Manga3asq, sourceInfo);

  await suite.run();
}
