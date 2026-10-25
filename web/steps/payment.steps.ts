import assert from "node:assert/strict";
import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";
import { CheckoutPage } from "../pages/checkout.page.ts";
import { PaymentPage } from "../pages/payment.page.ts";
import { InvoiceApi } from "../support/invoice-api.ts";
import { createTestCard } from "../support/test-data.ts";
import type { E2EWorld } from "../support/world.ts";

Given("the isolated order count is recorded", async function (this: E2EWorld) {
  assert.ok(this.context);
  this.invoiceApi = await InvoiceApi.connect(this.context.request);
  this.invoicesBefore = await this.invoiceApi.count();
});

When("I open the payment step", async function (this: E2EWorld) {
  assert.ok(this.page);
  const checkout = new CheckoutPage(this.page);
  await expect(checkout.billingProceed).toBeEnabled();
  await checkout.openPayment();
  await expect(checkout.paymentHeading).toBeVisible();
});

When("I provide a synthetic card with {word} format", async function (this: E2EWorld, format: string) {
  assert.ok(this.page);
  assert.ok(format === "valid" || format === "invalid");
  await new PaymentPage(this.page).fillCard(createTestCard(format === "valid"));
});

When("I check the demonstration payment", async function (this: E2EWorld) {
  assert.ok(this.page);
  const payment = new PaymentPage(this.page);
  const response = await payment.checkPayment();
  assert.equal(response.status(), 200);
  assert.equal((await response.json()).message, "Payment was successful");
  await expect(payment.success).toHaveText("Payment was successful");
  await expect(payment.finish).toHaveText("Confirm");
});

When("I confirm my order", async function (this: E2EWorld) {
  assert.ok(this.page);
  this.orderResponse = await new PaymentPage(this.page).confirmOrder();
});

Then("my order should be confirmed and persisted with the selected product", async function (this: E2EWorld) {
  assert.ok(this.page && this.orderResponse && this.invoiceApi && this.selectedProduct);
  const created = await this.orderResponse.json();
  assert.equal(this.orderResponse.status(), 201, `Order creation failed: ${JSON.stringify(created)}`);
  assert.equal(typeof created.id, "string");
  assert.equal(typeof created.invoice_number, "string");
  assert.ok(created.invoice_number.length > 0);
  const payment = new PaymentPage(this.page);
  await expect(payment.confirmation).toContainText("Thanks for your order!");
  await expect(payment.confirmation).toContainText(created.invoice_number);
  const persisted = await this.invoiceApi.find(created.id);
  assert.equal(persisted.invoice_number, created.invoice_number);
  assert.equal(persisted.total, created.total);
  assert.ok(Array.isArray(persisted.invoicelines));
  assert.equal(persisted.invoicelines.length, 1);
  const line = persisted.invoicelines[0];
  assert.equal(line.product.name, this.selectedProduct.name);
  assert.equal(line.quantity, this.selectedProduct.quantity);
  assert.equal(Math.round(Number(line.unit_price) * 100), this.selectedProduct.unitPriceCents);
  assert.ok(Number(persisted.total) > 0);
  assert.equal(Math.round(Number(persisted.subtotal) * 100),
    this.selectedProduct.unitPriceCents * this.selectedProduct.quantity);
  assert.equal(await this.invoiceApi.count(), this.invoicesBefore! + 1);
  await this.attach(JSON.stringify({ id: created.id, invoiceNumber: created.invoice_number,
    total: persisted.total, subtotal: persisted.subtotal, product: line.product.name,
    quantity: line.quantity }), "application/json");
});

Then("the invalid card format should prevent payment and order creation", async function (this: E2EWorld) {
  assert.ok(this.page && this.invoiceApi);
  const payment = new PaymentPage(this.page);
  await expect(payment.cardNumberError).toBeVisible();
  await expect(payment.finish).toBeDisabled();
  await expect(payment.confirmation).toBeHidden();
  assert.equal(await this.invoiceApi.count(), this.invoicesBefore);
});
