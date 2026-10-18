import { expect } from "playwright/test";
import type { Page } from "playwright";

export type BillingField =
  | "postal_code"
  | "house_number"
  | "street"
  | "city"
  | "state";

const billingValues: Record<BillingField, string> = {
  postal_code: "99999-999",
  house_number: "1",
  street: "Test Street",
  city: "Test City",
  state: "Test State",
};

export class CheckoutPage {
  constructor(private readonly page: Page) {}

  async continueAsGuest(email: string): Promise<void> {
    const guestTab = this.page.getByRole("tab", { name: "Continue as Guest" });
    await expect(guestTab).toBeVisible();
    await guestTab.click();

    await this.page.locator('[data-test="guest-email"]').fill(email);
    await this.page.locator('[data-test="guest-first-name"]').fill("QA");
    await this.page.locator('[data-test="guest-last-name"]').fill("Explorer");
    await this.page.locator('[data-test="guest-submit"]').click();

    const proceed = this.page.locator('[data-test="proceed-2-guest"]');
    await expect(proceed).toBeEnabled();
    await proceed.click();
    await expect(
      this.page.getByRole("heading", { name: "Billing Address" })
    ).toBeVisible();
  }

  async fillBillingAddress(omittedField?: BillingField): Promise<void> {
    await this.page.locator('[data-test="country"]')
      .selectOption({ label: "Brazil" });

    for (const [field, value] of Object.entries(billingValues)) {
      if (field !== omittedField) {
        await this.page.locator(`[data-test="${field}"]`).fill(value);
      }
    }
  }

  async verifyIncompleteAddress(): Promise<void> {
    await expect(
      this.page.getByRole("heading", { name: "Billing Address" })
    ).toBeVisible();
    await expect(this.page.locator('[data-test="proceed-3"]'))
      .toBeDisabled();
  }

  async reachPayment(): Promise<void> {
    const proceed = this.page.locator('[data-test="proceed-3"]');
    await expect(proceed).toBeEnabled();
    await proceed.click();

    await expect(this.page).toHaveURL(/\/checkout(?:[/?#]|$)/);
    await expect(this.page.getByRole("heading", { name: "Payment" }))
      .toBeVisible();
    await expect(this.page.locator('[data-test="payment-method"]'))
      .toBeVisible();
    await expect(this.page.locator('[data-test="finish"]'))
      .toBeDisabled();
  }
}
