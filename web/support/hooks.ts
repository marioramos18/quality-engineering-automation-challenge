import {
  After,
  Before,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";

import { chromium } from "playwright";

import type { E2EWorld } from "./world.ts";

setDefaultTimeout(30_000);

const MAX_NETWORK_EVENTS = 20;

function safeRequestUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

Before(async function (this: E2EWorld) {
  const headed = process.env.PW_HEADED === "1";

  this.browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 350 : 0,
  });

  this.context = await this.browser.newContext();

  // Register before creating the page, so the first catalog navigation is covered.
  this.context.on("response", (response) => {
    if (response.status() < 400) return;
    this.catalogHttpErrorCount += 1;
    if (this.catalogHttpErrors.length >= MAX_NETWORK_EVENTS) return;

    const request = response.request();
    this.catalogHttpErrors.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: safeRequestUrl(response.url()),
      status: response.status(),
    });
  });

  this.context.on("requestfailed", (request) => {
    this.catalogNetworkFailureCount += 1;
    if (this.catalogNetworkFailures.length >= MAX_NETWORK_EVENTS) return;

    this.catalogNetworkFailures.push({
      method: request.method(),
      resourceType: request.resourceType(),
      url: safeRequestUrl(request.url()),
      failure: request.failure()?.errorText.slice(0, 160) ?? "unknown network error",
    });
  });

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
