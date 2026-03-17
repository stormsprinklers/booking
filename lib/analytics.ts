import type { FunnelEvent } from "@/lib/types";

const events: FunnelEvent[] = [
  "landing_view",
  "category_selected",
  "pricing_completed",
  "option_selected",
  "booking_started",
  "address_entered",
  "slot_selected",
  "details_entered",
  "booking_completed",
  "drop_off",
];

export type TrackPayload = Record<string, string | number | boolean | undefined>;

/**
 * Analytics tracking stub. Wire to GA, PostHog, etc. for production.
 */
export function track(event: FunnelEvent, payload?: TrackPayload): void {
  if (process.env.NODE_ENV === "development") {
    console.log("[analytics]", event, payload ?? {});
  }
  // Production: window.gtag?.('event', event, payload);
}
