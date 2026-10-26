export function isLoopbackHost(hostname: string): boolean {
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname);
}

export function isAllowedIsolatedRequest(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return ["http:", "https:"].includes(url.protocol) &&
      isLoopbackHost(url.hostname) && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function requireIsolatedTarget(flag: string, action: string): void {
  let target: URL;
  try {
    target = new URL(process.env.WEB_BASE_URL ?? "");
  } catch {
    throw new Error(`${action} requires WEB_BASE_URL pointing to an authorized loopback instance.`);
  }
  if (
    process.env[flag] !== "1" ||
    !["http:", "https:"].includes(target.protocol) ||
    !isLoopbackHost(target.hostname) || target.username || target.password
  ) {
    throw new Error(`${action} requires ${flag}=1 and an authorized loopback instance. Public targets are forbidden.`);
  }
}
