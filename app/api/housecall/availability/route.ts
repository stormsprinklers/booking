import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db/client";
import * as hcp from "@/lib/housecallpro/client";
import { INSTALL_QUOTE_EMPLOYEE_ID, INSTALL_QUOTE_ZONE_BY_DOW } from "@/lib/config/installQuoteTech";

export const dynamic = "force-dynamic";

const DISPLAY_TIME_ZONE = "America/Denver";
const SERVICE_DURATION_MINUTES = 120;
const SHOW_FOR_DAYS = 7;
const JOBS_PAGE_SIZE = 100;

function endDateFromStart(startDateIso: string, days: number): string {
  const d = new Date(startDateIso);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 19);
}

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

/** Subtract scheduled jobs from booking windows for one employee. */
function subtractJobsFromWindows(
  bookingWindows: { start_time: string; end_time?: string }[],
  jobs: { scheduled_start?: string; scheduled_end?: string; assigned_employee_ids?: string[] }[],
  employeeId: string
): { start_time: string; end_time: string }[] {
  const employeeJobs = jobs.filter(
    (j) => Array.isArray(j.assigned_employee_ids) && j.assigned_employee_ids.includes(employeeId) && j.scheduled_start
  );
  const blocks = employeeJobs
    .map((j) => {
      const start = new Date(j.scheduled_start!).getTime();
      const end = j.scheduled_end ? new Date(j.scheduled_end).getTime() : start + SERVICE_DURATION_MINUTES * 60 * 1000;
      return { start, end };
    })
    .sort((a, b) => a.start - b.start);

  const result: { start_time: string; end_time: string }[] = [];
  for (const w of bookingWindows) {
    const wStart = new Date(w.start_time).getTime();
    const wEnd = w.end_time ? new Date(w.end_time).getTime() : wStart + SERVICE_DURATION_MINUTES * 60 * 1000;
    const segments = [{ start: wStart, end: wEnd }];
    for (const b of blocks) {
      const next: { start: number; end: number }[] = [];
      for (const s of segments) {
        if (b.end <= s.start || b.start >= s.end) {
          next.push(s);
        } else {
          if (s.start < b.start) next.push({ start: s.start, end: Math.min(s.end, b.start) });
          if (b.end < s.end) next.push({ start: Math.max(s.start, b.end), end: s.end });
        }
      }
      segments.length = 0;
      segments.push(...next);
    }
    for (const s of segments) {
      if (s.end - s.start >= SERVICE_DURATION_MINUTES * 60 * 1000) {
        result.push({
          start_time: new Date(s.start).toISOString(),
          end_time: new Date(s.end).toISOString(),
        });
      }
    }
  }
  return result;
}

/** Split availability windows into discrete SERVICE_DURATION_MINUTES slots. */
function windowsToSlots(
  windows: { start_time: string; end_time: string }[]
): { start_time: string; end_time: string }[] {
  const durationMs = SERVICE_DURATION_MINUTES * 60 * 1000;
  const slots: { start_time: string; end_time: string }[] = [];
  for (const w of windows) {
    let start = new Date(w.start_time).getTime();
    const end = new Date(w.end_time).getTime();
    while (start + durationMs <= end) {
      slots.push({
        start_time: new Date(start).toISOString(),
        end_time: new Date(start + durationMs).toISOString(),
      });
      start += durationMs;
    }
  }
  return slots;
}

