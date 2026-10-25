import assert from "node:assert/strict";
import { test } from "node:test";
import { isAllowedIsolatedRequest, requireIsolatedTarget } from "../support/isolation.ts";

function withTarget(url: string | undefined, enabled: boolean, check: () => void): void {
  const previous = { url: process.env.WEB_BASE_URL, flag: process.env.E2E_ALLOW_ORDER_CREATION };
  try {
    if (url === undefined) delete process.env.WEB_BASE_URL;
    else process.env.WEB_BASE_URL = url;
    process.env.E2E_ALLOW_ORDER_CREATION = enabled ? "1" : "0";
    check();
  } finally {
    if (previous.url === undefined) delete process.env.WEB_BASE_URL;
    else process.env.WEB_BASE_URL = previous.url;
    if (previous.flag === undefined) delete process.env.E2E_ALLOW_ORDER_CREATION;
    else process.env.E2E_ALLOW_ORDER_CREATION = previous.flag;
  }
}

test("public or unspecified targets cannot create orders even with opt-in", () => {
  for (const url of [undefined, "https://practicesoftwaretesting.com", "http://192.168.1.1",
    "http://localhost.example.com", "file:///tmp/app", "http://user:pass@localhost"]) {
    withTarget(url, true, () => assert.throws(() =>
      requireIsolatedTarget("E2E_ALLOW_ORDER_CREATION", "Checkout")));
  }
});

test("loopback requires explicit opt-in", () => {
  withTarget("http://localhost:4200", false, () => assert.throws(() =>
    requireIsolatedTarget("E2E_ALLOW_ORDER_CREATION", "Checkout")));
});

test("authorized IPv4, IPv6 and localhost targets are accepted", () => {
  for (const url of ["http://localhost:4200", "http://127.0.0.1:4200", "http://[::1]:4200"]) {
    withTarget(url, true, () => assert.doesNotThrow(() =>
      requireIsolatedTarget("E2E_ALLOW_ORDER_CREATION", "Checkout")));
  }
});

test("isolated request guard rejects external API calls and redirect destinations", () => {
  for (const url of ["https://api.practicesoftwaretesting.com/users/login", "https://example.com",
    "http://localhost.example.com", "ws://localhost:4200", "invalid", "http://user:pass@127.0.0.1"]) {
    assert.equal(isAllowedIsolatedRequest(url), false, url);
  }
  assert.equal(isAllowedIsolatedRequest("http://localhost:8091/payment/check"), true);
});
