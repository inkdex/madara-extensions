import { type TestLogger } from "@paperback/types";

import { NovelMic } from "../NovelMic/main.js";
import sourceInfo from "../NovelMic/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("NovelMic tests", logger);
  registerDefaultTests(suite, NovelMic, sourceInfo);

  await suite.run();
}
