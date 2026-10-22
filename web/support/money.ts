import assert from "node:assert/strict";

export function moneyToCents(text: string): number {
  const amount = text.replace(/[^\d.]/g, "");
  assert.match(amount, /^\d+(?:\.\d{1,2})?$/, `Invalid price: ${text}`);
  return Math.round(Number(amount) * 100);
}
