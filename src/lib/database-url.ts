/**
 * Resolves the Postgres connection string.
 *
 * Prisma's schema reads env("DATABASE_URL"), but managed providers name the
 * variable themselves. The Vercel Postgres/Neon/Supabase integrations prefix
 * every variable they create with a user-chosen string, so a project ends up
 * with names like `database_DATABASE_URL` or `mydb_POSTGRES_URL` and nothing
 * called DATABASE_URL at all.
 *
 * The prefix is arbitrary, so match on the suffix instead of a fixed list of
 * names: any variable that IS one of these or ends with `_<name>` counts.
 *
 * Order matters. Pooled connections come first here because that is what the
 * app should use for serving requests. scripts/deploy.mjs mirrors this list
 * but prefers the non-pooled entries, because migrations cannot run through a
 * connection pooler.
 */
export const DATABASE_URL_SUFFIXES = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "STORAGE_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
] as const;

/**
 * Names matching `suffix`, exact match first, then prefixed ones sorted so the
 * result is stable when an integration created several.
 */
export function matchingVariables(suffix: string, env: NodeJS.ProcessEnv): string[] {
  const exact = env[suffix] ? [suffix] : [];
  const prefixed = Object.keys(env)
    .filter((name) => name !== suffix && name.endsWith(`_${suffix}`) && env[name])
    .sort();
  return [...exact, ...prefixed];
}

export function resolveDatabaseUrl(env: NodeJS.ProcessEnv = process.env): string | undefined {
  for (const suffix of DATABASE_URL_SUFFIXES) {
    const [name] = matchingVariables(suffix, env);
    if (name) return env[name];
  }
  return undefined;
}
