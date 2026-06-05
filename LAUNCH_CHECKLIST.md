# LockInTalks Launch Checklist

Use this before opening payments to real users.

## Code Checks

- Run `npm run test:payments`.
- Run `npm run test:rewards`.
- Run `npm run test:auth`.
- Run `npm run test:launch`.
- Run `npm run lint`.
- Run `npm run build`.

## Vercel Setup

- Add `NEXT_PUBLIC_SUPABASE_URL`.
- Add `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Add `SUPABASE_SERVICE_ROLE_KEY`.
- Add `APP_SESSION_SECRET`.
- Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
- Add `RAZORPAY_KEY_SECRET`.
- Add `RAZORPAY_WEBHOOK_SECRET`.
- Redeploy after saving environment variables.

## Razorpay Test Mode Setup

- Create or copy Test Mode API keys in Razorpay.
- Confirm Razorpay account/KYC details are being handled by a parent/adult.
- Add webhook URL:

```text
https://lockintalks.vercel.app/api/payments/webhook
```

- Enable `payment.captured`.
- Enable `payment.failed`.
- Enable `refund.created`.
- Enable `refund.processed`.
- Enable `refund.failed`.
- Make sure the webhook secret in Razorpay exactly matches `RAZORPAY_WEBHOOK_SECRET` in Vercel.
- Open `/api/health/razorpay` and confirm `checkoutReady` and `webhookReady` are true.
- Keep the app in Test Mode until Razorpay review, adult approval, and test payments are complete.

## Successful Payment Test

- Log in as a normal user.
- Register for a live competition.
- Start Razorpay Checkout.
- Complete one successful test payment.
- Confirm `/dashboard` shows paid/captured.
- Confirm `/admin/registrations` shows paid/captured.
- Confirm prize pool updates only after verified payment.
- Confirm LockIn Points are awarded once, not duplicated.

## Failed or Cancelled Payment Test

- Register again or use another test registration.
- Fail or cancel Razorpay Checkout.
- Confirm dashboard does not show paid.
- Confirm admin status is failed or cancelled.
- Confirm prize pool does not increase.
- Confirm LockIn Points are not awarded.

## Website Review Pages

- Check `/terms`.
- Check `/privacy`.
- Check `/refund-policy`.
- Check `/pricing`.
- Check `/shipping-policy`.
- Check `/parent-consent`.
- Check `/contact`.
- Confirm all support links use `lockintalks@gmail.com`.
- Confirm wording is parent-friendly and does not promise fake stats, fake prizes, or fake testimonials.
- Confirm public placeholders are either removed or clearly marked as details an adult must fill later.

## Auth/Admin Safety

- Login works once.
- Logout is still a POST form action, not a normal link.
- Admin can open `/admin`, `/admin/competitions`, and `/admin/registrations`.
- Normal users cannot access admin routes.
- Registration still requires login.

## Adult/Legal Review

- Ask an adult/legal advisor to review the Terms and Conditions.
- Ask an adult/legal advisor to review the Privacy Policy.
- Ask an adult/legal advisor to review the Cancellation and Refund Policy.
- Ask an adult/legal advisor to review the Parent and Guardian Consent page.
- Ask an adult/legal advisor to confirm whether GST, legal entity, business address, or phone details must be shown.
- Confirm Razorpay account details and business information are accurate before live payments.

## Before Live Razorpay Payments

- Complete Razorpay KYC and account approval.
- Complete adult/legal approval for the public policy pages and parent consent wording.
- Replace test keys with live keys only after approval.
- Add the live webhook secret to Vercel if Razorpay gives a different live webhook secret.
- Create a Live Mode webhook using `https://lockintalks.vercel.app/api/payments/webhook`.
- Enable `payment.captured`, `payment.failed`, `refund.created`, `refund.processed`, and `refund.failed` in Live Mode.
- Redeploy after switching any Razorpay environment variables.
- Confirm `/api/health/razorpay` shows `keyMode: "live"` only after the live keys are intentionally added.
- Run one low-risk live payment test with adult supervision after approval.
- Confirm dashboard payment status updates correctly.
- Confirm admin registration/payment status updates correctly.
- Confirm prize pool updates only after verified paid registration.
- Confirm LockIn Points are not awarded for failed, cancelled, refunded, or unverified payments.
- Keep a rollback plan: switch Vercel Razorpay env vars back to Test Mode or remove payment keys, then redeploy.
