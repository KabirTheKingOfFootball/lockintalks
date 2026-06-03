# LockInTalks Transfer Checklist

Generated on: 2026-06-03

This checklist is for moving the LockInTalks project from the old laptop to a new laptop using the `F:` USB drive.

## Quick Summary

- Main project: `LockInTalks`
- Current folder on old laptop: `C:\Users\shara\Documents\Codex\2026-05-12\files-mentioned-by-the-user-chatgpt`
- Recommended folder on USB: `F:\LockInTalks-Transfer\LockInTalks`
- Recommended folder on new laptop: `C:\Users\YOUR_NEW_USER\Documents\Projects\LockInTalks`
- GitHub remote: `https://github.com/KabirTheKingOfFootball/lockintalks`
- Current branch: `main`
- Commit at scan time before this checklist was created: `b6aca0a813eb8b942106f24b210154473a3a81dc`
- Git status before this checklist was created: clean, no uncommitted app-code changes

## Project 1: LockInTalks

### 1. Project Name

`LockInTalks`

This is a Next.js App Router website for online public speaking competitions for kids and teenagers. It uses Supabase for auth/database/admin data, Razorpay readiness for payments, Vercel Analytics/Speed Insights, and a local FAQ assistant.

### 2. Exact Main Project Folder Path

Old laptop:

```text
C:\Users\shara\Documents\Codex\2026-05-12\files-mentioned-by-the-user-chatgpt
```

USB transfer folder:

```text
F:\LockInTalks-Transfer\LockInTalks
```

Recommended new laptop folder:

```text
C:\Users\YOUR_NEW_USER\Documents\Projects\LockInTalks
```

You can also put it anywhere simple, such as:

```text
C:\Users\YOUR_NEW_USER\Desktop\Projects\LockInTalks
```

### 3. Important Files And Folders To Copy

Copy these folders:

```text
app\
components\
data\
docs\
lib\
public\
scripts\
supabase\
.git\
```

Copy these root files:

```text
.env.example
.gitignore
eslint.config.mjs
instrumentation-client.ts
instrumentation.ts
LAUNCH_CHECKLIST.md
next-env.d.ts
next.config.ts
package.json
package-lock.json
PARENT_LEGAL_REVIEW_CHECKLIST.md
postcss.config.mjs
proxy.ts
RAZORPAY_SETUP.md
README.md
sentry.server.config.ts
TRANSFER_CHECKLIST.md
tsconfig.json
```

### 4. Files And Folders That Should NOT Be Copied

Do not copy these. They are generated, huge, temporary, or machine-specific:

```text
node_modules\
.next\
.tools\
dist\
build\
out\
.cache\
coverage\
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
```

Why:

- `node_modules\` can be recreated with `npm install`.
- `.next\` can be recreated with `npm run build`.
- `.tools\` is a local bundled Node copy and is not needed on the new laptop.
- `dist\`, `build\`, `out\`, `.cache\`, and log files are generated output.

### 5. Environment And Config Files Needed

Important env example file:

```text
.env.example
```

Local env files found during scan:

```text
No .env.local, .env.production, or .env files were found in this project folder.
```

That is good for safety. Real secrets should not be committed or copied casually.

Required environment variables for local development or Vercel:

```text
NEXT_PUBLIC_SITE_URL
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_SESSION_SECRET
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
NEXT_PUBLIC_SENTRY_DSN
SENTRY_DSN
NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE
SENTRY_TRACES_SAMPLE_RATE
```

Most important required values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_SESSION_SECRET
```

Razorpay values needed when testing payments:

```text
NEXT_PUBLIC_RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
RAZORPAY_WEBHOOK_SECRET
```

Where to copy secrets from:

- Supabase dashboard for Supabase URL, publishable key, and service role key.
- Vercel dashboard if the values are already saved there.
- Razorpay dashboard for Razorpay test/live keys and webhook secret.
- Do not paste passwords, service role keys, webhook secrets, or API secrets into normal chats.

### 6. Database And Storage Files

Supabase files to copy:

```text
supabase\schema.sql
supabase\seed-competitions.sql
```

Purpose:

- `schema.sql` creates/updates database tables, indexes, RLS policies, payment tables, LockIn Points tables, storage policies, and admin support.
- `seed-competitions.sql` contains optional launch competition seed data.

Important:

- The actual Supabase database is online, not inside this project folder.
- To move to a new laptop, you only need the SQL files and the Supabase project credentials.
- If the Supabase project already exists online, do not rerun SQL blindly unless you know what you are doing.

Supabase storage:

