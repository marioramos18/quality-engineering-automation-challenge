import { expect } from "playwright/test";
import type { Page } from "playwright";

export class CatalogPage {
  constructor(private readonly page: Page) {}

  async openAvailableProduct(): Promise<string> {
    const baseUrl = (
      process.env.WEB_BASE_URL ??
      "https://practicesoftwaretesting.com"
    ).replace(/\/$/, "");

    await this.page.goto(baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    const card = this.page.locator(
      'a[data-test^="product-"]:not(:has([data-test="out-of-stock"]))'
    ).first();
    await expect(card).toBeVisible();

    const name = await card.locator('[data-test="product-name"]').innerText();
    await card.click();

    return name.trim();
  }
}
