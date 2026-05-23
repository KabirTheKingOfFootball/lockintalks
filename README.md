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

1. Run `supabase/schema.sql` in Supabase SQL Editor.
2. Add Supabase environment variables in Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. Add Razorpay test keys in Vercel:
   - `NEXT_PUBLIC_RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
   - `RAZORPAY_WEBHOOK_SECRET`
4. In Razorpay Dashboard, create a payment webhook that points to:
   - `https://YOUR-VERCEL-DOMAIN/api/payments/webhook`
   - Enable payment events such as `payment.captured` and `payment.failed`.
5. Add the deployed site URL and `/auth/callback` in Supabase Auth URL settings.
6. Redeploy on Vercel.

Razorpay payments use a secure order and verification flow. The browser opens Checkout, but registrations are only treated as seat-confirmed after server-side verification and captured payment confirmation. Webhooks are recorded in `payment_events` and deduplicated using Razorpay's event id.

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