- Competition images uploaded through Supabase Storage live online in the `competition-images` bucket.
- They are not stored locally except the logo in `public\`.

### 7. Images, Uploads, And Assets To Shift

Local asset folder:

```text
public\
```

Important file:

```text
public\lockintalks-logo.png
```

This file must be copied because it is used across the website for branding and SEO images.

Uploaded competition images:

- Stored in Supabase Storage online.
- Not stored in this local project unless manually downloaded.

### 8. Package Manager Files Needed

Copy:

```text
package.json
package-lock.json
```

This project uses npm.

Do not copy:

```text
node_modules\
```

Run this on the new laptop instead:

```bash
npm install
```

### 9. Git Files And Status

Git folder exists:

```text
.git\
```

Git remote:

```text
origin  https://github.com/KabirTheKingOfFootball/lockintalks
```

Current branch:

```text
main
```

Commit at scan time before this checklist was created:

```text
b6aca0a813eb8b942106f24b210154473a3a81dc
```

Status before this checklist was created:

```text
Clean. No uncommitted app-code changes.
main is aligned with origin/main.
```

After this task, `TRANSFER_CHECKLIST.md` was created intentionally and copied to the USB transfer folder.

Important:

- If you copy `.git\`, the new laptop will keep the Git history and remote.
- If you do not copy `.git\`, you can clone from GitHub instead.

Recommended easiest method on new laptop:

```bash
git clone https://github.com/KabirTheKingOfFootball/lockintalks
```

Then copy any local-only files if needed. At scan time, there were no local-only app changes.

### 10. Commands To Run After Copying To New Laptop

Open PowerShell on the new laptop:

```powershell
cd "C:\Users\YOUR_NEW_USER\Documents\Projects\LockInTalks"
npm install
npm run dev
```

Open in browser:

```text
http://localhost:3000
```

Before deployment or final testing:

```powershell
npm run test:payments
npm run test:rewards
npm run test:launch
npm run lint
npm run build
```

Auth smoke test:

```powershell
npm run test:auth
```

If testing deployed production:

```powershell
$env:LOCKINTALKS_TEST_BASE_URL="https://lockintalks.vercel.app"
npm run test:auth
npm run test:launch
```

### 11. Software And Tools Needed On New Laptop

Install these:

```text
Node.js
Git
VS Code
Google Chrome
```

Recommended versions:

```text
Node.js: current project was scanned with Node v24.16.0
npm: current project was scanned with npm 11.13.0
Git: current project was scanned with git 2.54.0.windows.1
```

VS Code extensions that may help:

```text
ESLint
Prettier
Tailwind CSS IntelliSense
GitHub Pull Requests and Issues
```

Optional tools:

```text
Vercel CLI
Supabase CLI
Razorpay dashboard access
```

Not required for basic development:

```text
Firebase CLI
Netlify CLI
Python
```

### 12. Hidden Important Files Easy To Miss

Important hidden files/folders:

```text
.git\
.gitignore
.env.example
```

Do not miss:

```text
proxy.ts
instrumentation.ts
instrumentation-client.ts
sentry.server.config.ts
supabase\schema.sql
supabase\seed-competitions.sql
docs\lockintalks-complete-platform-essay.md
```

`proxy.ts` is important for Next/Supabase session behavior.

`docs\lockintalks-complete-platform-essay.md` is important because the FAQ assistant uses it as a knowledge source.

## USB Folder Layout

The USB should look like this:

```text
F:\
  LockInTalks-Transfer\
    TRANSFER_CHECKLIST.md
    LockInTalks\
      .git\
      app\
      components\
      data\
      docs\
      lib\
      public\
      scripts\
      supabase\
      .env.example
      .gitignore
      package.json
      package-lock.json
      next.config.ts
      tsconfig.json
      README.md
      ...
```

Do not worry if `node_modules\` and `.next\` are missing from the USB. That is correct.

## New Laptop Setup Steps

1. Install Node.js.
2. Install Git.
3. Install VS Code.
4. Copy this folder from USB:

```text
F:\LockInTalks-Transfer\LockInTalks
```

to:

```text
C:\Users\YOUR_NEW_USER\Documents\Projects\LockInTalks
```

5. Open PowerShell:

```powershell
cd "C:\Users\YOUR_NEW_USER\Documents\Projects\LockInTalks"
npm install
```

6. Create `.env.local` only if you want local Supabase/payment testing:

```powershell
copy .env.example .env.local
```

Then edit `.env.local` with real values. Do not commit `.env.local`.

7. Start the website:

```powershell
npm run dev
```

8. Open:

```text
http://localhost:3000
```

9. Run final checks:

```powershell
npm run test:launch
npm run lint
npm run build
```

## Vercel Reminder

The live website is already deployed on Vercel. Moving laptops does not move Vercel itself.

On the new laptop, make sure you can access:

```text
https://vercel.com/dashboard
```

Project:

```text
lockintalks
```

The deployed site:

```text
https://lockintalks.vercel.app
```

## Supabase Reminder

Moving laptops does not move the Supabase database. Supabase is online.

You need:

```text
Supabase project URL
Supabase publishable key
Supabase service role key
```

Keep service role key private.

## Razorpay Reminder

Moving laptops does not move Razorpay dashboard settings. Razorpay is online.

Webhook URL:

```text
https://lockintalks.vercel.app/api/payments/webhook
```

Keep Razorpay key secret and webhook secret private.

## Final Copy Rules

Copy:

```text
source code
public assets
supabase SQL files
docs
package files
config files
.git folder
```

Skip:

```text
node_modules
.next
.tools
logs
build output
cache folders
local secrets unless you intentionally need them
```

This is the cleanest way to shift the project safely without dragging huge useless files onto the new laptop.
