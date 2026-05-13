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

Copy `.env.example` to `.env.local` and replace secrets before deploying. The payment and auth flows are demo-safe UI flows and are structured so real providers can be integrated server-side without exposing secrets.
