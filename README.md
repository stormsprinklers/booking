# Storm Sprinklers | Pricing & Booking

Production-ready web app for Storm Sprinklers: instant online pricing and seamless online booking. Replaces Wix + Velo with a native, fast, mobile-first experience.

## Routes

- **Pricing flow:** `/pricing` → `/pricing/wizard` → `/pricing/results` → book → `/schedule/...`
- **Direct booking:** `/booking` (zip + service) → `/schedule/availability` → `/schedule/details` → `/schedule/confirm` → `/schedule/success`
- **From pricing:** `/schedule` (with quote params) → same schedule steps as above

Subdomains (production): e.g. `pricing.stormsprinklers.com` vs `booking.stormsprinklers.com` — set `NEXT_PUBLIC_SITE=pricing` or `booking` per deployment.

## Tech Stack

- Next.js 16, TypeScript, Tailwind CSS
- Component-based UI, React Context for pricing and booking state

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Root redirects to `/pricing`.

## Folder structure

| Concern | Location |
|---------|----------|
| Pricing logic | `lib/pricing/pricingEngine.ts` |
| Booking logic | `lib/booking/`, `contexts/BookingContext.tsx` |
| Mock data | `lib/mock/` |
| Types | `lib/types.ts` |
| Design tokens | `app/globals.css` |
| UI components | `components/ui/` |

## Housecall Pro + Neon integration

The app integrates with [Housecall Pro](https://docs.housecallpro.com/docs/housecall-public-api) and stores synced data in Neon Postgres.

**Required env vars:** `HOUSECALLPRO_API_KEY`, `DATABASE_URL`

**Setup:**
1. Create a Neon project at [neon.tech](https://neon.tech) and add `DATABASE_URL` to Vercel env.
2. Run `scripts/init-db.sql` in the Neon SQL Editor to create tables.
3. Set `HOUSECALLPRO_API_KEY` in Vercel env.

**Flow:**
- When the user starts booking, `POST /api/sync/housecall` runs and syncs employees, service zones, and customers from Housecall Pro into Neon.
- Address validation uses service zones from the DB (`GET /api/address/validate?address=...`).
- Availability uses `GET /api/housecall/availability?service_zone_id=...`, which fetches booking windows from Housecall Pro for employees in that zone.

**Endpoints:** [Employees](https://docs.housecallpro.com/docs/housecall-public-api/303ee235f23fa-get-employees), [Service Zones](https://docs.housecallpro.com/docs/housecall-public-api/38b31504822e9-get-service-zones), [Customers](https://docs.housecallpro.com/docs/housecall-public-api/042bd3bf861ae-get-customers), [Booking Windows](https://docs.housecallpro.com/docs/housecall-public-api/c80920efe7ef1-booking-windows)

**Troubleshooting (nothing in Neon):**
1. Run `scripts/init-db.sql` in the Neon SQL Editor.
2. Call `POST /api/sync/housecall` and check the response: if `errors` is present, the Housecall Pro API is failing (wrong base URL, auth, or plan).
3. Set `HOUSECALLPRO_API_BASE` if your API uses a different base (default: `https://api.housecallpro.com/v1`).

## Production wiring

- **Address:** Falls back to mock if HCP/DB not configured.
- **Availability:** Falls back to mock if HCP returns no slots.
- **SMS/Email:** Twilio, Resend, etc.
- **Analytics:** Wire `lib/analytics.ts` to GA, PostHog, etc.

## Deploy

```bash
npm run build
npm run start
```

Deploy to Vercel by connecting the GitHub repo. Configure `pricing.stormsprinklers.com` and `schedule.stormsprinklers.com` as custom domains.
