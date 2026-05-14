import { type TestLogger } from "@paperback/types";

import { WebtoonXYZ } from "../WebtoonXYZ/main.js";
import sourceInfo from "../WebtoonXYZ/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("WebtoonXYZ tests", logger);
  registerDefaultTests(suite, WebtoonXYZ, sourceInfo);

  await suite.run();
}
