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
    ["html", "../reports/e2e-report.html"]
  ],

  timeout: 30000
};
