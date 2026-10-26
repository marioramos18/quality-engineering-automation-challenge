import { randomUUID } from "node:crypto";

export type BillingField =
  | "postal_code"
  | "house_number"
  | "street"
  | "city"
  | "state";

export interface GuestDetails {
  readonly email: string;
  readonly firstName: string;
  readonly lastName: string;
}

export interface BillingAddress {
  readonly country: string;
  readonly fields: Readonly<Record<"postal_code" | "house_number", string>>;
}

export function createGuestDetails(): GuestDetails {
  return {
    email: `qa-checkout-${randomUUID()}@example.com`,
    firstName: "QA",
    lastName: "Explorer",
  };
}

export const billingAddress: BillingAddress = {
  country: "Brazil",
  fields: {
    postal_code: "99999-999",
    house_number: "1",
  },
};

export interface TestCard {
  readonly number: string;
  readonly expiration: string;
  readonly cvv: string;
  readonly holder: string;
}

// Synthetic format accepted by the demo validator; never a real payment.
export function createTestCard(validFormat = true): TestCard {
  return {
    number: validFormat ? "0000-0000-0000-0000" : "invalid-card-number",
    expiration: `12/${new Date().getFullYear() + 2}`,
    cvv: "000",
    holder: "QA Test",
  };
}
