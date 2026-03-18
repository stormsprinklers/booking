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
      jobNotes,
    } = body;

    const tzOffset = "-06:00";
    const startIso = scheduledStart && !scheduledStart.includes("+") && !scheduledStart.endsWith("Z")
      ? `${String(scheduledStart).replace(/Z?$/, "")}${tzOffset}` : scheduledStart;
    const endIso = scheduledEnd && !scheduledEnd.includes("+") && !scheduledEnd.endsWith("Z")
      ? `${String(scheduledEnd).replace(/Z?$/, "")}${tzOffset}` : scheduledEnd;

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
          address_line_1: addressLine1 || address || undefined,
          city: city || undefined,
          state: state || undefined,
          zip: zip || undefined,
        });
        customerId = id;
      }
    }
    if (!customerId) {
      return NextResponse.json({ error: "Customer email or phone is required" }, { status: 400 });
    }

    const payload: hcp.CreateJobPayload = {
      customer_id: customerId,
      description: description || "Online booking",
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
    if (startIso && endIso) {
      payload.schedule = {
        scheduled_start: startIso,
        scheduled_end: endIso,
        ...(employeeId && { assigned_employee_ids: [employeeId] }),
      };
    }
    if (jobNotes?.trim()) {
      payload.notes = jobNotes.trim();
    }

    // #region agent log
    fetch('http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'X-Debug-Session-Id':'d0054e'
      },
      body:JSON.stringify({
        sessionId:'d0054e',
        runId:'create-job',
        hypothesisId:'H3',
        location:'app/api/housecall/create-job/route.ts:113',
        message:'createJob payload before send',
        data:{
          customerId,
          employeeId,
          scheduled_start:payload.schedule?.scheduled_start,
          scheduled_end:payload.schedule?.scheduled_end,
          assigned_employee_ids:payload.schedule?.assigned_employee_ids
        },
        timestamp:Date.now()
      })
    }).catch(()=>{});
    // #endregion

    const res = await hcp.createJob(payload);
    const jobId = (res.job as { id?: string })?.id ?? (res as { id?: string }).id;
    if (!jobId) throw new Error("Create job did not return job ID");

    if (employeeId) {
      try {
        await hcp.dispatchJobToEmployee(jobId, employeeId);
      } catch (err) {
        console.warn("Dispatch job to employee failed:", err);
      }
    }

    const debug = {
      customerId,
      employeeId: employeeId ?? null,
      schedule: payload.schedule,
    };

    return NextResponse.json({ ok: true, jobId, debug });
  } catch (err) {
    console.error("Create job error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create job" },
      { status: 500 }
    );
  }
}
