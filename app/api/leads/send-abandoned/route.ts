import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import { createGhlContact } from "@/lib/ghl/client";

export const dynamic = "force-dynamic";

async function sendAbandonedLeads(request: NextRequest) {
  const auth = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const rows = await sql`
      SELECT id, name, email, phone, service_category, service_title
      FROM leads
      WHERE converted_at IS NULL
        AND sent_to_ghl_at IS NULL
        AND created_at < NOW() - INTERVAL '30 minutes'
      ORDER BY created_at ASC
    `;

    const leads = Array.isArray(rows) ? rows : [rows];
    let sent = 0;

    for (const lead of leads) {
      const r = lead as { id: string; name: string; email: string | null; phone: string | null; service_category: string; service_title: string | null };
      const nameParts = (r.name ?? "Lead").trim().split(/\s+/);
      const firstName = nameParts[0] ?? "Lead";
      const lastName = nameParts.slice(1).join(" ") ?? "";

      if (!r.email && !r.phone) continue;

      try {
        await createGhlContact({
          firstName,
          lastName,
          email: r.email ?? undefined,
          phone: r.phone ?? undefined,
          tags: ["Storm-Booking-Lead", "Abandoned-Cart", `Service:${r.service_category}`],
        });

        await sql`
          UPDATE leads SET sent_to_ghl_at = NOW() WHERE id = ${r.id}
        `;
        sent++;
      } catch (err) {
        console.error(`GHL send failed for lead ${r.id}:`, err);
      }
    }

    return NextResponse.json({ ok: true, sent, total: leads.length });
  } catch (err) {
    console.error("POST /api/leads/send-abandoned error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to send abandoned leads" },
      { status: 500 }
    );
  }
}

/** GET /api/leads/send-abandoned - Vercel Cron invokes with GET. */
export async function GET(request: NextRequest) {
  return sendAbandonedLeads(request);
}

/** POST /api/leads/send-abandoned - Manual trigger. */
export async function POST(request: NextRequest) {
  return sendAbandonedLeads(request);
}
