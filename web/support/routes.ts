export const routes = {
  login: "/auth/login",
  loginPattern: /\/auth\/login(?:[/?#]|$)/,
  account: /\/account(?:[/?#]|$)/,
  profile: /\/account\/profile(?:[/?#]|$)/,
  checkout: /\/checkout(?:[/?#]|$)/,
} as const;
