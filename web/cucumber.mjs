import { mkdirSync } from "node:fs";
import path from "node:path";

const reportDirectory = process.env.E2E_REPORT_DIR ?? "../reports";
mkdirSync(reportDirectory, { recursive: true });

export default {
  paths: [
    "features/**/*.feature"
  ],

  import: [
    "./tsx-register.mjs",
    "./support/**/*.ts",
    "./steps/**/*.ts"
  ],

  format: [
    "progress",
    ["html", path.join(reportDirectory, "e2e-report.html")],
    ["junit", path.join(reportDirectory, "junit.xml")]
  ],

  timeout: 30000
};
