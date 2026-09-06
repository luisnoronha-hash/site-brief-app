/**
 * Pre-build step for deployed environments.
 *
 * Vercel only runs `npm install` and the build command, so migrations would
 * otherwise never be applied and the production database would stay empty —
 * every page that touches Prisma 500s even though the build is green.
 *
 * Runs before `next build`:
 *   1. `prisma migrate deploy` to bring the schema up to date
 *   2. the seed, which upserts default pricing settings and ensures an admin
 *
 * When DATABASE_URL is absent this exits 0 with a notice rather than failing.
 * That's deliberate: it lets a project deploy and serve the (static) marketing
 * page before a database has been provisioned, instead of hard-failing the
 * build with an error that looks like a code problem.
 */
import { spawnSync } from "node:child_process";

/**
 * Managed Postgres (Neon, Supabase, and friends) hands out a *pooled*
 * connection string, and Prisma cannot run migrations through a connection
 * pooler — it needs a direct session. Those providers expose the direct
 * connection under a second variable whose name varies, so try the known ones
 * and fall back to DATABASE_URL, which is correct for a plain Postgres.
 *
 * Only migrations and the seed use this. The app itself keeps the pooled URL,
 * which is what you want for serverless request handling.
 */
function directDatabaseUrl() {
  return (
    process.env.DIRECT_DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL_NON_POOLING ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL
  );
}

function run(label, command, args) {
  process.stdout.write(`\n▸ ${label}\n`);
  const env = { ...process.env, DATABASE_URL: directDatabaseUrl() };
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    process.stderr.write(`\n✗ ${label} failed (exit ${result.status ?? "signal"}).\n`);
    process.exit(result.status ?? 1);
  }
}

if (!process.env.DATABASE_URL) {
  process.stdout.write(
    "\n⚠ DATABASE_URL is not set — skipping migrations and seed.\n" +
      "  The build will succeed and the marketing page will render, but sign-in,\n" +
      "  orders, and the admin queue will fail until a database is configured.\n"
  );
  process.exit(0);
}

if (directDatabaseUrl() !== process.env.DATABASE_URL) {
  process.stdout.write("\nUsing the direct (non-pooled) connection for migrations.\n");
}

run("prisma migrate deploy", "npx", ["prisma", "migrate", "deploy"]);
run("seed defaults", "npx", ["tsx", "prisma/seed.ts"]);

const missing = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"].filter((key) => !process.env[key]);
if (missing.length > 0) {
  process.stdout.write(
    `\n⚠ Missing ${missing.join(", ")} — NextAuth will reject sign-in attempts in production.\n`
  );
}

process.stdout.write("\n✓ Database ready.\n");
