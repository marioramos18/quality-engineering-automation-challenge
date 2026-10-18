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

export class E2EWorld extends World {
  browser?: Browser;
  context?: BrowserContext;
  page?: Page;
  selectedProduct?: SelectedProduct;
}

setWorldConstructor(E2EWorld);
