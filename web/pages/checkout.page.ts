import type { Locator, Page } from "playwright";
import type { BillingAddress, BillingField, GuestDetails } from "../support/test-data.ts";

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
    await this.guestTab.click();

    await this.guestEmail.fill(guest.email);
    await this.guestFirstName.fill(guest.firstName);
    await this.guestLastName.fill(guest.lastName);
    await this.guestSubmit.click();

    await this.guestProceed.click();
  }

  async fillBillingAddress(address: BillingAddress, omittedField?: BillingField): Promise<void> {
    await this.country.selectOption({ label: address.country });
    await this.billingFields.postal_code.fill(address.fields.postal_code);
    const [lookup] = await Promise.all([
      this.page.waitForResponse((response) => {
        const url = new URL(response.url());
        return url.pathname === "/postcode-lookup" &&
          url.searchParams.get("postcode") === address.fields.postal_code &&
          url.searchParams.get("house_number") === address.fields.house_number;
      }),
      this.billingFields.house_number.fill(address.fields.house_number),
    ]);
    if (!lookup.ok()) {
      throw new Error(`Postcode lookup failed: HTTP ${lookup.status()}`);
    }
    const locality = await lookup.json();
    // The application validates city/state against this deterministic lookup.
    // Use its synthetic locality rather than racing the automatic field update.
    for (const field of ["street", "city", "state"] as const) {
      await this.billingFields[field].fill(locality[field]);
    }
    if (omittedField) {
      await this.billingFields[omittedField].fill("");
    }
  }

  async openPayment(): Promise<void> {
    await this.billingProceed.click();
  }
}
