# Razorpay Setup For Audiosen Subscription Payments

## 1. Create and verify Razorpay account
- Sign up at `https://razorpay.com`.
- Complete KYC and business verification.
- Add your settlement bank account in Razorpay dashboard.

## 2. Generate API keys
- In Razorpay dashboard, open `Settings -> API Keys`.
- Generate Test keys for development.
- Generate Live keys when you are ready to go live.

## 3. Configure environment variables
Add these in your production `.env`:

```env
RAZORPAY_KEY_ID=rzp_live_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

## 4. Test the checkout flow
- Start app with `npm run dev`.
- Open Home page and go to `Subscription Plans`.
- Click `Pay & Subscribe`.
- Complete test payment in Razorpay test mode.
- Verify payment logs are written to `data/payments.ndjson`.

## 5. Go live
- Replace test keys with live keys in deployment environment.
- In Razorpay dashboard, ensure settlement account is active.
- Payments will settle to your configured bank account based on Razorpay settlement cycle.

## Notes
- Card/UPI/wallet availability depends on your Razorpay account settings.
- Keep `RAZORPAY_KEY_SECRET` private and never expose it in frontend code.
