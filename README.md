# Rwanda Stock

A responsive business-management MVP prototype for small businesses in Rwanda.

## Pages
- `/` — marketing homepage with business imagery and calls to action
- `/features` — product capabilities and business-type tools
- `/pricing` — free and planned business subscription
- `/about` — product purpose and design principles
- `/contact` — feedback form preview (does not send or store messages)
- `/dashboard` — interactive demo dashboard
- `/payments` — payment initiation UI for subscriptions and existing sales orders
- `/payments/return` — provider transaction verification result

## Payments integration

The app integrates with Flutterwave's hosted checkout for Rwanda Mobile Money (RWF). The provider supports MTN and Airtel in Rwanda; the checkout method is set to `mobilemoneyrwanda`. Customers choose the available network in the provider-hosted checkout.

Server routes:
- `POST /api/payments/initialize` — validates the payment purpose and server-side amount, stores a pending payment in MongoDB, then creates a hosted Flutterwave checkout.
- `GET /api/payments/verify` — verifies a returned transaction against Flutterwave and the stored transaction.
- `POST /api/payments/webhook` — validates the configured Flutterwave webhook secret hash and verifies the transaction before updating records.

### Required environment variables

Copy `.env.example` to `.env.local` for local development and fill in values privately. Never commit real credentials.

- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — optional database name; defaults to `rwanda_stock`
- `FLW_SECRET_KEY` — Flutterwave server-side secret key
- `FLW_SECRET_HASH` — random webhook secret hash configured in the Flutterwave dashboard
- `NEXT_PUBLIC_APP_URL` — exact deployed app origin, e.g. your Vercel URL without a trailing slash
- `RS_BUSINESS_MONTHLY_PRICE_RWF` — the subscription amount in whole RWF. Choose the price before enabling payment.

Configure the same variables in Vercel → Project → Settings → Environment Variables, then redeploy. Set Flutterwave to test mode first. Configure the webhook URL as `https://YOUR-DOMAIN/api/payments/webhook` and set the same secret hash in Flutterwave and Vercel.

### Important readiness limits

- No provider credentials or real transaction have been configured or tested by this repository change.
- Sales checkout requires an existing MongoDB `orders` record with an ObjectId `_id`, numeric `totalRwf`, and optionally `customerEmail`; it must not have `paymentStatus: "paid"`. The sales/order-creation module is not yet implemented in the current dashboard, so sale checkout will not work until orders are created by a trusted server route.
- Payment status is only marked paid after provider verification. Never rely on the browser redirect alone.
- Authentication, tenant ownership, verified email, order creation, refunds, reconciliation, and production-grade rate limiting still need to be implemented before public production use. In particular, don't use the subscription record to grant account access until account authentication and tenant binding exist.
- Do not use real production keys until the merchant account and webhook are configured. Keep all secret keys server-side.

## Stack
- Next.js App Router, React, TypeScript, Lucide icons
- MongoDB Node driver for payment records
- Flutterwave v3 hosted checkout and transaction verification
- Responsive CSS for mobile, tablet, and desktop

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Current prototype limitations
The dashboard still uses demo inventory and sample figures. Authentication, persistent inventory, trusted order creation, real sales reporting, contact-message delivery, subscription access control, and offline support are not yet implemented.
