import {
  setWorldConstructor,
  World,
} from "@cucumber/cucumber";

import type {
  Browser,
  BrowserContext,
  Page,
} from "playwright";
import type { SelectedProduct } from "../pages/product.page.ts";
import { loadWebConfig } from "./config.ts";
import type { InvoiceApi } from "./invoice-api.ts";
import type { Response } from "playwright";

export interface CatalogNetworkEvent {
  method: string;
  resourceType: string;
  url: string;
  status?: number;
  failure?: string;
}

export class E2EWorld extends World {
  readonly config = loadWebConfig();
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  selectedProduct?: SelectedProduct;
  invoiceApi?: InvoiceApi;
  invoicesBefore?: number;
  orderResponse?: Response;
  catalogHttpErrors: CatalogNetworkEvent[] = [];
  catalogNetworkFailures: CatalogNetworkEvent[] = [];
  catalogHttpErrorCount = 0;
  catalogNetworkFailureCount = 0;
}

setWorldConstructor(E2EWorld);
