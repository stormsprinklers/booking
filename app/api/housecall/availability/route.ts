import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import * as hcp from "@/lib/housecallpro/client";
import { INSTALL_QUOTE_EMPLOYEE_ID, INSTALL_QUOTE_ZONE_BY_DOW } from "@/lib/config/installQuoteTech";

export const dynamic = "force-dynamic";

const DISPLAY_TIME_ZONE = "America/Denver";
const SERVICE_DURATION_MINUTES = 120;

function denverTomorrowAt(hour24: number): string {
  // Return a Housecall-style start_date string: YYYY-MM-DDTHH:MM:SS (no timezone suffix)
  // using the America/Denver calendar date for "tomorrow".
  const now = new Date();
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = dtf.formatToParts(now);
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  const y = Number(map.year);
  const m = Number(map.month);
  const d = Number(map.day);
  // Build a UTC date that corresponds to the Denver calendar "today" at noon, then add one day.
  // We use this just to compute tomorrow's Denver date string safely across DST boundaries.
  const approxUtc = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  approxUtc.setUTCDate(approxUtc.getUTCDate() + 1);
  const yy = approxUtc.getUTCFullYear();
  const mm = String(approxUtc.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(approxUtc.getUTCDate()).padStart(2, "0");
  const hh = String(hour24).padStart(2, "0");
  return `${yy}-${mm}-${dd}T${hh}:00:00`;
}

function getDenverDateKey(iso: string): string {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  // Example output: "03/19/2026"
  const parts = dtf.formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return `${map.year}-${map.month}-${map.day}`;
}

function getDenverHM(iso: string): { hh: number; mm: number } {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(new Date(iso));
  const map = Object.fromEntries(parts.filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  return { hh: Number(map.hour), mm: Number(map.minute) };
}

function getDenverDow(iso: string): number {
  const wd = new Intl.DateTimeFormat("en-US", {
    timeZone: DISPLAY_TIME_ZONE,
    weekday: "short",
  }).format(new Date(iso));
  // JS getDay: 0=Sun ... 6=Sat
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[wd] ?? 0;
}

function formatWindow(startIso: string, endIso: string): {
  date: string;
  start: string;
  end: string;
  label: string;
} {
  const date = getDenverDateKey(startIso);
  const { hh: h, mm: m } = getDenverHM(startIso);
  const { hh: eh, mm: em } = getDenverHM(endIso);

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
    // #region agent log
    fetch("http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d0054e" },
      body: JSON.stringify({
        sessionId: "d0054e",
        runId: "availability-debug",
        hypothesisId: "H-availability-0slots",
        location: "app/api/housecall/availability/route.ts:24",
        message: "availability route hit",
        data: { serviceZoneId, category },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

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

      const startDate = denverTomorrowAt(8);
      const { booking_windows } = await hcp.getBookingWindows(INSTALL_QUOTE_EMPLOYEE_ID, {
        serviceDurationMinutes: SERVICE_DURATION_MINUTES,
        showForDays: 7,
        startDate,
      });

      const debug =
        // #region agent log
        {
          branch: "upgrade",
          serviceZoneId,
          serviceDurationMinutes: SERVICE_DURATION_MINUTES,
          query: { employee_ids: INSTALL_QUOTE_EMPLOYEE_ID, service_duration: SERVICE_DURATION_MINUTES, show_for_days: 7, start_date: startDate },
          bookingWindowsCount: booking_windows.length,
          bookingWindowsFirst: booking_windows[0]
            ? {
                start_time: booking_windows[0].start_time,
                end_time: booking_windows[0].end_time ?? null,
                available: booking_windows[0].available ?? null,
                localFormatted: (() => {
                  const startIso = booking_windows[0].start_time;
                  const endIso =
                    booking_windows[0].end_time ||
                    new Date(new Date(booking_windows[0].start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
                  return formatWindow(startIso, endIso);
                })(),
              }
            : null,
        };
      // #region agent log
      fetch("http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d0054e" },
        body: JSON.stringify({
          sessionId: "d0054e",
          runId: "availability-debug",
          hypothesisId: "H-availability-0slots",
          location: "app/api/housecall/availability/route.ts:56",
          message: "install booking_windows result",
          data: {
            employeeId: INSTALL_QUOTE_EMPLOYEE_ID,
            serviceDurationMinutes: 120,
            bookingWindowsCount: booking_windows.length,
            first: booking_windows[0]
              ? {
                  start_time: booking_windows[0].start_time,
                  end_time: booking_windows[0].end_time ?? null,
                  available: booking_windows[0].available ?? null,
                }
              : null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion

      const slots: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string; technicianName?: string }[] = [];
      const seen = new Set<string>();

      for (const w of booking_windows) {
        // If end_time is missing, assume a 2-hour planned job duration.
        const endIso =
          w.end_time ||
          new Date(new Date(w.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
        const { date, start, end, label } = formatWindow(w.start_time, endIso);
        const dow = getDenverDow(w.start_time);
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
      // #region agent log
      fetch("http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7", {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d0054e" },
        body: JSON.stringify({
          sessionId: "d0054e",
          runId: "availability-debug",
          hypothesisId: "H-availability-0slots",
          location: "app/api/housecall/availability/route.ts:85",
          message: "install slots built",
          data: { slotsCount: slots.length },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion
      return NextResponse.json({ slots, debug });
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
    let loggedFirstEmployee = false;

    const debug: Record<string, unknown> = {
      branch: "repair",
      serviceZoneId,
      serviceDurationMinutes: SERVICE_DURATION_MINUTES,
      query: null,
      employeesConsidered: employees.length,
      bookingWindowsFirstEmployeeId: null,
      bookingWindowsFirstEmployeeBookingWindowsCount: null,
      bookingWindowsFirst: null,
        bookingWindowsFirstRaw: null,
        scheduleWindowsFirstEmployeeScheduleWindowsCount: null,
        scheduleWindowsFirstRaw: null,
        errors: [] as { employeeId: string; message: string }[],
    };

    for (const emp of employees) {
      try {
        const startDate = denverTomorrowAt(8);
        const { booking_windows } = await hcp.getBookingWindows(emp.id, {
          serviceDurationMinutes: SERVICE_DURATION_MINUTES,
          showForDays: 7,
          startDate,
        });
        let schedule_windows_len: number | null = null;
        let schedule_windows_raw: unknown = null;
        try {
          const swRes = await hcp.getScheduleWindows(emp.id, {
            serviceDurationMinutes: SERVICE_DURATION_MINUTES,
            showForDays: 7,
            startDate,
          });
          schedule_windows_len = swRes.schedule_windows.length;
          schedule_windows_raw = {
            tried: swRes.debug?.tried ?? null,
            sample: swRes.schedule_windows.slice(0, 5).map((sw) => ({
            start_time: sw.start_time,
            end_time: sw.end_time ?? null,
            available: (sw as { available?: unknown }).available ?? null,
            employee_id: (sw as { employee_id?: unknown }).employee_id ?? null,
            })),
          };
        } catch (swErr) {
          const msg = swErr instanceof Error ? swErr.message : String(swErr);
          schedule_windows_len = -1;
          schedule_windows_raw = { error: msg.slice(0, 1200) };
        }
        if (!loggedFirstEmployee) {
          loggedFirstEmployee = true;
          debug.query = { employee_ids: emp.id, service_duration: SERVICE_DURATION_MINUTES, show_for_days: 7, start_date: startDate };
          debug.bookingWindowsFirstEmployeeId = emp.id;
          debug.bookingWindowsFirstEmployeeBookingWindowsCount = booking_windows.length;
          debug.bookingWindowsFirst = booking_windows[0]
            ? {
                start_time: booking_windows[0].start_time,
                end_time: booking_windows[0].end_time ?? null,
                available: booking_windows[0].available ?? null,
                localFormatted: (() => {
                  const startIso = booking_windows[0].start_time;
                  const endIso =
                    booking_windows[0].end_time ||
                    new Date(new Date(booking_windows[0].start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
                  return formatWindow(startIso, endIso);
                })(),
              }
            : null;
          debug.bookingWindowsFirstRaw = booking_windows.slice(0, 5).map((bw) => ({
            start_time: bw.start_time,
            end_time: bw.end_time ?? null,
            available: bw.available ?? null,
            employee_id: bw.employee_id ?? null,
          }));
          debug.scheduleWindowsFirstEmployeeScheduleWindowsCount = schedule_windows_len;
          debug.scheduleWindowsFirstRaw = schedule_windows_raw;
          // #region agent log
          fetch("http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7", {
            method: "POST",
            headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d0054e" },
            body: JSON.stringify({
              sessionId: "d0054e",
              runId: "availability-debug",
              hypothesisId: "H-availability-0slots",
              location: "app/api/housecall/availability/route.ts:118",
              message: "repair booking_windows result (first employee)",
              data: {
                employeeId: emp.id,
                serviceDurationMinutes: 120,
                bookingWindowsCount: booking_windows.length,
                first: booking_windows[0]
                  ? {
                      start_time: booking_windows[0].start_time,
                      end_time: booking_windows[0].end_time ?? null,
                      available: booking_windows[0].available ?? null,
                    }
                  : null,
              },
              timestamp: Date.now(),
            }),
          }).catch(() => {});
          // #endregion
        }
        for (const w of booking_windows) {
          // If end_time is missing, assume a 2-hour planned job duration.
          const endIso =
            w.end_time ||
            new Date(new Date(w.start_time).getTime() + 2 * 60 * 60 * 1000).toISOString();
          const { date, start, end, label } = formatWindow(w.start_time, endIso);
          const dow = getDenverDow(w.start_time);
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
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        (debug.errors as { employeeId: string; message: string }[]).push({
          employeeId: emp.id,
          message: msg.slice(0, 1200),
        });
        continue;
      }
    }

    slots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    // #region agent log
    fetch("http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "d0054e" },
      body: JSON.stringify({
        sessionId: "d0054e",
        runId: "availability-debug",
        hypothesisId: "H-availability-0slots",
        location: "app/api/housecall/availability/route.ts:142",
        message: "repair slots built",
        data: { slotsCount: slots.length },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion

    return NextResponse.json({ slots, debug });
  } catch (err) {
    console.error("Availability fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
