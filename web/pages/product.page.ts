import assert from "node:assert/strict";

import { expect } from "playwright/test";
import type { Page } from "playwright";

export interface SelectedProduct {
  name: string;
  quantity: number;
  unitPriceCents: number;
}

export function moneyToCents(text: string): number {
  const amount = text.replace(/[^\d.]/g, "");
  assert.match(amount, /^\d+(?:\.\d{1,2})?$/, `Invalid price: ${text}`);
  return Math.round(Number(amount) * 100);
}

export class ProductPage {
  constructor(private readonly page: Page) {}

  async addAvailableProduct(expectedName: string): Promise<SelectedProduct> {
    const name = this.page.locator('[data-test="product-name"]');
    const unitPrice = this.page.locator('[data-test="unit-price"]');
    const quantity = this.page.locator('[data-test="quantity"]');
    const addToCart = this.page.locator('[data-test="add-to-cart"]');

    await expect(name).toHaveText(expectedName);
    await expect(unitPrice).toBeVisible();
    await expect(addToCart).toBeEnabled();

    const selected: SelectedProduct = {
      name: expectedName,
      quantity: Number(await quantity.inputValue()),
      unitPriceCents: moneyToCents(await unitPrice.innerText()),
    };
    assert.ok(Number.isInteger(selected.quantity) && selected.quantity > 0);
    assert.ok(selected.unitPriceCents > 0);

    await addToCart.click();
    await expect(
      this.page.getByText("Product added to shopping cart.")
    ).toBeVisible();
    await expect(this.page.locator('[data-test="cart-quantity"]'))
      .toHaveText(String(selected.quantity));

    return selected;
  }
}