async function listJobsForWindow(employeeIds: string[], startDate: string, endDate: string) {
  const jobs: { scheduled_start?: string; scheduled_end?: string; assigned_employee_ids?: string[] }[] = [];
  let page = 1;
  while (true) {
    const { jobs: pageJobs } = await hcp.listJobs({
      employeeIds,
      scheduledStartMin: startDate,
      scheduledStartMax: endDate,
      scheduledEndMin: startDate,
      scheduledEndMax: endDate,
      pageSize: JOBS_PAGE_SIZE,
      page,
    });
    jobs.push(...pageJobs);
    if (pageJobs.length < JOBS_PAGE_SIZE) break;
    page += 1;
    if (page > 20) break;
  }
  return jobs;
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

      const startDate = denverTomorrowAt(8);
      const endDate = endDateFromStart(startDate, SHOW_FOR_DAYS);
      const [bookingRes, jobs] = await Promise.all([
        hcp.getBookingWindows(INSTALL_QUOTE_EMPLOYEE_ID, {
          serviceDurationMinutes: SERVICE_DURATION_MINUTES,
          showForDays: SHOW_FOR_DAYS,
          startDate,
        }),
        listJobsForWindow([INSTALL_QUOTE_EMPLOYEE_ID], startDate, endDate),
      ]);
      const availableWindows = subtractJobsFromWindows(bookingRes.booking_windows, jobs, INSTALL_QUOTE_EMPLOYEE_ID);
      const raw = availableWindows.map((w) => ({
        start_time: w.start_time,
        end_time: w.end_time,
      }));
      const slotWindows = windowsToSlots(raw);

      const debug = {
        branch: "upgrade",
        source: "booking_windows_minus_jobs",
        serviceZoneId,
        query: {
          employee_ids: INSTALL_QUOTE_EMPLOYEE_ID,
          service_duration: SERVICE_DURATION_MINUTES,
          show_for_days: SHOW_FOR_DAYS,
          start_date: startDate,
          scheduled_start_min: startDate,
          scheduled_start_max: endDate,
          scheduled_end_min: startDate,
          scheduled_end_max: endDate,
          page_size: JOBS_PAGE_SIZE,
        },
        bookingWindowsCount: bookingRes.booking_windows.length,
        jobsCount: jobs.length,
        availableWindowsCount: availableWindows.length,
        slotWindowsCount: slotWindows.length,
        slotWindowsSample: slotWindows.slice(0, 5),
      };

      const slots: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string; technicianName?: string }[] = [];
      const seen = new Set<string>();

      for (const w of slotWindows) {
        const endIso = w.end_time ?? new Date(new Date(w.start_time).getTime() + SERVICE_DURATION_MINUTES * 60 * 1000).toISOString();
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
    const debug: Record<string, unknown> = {
      branch: "repair",
      source: null as string | null,
      serviceZoneId,
      serviceDurationMinutes: SERVICE_DURATION_MINUTES,
      employeesConsidered: employees.length,
      query: null,
      firstEmployeeId: null,
      firstEmployeeSlotWindowsCount: null,
      firstEmployeeSlotWindowsSample: null,
      errors: [] as { employeeId: string; message: string }[],
    };
    let capturedFirst = false;

    const startDate = denverTomorrowAt(8);
    const endDate = endDateFromStart(startDate, SHOW_FOR_DAYS);
    const employeeIds = employees.map((e) => e.id);
    const jobs = employeeIds.length > 0 ? await listJobsForWindow(employeeIds, startDate, endDate) : [];

    for (const emp of employees) {
      try {
        const bookingRes = await hcp.getBookingWindows(emp.id, {
          serviceDurationMinutes: SERVICE_DURATION_MINUTES,
          showForDays: SHOW_FOR_DAYS,
          startDate,
        });
        const availableWindows = subtractJobsFromWindows(bookingRes.booking_windows, jobs, emp.id);
        const raw = availableWindows.map((w) => ({
          start_time: w.start_time,
          end_time: w.end_time,
        }));
        const slotWindows = windowsToSlots(raw);
        if (!capturedFirst) {
          capturedFirst = true;
          debug.source = "booking_windows_minus_jobs";
          debug.query = {
            employee_ids: emp.id,
            service_duration: SERVICE_DURATION_MINUTES,
            show_for_days: SHOW_FOR_DAYS,
            start_date: startDate,
            scheduled_start_min: startDate,
            scheduled_start_max: endDate,
            scheduled_end_min: startDate,
            scheduled_end_max: endDate,
            page_size: JOBS_PAGE_SIZE,
          };
          debug.firstEmployeeId = emp.id;
          debug.firstEmployeeBookingWindowsCount = bookingRes.booking_windows.length;
          debug.jobsCount = jobs.length;
          debug.firstEmployeeAvailableWindowsCount = availableWindows.length;
          debug.firstEmployeeSlotWindowsCount = slotWindows.length;
          debug.firstEmployeeSlotWindowsSample = slotWindows.slice(0, 5);
        }
        for (const w of slotWindows) {
          const endIso = w.end_time ?? new Date(new Date(w.start_time).getTime() + SERVICE_DURATION_MINUTES * 60 * 1000).toISOString();
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
        (debug.errors as { employeeId: string; message: string }[]).push({
          employeeId: emp.id,
          message: err instanceof Error ? err.message.slice(0, 1200) : String(err).slice(0, 1200),
        });
        continue;
      }
    }

    slots.sort((a, b) => (a.date + a.startTime).localeCompare(b.date + b.startTime));
    return NextResponse.json({ slots, debug });
  } catch (err) {
    console.error("Availability fetch error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
