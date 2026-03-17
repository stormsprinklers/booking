import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import * as hcp from "@/lib/housecallpro/client";

export const dynamic = "force-dynamic";

function normalizePhone(phone: string | undefined): string {
  return (phone ?? "").replace(/\D/g, "").slice(-10);
}

async function findExistingCustomerId(
  email: string | undefined,
  phone: string | undefined
): Promise<string | null> {
  if (!sql || (!email?.trim() && !phone?.trim())) return null;
  try {
    if (email?.trim()) {
      const rows = await sql`
        SELECT id FROM hcp_customers
        WHERE LOWER(TRIM(email)) = LOWER(TRIM(${email.trim()}))
        LIMIT 1
      `;
      const row = (Array.isArray(rows) ? rows[0] : null) as { id?: string } | null;
      if (row?.id) return row.id;
    }
    if (phone && normalizePhone(phone).length >= 10) {
      const normPhone = normalizePhone(phone);
      const rows = await sql`
        SELECT id FROM hcp_customers
        WHERE REGEXP_REPLACE(phone, '\D', '', 'g') LIKE ${"%" + normPhone}
        LIMIT 1
      `;
      const row = (Array.isArray(rows) ? rows[0] : null) as { id?: string } | null;
      if (row?.id) return row.id;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      description,
      scheduledStart,
      scheduledEnd,
      customer,
      address,
      addressLine1,
      addressLine2,
      city,
      state,
      zip,
      employeeId,
    } = body;

    let customerId: string | null = null;
    if (customer?.email || customer?.phone) {
      customerId = await findExistingCustomerId(customer.email, customer.phone);
      if (!customerId && customer) {
        const nameParts = (customer.name ?? "Customer").trim().split(/\s+/);
        const { id } = await hcp.createCustomer({
          first_name: nameParts[0] ?? "Customer",
          last_name: nameParts.slice(1).join(" ") ?? "",
          email: customer.email ?? undefined,
          phone: customer.phone ?? undefined,
        });
        customerId = id;
      }
    }
    if (!customerId) {
      return NextResponse.json({ error: "Customer email or phone is required" }, { status: 400 });
    }

    const payload: Record<string, unknown> = {
      description: description || "Online booking",
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
      customer_id: customerId,
    };
    const line1 = addressLine1 || address || zip;
    if (line1 || city || state || zip) {
      payload.property = {
        address_line_1: line1,
        ...(addressLine2 && { address_line_2: addressLine2 }),
        ...(city && { city }),
        ...(state && { state }),
        zip: zip || address || undefined,
      };
    }
    if (employeeId) {
      payload.assigned_to = employeeId;
    }

    const res = await hcp.createJob(payload as hcp.CreateJobPayload);
    const jobId = (res.job as { id?: string })?.id ?? (res as { id?: string }).id;

    return NextResponse.json({ ok: true, jobId });
  } catch (err) {
    console.error("Create job error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create job" },
      { status: 500 }
    );
  }
}
