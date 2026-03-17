import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const rows = await sql`
      SELECT id, first_name, last_name, name, service_zone_ids
      FROM hcp_employees
      ORDER BY name, first_name
    `;

    type Row = { id: string; first_name: string | null; last_name: string | null; name: string | null; service_zone_ids: unknown };
    const allRows = (Array.isArray(rows) ? rows : []) as Row[];
    let employees = allRows.map((r) => {
      const ids = r.service_zone_ids;
      const arr = Array.isArray(ids) ? ids : typeof ids === "string" ? JSON.parse(ids || "[]") : [];
      return {
        id: r.id,
        name: (r.name ?? [r.first_name, r.last_name].filter(Boolean).join(" ")) || r.id,
        serviceZoneIds: arr as string[],
      };
    });

    const serviceZoneId = request.nextUrl.searchParams.get("service_zone_id");
    if (serviceZoneId) {
      employees = employees.filter((e) => e.serviceZoneIds.includes(serviceZoneId));
    }

    return NextResponse.json({ employees });
  } catch (err) {
    console.error("Employees fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
