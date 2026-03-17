# Storm Sprinklers | Pricing & Booking

Production-ready web app for Storm Sprinklers: instant online pricing and seamless online booking. Replaces Wix + Velo with a native, fast, mobile-first experience.

## Routes

- **Pricing flow:** `/pricing` → `/pricing/wizard` → `/pricing/results`
- **Booking flow:** `/schedule` → `/schedule/availability` → `/schedule/details` → `/schedule/confirm` → `/schedule/success`

Subdomains (production): `pricing.stormsprinklers.com` and `schedule.stormsprinklers.com` route via middleware.

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

## Production wiring

- **Backend:** Replace mock APIs with Postgres (bookings, customers, availability)
- **Scheduling:** Real technician availability and routing
- **Address:** Google Places / address validation API
- **SMS/Email:** Twilio, Resend, etc.
- **Analytics:** Wire `lib/analytics.ts` to GA, PostHog, etc.

## Deploy

```bash
npm run build
npm run start
```

Deploy to Vercel by connecting the GitHub repo. Configure `pricing.stormsprinklers.com` and `schedule.stormsprinklers.com` as custom domains.
