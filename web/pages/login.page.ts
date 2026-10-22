import type { Locator, Page } from "playwright";
import type { WebConfig } from "../support/config.ts";
import { routes } from "../support/routes.ts";

export class LoginPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly submit: Locator;
  readonly authenticationError: Locator;
  readonly accountHeading: Locator;
  readonly requiredErrors: Readonly<Record<"email" | "password", Locator>>;

  constructor(private readonly page: Page, private readonly config: WebConfig) {
    this.email = page.locator('[data-test="email"]');
    this.password = page.locator('[data-test="password"]');
    this.submit = page.locator('[data-test="login-submit"]');
    this.authenticationError = page.locator(
      '[data-test="login-error"]:visible, ' +
      '[role="alert"]:visible, ' +
      '.alert-danger:visible'
    ).first();
    this.accountHeading = page.getByRole("heading", { name: /my account/i });
    this.requiredErrors = {
      email: page.getByText(/email.*required/i).first(),
      password: page.getByText(/password.*required/i).first(),
    };
  }

  async open(): Promise<void> {
    await this.page.goto(`${this.config.baseUrl}${routes.login}`, {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });

    await this.email.waitFor({ state: "visible", timeout: 10000 });
  }

  async login(
    email: string,
    password: string
  ): Promise<void> {
    await this.email.fill(email);
    await this.password.fill(password);
    await this.submit.click();
  }

  async awaitAccountNavigation(): Promise<void> {
    await Promise.race([
      this.page.waitForURL(routes.account, { timeout: 20000 }),
      this.authenticationError.waitFor({ state: "visible", timeout: 20000 })
        .then(async () => {
          throw new Error(
            `Login was rejected: ${(await this.authenticationError.innerText()).trim()}`
          );
        }),
    ]);
  }

  async getAuthenticationError(): Promise<string> {
    await this.authenticationError.waitFor({
      state: "visible",
      timeout: 10000,
    });

    return (await this.authenticationError.innerText()).trim();
  }

  requiredFieldError(
    field: "email" | "password"
  ): Locator {
    return this.requiredErrors[field];
  }
}
