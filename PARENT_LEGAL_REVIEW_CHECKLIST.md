# LockInTalks Parent and Legal Review Checklist

Use this checklist before opening LockInTalks to wider public registrations or live Razorpay payments. This document is not legal advice. A parent/adult and, if possible, a legal/accounting advisor should review the final site and business details.

## Business Details

- Confirm the legal entity or owner name.
- Confirm the business owner details needed for Razorpay KYC.
- Confirm the registered business address if required.
- Confirm whether a phone number must be shown publicly.
- Confirm whether GST applies.
- Confirm any GST number or tax wording before adding it publicly.
- Confirm the support email is correct: `lockintalks@gmail.com`.

## Razorpay and Payments

- Complete Razorpay KYC with real adult/business documents.
- Confirm the Razorpay account is in Test Mode before test payments.
- Confirm live keys are used only after Razorpay approval.
- Confirm the webhook URL is added:

```text
https://lockintalks.vercel.app/api/payments/webhook
```

- Confirm `RAZORPAY_WEBHOOK_SECRET` in Vercel exactly matches the Razorpay webhook secret.
- Confirm payment status, dashboard status, and admin status are correct after a successful test payment.
- Confirm failed, cancelled, pending, refunded, or unverified payments do not count as paid.

## Policy Pages

- Review `/terms`.
- Review `/privacy`.
- Review `/refund-policy`.
- Review `/pricing`.
- Review `/shipping-policy`.
- Review `/parent-consent`.
- Review `/contact`.
- Confirm every page uses `lockintalks@gmail.com`.
- Confirm no fake company number, fake GST number, fake address, fake phone number, fake judge, fake testimonial, or fake statistic is published.
- Replace public placeholders only when real details are confirmed.

## Children and Parent Consent

- Confirm parent/guardian consent wording is acceptable.
- Confirm guardian email collection is acceptable.
- Confirm age verification wording is acceptable.
- Confirm privacy wording is acceptable for kids and teenagers.
- Confirm the Privacy Policy is reviewed for DPDP Act and children-data compliance before wider public launch.

## Competitions and Rewards

- Confirm competition entry fee wording is accurate.
- Confirm prize pool wording is accurate.
- Confirm cash/Amazon gift card reward wording is accurate for the actual competition.
- Confirm LockIn Points are described as non-cash, non-withdrawable, and non-transferable.
- Confirm points from failed, cancelled, refunded, or invalid registrations are not awarded or are reversed.
- Confirm certificates and feedback wording matches what LockInTalks actually provides.

## Refunds and Support

- Confirm the refund policy is realistic and parent-friendly.
- Confirm refund timeline wording before public launch.
- Confirm how duplicate payments will be handled.
- Confirm what happens if a competition is cancelled or rescheduled.
- Confirm what support information parents should include in refund emails.

## Final Approval

- Run the full launch checklist in `LAUNCH_CHECKLIST.md`.
- Test auth, registration, payment, admin, and logout flows.
- Ask a parent/adult to click every footer policy link.
- Ask a parent/adult to complete one test registration and test payment.
- Give final approval before switching to live Razorpay keys.
