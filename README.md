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
4. Add the deployed site URL and `/auth/callback` in Supabase Auth URL settings.
5. Redeploy on Vercel.

Razorpay payments use a secure order and verification flow. The browser opens Checkout, but registrations are marked `paid` only after `/api/payments/verify` validates the Razorpay signature on the server.
