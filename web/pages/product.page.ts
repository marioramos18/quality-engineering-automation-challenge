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

  async addAvailableProduct(): Promise<SelectedProduct> {
    const selected: SelectedProduct = {
      name: (await this.name.innerText()).trim(),
      quantity: Number(await this.quantity.inputValue()),
      unitPriceCents: moneyToCents(await this.unitPrice.innerText()),
    };

    await this.addToCartButton.click();
    return selected;
  }
}
