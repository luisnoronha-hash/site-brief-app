/**
 * Normalizes URL environment variables at runtime, on the server.
 *
 * next.config.js applies the same repair, but that only covers the build:
 * Vercel injects the original values into the deployed functions, so a
 * malformed NEXTAUTH_URL still reaches NextAuth on every request. NextAuth
 * parses it per request in assertConfig, which fails the whole auth API with
 * `TypeError: Invalid URL` and never names the variable.
 *
 * Importing this module for its side effect — before anything that reads these
 * variables — makes the repair apply to the running app as well.
 *
 * Mirrors the logic in next.config.js, which cannot import this file (it is
 * CommonJS and runs before the app is compiled).
 */
const URL_VARIABLES = ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"] as const;

/**
 * Strips paste artifacts: surrounding whitespace, a trailing slash, and a
 * duplicated scheme (the dashboard field supplies "https://" and the pasted
 * value carries its own). Returns null when the result still isn't a URL.
 */
export function normalizeUrl(raw: string): string | null {
  const cleaned = raw
    .trim()
    .replace(/^(https?:\/\/)\s*(?=https?:\/\/)/i, "")
    .replace(/\/+$/, "");
  try {
    new URL(cleaned);
    return cleaned;
  } catch {
    return null;
  }
}

for (const name of URL_VARIABLES) {
  const raw = process.env[name];
  if (!raw) continue;

  const cleaned = normalizeUrl(raw);
  if (cleaned === null) {
    // Leaving a broken value in place fails every request with an anonymous
    // URL error. Dropping it lets NextAuth fall back to the request's own
    // host, which keeps the app usable, and the warning says what to fix.
    console.warn(`[env] ${name} is not a valid URL (${JSON.stringify(raw)}) — ignoring it.`);
    delete process.env[name];
  } else if (cleaned !== raw) {
    console.warn(`[env] ${name}: normalized to ${cleaned}`);
    process.env[name] = cleaned;
  }
}
