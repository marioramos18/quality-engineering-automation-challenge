import type { Page, Response } from "playwright";
import { checkoutApiRoutes } from "./routes.ts";

export interface PostcodeLocality {
  readonly street: string;
  readonly city: string;
  readonly state: string;
}

export async function waitForPostcodeLookup(
  page: Page,
  postcode: string,
  houseNumber: string
): Promise<PostcodeLocality> {
  const response = await page.waitForResponse((candidate) => {
    const url = new URL(candidate.url());
    return url.pathname === checkoutApiRoutes.postcodeLookup &&
      url.searchParams.get("postcode") === postcode &&
      url.searchParams.get("house_number") === houseNumber;
  });
  if (!response.ok()) {
    throw new Error(`Postcode lookup failed: HTTP ${response.status()}`);
  }
  const locality: unknown = await response.json();
  if (typeof locality !== "object" || locality === null ||
      !["street", "city", "state"].every((field) =>
        typeof (locality as Record<string, unknown>)[field] === "string")) {
    throw new Error("Postcode lookup returned an invalid locality");
  }
  return locality as PostcodeLocality;
}

export function waitForCheckoutPost(
  page: Page,
  path: typeof checkoutApiRoutes.paymentCheck | typeof checkoutApiRoutes.guestInvoice
): Promise<Response> {
  return page.waitForResponse((response) =>
    new URL(response.url()).pathname === path && response.request().method() === "POST");
}
