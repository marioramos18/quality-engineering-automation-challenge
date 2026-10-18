import assert from "node:assert/strict";

import {
  Given,
  When,
  Then,
} from "@cucumber/cucumber";

import { LoginPage } from "../pages/login.page.ts";
import type { E2EWorld } from "../support/world.ts";


Given(
  "I am on the Toolshop login page",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");

    const loginPage = new LoginPage(this.page);

    await loginPage.open();
  }
);


When(
  "I sign in with valid customer credentials",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");

    const email =
      process.env.E2E_CUSTOMER_EMAIL ??
      "customer@practicesoftwaretesting.com";

    const password =
      process.env.E2E_CUSTOMER_PASSWORD ??
      "welcome01";

    const loginPage = new LoginPage(this.page);

    await loginPage.login(email, password);
  }
);


Then(
  "I should see my account page",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");

    const loginPage = new LoginPage(this.page);

    await loginPage.waitForAccountPage();
  }
);


When(
  "I sign in with email {string} and password {string}",
  async function (
    this: E2EWorld,
    email: string,
    password: string
  ) {
    assert.ok(this.page, "Page not initialized");

    const loginPage = new LoginPage(this.page);

    await loginPage.login(email, password);
  }
);


Then(
  "authentication should be rejected",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Page not initialized");

    const loginPage = new LoginPage(this.page);

    // An authentication error must be visible.
    const errorMessage =
      await loginPage.getAuthenticationError();

    assert.ok(
      errorMessage.length > 0,
      "Expected a visible authentication error message"
    );

    // The user must remain on the login page.
    assert.match(
      this.page.url(),
      /\/auth\/login(?:[/?#]|$)/,
      "The user should remain on the login page"
    );
  }
);


Then(
  "the {string} field should display a required validation message",
  async function (
    this: E2EWorld,
    field: string
  ) {
    assert.ok(this.page, "Page not initialized");

    assert.ok(
      field === "email" || field === "password",
      `Unexpected field: ${field}`
    );

    const loginPage = new LoginPage(this.page);

    const errorMessage = loginPage.requiredFieldError(field);

    await errorMessage.waitFor({
      state: "visible",
      timeout: 10000,
    });

    assert.match(
      this.page.url(),
      /\/auth\/login(?:[/?#]|$)/,
      "The user should remain on the login page"
    );
  }
);
