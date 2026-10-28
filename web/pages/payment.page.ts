import type { Locator, Page } from "playwright";
import type { TestCard } from "../support/test-data.ts";

export class PaymentPage {
  readonly method: Locator;
  readonly cardNumber: Locator;
  readonly expiration: Locator;
  readonly cvv: Locator;
  readonly cardHolder: Locator;
  readonly finish: Locator;
  readonly success: Locator;
  readonly confirmation: Locator;
  readonly cardNumberError: Locator;

  constructor(page: Page) {
    this.method = page.locator('[data-test="payment-method"]');
    this.cardNumber = page.locator('[data-test="credit_card_number"]');
    this.expiration = page.locator('[data-test="expiration_date"]');
    this.cvv = page.locator('[data-test="cvv"]');
    this.cardHolder = page.locator('[data-test="card_holder_name"]');
    this.finish = page.locator('[data-test="finish"]');
    this.success = page.locator('[data-test="payment-success-message"]');
    this.confirmation = page.locator('#order-confirmation');
    this.cardNumberError = page.getByText("Invalid card number format.", { exact: true });
  }

  async fillCard(card: TestCard): Promise<void> {
    await this.method.selectOption("credit-card");
    await this.cardNumber.fill(card.number);
    await this.expiration.fill(card.expiration);
    await this.cvv.fill(card.cvv);
    await this.cardHolder.fill(card.holder);
  }

  async submit(): Promise<void> {
    await this.finish.click();
  }
}
