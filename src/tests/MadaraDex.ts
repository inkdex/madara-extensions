import { type TestLogger } from "@paperback/types";

import { MadaraDex } from "../MadaraDex/main.js";
import sourceInfo from "../MadaraDex/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MadaraDex tests", logger);
  registerDefaultTests(suite, MadaraDex, sourceInfo);

  await suite.run();
}
