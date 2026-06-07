# LockInTalks Supabase Email Verification Setup

Use this checklist before opening LockInTalks signup to real students and parents.

Official Supabase references:

- Supabase Auth email templates: https://supabase.com/docs/guides/auth/auth-email-templates
- Supabase Auth redirect URLs: https://supabase.com/docs/guides/auth/redirect-urls
- Supabase custom SMTP: https://supabase.com/docs/guides/auth/auth-smtp

## Current App Behavior

LockInTalks supports both Supabase Confirm Email modes:

- If Confirm Email is OFF, signup creates a session immediately and the app redirects the user to the saved flow, `/dashboard`, or `/admin` based on role.
- If Confirm Email is ON, signup returns a friendly message: "Account created. Please check your email to verify your account before logging in."
- The signup and resend flows send confirmation links back to `/auth/callback`.
- `/auth/callback` exchanges the Supabase code for a session, creates the server app session, then redirects to the saved `next` path where possible.
- Login errors for unconfirmed users are converted into a readable message instead of raw Supabase text.

## Required Supabase URL Settings

In Supabase Dashboard, open:

Authentication -> URL Configuration

Set:

```text
Site URL:
https://lockintalks.vercel.app
```

Add these Redirect URLs:

```text
https://lockintalks.vercel.app/auth/callback
https://lockintalks.vercel.app/**
```

If LockInTalks later gets a custom domain, add the same callback and wildcard URLs for that custom domain too.

## Confirm Email Decision

Recommended production choice:

```text
Confirm Email: ON
Custom SMTP: ON and tested
```

Temporary beta choice if email delivery is not ready yet:

```text
Confirm Email: OFF
Custom SMTP: optional, but still recommended soon
```

Do not run a public launch with Confirm Email ON until confirmation emails are actually reaching inboxes reliably.

## Custom SMTP Checklist

Supabase's built-in email provider is useful for development, but it has low limits and is not the best choice for a public launch. For production signup, configure a custom SMTP provider.

In Supabase Dashboard, open:

Authentication -> Emails / SMTP settings

Add:

- SMTP host
- SMTP port
- SMTP username
- SMTP password
- Sender/from email
- Sender/from name, for example `LockInTalks`

Use a verified sender email or verified sending domain if your email provider supports it.

Recommended sender style:

```text
From name: LockInTalks
From email: a verified email you control
Reply-to/support email: lockintalks@gmail.com
```

## Email Template Checklist

In Supabase Authentication email templates, check:

- Confirm signup template uses the Supabase confirmation link variable.
- The email clearly says the user must verify the account before logging in if Confirm Email is ON.
- Support email is `lockintalks@gmail.com`.
- The tone is parent-friendly and does not ask users to share passwords.

## Resend Verification Flow

LockInTalks includes:

```text
POST /api/auth/resend-confirmation
```

The resend route:

- Requires a valid email format.
- Sends Supabase signup confirmation email using `/auth/callback`.
- Uses no-store cache headers.
- Masks emails in logs.
- Does not log passwords, tokens, or secrets.
- Gives friendly messages for rate limits and email delivery setup problems.
- Avoids exposing too much about whether an account exists.

## Manual Tests

Run these after saving Supabase settings and redeploying Vercel.

### Confirm Email ON

1. Use a fresh email address.
2. Sign up at `https://lockintalks.vercel.app/signup`.
3. Confirm the page says to check email.
4. Confirm the email arrives.
5. Click the confirmation link.
6. Confirm the link returns to LockInTalks through `/auth/callback`.
7. Confirm the user lands on `/dashboard` or the saved registration flow.
8. Log out.
9. Log in again with the same account.
10. Confirm login works normally.

### Resend Verification

1. Sign up with a fresh email while Confirm Email is ON.
2. Click `Resend verification email`.
3. Confirm the app shows a friendly success message.
4. Confirm the second email arrives.
5. If Supabase returns a rate limit, wait and try again later.

### Password Reset

If password reset is enabled later:

1. Request a password reset email.
2. Confirm the email arrives.
3. Confirm the redirect URL returns to the correct LockInTalks route.
4. Confirm the user can log in after resetting the password.

## If Emails Do Not Arrive

Check these in order:

1. Supabase Auth logs for the user/signup attempt.
2. Confirm Email setting.
3. Site URL and Redirect URLs.
4. Spam/promotions folder.
5. SMTP host, port, username, password, and sender email.
6. Whether the sender email/domain is verified by the SMTP provider.
7. Whether Supabase email rate limits were hit.

If the issue continues, keep Confirm Email OFF for a small private beta only, or pause signup until custom SMTP is working.
