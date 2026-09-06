/**
 * Base URL used to build links in emails and Stripe redirect URLs.
 *
 * NEXT_PUBLIC_APP_URL is the explicit setting, but it is easy to miss on a
 * fresh deploy — and without a fallback every verification link, password
 * reset link, and Stripe redirect silently points at localhost (or at the
 * literal string "undefined", which Stripe rejects outright). Vercel always
 * sets VERCEL_URL, so a deployment produces working links even before anything
 * has been configured by hand.
 */
export function appUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXTAUTH_URL;
  if (explicit) return explicit.replace(/\/+$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}
