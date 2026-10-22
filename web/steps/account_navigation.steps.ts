import assert from "node:assert/strict";

import { Then, When } from "@cucumber/cucumber";
import { expect } from "playwright/test";

import { AccountPage } from "../pages/account.page.ts";
import { routes } from "../support/routes.ts";
import type { E2EWorld } from "../support/world.ts";

When("I open my account profile", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  await new AccountPage(this.page).openProfile();
});

Then("the account profile form should be visible", async function (this: E2EWorld) {
  assert.ok(this.page, "Page not initialized");
  const account = new AccountPage(this.page);
  await expect(this.page).toHaveURL(routes.profile);
  await expect(account.profileHeading).toBeVisible();
  await expect(account.firstName).toBeVisible();
  await expect(account.email).toBeVisible();
});
