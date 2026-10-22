import type { Locator, Page } from "playwright";
import { routes } from "../support/routes.ts";

export class AccountPage {
  readonly profileLink: Locator;
  readonly profileHeading: Locator;
  readonly firstName: Locator;
  readonly email: Locator;

  constructor(private readonly page: Page) {
    this.profileLink = page.locator('[data-test="nav-profile"]');
    this.profileHeading = page.getByRole("heading", { name: "Profile" });
    this.firstName = page.locator('[data-test="first-name"]');
    this.email = page.locator('[data-test="email"]');
  }

  async openProfile(): Promise<void> {
    await this.profileLink.click();
    await this.page.waitForURL(routes.profile);
  }
}
