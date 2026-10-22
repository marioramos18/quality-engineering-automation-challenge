import assert from "node:assert/strict";

import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";

import { CartPage } from "../pages/cart.page.ts";
import { CatalogPage } from "../pages/catalog.page.ts";
import { CheckoutPage } from "../pages/checkout.page.ts";
import { billingAddress, createGuestDetails } from "../support/test-data.ts";
import type { BillingField } from "../support/test-data.ts";
import { ProductPage } from "../pages/product.page.ts";
import { moneyToCents } from "../support/money.ts";
import { routes } from "../support/routes.ts";
import type { E2EWorld } from "../support/world.ts";

Given("I have added an available product to my cart", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");

  const name = await new CatalogPage(this.page, this, this.config).openAvailableProduct();
  const product = new ProductPage(this.page);
  await expect(product.name).toHaveText(name);
  await expect(product.unitPrice).toBeVisible();
  await expect(product.addToCartButton).toBeEnabled();
  this.selectedProduct = await product.addAvailableProduct();
  await expect(product.addedNotice).toBeVisible();
  await expect(product.cartQuantity).toHaveText(String(this.selectedProduct.quantity));
  assert.ok(Number.isInteger(this.selectedProduct.quantity) && this.selectedProduct.quantity > 0);
  assert.ok(this.selectedProduct.unitPriceCents > 0);
});

When("I view my cart", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  await new CartPage(this.page).open();
  await expect(this.page).toHaveURL(routes.checkout);
});

Then(
  "the cart should show the product with a consistent quantity and total",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    assert.ok(this.selectedProduct, "No product was selected");
    const cart = new CartPage(this.page);
    await expect(cart.productTitle).toHaveText(this.selectedProduct.name);
    await expect(cart.productQuantity).toHaveValue(String(this.selectedProduct.quantity));
    await expect(cart.productPrice).toBeVisible();
    await expect(cart.linePrice).toBeVisible();
    await expect(cart.cartTotal).toBeVisible();

    const unitCents = moneyToCents(await cart.productPrice.innerText());
    const lineCents = moneyToCents(await cart.linePrice.innerText());
    const totalCents = moneyToCents(await cart.cartTotal.innerText());
    assert.equal(unitCents, this.selectedProduct.unitPriceCents);
    assert.equal(lineCents, unitCents * this.selectedProduct.quantity);
    assert.equal(totalCents, lineCents);
  }
);

When("I continue checkout as a guest", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");

  const cart = new CartPage(this.page);
  await cart.open();
  await expect(this.page).toHaveURL(routes.checkout);
  await expect(cart.productTitle).toBeVisible();
  await cart.startCheckout();

  const checkout = new CheckoutPage(this.page);
  await checkout.continueAsGuest(createGuestDetails());
  await expect(checkout.billingHeading).toBeVisible();
});

When("I provide a complete billing address", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  await new CheckoutPage(this.page).fillBillingAddress(billingAddress);
});

When(
  "I provide a billing address without {string}",
  async function (this: E2EWorld, field: string) {
    assert.ok(this.page, "Page not initialized");
    assert.ok(
      ["postal_code", "house_number", "street", "city", "state"].includes(field),
      `Unexpected billing field: ${field}`
    );
    await new CheckoutPage(this.page).fillBillingAddress(billingAddress, field as BillingField);
  }
);

Then(
  "I should remain on billing address without being able to continue",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    const checkout = new CheckoutPage(this.page);
    await expect(checkout.billingHeading).toBeVisible();
    await expect(checkout.billingProceed).toBeDisabled();
  }
);

Then(
  "I should reach the payment step without placing an order",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    const checkout = new CheckoutPage(this.page);
    await expect(checkout.billingProceed).toBeEnabled();
    await checkout.openPayment();
    await expect(this.page).toHaveURL(routes.checkout);
    await expect(checkout.paymentHeading).toBeVisible();
    await expect(checkout.paymentMethod).toBeVisible();
    await expect(checkout.finish).toBeDisabled();
  }
);
