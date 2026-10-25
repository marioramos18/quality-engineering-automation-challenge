import assert from "node:assert/strict";
import type { APIRequestContext } from "playwright";
import { isLoopbackHost, requireIsolatedTarget } from "./isolation.ts";

// Read-only audit of the disposable database, independent of UI confirmation.
export class InvoiceApi {
  private constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string,
    private readonly token: string,
  ) {}

  static async connect(request: APIRequestContext): Promise<InvoiceApi> {
    requireIsolatedTarget("E2E_ALLOW_ORDER_CREATION", "Invoice audit");
    const baseUrl = new URL(process.env.E2E_API_BASE_URL ?? "");
    assert.ok(["http:", "https:"].includes(baseUrl.protocol) &&
      isLoopbackHost(baseUrl.hostname) && !baseUrl.username && !baseUrl.password,
      "Invoice audit API must point to loopback without embedded credentials");
    const email = process.env.E2E_AUDIT_EMAIL;
    const password = process.env.E2E_AUDIT_PASSWORD;
    assert.ok(email && password, "Set E2E_AUDIT_EMAIL and E2E_AUDIT_PASSWORD for the isolated database");
    const response = await request.post(new URL("/users/login", baseUrl).href, {
      data: { email, password }, maxRedirects: 0,
    });
    assert.equal(response.status(), 200, "Isolated invoice audit login failed");
    const body = await response.json();
    assert.equal(typeof body.access_token, "string");
    assert.ok(body.access_token.length > 0);
    return new InvoiceApi(request, baseUrl.origin, body.access_token);
  }

  private async get(path: string): Promise<Record<string, unknown>> {
    const response = await this.request.get(`${this.baseUrl}${path}`, {
      headers: { Authorization: `Bearer ${this.token}`, Accept: "application/json" },
      maxRedirects: 0,
    });
    assert.equal(response.status(), 200, `Invoice audit GET ${path} failed`);
    return response.json();
  }

  async count(): Promise<number> {
    const body = await this.get("/invoices");
    assert.equal(typeof body.total, "number");
    return body.total as number;
  }

  async find(id: string): Promise<Record<string, unknown>> {
    return this.get(`/invoices/${encodeURIComponent(id)}`);
  }
}
