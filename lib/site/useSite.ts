"use client";

/**
 * Detect if we're on the booking subdomain. Use for client-side redirects/links
 * when a single deployment serves both pricing.stormsprinklers.com and booking.stormsprinklers.com.
 */
export function useIsBookingSite(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname.startsWith("booking.");
}
