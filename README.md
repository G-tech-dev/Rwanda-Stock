# Rwanda Stock

A responsive business-management MVP prototype for small businesses in Rwanda.

## Included
- Next.js App Router, React, TypeScript, and Lucide icons
- Mobile-friendly dashboard layout
- Business-type selector: retail shop, restaurant, pharmacy, services
- Demo inventory search, low-stock indicators, and add-item interaction
- RWF currency formatting and activity/quick-action panels

## Run locally
Install Node.js 20 or newer, then run:

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Important status
This is a frontend MVP prototype. Numbers and activity feed are sample data. Inventory edits exist only in browser memory and are not persisted. Authentication, MongoDB storage, validated sales flows, subscriptions/payments, and offline support still need to be implemented and tested.

## Security
Do not commit database URLs, passwords, tokens, or `.env` files. Store production secrets in your hosting provider's environment settings.