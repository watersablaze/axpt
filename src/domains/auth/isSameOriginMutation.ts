/** Preserve exact-origin enforcement in production. Next development may normalize
 * a loopback request URL to localhost while the browser and Host use 127.0.0.1.
 * Only that development-only, same-protocol/same-port discrepancy is accepted.
 * Forwarded headers and public hostnames never establish this exception.
 */
export function isSameOriginMutation(request: Request, environment = process.env.NODE_ENV): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  let target: URL;
  try { target = new URL(request.url); } catch { return false; }
  if (origin === target.origin) return true;
  if (environment !== "development") return false;
  try {
    const browser = new URL(origin);
    const loopback = new Set(["localhost", "127.0.0.1"]);
    return browser.origin === origin && loopback.has(browser.hostname) && loopback.has(target.hostname) &&
      browser.protocol === target.protocol && browser.port === target.port &&
      request.headers.get("host") === browser.host;
  } catch { return false; }
}
