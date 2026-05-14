import { type TestLogger } from "@paperback/types";

import { AllPornComic } from "../AllPornComic/main.js";
import sourceInfo from "../AllPornComic/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("AllPornComic tests", logger);
  registerDefaultTests(suite, AllPornComic, sourceInfo);

  await suite.run();
}
