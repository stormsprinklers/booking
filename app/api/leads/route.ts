import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** GET /api/leads - List all leads (admin) */
export async function GET(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ error: "Database not configured" }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status"); // "abandoned" | "converted" | null = all

    let raw: unknown;
    if (status === "converted") {
      raw = await sql`
        SELECT id, name, email, phone, service_category, service_title,
               pricing_inputs, created_at, converted_at, hcp_job_id, sent_to_ghl_at
        FROM leads
        WHERE converted_at IS NOT NULL
        ORDER BY created_at DESC
      `;
    } else if (status === "abandoned") {
      raw = await sql`
        SELECT id, name, email, phone, service_category, service_title,
               pricing_inputs, created_at, converted_at, hcp_job_id, sent_to_ghl_at
        FROM leads
        WHERE converted_at IS NULL
        ORDER BY created_at DESC
      `;
    } else {
      raw = await sql`
        SELECT id, name, email, phone, service_category, service_title,
               pricing_inputs, created_at, converted_at, hcp_job_id, sent_to_ghl_at
        FROM leads
        ORDER BY created_at DESC
      `;
    }

    const rows = Array.isArray(raw) ? raw : [raw];
    const leads = rows.map((r: Record<string, unknown>) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      serviceCategory: r.service_category,
      serviceTitle: r.service_title,
      pricingInputs: r.pricing_inputs ?? {},
      createdAt: r.created_at,
      convertedAt: r.converted_at ?? null,
      hcpJobId: r.hcp_job_id ?? null,
      sentToGhlAt: r.sent_to_ghl_at ?? null,
    }));

    return NextResponse.json({ leads });
  } catch (err) {
    console.error("GET /api/leads error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch leads" },
      { status: 500 }
    );
  }
}
