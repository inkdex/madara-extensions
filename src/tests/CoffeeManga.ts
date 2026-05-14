import { type TestLogger } from "@paperback/types";

import { CoffeeManga } from "../CoffeeManga/main.js";
import sourceInfo from "../CoffeeManga/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("CoffeeManga tests", logger);
  registerDefaultTests(suite, CoffeeManga, sourceInfo);

  await suite.run();
}
