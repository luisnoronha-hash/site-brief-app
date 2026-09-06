/**
 * Environment URLs are typed by hand into a dashboard, so they arrive with
 * paste artifacts: stray whitespace, a trailing slash, or a duplicated scheme
 * when the field already shows "https://" as a prefix. NextAuth builds a URL
 * from NEXTAUTH_URL at module load, so a malformed value fails every
 * prerendered page with `TypeError: Invalid URL` and a stack trace that never
 * names the variable — an opaque failure for a one-character mistake.
 *
 * Repair the unambiguous cases here, before Next starts. A value that still
 * cannot be parsed is dropped with a warning naming it, never thrown on:
 * failing the build takes the whole site down over one environment variable,
 * whereas dropping it lets NextAuth fall back to the request's own host and
 * keeps the site serving. Mirrors src/lib/env.ts, which does the same at
 * runtime (this file is CommonJS and cannot import it).
 */
const URL_VARIABLES = ["NEXTAUTH_URL", "NEXT_PUBLIC_APP_URL"];

function sanitizeUrlVariable(name) {
  const raw = process.env[name];
  if (!raw) return;

  // "https:// https://example.com" / "https://https://example.com" — the field
  // supplied a scheme and the pasted value carried its own.
  const cleaned = raw
    .trim()
    .replace(/^(https?:\/\/)\s*(?=https?:\/\/)/i, "")
    .replace(/\/+$/, "");

  try {
    // eslint-disable-next-line no-new
    new URL(cleaned);
  } catch {
    console.warn(
      `[env] ${name} is not a valid URL: ${JSON.stringify(raw)} — ignoring it. ` +
        `Expected something like "https://site-brief.com" (the scheme is required).`
    );
    delete process.env[name];
    return;
  }

  if (cleaned !== raw) {
    console.warn(`[env] ${name}: normalized to ${cleaned}`);
    process.env[name] = cleaned;
  }
}

for (const name of URL_VARIABLES) sanitizeUrlVariable(name);

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "pdf-lib"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },
};

module.exports = nextConfig;
