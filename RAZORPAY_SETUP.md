# LockInTalks Razorpay Test Mode Setup

This guide helps you finish Razorpay setup safely. Do not share real passwords, API keys, webhook secrets, cookies, or payment details in chats, screenshots, commits, or public docs.

## 1. Get Razorpay Test Mode API Keys

1. Open the Razorpay Dashboard.
2. Switch to **Test Mode**.
3. Go to **Account & Settings**.
4. Open **API Keys**.
5. Generate or copy the Test Mode key pair.
6. Keep the key secret private. It is server-only.

You need:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`

## 2. Add Vercel Environment Variables

Go to:

`Vercel Dashboard -> lockintalks -> Settings -> Environment Variables`

Add these:

```text
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_test_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
```

Important:

- `NEXT_PUBLIC_RAZORPAY_KEY_ID` is public because the browser needs it to open Checkout.
- `RAZORPAY_KEY_SECRET` is private. Never prefix it with `NEXT_PUBLIC`.
- `RAZORPAY_WEBHOOK_SECRET` must exactly match the secret you enter in Razorpay webhook settings.
- After saving env vars, redeploy the latest Vercel deployment.

## 3. Add Razorpay Webhook

In Razorpay Dashboard Test Mode:

1. Go to **Webhooks**.
2. Add a webhook.
3. Use this webhook URL:

```text
https://lockintalks.vercel.app/api/payments/webhook
```

4. Enter a webhook secret. Copy the same value into Vercel as `RAZORPAY_WEBHOOK_SECRET`.
5. Enable these events:

- `payment.captured`
- `payment.failed`
- `refund.created`
- `refund.processed`
- `refund.failed`

## 4. Check App Health

After redeploying, open:

```text
https://lockintalks.vercel.app/api/health/razorpay
```

Expected:

- `checkoutReady: true`
- `webhookReady: true`
- `keyMode: "test"` while testing

This endpoint only shows safe true/false setup information. It does not expose secret values.

## 5. Run One Successful Test Payment

1. Log in to LockInTalks.
2. Register for a live competition.
3. Open the payment page.
4. Pay using Razorpay Test Mode.
5. For UPI, Razorpay test mode commonly supports:
   - `success@razorpay` for success
   - `failure@razorpay` for failure
6. After success, check:
   - User dashboard shows payment as paid.
   - Admin registrations page shows paid/captured.
   - Prize pool counts the verified paid registration.
   - LockIn Points are awarded only once after confirmed payment.

## 6. Run One Failed Test Payment

1. Register with another test registration.
2. Start payment.
3. Use a failed test method or close/cancel Checkout.
4. Check:
   - Dashboard does not show the registration as paid.
   - Admin payment status is failed or cancelled.
   - Prize pool does not increase.
   - LockIn Points are not awarded for the failed payment.

## 7. Before Live Payments

Before switching to live Razorpay keys:

- Ask an adult/legal advisor to review `/terms`, `/privacy`, `/refund-policy`, `/pricing`, and `/shipping-policy`.
- Ask an adult/legal advisor to review `/parent-consent` and `/contact`.
- Confirm the refund policy is accurate.
- Confirm support email is working: `lockintalks@gmail.com`.
- Complete Razorpay account/business review requirements.
- Replace test keys with live keys only after Razorpay KYC/account activation and adult/legal approval.
- Create a separate Live Mode webhook using the same URL and a new live webhook secret.
- Redeploy after changing any Razorpay env vars.
- Run one small real payment test with adult supervision.

## 8. Razorpay Website Review Checklist

Before submitting or reviewing the website for Razorpay, confirm:

- Website URL: `https://lockintalks.vercel.app`
- Contact page exists: `/contact`
- Pricing page exists: `/pricing`
- Terms and Conditions page exists: `/terms`
- Privacy Policy page exists: `/privacy`
- Cancellation and Refund Policy page exists: `/refund-policy`
- Digital Service and No Physical Shipping Policy page exists: `/shipping-policy`
- Parent and Guardian Consent page exists: `/parent-consent`
- Support email is visible: `lockintalks@gmail.com`
- Business details placeholders are reviewed and replaced only with real information where required.
- Test login details are prepared separately if Razorpay asks for access. Do not write passwords in this file.
- Adult/legal review is completed before live payments.

## 9. Business Details To Fill Only When Confirmed

Do not invent these. Add them publicly only after a parent/adult confirms the real information:

- `[Legal Entity Name To Be Added]`
- `[Registered Business Address To Be Added]`
- `[Phone Number To Be Added If Needed]`
- `[GST Details To Be Added If Applicable]`
