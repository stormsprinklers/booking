import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const zipParam = request.nextUrl.searchParams.get("zip") ?? request.nextUrl.searchParams.get("address");
  const zip = zipParam?.trim().replace(/\D/g, "").slice(0, 5);
  if (!zip || zip.length !== 5) {
    return NextResponse.json(
      { valid: false, serviceArea: null },
      { status: 400 }
    );
  }

  try {
    if (!sql) throw new Error("DATABASE_URL not configured");
    const rows = await sql`
      SELECT id, name, zip_codes
      FROM hcp_service_zones
    `;
    type ZoneRow = { id: string; name: string | null; zip_codes: unknown };
    const zones = (Array.isArray(rows) ? rows : []) as ZoneRow[];
    for (const z of zones) {
      const zips = z.zip_codes;
      const arr = Array.isArray(zips) ? zips : (typeof zips === "string" ? JSON.parse(zips || "[]") : []);
      if (arr.includes(zip)) {
        return NextResponse.json({
          valid: true,
          serviceArea: { id: z.id, name: z.name ?? z.id },
        });
      }
    }

    return NextResponse.json({ valid: false, serviceArea: null });
  } catch (err) {
    console.error("Address validation error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Validation failed" },
      { status: 500 }
    );
  }
}
