import { type TestLogger } from "@paperback/types";

import { MangaDistrict } from "../MangaDistrict/main.js";
import sourceInfo from "../MangaDistrict/pbconfig.js";
import { TestSuite, registerDefaultTests } from "./suite.js";

export async function runTests(logger: TestLogger) {
  const suite = new TestSuite("MangaDistrict tests", logger);
  registerDefaultTests(suite, MangaDistrict, sourceInfo);

  await suite.run();
}
