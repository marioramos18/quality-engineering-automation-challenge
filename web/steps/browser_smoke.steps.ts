import assert from "node:assert/strict";

import {
  Given,
  Then,
} from "@cucumber/cucumber";

import type { E2EWorld } from "../support/world.ts";

Given(
  "I open a simple test page",
  async function (this: E2EWorld) {
    assert.ok(this.page, "Browser page is not initialized");

    await this.page.goto(
      "data:text/html,<html><body>" +
      "<h1>Browser ready</h1>" +
      "</body></html>"
    );
  }
);

Then(
  "the page heading should be {string}",
  async function (
    this: E2EWorld,
    expectedHeading: string
  ) {
    assert.ok(this.page, "Browser page is not initialized");

    const heading = this.page.locator("h1");

    assert.equal(
      await heading.textContent(),
      expectedHeading
    );
  }
);
