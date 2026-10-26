import type { Locator, Page } from "playwright";
import type { WebConfig } from "../support/config.ts";

export class CatalogPage {
  readonly productLinks: Locator;
  readonly outOfStock: Locator;
  readonly availableCard: Locator;
  readonly availableProductName: Locator;

  constructor(
    private readonly page: Page,
    private readonly config: WebConfig
  ) {
    this.productLinks = page.locator('a[data-test^="product-"]');
    this.outOfStock = page.locator('[data-test="out-of-stock"]');
    this.availableCard = page.locator(
      'a[data-test^="product-"]:not(:has([data-test="out-of-stock"]))'
    ).first();
    this.availableProductName = this.availableCard.locator('[data-test="product-name"]');
  }

  async openAvailableProduct(): Promise<string> {
    await this.page.goto(this.config.baseUrl, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await this.availableCard.waitFor({ state: "visible", timeout: 15_000 });

    const name = await this.availableProductName.innerText();
    await this.availableCard.click();

    return name.trim();
  }
}
