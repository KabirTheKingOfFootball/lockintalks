# LockInTalks Live Mode Switch Checklist

Use this only after Razorpay Test Mode is working and an adult/legal reviewer has approved the public website. Do not switch to live keys while testing normal development changes.

## Do Not Start Until

- Razorpay KYC/account activation is complete.
- Adult/legal review is complete for `/terms`, `/privacy`, `/refund-policy`, `/pricing`, `/shipping-policy`, `/parent-consent`, and `/contact`.
- The support email `lockintalks@gmail.com` is working and monitored.
- Test Mode registration, payment, dashboard, admin, and prize pool checks have passed.
- A parent/adult is available to supervise the first real payment test.

## 1. Generate Live Razorpay Keys

1. Open Razorpay Dashboard.
2. Switch to **Live Mode**.
3. Generate Live API keys.
4. Store the Key Secret immediately in a private place.
5. Do not paste secrets into chats, screenshots, docs, commits, or client-side code.

## 2. Update Vercel Environment Variables

In Vercel Project Settings, replace Test Mode values with Live Mode values:

```text
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<paste-live-key-secret-in-vercel-only>
RAZORPAY_WEBHOOK_SECRET=<paste-live-webhook-secret-in-vercel-only>
```

Keep these already configured:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_SESSION_SECRET
```

## 3. Create Live Mode Webhook

In Razorpay Live Mode, create a webhook with this URL:

```text
https://lockintalks.vercel.app/api/payments/webhook
```

Use a new Live Mode webhook secret and put the exact same value in Vercel as `RAZORPAY_WEBHOOK_SECRET`.

Enable these events:

```text
payment.captured
payment.failed
refund.created
refund.processed
refund.failed
```

## 4. Redeploy And Confirm Health

1. Redeploy Vercel after saving env vars.
2. Open:

```text
https://lockintalks.vercel.app/api/health/razorpay
```

Expected after the intentional live switch:

```text
checkoutReady: true
webhookReady: true
keyMode: live
```

If `keyMode` is still `test`, Live Mode keys are not active. If `keyMode` is `unknown`, check the key ID.

## 5. Small Real Payment Test

With adult supervision:

1. Register using a normal user account.
2. Start payment from the registration/payment page.
3. Make one small real payment.
4. Confirm the dashboard shows paid/captured.
5. Confirm `/admin/registrations` shows paid/captured.
6. Confirm the prize pool counts the registration only after verified payment.
7. Confirm Razorpay Dashboard shows the payment and webhook delivery.

## 6. Failed/Cancelled Check

1. Start another registration/payment.
2. Cancel checkout or use a failed payment path if available.
3. Confirm the registration is not marked paid.
4. Confirm prize pool does not increase.

## 7. Rollback Plan

If anything looks wrong:

1. Switch Vercel Razorpay env vars back to Test Mode values, or remove `RAZORPAY_KEY_SECRET` temporarily.
2. Redeploy Vercel.
3. Confirm `/api/health/razorpay` no longer reports live mode.
4. Do not continue real payments until the issue is fixed.

## Final Human Approval

Do not announce public real-money selling until:

- Razorpay Live Mode works.
- Adult/legal approval is complete.
- The first real payment test passes.
- Refund/support process is clear.
- A parent/adult confirms the website copy and business details are accurate.
