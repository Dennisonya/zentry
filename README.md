# Zentry

Zentry lets small businesses open an online store: a customizable storefront, products and services, orders and bookings, promotions, inventory, and a customer account area with favorites and notifications.

Built with Next.js (App Router), Supabase (Postgres, Auth, Storage) and Tailwind. Deployed on Netlify.

## Getting started

Requirements: Node 22 and npm.

```bash
npm install
cp .env.example .env.local   # then fill in the values
npm run dev                  # http://localhost:3000
```

See `.env.example` for every environment variable and where it comes from.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest, `tests/`) |

## How it fits together

- **No API layer for most data.** The browser talks to Supabase directly with the anon key, so Row Level Security policies are the security boundary. Anything that must not be trusted from the browser (order prices, stock, booking prices) is done in the database: `place_order()` RPC, triggers and CHECK constraints.
- **Server components** (storefront pages, page-view tracking) use `SUPABASE_SERVICE_ROLE_KEY` through `getSupabaseServerClient()` in `lib/supabase.ts`. That key must stay server-only.
- **Forms** validate with the zod schemas in `lib/validation.ts`. Errors are shown with Sonner toasts (`lib/errors.ts` turns a Supabase error into a readable message).
- **Storefront images** from Supabase Storage go through `next/image` via `components/store-image.tsx`.

## Database

SQL lives in `scripts/`, applied in filename order (`003a` before `003b`). Some scripts must wait for a frontend deploy. Read the header comment of each one before running it against production.

| Range | Contents |
| --- | --- |
| 001–014 | Base schema: businesses, products, services, orders, bookings, promotions, profiles, billing, store design, members |
| 015–019 | Order status history, order confirmation RPCs, saved items, fonts, product variants and business notifications |
| 020–022 | Order confirmation lockdown and server-side code delivery |
| 023 | `place_order()` and customer notifications |
| 024 | Removes the open order and notification insert policies (after the place_order frontend is live) |
| 025 | CHECK constraints, booking price trigger, booking insert policy |
| 026 | Objects first created in the dashboard (`email_exists`) |

There is no 010; that number was never used.
