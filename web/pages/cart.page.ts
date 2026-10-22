import { expect } from "playwright/test";
import type { Locator, Page } from "playwright";
import { routes } from "../support/routes.ts";

export class CartPage {
  readonly navCart: Locator;
  readonly productTitle: Locator;
  readonly productQuantity: Locator;
  readonly productPrice: Locator;
  readonly linePrice: Locator;
  readonly cartTotal: Locator;
  readonly proceed: Locator;

  constructor(private readonly page: Page) {
    this.navCart = page.locator('[data-test="nav-cart"]');
    this.productTitle = page.locator('[data-test="product-title"]');
    this.productQuantity = page.locator('[data-test="product-quantity"]');
    this.productPrice = page.locator('[data-test="product-price"]');
    this.linePrice = page.locator('[data-test="line-price"]');
    this.cartTotal = page.locator('[data-test="cart-total"]');
    this.proceed = page.locator('[data-test="proceed-1"]');
  }

  async open(): Promise<void> {
    await this.navCart.click();
    await expect(this.page).toHaveURL(routes.checkout);
    await expect(this.productTitle).toBeVisible();
  }

  async startCheckout(): Promise<void> {
    await this.proceed.click();
  }
}
