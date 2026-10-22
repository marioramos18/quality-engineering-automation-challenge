import { expect } from "playwright/test";
import type { Locator, Page } from "playwright";
import type { BillingAddress, BillingField, GuestDetails } from "../support/test-data.ts";
import { routes } from "../support/routes.ts";

export class CheckoutPage {
  readonly guestTab: Locator;
  readonly guestEmail: Locator;
  readonly guestFirstName: Locator;
  readonly guestLastName: Locator;
  readonly guestSubmit: Locator;
  readonly guestProceed: Locator;
  readonly billingHeading: Locator;
  readonly country: Locator;
  readonly billingFields: Readonly<Record<BillingField, Locator>>;
  readonly billingProceed: Locator;
  readonly paymentHeading: Locator;
  readonly paymentMethod: Locator;
  readonly finish: Locator;

  constructor(private readonly page: Page) {
    this.guestTab = page.getByRole("tab", { name: "Continue as Guest" });
    this.guestEmail = page.locator('[data-test="guest-email"]');
    this.guestFirstName = page.locator('[data-test="guest-first-name"]');
    this.guestLastName = page.locator('[data-test="guest-last-name"]');
    this.guestSubmit = page.locator('[data-test="guest-submit"]');
    this.guestProceed = page.locator('[data-test="proceed-2-guest"]');
    this.billingHeading = page.getByRole("heading", { name: "Billing Address" });
    this.country = page.locator('[data-test="country"]');
    this.billingFields = {
      postal_code: page.locator('[data-test="postal_code"]'),
      house_number: page.locator('[data-test="house_number"]'),
      street: page.locator('[data-test="street"]'),
      city: page.locator('[data-test="city"]'),
      state: page.locator('[data-test="state"]'),
    };
    this.billingProceed = page.locator('[data-test="proceed-3"]');
    this.paymentHeading = page.getByRole("heading", { name: "Payment" });
    this.paymentMethod = page.locator('[data-test="payment-method"]');
    this.finish = page.locator('[data-test="finish"]');
  }

  async continueAsGuest(guest: GuestDetails): Promise<void> {
    await expect(this.guestTab).toBeVisible();
    await this.guestTab.click();

    await this.guestEmail.fill(guest.email);
    await this.guestFirstName.fill(guest.firstName);
    await this.guestLastName.fill(guest.lastName);
    await this.guestSubmit.click();

    await expect(this.guestProceed).toBeEnabled();
    await this.guestProceed.click();
    await expect(this.billingHeading).toBeVisible();
  }

  async fillBillingAddress(address: BillingAddress, omittedField?: BillingField): Promise<void> {
    await this.country.selectOption({ label: address.country });

    for (const field of Object.keys(address.fields) as BillingField[]) {
      if (field !== omittedField) {
        await this.billingFields[field].fill(address.fields[field]);
      }
    }
  }

  async openPayment(): Promise<void> {
    await expect(this.billingProceed).toBeEnabled();
    await this.billingProceed.click();
    await expect(this.page).toHaveURL(routes.checkout);
  }
}
