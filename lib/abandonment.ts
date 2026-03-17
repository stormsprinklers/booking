import { track } from "./analytics";

/**
 * Call when user has entered contact info but may abandon.
 * Structures data for future abandoned-booking recovery (SMS/email).
 * Backend can listen for this event and trigger follow-up.
 */
export function captureAbandonmentContact(data: {
  email?: string;
  phone?: string;
  step: "address" | "availability" | "details";
}) {
  track("drop_off", {
    step: data.step,
    hasEmail: !!data.email,
    hasPhone: !!data.phone,
    // In production: send to backend for recovery campaign
    // await fetch('/api/abandonment', { body: JSON.stringify(data) })
  });
}
