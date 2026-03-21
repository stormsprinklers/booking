import { headers } from "next/headers";

/**
 * Detect site from request host. Use for single deployment serving both domains.
 * Falls back to NEXT_PUBLIC_SITE when host is localhost or unknown.
 */
export async function getHomeHref(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get("host") ?? h.get("x-forwarded-host") ?? "";
    if (host.startsWith("booking.")) return "/booking";
  } catch {
    // ignore
  }
  const env = process.env.NEXT_PUBLIC_SITE;
  return env === "booking" ? "/booking" : "/pricing";
}
