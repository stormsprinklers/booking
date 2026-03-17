import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address");
  if (!address?.trim()) {
    return NextResponse.json(
      { valid: false, serviceArea: null },
      { status: 400 }
    );
  }

  try {
    const normalized = address.trim().toLowerCase();
    const zipMatch = normalized.match(/\b(\d{5})\b/);

    if (zipMatch) {
      const zip = zipMatch[1];
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
