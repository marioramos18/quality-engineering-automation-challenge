import { expect } from "playwright/test";
import type { Locator, Page } from "playwright";
import { moneyToCents } from "../support/money.ts";

export interface SelectedProduct {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export class ProductPage {
  readonly name: Locator;
  readonly unitPrice: Locator;
  readonly quantity: Locator;
  readonly addToCartButton: Locator;
  readonly addedNotice: Locator;
  readonly cartQuantity: Locator;

  constructor(page: Page) {
    this.name = page.locator('[data-test="product-name"]');
    this.unitPrice = page.locator('[data-test="unit-price"]');
    this.quantity = page.locator('[data-test="quantity"]');
    this.addToCartButton = page.locator('[data-test="add-to-cart"]');
    this.addedNotice = page.getByText("Product added to shopping cart.");
    this.cartQuantity = page.locator('[data-test="cart-quantity"]');
  }

  async addAvailableProduct(expectedName: string): Promise<SelectedProduct> {
    await expect(this.name).toHaveText(expectedName);
    await expect(this.unitPrice).toBeVisible();
    await expect(this.addToCartButton).toBeEnabled();

    const selected: SelectedProduct = {
      name: expectedName,
      quantity: Number(await this.quantity.inputValue()),
      unitPriceCents: moneyToCents(await this.unitPrice.innerText()),
    };

    await this.addToCartButton.click();
    await expect(this.addedNotice).toBeVisible();
    await expect(this.cartQuantity)
      .toHaveText(String(selected.quantity));

    return selected;
  }
}
