import assert from "node:assert/strict";

import { expect } from "playwright/test";
import type { Page } from "playwright";

import { moneyToCents } from "./product.page.ts";
import type { SelectedProduct } from "./product.page.ts";

export class CartPage {
  constructor(private readonly page: Page) {}

  async open(): Promise<void> {
    await this.page.locator('[data-test="nav-cart"]').click();
    await expect(this.page).toHaveURL(/\/checkout(?:[/?#]|$)/);
    await expect(this.page.locator('[data-test="product-title"]')).toBeVisible();
  }

  async verifySelectedProduct(product: SelectedProduct): Promise<void> {
    await expect(this.page.locator('[data-test="product-title"]'))
      .toHaveText(product.name);
    await expect(this.page.locator('[data-test="product-quantity"]'))
      .toHaveValue(String(product.quantity));

    const unitPrice = this.page.locator('[data-test="product-price"]');
    const linePrice = this.page.locator('[data-test="line-price"]');
    const total = this.page.locator('[data-test="cart-total"]');
    await expect(unitPrice).toBeVisible();
    await expect(linePrice).toBeVisible();
    await expect(total).toBeVisible();

    const cartUnitCents = moneyToCents(await unitPrice.innerText());
    const lineCents = moneyToCents(await linePrice.innerText());
    const totalCents = moneyToCents(await total.innerText());

    assert.equal(cartUnitCents, product.unitPriceCents);
    assert.equal(lineCents, cartUnitCents * product.quantity);
    assert.equal(totalCents, lineCents);
  }

  async startCheckout(): Promise<void> {
    await this.page.locator('[data-test="proceed-1"]').click();
  }
}
