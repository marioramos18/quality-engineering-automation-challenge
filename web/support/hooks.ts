import {
  After,
  Before,
  Status,
  setDefaultTimeout,
} from "@cucumber/cucumber";

import { chromium } from "playwright";

import type { E2EWorld } from "./world.ts";
import { isAllowedIsolatedRequest, requireIsolatedTarget } from "./isolation.ts";
import { saveCatalogDiagnostics } from "./catalog-diagnostics.ts";

setDefaultTimeout(30_000);

const MAX_NETWORK_EVENTS = 20;
const SCREENSHOT_TIMEOUT_MS = 10_000;

function safeRequestUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    return `${url.origin}${url.pathname}`;
  } catch {
    return "[invalid URL]";
  }
}

Before(async function (this: E2EWorld, scenario) {
  const negativeAuth = scenario.pickle.tags.some(
    (tag) => tag.name === "@login-negative"
  );
  const checkout = scenario.pickle.tags.some((tag) => tag.name === "@isolated-checkout");

  if (negativeAuth) {
    requireIsolatedTarget("E2E_ALLOW_NEGATIVE_AUTH", "@login-negative");
  }
  if (checkout) {
    requireIsolatedTarget("E2E_ALLOW_ORDER_CREATION", "@isolated-checkout");
  }

  const headed = process.env.PW_HEADED === "1";

  this.browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 350 : 0,
  });

  this.context = await this.browser.newContext({ serviceWorkers: "block" });

  if (negativeAuth || checkout) {
    // Block redirects and API requests from reaching a public host.
    await this.context.route("**/*", async (route) => {
      if (!isAllowedIsolatedRequest(route.request().url())) {
        await route.abort("blockedbyclient");
        return;
      }

      await route.continue();
    });
  }

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
  const scenarioFailed = scenario.result?.status === Status.FAILED;
  const hookErrors: unknown[] = [];

  if (scenarioFailed && this.page) {
    try {
      await saveCatalogDiagnostics(this.page, this);
    } catch (error) {
      hookErrors.push(error);
      console.error("Failed to save browser diagnostics:", error);
    }
  }

  if ((scenarioFailed || process.env.E2E_CAPTURE_SUCCESS === "1") && this.page) {
    try {
      const screenshot = await this.page.screenshot({
        fullPage: true,
        timeout: SCREENSHOT_TIMEOUT_MS,
      });
      await this.attach(screenshot, "image/png");
    } catch (error) {
      hookErrors.push(error);
      console.error("Failed to attach scenario screenshot:", error);
    }
  }

  try {
    await this.context?.close();
  } catch (error) {
    hookErrors.push(error);
    console.error("Failed to close browser context:", error);
  }

  try {
    await this.browser?.close();
  } catch (error) {
    hookErrors.push(error);
    console.error("Failed to close browser:", error);
  }

  if (!scenarioFailed && hookErrors.length > 0) {
    throw new AggregateError(hookErrors, "E2E evidence or cleanup failed");
  }
});
