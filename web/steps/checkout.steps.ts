import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { Given, Then, When } from "@cucumber/cucumber";

import { CartPage } from "../pages/cart.page.ts";
import { CatalogPage } from "../pages/catalog.page.ts";
import { CheckoutPage } from "../pages/checkout.page.ts";
import type { BillingField } from "../pages/checkout.page.ts";
import { ProductPage } from "../pages/product.page.ts";
import type { E2EWorld } from "../support/world.ts";

Given("I have added an available product to my cart", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");

  const name = await new CatalogPage(this.page).openAvailableProduct();
  this.selectedProduct = await new ProductPage(this.page).addAvailableProduct(name);
});

When("I view my cart", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  await new CartPage(this.page).open();
});

Then(
  "the cart should show the product with a consistent quantity and total",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    assert.ok(this.selectedProduct, "No product was selected");
    await new CartPage(this.page).verifySelectedProduct(this.selectedProduct);
  }
);

When("I continue checkout as a guest", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");

  const cart = new CartPage(this.page);
  await cart.open();
  await cart.startCheckout();

  const email = `qa-checkout-${randomUUID()}@example.com`;
  await new CheckoutPage(this.page).continueAsGuest(email);
});

When("I provide a complete billing address", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  await new CheckoutPage(this.page).fillBillingAddress();
});

When(
  "I provide a billing address without {string}",
  async function (this: E2EWorld, field: string) {
    assert.ok(this.page, "Page not initialized");
    assert.ok(
      ["postal_code", "house_number", "street", "city", "state"].includes(field),
      `Unexpected billing field: ${field}`
    );
    await new CheckoutPage(this.page).fillBillingAddress(field as BillingField);
  }
);

Then(
  "I should remain on billing address without being able to continue",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    await new CheckoutPage(this.page).verifyIncompleteAddress();
  }
);

Then(
  "I should reach the payment step without placing an order",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");
    await new CheckoutPage(this.page).reachPayment();
  }
);
