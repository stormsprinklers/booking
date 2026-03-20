/**
 * GoHighLevel API client for sending abandoned leads.
 * Env: GHL_API_KEY, GHL_LOCATION_ID
 */

export interface GhlContactInput {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  tags?: string[];
  source?: string;
}

export async function createGhlContact(input: GhlContactInput): Promise<{ id: string } | null> {
  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!apiKey || !locationId) {
    console.warn("GHL: missing GHL_API_KEY or GHL_LOCATION_ID");
    return null;
  }

  const body = {
    locationId,
    firstName: input.firstName || "Lead",
    lastName: input.lastName || "",
    email: input.email || undefined,
    phone: input.phone || undefined,
    tags: input.tags ?? ["Storm-Booking-Lead", "Abandoned-Cart"],
    source: input.source ?? "Storm Booking",
  };

  const res = await fetch("https://api.gohighlevel.com/v1/contacts/", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GHL create contact failed: ${res.status} ${text}`);
  }

  const data = (await res.json()) as { contact?: { id?: string }; id?: string };
  const id = data.contact?.id ?? data.id;
  return id ? { id } : null;
}
