import { NextResponse } from "next/server";
import { sql } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    const rows = await sql`
      SELECT id, name, zip_codes
      FROM hcp_service_zones
      ORDER BY name
    `;

    type Row = { id: string; name: string | null; zip_codes: unknown };
    const allRows = (Array.isArray(rows) ? rows : []) as Row[];
    const zones = allRows.map((r) => {
      const zips = r.zip_codes;
      const arr = Array.isArray(zips) ? zips : typeof zips === "string" ? JSON.parse(zips || "[]") : [];
      return {
        id: r.id,
        name: r.name ?? r.id,
        zipCodes: arr,
      };
    });

    return NextResponse.json({ zones });
  } catch (err) {
    console.error("Service zones fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch" },
      { status: 500 }
    );
  }
}
