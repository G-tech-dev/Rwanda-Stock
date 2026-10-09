# Rwanda Stock — backend MVP

## Backend modules
- Email/password signup, login, logout and current-session APIs using bcrypt password hashes and signed HttpOnly cookies.
- Roles: trader and customer; business records isolated by business ID.
- Persistent inventory CRUD, customers, sales orders with stock deduction, reports, trader wallet balance/ledger, and manual USSD payment references.
- Health check at `/api/health`.

## API routes
- `POST /api/auth/signup` — { name, email, password, role: "trader" | "customer", businessName?, businessType? }
- `POST /api/auth/login` — { email, password }
- `POST /api/auth/logout`, `GET /api/auth/me`
- `GET/POST /api/inventory`; `PATCH/DELETE /api/inventory/:itemId`
- `GET/POST /api/customers`
- `GET/POST /api/orders` — create sale with { items: [{ itemId, quantity }] }; stock is decremented server-side.
- `GET /api/wallet`, `GET /api/reports`, `GET /api/health`
- `POST /api/payments/initialize` — signed-in customer for sales; signed-in trader for wallet top-up/subscription.
- `POST /api/payments/confirm` — signed-in trader for that trader's business.

## Payment behavior and limitations
Payments open the operator's USSD menu and remain pending until a trader checks the operator's confirmation message/account and records manual receipt. This is not independent operator verification, and a USSD code alone does not trigger a payment prompt or verify payment. Automated prompts/status confirmation require official MTN MoMo/Airtel Money merchant API credentials, authenticated callbacks and reconciliation. The app never collects or stores mobile-money PINs.

## Environment variables
Configure in Vercel Project Settings → Environment Variables, then redeploy:
- `MONGODB_URI` — MongoDB connection string
- `MONGODB_DB` — optional, defaults to `rwanda_stock`
- `AUTH_SECRET` — random server-only secret at least 32 characters
- `RS_BUSINESS_MONTHLY_PRICE_RWF` — monthly subscription price

## Important
This is a backend MVP, not a fully audited production finance system. Before real-money production, add rate limiting, email verification/password reset, CSRF/origin protection, audit logs, reconciliation, refunds, MongoDB indexes, and a MongoDB Atlas deployment or replica set for payment transactions. The payment settlement endpoint uses MongoDB transactions, so a standalone MongoDB server is not sufficient. The existing marketing dashboard is still a demo UI and is not yet wired to these APIs. Subscription access enforcement, offline sync, and actual MTN/Airtel API prompts are not implemented.

## Local development
```bash
npm install
npm run dev
```
