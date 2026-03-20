import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

/** POST /api/leads/capture - Capture a lead when they reach the results page */
export async function POST(request: NextRequest) {
  try {
    if (!sql) {
      return NextResponse.json({ ok: false }, { status: 200 }); // don't fail UI
    }

    const body = await request.json();
    const {
      name,
      email,
      phone,
      serviceCategory,
      serviceTitle,
      pricingInputs = {},
    } = body;

    const nameStr = String(name ?? "").trim();
    const emailStr = email ? String(email).trim() || null : null;
    const phoneStr = phone ? String(phone).trim() || null : null;
    const categoryStr = String(serviceCategory ?? "repair").trim();
    const titleStr = serviceTitle ? String(serviceTitle).trim() || null : null;

    if (!nameStr || (!emailStr && !phoneStr)) {
      return NextResponse.json({ ok: false, reason: "Missing name or contact" }, { status: 400 });
    }

    const pricingJson = JSON.stringify(pricingInputs);

    if (emailStr) {
      const existing = await sql`
        SELECT id, converted_at FROM leads
        WHERE LOWER(TRIM(email)) = LOWER(${emailStr})
        ORDER BY created_at DESC LIMIT 1
      `;
      const arr = Array.isArray(existing) ? existing : [existing];
      const row = arr[0] as { id?: string; converted_at?: string } | undefined;
      if (row?.id && !row.converted_at) {
        await sql`
          UPDATE leads SET
            name = ${nameStr},
            phone = ${phoneStr},
            service_category = ${categoryStr},
            service_title = ${titleStr},
            pricing_inputs = ${pricingJson}::jsonb
          WHERE id = ${row.id}
        `;
      } else if (!row?.id) {
        await sql`
          INSERT INTO leads (name, email, phone, service_category, service_title, pricing_inputs)
          VALUES (${nameStr}, ${emailStr}, ${phoneStr}, ${categoryStr}, ${titleStr}, ${pricingJson}::jsonb)
        `;
      }
    } else {
      await sql`
        INSERT INTO leads (name, email, phone, service_category, service_title, pricing_inputs)
        VALUES (${nameStr}, ${emailStr}, ${phoneStr}, ${categoryStr}, ${titleStr}, ${pricingJson}::jsonb)
      `;
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/leads/capture error:", err);
    return NextResponse.json({ ok: false }, { status: 200 }); // don't fail UI
  }
}
