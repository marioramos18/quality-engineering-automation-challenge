export interface WebConfig {
  readonly baseUrl: string;
}

export interface CustomerCredentials {
  readonly email: string;
  readonly password: string;
}

const PUBLIC_BASE_URL = "https://practicesoftwaretesting.com";
const PUBLIC_CUSTOMER: CustomerCredentials = {
  email: "customer@practicesoftwaretesting.com",
  password: "welcome01",
};

export function loadWebConfig(env: NodeJS.ProcessEnv = process.env): WebConfig {
  const rawBaseUrl = env.WEB_BASE_URL ?? PUBLIC_BASE_URL;
  let url: URL;

  try {
    url = new URL(rawBaseUrl);
  } catch {
    throw new Error("WEB_BASE_URL must be a valid HTTP(S) URL.");
  }

  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  ) {
    throw new Error("WEB_BASE_URL must be an HTTP(S) URL without credentials, query or fragment.");
  }

  return { baseUrl: url.href.replace(/\/$/, "") };
}

export function customerCredentials(
  config: WebConfig,
  env: NodeJS.ProcessEnv = process.env
): CustomerCredentials {
  const email = env.E2E_CUSTOMER_EMAIL;
  const password = env.E2E_CUSTOMER_PASSWORD;

  if (email && password) return { email, password };
  if (!email && !password && config.baseUrl === PUBLIC_BASE_URL) {
    return PUBLIC_CUSTOMER;
  }

  throw new Error(
    "Set both E2E_CUSTOMER_EMAIL and E2E_CUSTOMER_PASSWORD for this WEB_BASE_URL."
  );
}
