import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import * as hcp from "@/lib/housecallpro/client";
import { INSTALL_QUOTE_EMPLOYEE_ID, INSTALL_QUOTE_ZONE_BY_DOW } from "@/lib/config/installQuoteTech";

export const dynamic = "force-dynamic";

function formatWindow(startIso: string, endIso: string): { date: string; start: string; end: string; label: string } {
  const d = new Date(startIso);
  const endD = new Date(endIso);
  const date = d.toISOString().slice(0, 10);
  const h = d.getHours();
  const m = d.getMinutes();
  const eh = endD.getHours();
  const em = endD.getMinutes();
  const start = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  const end = `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`;
  const fmt = (hr: number, min: number) =>
    `${hr === 12 ? 12 : hr % 12}${min ? `:${String(min).padStart(2, "0")}` : ""} ${hr >= 12 ? "PM" : "AM"}`;
  const label = `${fmt(h, m)}–${fmt(eh, em)}`;
  return { date, start, end, label };
}

export async function GET(request: NextRequest) {
  const serviceZoneId = request.nextUrl.searchParams.get("service_zone_id");
  const category = request.nextUrl.searchParams.get("category");
  if (!serviceZoneId) {
    return NextResponse.json(
      { error: "service_zone_id is required" },
      { status: 400 }
    );
  }

  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: "DATABASE_URL not configured" },
        { status: 500 }
      );
    }

    if (category === "upgrade") {
      const rows = await sql`
        SELECT id, name
        FROM hcp_employees
        WHERE id = ${INSTALL_QUOTE_EMPLOYEE_ID}
      `;

      const empRow = (Array.isArray(rows) ? rows[0] : null) as { id: string; name: string } | null;
      const installerName = empRow?.name ?? "Installer";

      const { booking_windows } = await hcp.getBookingWindows(INSTALL_QUOTE_EMPLOYEE_ID);

      const slots: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string; technicianName?: string }[] = [];
      const seen = new Set<string>();

      for (const w of booking_windows) {
        const endIso = w.end_time || new Date(new Date(w.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
        const { date, start, end, label } = formatWindow(w.start_time, endIso);
        const d = new Date(`${date}T12:00:00`);
        const dow = d.getDay();
        // No install quotes on weekends
        if (dow === 0 || dow === 6) continue;
        const allowedZones = INSTALL_QUOTE_ZONE_BY_DOW[dow] ?? [];
        if (allowedZones.length > 0 && !allowedZones.includes(serviceZoneId)) {
          continue;
        }
        const key = `${date}-${start}-${INSTALL_QUOTE_EMPLOYEE_ID}`;
        if (seen.has(key)) continue;
        seen.add(key);
        slots.push({
          id: key,
          date,
          startTime: start,
          endTime: end,
          label,
          technicianId: INSTALL_QUOTE_EMPLOYEE_ID,
          technicianName: installerName,
        });
      }

      slots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
      return NextResponse.json({ slots });
    }

    const rows = await sql`
      SELECT id, name, service_zone_ids
      FROM hcp_employees
    `;

    const allRows = (Array.isArray(rows) ? rows : []) as { id: string; name: string; service_zone_ids: unknown }[];
    const employees = allRows.filter((r) => {
      const ids = r.service_zone_ids;
      const arr = Array.isArray(ids) ? ids : typeof ids === "string" ? JSON.parse(ids || "[]") : [];
      return arr.includes(serviceZoneId);
    });

    const slots: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string; technicianName?: string }[] = [];
    const seen = new Set<string>();

    for (const emp of employees) {
      try {
        const { booking_windows } = await hcp.getBookingWindows(emp.id);
        for (const w of booking_windows) {
          const endIso = w.end_time || new Date(new Date(w.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
          const { date, start, end, label } = formatWindow(w.start_time, endIso);
          const d = new Date(`${date}T12:00:00`);
          const dow = d.getDay();
          // No booking of any type on weekends
          if (dow === 0 || dow === 6) continue;
          const key = `${date}-${start}-${emp.id}`;
          if (!seen.has(key)) {
            seen.add(key);
            slots.push({
              id: key,
              date,
              startTime: start,
              endTime: end,
              label,
              technicianId: emp.id,
              technicianName: emp.name,
            });
          }
        }
      } catch {
        continue;
      }
    }

    slots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));

    return NextResponse.json({ slots });
  } catch (err) {
    console.error("Availability fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
