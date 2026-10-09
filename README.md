# EasyPay Rwanda — payment-focused MVP

EasyPay Rwanda helps Rwandan small businesses create payment requests, track pending payments, manage customer contacts, and access trader wallet and subscription flows. Inventory management is not part of the product.

## Backend modules
- Email/password signup, login, logout and current-session APIs using bcrypt password hashes and signed HttpOnly cookies.
- Roles: trader and customer; business records isolated by business ID.
- Payment requests with RWF amount and description; customer records; trader wallet balance/ledger; manual mobile-money payment references.
- Health check at `/api/health`.

## API routes
- `POST /api/auth/signup` — { name, email, password, role: "trader" | "customer", businessName?, businessType? }
- `POST /api/auth/login` — { email, password }
- `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST /api/customers`
- `GET/POST /api/orders` — create a payment request with { description, amountRwf }; returns a reference to share with the payer.
- `GET /api/wallet`, `GET /api/reports`, `GET /api/health`
- `POST /api/payments/initialize` — signed-in customer for a payment reference; signed-in trader for wallet top-up/subscription.
- `POST /api/payments/confirm` — signed-in trader for that trader's business.

## Payment behavior and limitations
The app provides manual USSD instructions and keeps payment status pending until a trader checks the operator's confirmation message/account and records receipt. This is not independent operator verification, and a USSD code alone does not trigger a payment prompt or verify payment. Automated prompts/status confirmation require official MTN MoMo/Airtel Money merchant API credentials, authenticated callbacks and reconciliation. The app never collects or stores mobile-money PINs.

## Environment variables
Configure in Vercel Project Settings → Environment Variables, then redeploy:
- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — optional, defaults to `rwanda_stock`
- `AUTH_SECRET` — random server-only secret at least 32 characters
- `RS_BUSINESS_MONTHLY_PRICE_RWF` — monthly subscription price

## Important
This is a backend MVP, not a fully audited production finance system. Before real-money production, add rate limiting, email verification/password reset, CSRF/origin protection, audit logs, reconciliation, refunds, MongoDB indexes, and a MongoDB Atlas deployment or replica set for payment transactions. Subscription access enforcement, offline sync, and actual MTN/Airtel API prompts are not implemented.

## Local development
```bash
npm install
npm run dev
```
