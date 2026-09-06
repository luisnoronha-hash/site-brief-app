/**
 * Environment URLs are typed by hand into a dashboard, so they arrive with
 * paste artifacts: stray whitespace, a trailing slash, or a duplicated scheme
 * when the field already shows "https://" as a prefix. NextAuth builds a URL
 * from NEXTAUTH_URL at module load, so a malformed value fails every
 * prerendered page with `TypeError: Invalid URL` and a stack trace that never
 * names the variable — an opaque failure for a one-character mistake.
 *
 * Repair the unambiguous cases here, before Next starts, and otherwise fail
 * with a message that says which variable is wrong and what it contains.
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
    throw new Error(
      `${name} is not a valid URL: ${JSON.stringify(raw)}. ` +
        `Expected something like "https://site-brief.com". Fix it in the ` +
        `project's environment variables and redeploy.`
    );
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
