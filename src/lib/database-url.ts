/**
 * Resolves the Postgres connection string.
 *
 * Prisma's schema reads env("DATABASE_URL"), but managed providers name the
 * variable themselves: the Vercel Postgres/Neon/Supabase integrations create
 * it from a configurable prefix, so a project can end up with POSTGRES_URL or
 * STORAGE_URL and nothing called DATABASE_URL at all. Rather than leaving the
 * app dead with a correctly-provisioned database attached, accept the names
 * those integrations actually produce.
 *
 * Order matters: pooled connections come first because that is what the app
 * should use for serving requests. scripts/deploy.mjs keeps its own copy of
 * this list (it is plain JS and runs before the app is built) and prefers the
 * non-pooled entries instead, because migrations cannot run through a pooler.
 */
export const DATABASE_URL_VARIABLES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "STORAGE_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
] as const;

export function resolveDatabaseUrl(): string | undefined {
  for (const name of DATABASE_URL_VARIABLES) {
    const value = process.env[name];
    if (value) return value;
  }
  return undefined;
}
