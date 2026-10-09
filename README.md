# Rwanda Stock

A responsive business-management MVP prototype for small businesses in Rwanda.

## Pages
- `/` — marketing homepage
- `/features` — product capabilities
- `/pricing` — free and planned paid subscription
- `/about` — product purpose
- `/contact` — feedback form preview
- `/dashboard` — interactive demo dashboard
- `/payments` — manual MTN MoMo/Airtel Money payment instructions and trader confirmation

## Manual USSD payments

Rwanda Stock creates a unique reference and records the amount server-side. The payer then uses the mobile-money menu on their phone:
- MTN MoMo: dial `*182#` and follow the appropriate payment menu.
- Airtel Money: dial `*182*8*1#` and follow the merchant-payment menu.

The app never requests or stores the mobile-money PIN. USSD codes open the operator menu; they do not, by themselves, prove a transaction or guarantee an automatic phone prompt. The payer must review the recipient and amount in the operator menu and authorize the payment there.

The trader must inspect the operator's confirmation message/account before pressing **Trader confirms receipt**. The resulting status is `trader_confirmed`, meaning a human trader asserted receipt. It is not independently verified by MTN/Airtel. Automated payment prompts and authoritative transaction verification require approved MTN MoMo/Airtel Money API credentials, server-side integration, and authenticated callbacks.

### Environment variables

Configure in Vercel → Project → Settings → Environment Variables, then redeploy:
- `MONGODB_URI` — MongoDB connection string (server-side only)
- `MONGODB_DB` — optional database name; defaults to `rwanda_stock`
- `RS_BUSINESS_MONTHLY_PRICE_RWF` — subscription price in whole RWF
- `RS_TRADER_CONFIRMATION_SECRET` — temporary shared code used to protect the manual confirmation endpoint

Never use the mobile-money PIN as this app confirmation code. The shared confirmation code is only a temporary MVP safeguard, not a replacement for account authentication. Before public production use, implement per-trader login/session authentication, role-based authorization, rate limiting, order ownership checks, and an auditable confirmation flow. Without those, a shared code is not sufficient protection for money-related actions.

### Current limitations
- The sales payment flow requires an existing MongoDB `orders` record with an ObjectId `_id` and integer `totalRwf`; the current dashboard does not yet create persistent orders.
- Wallet top-ups are recorded against a wallet keyed by payer email after manual trader confirmation. Production wallet accounting should use an immutable ledger and authenticated trader ownership.
- Subscription payment records are updated after manual trader confirmation; subscription access control is not implemented.
- No real transaction has been performed or independently verified by this code.
- Automated USSD prompts require formal provider onboarding and API credentials. This implementation only opens the operator's USSD menu and displays instructions.
- Authentication, tenant isolation, order creation, reconciliation, refunds, and offline support are not implemented.

## Stack
- Next.js App Router, React, TypeScript, Lucide icons
- MongoDB Node driver for payment records
- Responsive CSS for mobile, tablet, and desktop

## Run locally
```bash
npm install
npm run dev
```

Open http://localhost:3000.
