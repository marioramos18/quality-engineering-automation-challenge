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
const SCREENSHOT_TIMEOUT_MS = 10_000;

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "[::1]";
}

function requireIsolatedNegativeAuthTarget(): void {
  const baseUrl = process.env.WEB_BASE_URL;
  let target: URL;

  try {
    target = new URL(baseUrl ?? "");
  } catch {
    throw new Error(
      "@login-negative requires WEB_BASE_URL to point to an authorized local instance."
    );
  }

  if (
    process.env.E2E_ALLOW_NEGATIVE_AUTH !== "1" ||
    !["http:", "https:"].includes(target.protocol) ||
    !isLoopbackHost(target.hostname) ||
    target.username ||
    target.password
  ) {
    throw new Error(
      "@login-negative is restricted to an authorized loopback instance " +
      "with E2E_ALLOW_NEGATIVE_AUTH=1. Public targets are forbidden."
    );
  }
}

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

  if (negativeAuth) {
    requireIsolatedNegativeAuthTarget();
  }

  const headed = process.env.PW_HEADED === "1";

  this.browser = await chromium.launch({
    headless: !headed,
    slowMo: headed ? 350 : 0,
  });

  this.context = await this.browser.newContext();

  if (negativeAuth) {
    // Block redirects and API requests from reaching a public host.
    await this.context.route("**/*", async (route) => {
      let destination: URL;
      try {
        destination = new URL(route.request().url());
      } catch {
        await route.abort("blockedbyclient");
        return;
      }

      if (
        !["http:", "https:"].includes(destination.protocol) ||
        !isLoopbackHost(destination.hostname)
      ) {
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
