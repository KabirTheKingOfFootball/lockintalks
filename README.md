# LockInTalks

Modern Next.js website for LockInTalks, an online public speaking competition platform for kids and teenagers.

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- shadcn-style local UI primitives

## Setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Production

```bash
npm run build
npm run start
```

Copy `.env.example` to `.env.local` and replace secrets before deploying.

## Supabase + Razorpay Setup

For Supabase email verification and SMTP setup, use `SUPABASE_EMAIL_SETUP.md`. For the beginner-friendly payment setup walkthrough, use `RAZORPAY_SETUP.md`. For the final pre-launch checklist, use `LAUNCH_CHECKLIST.md`. For parent/adult review, use `PARENT_LEGAL_REVIEW_CHECKLIST.md`.

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Add Supabase environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_SESSION_SECRET`
3. Add Razorpay test keys in Vercel:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. In Razorpay Dashboard, create a payment webhook that points to:
   - `https://YOUR-VERCEL-DOMAIN/api/payments/webhook`
   - Enable payment events such as `payment.captured`, `payment.failed`, and refund-related events.
5. Add Supabase Auth URL settings:
   - Site URL: `https://lockintalks.vercel.app`
   - Redirect URL: `https://lockintalks.vercel.app/auth/callback`
   - Redirect URL: `https://lockintalks.vercel.app/**`
6. Redeploy on Vercel.

If Supabase Confirm Email is ON, configure and test custom SMTP before public launch. Supabase's built-in email provider is better for development than real public signup. The app already shows a "check your email" message and includes a resend verification email flow.

`APP_SESSION_SECRET` should be a random server-only string with at least 32 characters. It signs the temporary LockInTalks app session cookie used as the server-side auth source of truth when Supabase browser cookies are unreliable in production.

Razorpay payments use a secure order and verification flow. The browser opens Checkout, but registrations are only treated as seat-confirmed after server-side verification and captured payment confirmation. Webhooks are recorded in `payment_events` and deduplicated using Razorpay's event id.

Safe Razorpay setup check:

- `/api/health/razorpay`

This route only returns setup booleans and key mode (`test`, `live`, `unknown`, or `missing`). It never returns key values or secrets.

Launch feature flag:

- `NEXT_PUBLIC_LOCKIN_POINTS_ENABLED=false`

This is the safe default for the first public launch. The internal points/reward code is preserved for later, but public UI, checkout discounts, and automatic awards stay disabled unless this flag is intentionally set to `true`.

Razorpay review/support pages:

- `/terms`
- `/privacy`
- `/refund-policy`
- `/pricing`
- `/shipping-policy`
- `/parent-consent`
- `/contact`

Payment safety rule: do not mark registrations as paid from the browser callback alone. Successful payments must pass server-side Razorpay signature verification and captured payment confirmation. Failed, cancelled, refunded, or unverified payments must not count toward prize pools.

## Monitoring

Vercel Web Analytics and Speed Insights are included in the root layout. Optional Sentry monitoring is configured and stays inactive until these variables are added:

- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_DSN`
- `NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE`
- `SENTRY_TRACES_SAMPLE_RATE`

## Admin Panel

Admin routes live under `/admin`. They are protected by Supabase Auth plus a `profiles.role = 'admin'` authorization check. To make a user an admin:

1. Sign up normally on the website.
2. In Supabase, open **Authentication > Users** and copy that user's UUID and email.
3. In **SQL Editor**, run:

```sql
insert into public.profiles (id, email, role)
values ('USER_UUID_HERE', 'admin@example.com', 'admin')
on conflict (id) do update set role = 'admin', email = excluded.email;
```

The admin panel can create, edit, delete, and upload images for competitions, manage registration payment statuses, search/filter participants, view analytics, and export registrations as CSV.

## Auth Smoke Testing

Before every production deploy, run the safe auth checks:

```bash
npm run test:auth
npm run test:payments
npm run test:rewards
npm run test:launch
```

For a deployed site:

```bash
$env:LOCKINTALKS_TEST_BASE_URL="https://lockintalks.vercel.app"
npm run test:auth
npm run test:launch
```

For a real login smoke test, create a temporary Supabase test user and set these only in your terminal. Do not commit them:

```bash
$env:LOCKINTALKS_TEST_EMAIL="temporary-test@example.com"
$env:LOCKINTALKS_TEST_PASSWORD="temporary-test-password"
$env:LOCKINTALKS_TEST_BASE_URL="https://lockintalks.vercel.app"
npm run test:auth
```

Manual beta auth checklist:

- Open `/auth-test`.
- Click **Test First-Party Cookie**. It must set and read `lockintalks_test`.
- Log in with a temporary account. `/api/auth/session` must return `authenticated: true`.
- Admin users must show `role: "admin"` and open `/admin`, `/admin/competitions`, and `/admin/registrations`.
- Logout, then confirm `/api/auth/session` returns `authenticated: false`.

Auth source-of-truth rule: protected pages and APIs should use `getServerAuthSession()` from `lib/auth/server-session.ts`. Do not add protected access checks that rely only on browser localStorage or client-side Supabase state.
