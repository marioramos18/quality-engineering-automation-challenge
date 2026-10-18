import {
  After,
  Before,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";

import { chromium } from "playwright";

import type { E2EWorld } from "./world.ts";

setDefaultTimeout(30_000);

Before(async function (this: E2EWorld) {
  const headed = process.env.PW_HEADED === "1";

  this.browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 350 : 0,
  });

  this.context = await this.browser.newContext();

  this.page = await this.context.newPage();
});

After(async function (this: E2EWorld, scenario) {
  try {
    if (
      scenario.result?.status === Status.FAILED &&
      this.page
    ) {
      const screenshot = await this.page.screenshot({
        fullPage: true,
      });

      await this.attach(screenshot, "image/png");
    }
  } finally {
    await this.context?.close();
    await this.browser?.close();
  }
});
