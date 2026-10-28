export const routes = {
  login: "/auth/login",
  loginPattern: /\/auth\/login(?:[/?#]|$)/,
  account: /\/account(?:[/?#]|$)/,
  profile: /\/account\/profile(?:[/?#]|$)/,
  checkout: /\/checkout(?:[/?#]|$)/,
} as const;

export const checkoutApiRoutes = {
  postcodeLookup: "/postcode-lookup",
  paymentCheck: "/payment/check",
  guestInvoice: "/invoices/guest",
} as const;
