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

export interface CatalogNetworkEvent {
  method: string;
  resourceType: string;
  url: string;
  status?: number;
  failure?: string;
}

export class E2EWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  selectedProduct?: SelectedProduct;
  catalogHttpErrors: CatalogNetworkEvent[] = [];
  catalogNetworkFailures: CatalogNetworkEvent[] = [];
  catalogHttpErrorCount = 0;
  catalogNetworkFailureCount = 0;
}

setWorldConstructor(E2EWorld);
