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
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row?.id) return row.id as string;
    }
    if (phone && normalizePhone(phone).length >= 10) {
      const normPhone = normalizePhone(phone);
      const rows = await sql`
        SELECT id FROM hcp_customers
        WHERE REGEXP_REPLACE(phone, '\D', '', 'g') LIKE ${"%" + normPhone}
        LIMIT 1
      `;
      const row = Array.isArray(rows) ? rows[0] : null;
      if (row?.id) return row.id as string;
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
      zip,
      employeeId,
    } = body;

    const payload: Record<string, unknown> = {
      description: description || "Online booking",
      scheduled_start: scheduledStart,
      scheduled_end: scheduledEnd,
    };

    const existingId = await findExistingCustomerId(customer?.email, customer?.phone);
    if (existingId) {
      payload.customer_id = existingId;
    } else if (customer) {
      payload.customer = {
        first_name: customer.name?.split(" ")[0] ?? customer.name,
        last_name: customer.name?.split(" ").slice(1).join(" ") ?? "",
        email: customer.email,
        phone: customer.phone,
      };
    }
    if (address || zip) {
      payload.property = { address_line_1: address || zip, zip };
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
