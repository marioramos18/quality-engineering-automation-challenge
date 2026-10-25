import { mkdir, writeFile } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import path from "node:path";
import type { Page } from "playwright";
import type { E2EWorld } from "./world.ts";

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

export async function saveCatalogDiagnostics(page: Page, network: CatalogEvidence): Promise<void> {
  const reportDirectory = path.resolve(process.cwd(), process.env.E2E_REPORT_DIR ?? "../reports", "catalog-diagnostics");
  await mkdir(reportDirectory, { recursive: true });
  const name = `catalog-${Date.now()}-${randomUUID()}`;
  const screenshotPath = path.join(reportDirectory, `${name}.png`);
  const diagnosticPath = path.join(reportDirectory, `${name}.json`);

  // Capture the screenshot immediately, before any further page inspection.
  let screenshotError: string | undefined;
  try {
    await page.screenshot({ path: screenshotPath, fullPage: true });
  } catch (error) {
    screenshotError = String(error).slice(0, 200);
  }

  const [title, pageState, productCount, outOfStockCount] = await Promise.allSettled([
    page.title(),
    page.evaluate(() => ({
      readyState: document.readyState,
      bodyText: (document.body?.innerText ?? "").slice(0, 2000),
    })),
    page.evaluate(() => document.querySelectorAll('a[data-test^="product-"]').length),
    page.evaluate(() => document.querySelectorAll('[data-test="out-of-stock"]').length),
  ]);

  const report = {
    url: safePageUrl(page.url()),
    title: title.status === "fulfilled" ? title.value.slice(0, 200) : "[unavailable]",
    readyState: pageState.status === "fulfilled" ? pageState.value.readyState : "unavailable",
    productCount: productCount.status === "fulfilled" ? productCount.value : null,
    outOfStockCount: outOfStockCount.status === "fulfilled" ? outOfStockCount.value : null,
    bodyExcerpt: pageState.status === "fulfilled"
      ? safeBodyExcerpt(pageState.value.bodyText)
      : "[unavailable]",
    httpErrorCount: network.catalogHttpErrorCount,
    httpErrors: network.catalogHttpErrors,
    networkFailureCount: network.catalogNetworkFailureCount,
    networkFailures: network.catalogNetworkFailures,
    screenshot: screenshotError ? null : path.basename(screenshotPath),
    screenshotError,
  };

  await writeFile(diagnosticPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  console.error(`Scenario failed. Diagnostic saved: ${diagnosticPath}`);
}
