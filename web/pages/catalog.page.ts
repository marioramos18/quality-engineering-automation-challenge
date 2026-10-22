import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { expect } from "playwright/test";
import type { Locator, Page } from "playwright";
import type { E2EWorld } from "../support/world.ts";
import type { WebConfig } from "../support/config.ts";

type CatalogEvidence = Pick<
  E2EWorld,
  | "catalogHttpErrors"
  | "catalogNetworkFailures"
  | "catalogHttpErrorCount"
  | "catalogNetworkFailureCount"
>;

function safeBodyExcerpt(text: string): string {
  return text
    .replace(/\b(?:password|token|secret|authorization|api[-_ ]?key)\b\s*[:=]\s*\S+/gi, "[redacted]")
    .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, "[email]")
    .replace(/https?:\/\/\S+/gi, "[URL]")
    .replace(/\b\d{7,}\b/g, "[number]")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 500);
}

function safePageUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    if (url.protocol === "data:") return "data:[redacted]";
    return `${url.origin}${url.pathname}${url.search ? "?[query redacted]" : ""}`;
  } catch {
    return "[unavailable]";
  }
}

export class CatalogPage {
  readonly productLinks: Locator;
  readonly outOfStock: Locator;
  readonly availableCard: Locator;
  readonly availableProductName: Locator;

  constructor(
    private readonly page: Page,
    private readonly network: CatalogEvidence,
    private readonly config: WebConfig
  ) {
    this.productLinks = page.locator('a[data-test^="product-"]');
    this.outOfStock = page.locator('[data-test="out-of-stock"]');
    this.availableCard = page.locator(
      'a[data-test^="product-"]:not(:has([data-test="out-of-stock"]))'
    ).first();
    this.availableProductName = this.availableCard.locator('[data-test="product-name"]');
  }

  private async saveUnavailableCatalogEvidence(): Promise<void> {
    const reportDirectory = path.resolve(process.cwd(), "../reports/catalog-diagnostics");
    await mkdir(reportDirectory, { recursive: true });
    const name = `catalog-${Date.now()}-${randomUUID()}`;
    const screenshotPath = path.join(reportDirectory, `${name}.png`);
    const diagnosticPath = path.join(reportDirectory, `${name}.json`);

    // Capture the screenshot immediately, before any further page inspection.
    let screenshotError: string | undefined;
    try {
      await this.page.screenshot({ path: screenshotPath, fullPage: true });
    } catch (error) {
      screenshotError = String(error).slice(0, 200);
    }

    const [title, pageState, productCount, outOfStockCount] = await Promise.allSettled([
      this.page.title(),
      this.page.evaluate(() => ({
        readyState: document.readyState,
        bodyText: (document.body?.innerText ?? "").slice(0, 2000),
      })),
      this.productLinks.count(),
      this.outOfStock.count(),
    ]);

    const report = {
      url: safePageUrl(this.page.url()),
      title: title.status === "fulfilled" ? title.value.slice(0, 200) : "[unavailable]",
      readyState: pageState.status === "fulfilled" ? pageState.value.readyState : "unavailable",
      productCount: productCount.status === "fulfilled" ? productCount.value : null,
      outOfStockCount: outOfStockCount.status === "fulfilled" ? outOfStockCount.value : null,
      bodyExcerpt: pageState.status === "fulfilled"
        ? safeBodyExcerpt(pageState.value.bodyText)
        : "[unavailable]",
      httpErrorCount: this.network.catalogHttpErrorCount,
      httpErrors: this.network.catalogHttpErrors,
      networkFailureCount: this.network.catalogNetworkFailureCount,
      networkFailures: this.network.catalogNetworkFailures,
      screenshot: screenshotError ? null : path.basename(screenshotPath),
      screenshotError,
    };

    await writeFile(diagnosticPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
    console.error(`Catalog unavailable. Diagnostic saved: ${diagnosticPath}`);
  }

  async openAvailableProduct(): Promise<string> {
    await this.page.goto(this.config.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    try {
      await expect(this.availableCard).toBeVisible({ timeout: 15_000 });
    } catch (error) {
      try {
        await this.saveUnavailableCatalogEvidence();
      } catch (diagnosticError) {
        console.error(`Catalog diagnostic could not be saved: ${String(diagnosticError).slice(0, 200)}`);
      }
      throw error;
    }

    const name = await this.availableProductName.innerText();
    await this.availableCard.click();

    return name.trim();
  }
}
