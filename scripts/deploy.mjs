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
/**
 * The integrations prefix every variable they create with a user-chosen
 * string, so the connection can arrive as `database_DATABASE_URL` rather than
 * DATABASE_URL. The prefix is arbitrary — match on the suffix.
 * Mirrors src/lib/database-url.ts, kept separate because this script is plain
 * JS and runs before the app is built.
 */
function firstSet(suffixes) {
  for (const suffix of suffixes) {
    const names = process.env[suffix]
      ? [suffix]
      : Object.keys(process.env)
          .filter((name) => name.endsWith(`_${suffix}`) && process.env[name])
          .sort();
    if (names.length > 0) return { name: names[0], value: process.env[names[0]] };
  }
  return null;
}

/** Pooled first: correct for serving requests. */
const ANY_DATABASE_URL = [
  "DATABASE_URL",
  "POSTGRES_PRISMA_URL",
  "POSTGRES_URL",
  "STORAGE_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
];

/** Non-pooled first: migrations cannot run through a connection pooler. */
const DIRECT_DATABASE_URL = [
  "DIRECT_DATABASE_URL",
  "DATABASE_URL_UNPOOLED",
  "DATABASE_URL_NON_POOLING",
  "POSTGRES_URL_NON_POOLING",
  ...ANY_DATABASE_URL,
];

function run(label, command, args, databaseUrl) {
  process.stdout.write(`\n▸ ${label}\n`);
  const env = { ...process.env, DATABASE_URL: databaseUrl };
  const result = spawnSync(command, args, { stdio: "inherit", env });
  if (result.status !== 0) {
    process.stderr.write(`\n✗ ${label} failed (exit ${result.status ?? "signal"}).\n`);
    process.exit(result.status ?? 1);
  }
}

const pooled = firstSet(ANY_DATABASE_URL);

if (!pooled) {
  // Name the variables that DO exist, so a database attached under an
  // unexpected name is obvious from the log instead of guesswork. Names only —
  // a connection string carries credentials and must never reach a build log.
  const candidates = Object.keys(process.env)
    .filter((name) => /DATABASE|POSTGRES|_URL$/.test(name))
    .sort();

  process.stdout.write(
    "\n⚠ No database connection string found — skipping migrations and seed.\n" +
      `  Looked for (with or without a prefix): ${ANY_DATABASE_URL.join(", ")}\n` +
      (candidates.length > 0
        ? `  Variables present that look related: ${candidates.join(", ")}\n`
        : "  No database-looking variables are set on this deployment at all.\n") +
      "  The build will succeed and the marketing page will render, but sign-in,\n" +
      "  orders, and the admin queue will fail until a database is configured.\n"
  );
  process.exit(0);
}

const direct = firstSet(DIRECT_DATABASE_URL);
process.stdout.write(`\nDatabase connection found in ${pooled.name}.\n`);
if (direct.name !== pooled.name) {
  process.stdout.write(`Using ${direct.name} (direct, non-pooled) for migrations.\n`);
}

run("prisma migrate deploy", "npx", ["prisma", "migrate", "deploy"], direct.value);
run("seed defaults", "npx", ["tsx", "prisma/seed.ts"], direct.value);

// Storage is optional to deploy but not optional to deliver a report, and its
// absence is otherwise invisible until an agent tries to upload a headshot.
if (process.env.BLOB_READ_WRITE_TOKEN) {
  process.stdout.write("\nObject storage: Vercel Blob.\n");
} else if (process.env.S3_BUCKET && process.env.S3_ACCESS_KEY_ID) {
  process.stdout.write("\nObject storage: S3-compatible bucket.\n");
} else {
  process.stdout.write(
    "\n⚠ No object storage configured — headshot/logo uploads and report delivery\n" +
      "  will be unavailable. Set BLOB_READ_WRITE_TOKEN or the S3_* variables.\n"
  );
}

const missing = ["NEXTAUTH_SECRET", "NEXTAUTH_URL"].filter((key) => !process.env[key]);
if (missing.length > 0) {
  process.stdout.write(
    `\n⚠ Missing ${missing.join(", ")} — NextAuth will reject sign-in attempts in production.\n`
  );
}

process.stdout.write("\n✓ Database ready.\n");
