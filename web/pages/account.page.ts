import type { Page } from "playwright";

export class AccountPage {
  constructor(private readonly page: Page) {}

  async openProfile(): Promise<void> {
    await this.page.locator('[data-test="nav-profile"]').click();
    await this.page.waitForURL(/\/account\/profile(?:[/?#]|$)/);
  }

  async waitForProfileForm(): Promise<void> {
    await this.page.getByRole("heading", { name: "Profile" }).waitFor({
      state: "visible",
    });
    await this.page.locator('[data-test="first-name"]').waitFor({
      state: "visible",
    });
    await this.page.locator('[data-test="email"]').waitFor({
      state: "visible",
    });
  }
}
