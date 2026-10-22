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
  readonly fields: Readonly<Record<BillingField, string>>;
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
    street: "Test Street",
    city: "Test City",
    state: "Test State",
  },
};
