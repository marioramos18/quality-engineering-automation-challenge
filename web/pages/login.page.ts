import type { Locator, Page } from "playwright";

export class LoginPage {
  private readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async open(): Promise<void> {
    const baseUrl = (
      process.env.WEB_BASE_URL ??
      "https://practicesoftwaretesting.com"
    ).replace(/\/$/, "");

    await this.page.goto(`${baseUrl}/auth/login`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await this.page
      .locator('[data-test="email"]')
      .waitFor({
        state: "visible",
        timeout: 10000,
      });
  }

  async login(
    email: string,
    password: string
  ): Promise<void> {
    await this.page
      .locator('[data-test="email"]')
      .fill(email);

    await this.page
      .locator('[data-test="password"]')
      .fill(password);

    await this.page
      .locator('[data-test="login-submit"]')
      .click();
  }

  async waitForAccountPage(): Promise<void> {
    const authenticationError = this.page.locator(
      '[data-test="login-error"]:visible, ' +
      '[role="alert"]:visible, ' +
      '.alert-danger:visible'
    ).first();

    await Promise.race([
      this.page.waitForURL(/\/account(?:[/?#]|$)/, { timeout: 20000 }),
      authenticationError.waitFor({ state: "visible", timeout: 20000 })
        .then(async () => {
          throw new Error(
            `Login was rejected: ${(await authenticationError.innerText()).trim()}`
          );
        }),
    ]);

    await this.page
      .getByRole("heading", { name: /my account/i })
      .waitFor({ state: "visible" });
  }

  async getAuthenticationError(): Promise<string> {
    const errorMessage = this.page.locator(
      '[data-test="login-error"]:visible, ' +
      '[role="alert"]:visible, ' +
      '.alert-danger:visible'
    ).first();

    await errorMessage.waitFor({
      state: "visible",
      timeout: 10000,
    });

    return (await errorMessage.innerText()).trim();
  }

  requiredFieldError(
    field: "email" | "password"
  ): Locator {
    const pattern =
      field === "email"
        ? /email.*required/i
        : /password.*required/i;

    return this.page.getByText(pattern).first();
  }
}
