# Site Brief

A web application for Site Brief, a South Florida development-potential analysis service. Residential
real estate agents submit a property address; Site Brief's own team of analysts prepares a
professional development-potential analysis; the agent receives it as a branded PDF carrying their
own name, license, and brokerage.

**This is an intake, payment, tracking, and delivery portal with an internal fulfillment queue — not
an automated zoning-calculation engine.** Every analysis is prepared by a human Site Brief analyst.
The application generates the branded cover, running header/footer, and closing disclaimer page,
then merges them with the analysis PDF an admin uploads.

## Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- PostgreSQL + Prisma
- NextAuth (credentials + Google OAuth)
- Stripe (Checkout for one-off charges, Billing for the subscription, Customer Portal for self-service)
- S3-compatible object storage (signed uploads/downloads)
- Resend for transactional email (English/Portuguese)
- pdf-lib for server-side PDF branding/merging

## Getting started

```bash
npm install
cp .env.example .env
# fill in .env — see "Environment variables" below
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

The seed script creates default pricing settings and an admin user (`ADMIN_EMAIL`, defaulting to
`admin@site-brief.com`) with a temporary password of `changeme123`. **Change this password
immediately** after first sign-in.

## Environment variables

See `.env.example` for the full list. Notes on a few:

- `DATABASE_URL` — PostgreSQL connection string.
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — from a Google Cloud OAuth 2.0 client (for "Continue
  with Google").
- `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — from your Stripe
  dashboard.
- `STRIPE_PRICE_SUBSCRIPTION` — the Stripe Price ID for the $99/month subscription plan (create this
  in the Stripe dashboard; the app charges whatever this Price is configured for).
- `S3_*` — any S3-compatible bucket (AWS S3, Cloudflare R2, Backblaze B2, etc). Buckets should be
  **private**; the app only ever hands out short-lived signed URLs.
- `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` — enables address autocomplete on the order form. The app
  degrades to a plain text address field if this is omitted.

### Stripe webhooks (local development)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`.

**Stripe Customer Portal configuration is automatic, not a manual dashboard step.** The Customer
Portal's own default cancellation behavior is immediate, which doesn't match the product's policy.
`src/lib/stripe.ts`'s `getOrCreatePortalConfiguration()` creates a Billing Portal configuration with
`subscription_cancel.mode: "at_period_end"` on first use and caches its ID in `Setting`, so every
portal session — however the customer reaches it — cancels at period end. The billing page's own
"Cancel subscription" button also calls `subscriptions.update` with `cancel_at_period_end: true`
directly, as a second, independent enforcement of the same policy.

## How entitlements work

Pricing and allowance logic lives in `src/lib/entitlements.ts`, evaluated in this order for every
order submission:

1. **Free tier** — the first `freeAnalysesCount` (default 3) orders are free, tracked per account but
   shared across every account with the same Florida license number or the same brokerage email
   domain (abuse control). Admins can grant bonus credits to a specific agent from the order detail
   page in `/admin`.
2. **Subscription allowance** — if the agent has an active subscription, up to `monthlyAllowance`
   (default 2) analyses per billing period are included at no extra charge. The counter resets to
   zero on every `invoice.paid` webhook (start of a new period), not client-side.
3. **Overage / single analysis** — anything beyond the above is charged: the configurable overage
   rate if there's an active subscription, otherwise the single-analysis rate (default $250).

A rush (24-hour) deadline always adds the configurable rush surcharge as a separate charge, even on
an otherwise free or subscription-covered order.

All of these figures are editable at `/admin/settings` without a deployment.

**Payment integrity:** for orders that require a charge, the order row is created immediately
(visible in the queue as `submitted`), and a Stripe Checkout Session is created for the amount due;
`stripePaymentIntentId` is only populated once Stripe's `checkout.session.completed` webhook fires.
Subscription status, period dates, and allowance resets are likewise only ever written from verified
webhook events (`checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`,
`customer.subscription.updated`, `customer.subscription.deleted`) — never from a client-side
redirect.

## Report generation

Admins upload the finished analysis PDF from `/admin/orders/[id]`. The server
(`src/lib/pdf.ts`):

1. Builds a branded cover page (address, agent headshot, name, license, brokerage, brokerage logo).
2. Merges in every page of the uploaded analysis, overlaying a running header (agent name/brokerage,
   property address) and footer (`Development analysis by Site Brief · site-brief.com`).
3. Appends a closing page with the agent's contact block and the required disclaimer text.

The merged PDF is stored in the private bucket and served to the agent via a time-limited signed URL.

## Deployment

Designed for Vercel. `vercel.json` pins the framework preset and build command so the deployment
doesn't depend on whatever Vercel auto-detected when the project was first imported.

1. Provision a PostgreSQL database (Vercel Postgres, Neon, Supabase, RDS, etc).
2. Set all environment variables from `.env.example` in the Vercel project.
3. Point a Stripe webhook endpoint at `https://<your-domain>/api/stripe/webhook` for the events
   listed above.
4. Configure the Google Cloud OAuth client's authorized redirect URI:
   `https://<your-domain>/api/auth/callback/google`.

**Migrations and seeding run automatically on deploy.** `scripts/deploy.mjs` runs before
`next build` (wired up as the `vercel-build` script) and applies `prisma migrate deploy` followed by
the seed, both of which are idempotent and safe on every deploy. If `DATABASE_URL` isn't set yet the
script exits cleanly with a notice instead of failing the build — the static marketing page still
deploys, while anything touching the database won't work until a database is configured.

**The seeded admin password is never hardcoded outside development.** Set `ADMIN_PASSWORD` (12+
characters) to choose it; leave it blank and a deployed environment generates a random one and prints
it once in the build log. The `changeme123` default applies only when `NODE_ENV` isn't `production`.
The password is only used the first time the admin account is created — changing the variable later
does not reset it.

## Known follow-ups

- `npm audit` currently flags several Next.js 14.x advisories that are only fully resolved by
  upgrading to Next 15/16 (a breaking change involving `next-auth` v5 migration). Track this as a
  near-term hardening task before handling real payment/PII traffic at scale.
- Exact aspect-ratio enforcement (a truly square headshot crop) isn't implemented — there's no
  cropping UI yet, so `/api/profile` only enforces the minimum pixel dimensions (600×600 headshot,
  1000px-wide logo, via `src/lib/image-dimensions.ts`), not squareness.

## Out of scope (v1)

Automated zoning lookups, MLS integration, a comps engine, in-app messaging, mobile apps, and a
team/brokerage multi-seat tier are intentionally not built — see the product brief.
