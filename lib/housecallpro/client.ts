/**
 * Housecall Pro API client.
 * Docs: https://docs.housecallpro.com/docs/housecall-public-api
 */

const BASE_URL = process.env.HOUSECALLPRO_API_BASE ?? "https://api.housecallpro.com";

async function fetchHCP<T>(path: string, options?: { method?: string; body?: unknown }): Promise<T> {
  const apiKey = process.env.HOUSECALLPRO_API_KEY;
  if (!apiKey) throw new Error("HOUSECALLPRO_API_KEY is not set");

  const fetchOptions: RequestInit = {
    method: options?.method ?? "GET",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  };
  if (options?.body !== undefined) {
    (fetchOptions as { body: string }).body = JSON.stringify(options.body);
  }
  const res = await fetch(`${BASE_URL}${path}`, fetchOptions);

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Housecall Pro API error ${res.status}: ${text}`);
  }

  const text = await res.text();
  return (text ? JSON.parse(text) : {}) as T;
}

type EmployeeRaw = {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  service_zone_ids?: string[];
  service_zone_id?: string;
  service_zones?: { id?: string }[];
};
type Employee = { id: string; first_name?: string; last_name?: string; name?: string; service_zone_ids: string[] };
type ServiceZone = {
  id: string;
  name?: string;
  zip_codes?: string[];
  coverage_type?: string;
  trip_charge?: number;
  fee_name?: string;
  cities?: { city?: string; state?: string; country?: string }[];
  service_pros?: {
    id: string;
    first_name?: string;
    last_name?: string;
    email?: string;
    full_name?: string;
  }[];
};

function normalizeEmployeeZoneIds(e: EmployeeRaw): string[] {
  if (Array.isArray(e.service_zone_ids) && e.service_zone_ids.length > 0) return e.service_zone_ids;
  if (e.service_zone_id && typeof e.service_zone_id === "string") return [e.service_zone_id];
  if (Array.isArray(e.service_zones)) {
    const ids = e.service_zones.map((z) => z?.id).filter((id): id is string => Boolean(id));
    if (ids.length > 0) return ids;
  }
  return [];
}
type Customer = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; address_line_1?: string; city?: string; state?: string; zip?: string };
type BookingWindow = { start_time: string; end_time?: string; employee_id?: string; available?: boolean };
type ScheduleWindow = { start_time: string; end_time?: string; employee_id?: string; available?: boolean };

export async function getEmployees(): Promise<{ employees: Employee[] }> {
  const res = await fetchHCP<Record<string, unknown>>("/employees");
  const raw = (res.employees ?? res.data ?? res.items ?? []) as EmployeeRaw[];
  const employees: Employee[] = Array.isArray(raw)
    ? raw.map((e) => ({
        id: e.id,
        first_name: e.first_name,
        last_name: e.last_name,
        name: e.name ?? [e.first_name, e.last_name].filter(Boolean).join(" "),
        service_zone_ids: normalizeEmployeeZoneIds(e),
      }))
    : [];
  return { employees };
}

export async function getServiceZones(): Promise<{ service_zones: ServiceZone[] }> {
  const res = await fetchHCP<Record<string, unknown>>("/service_zones");
  const zones = (res.service_zones ?? res.data ?? res.items ?? []) as ServiceZone[];
  return { service_zones: Array.isArray(zones) ? zones : [] };
}

export async function getCustomers(params?: { per_page?: number; page?: number }): Promise<{ customers: Customer[] }> {
  const qs = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : "";
  const res = await fetchHCP<Record<string, unknown>>(`/customers${qs}`);
  const customers = (res.customers ?? res.data ?? res.items ?? []) as Customer[];
  return { customers: Array.isArray(customers) ? customers : [] };
}

export interface CreateCustomerPayload {
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export async function createCustomer(payload: CreateCustomerPayload): Promise<{ id: string }> {
  const res = await fetchHCP<{ id?: string; customer?: { id: string } }>("/customers", {
    method: "POST",
    body: payload,
  });
  const id = res.id ?? (res as { customer?: { id: string } }).customer?.id;
  if (!id) throw new Error("Housecall Pro createCustomer did not return an id");
  return { id };
}

export async function getBookingWindows(
  employeeId: string,
  options?: { serviceDurationMinutes?: number; showForDays?: number; startDate?: string }
): Promise<{ booking_windows: BookingWindow[] }> {
  const serviceDurationMinutes = options?.serviceDurationMinutes;
  const showForDays = options?.showForDays;
  const startDate = options?.startDate;
  const qs = new URLSearchParams({
    // Housecall Pro docs use `employee_ids` (array[string]) for this endpoint.
    // We pass a single employee id as `employee_ids`.
    employee_ids: employeeId,
    ...(serviceDurationMinutes && serviceDurationMinutes > 0 ? { service_duration: String(serviceDurationMinutes) } : {}),
    ...(showForDays && showForDays > 0 ? { show_for_days: String(showForDays) } : {}),
    ...(startDate ? { start_date: startDate } : {}),
  });
  // Docs:
  // https://api.housecallpro.com/company/schedule_availability/booking_windows
  const res = await fetchHCP<Record<string, unknown>>(
    `/company/schedule_availability/booking_windows?${qs.toString()}`
  );
  const windows = (res.booking_windows ?? res.data ?? res.items ?? []) as BookingWindow[];
  return { booking_windows: Array.isArray(windows) ? windows : [] };
}

export async function getScheduleWindows(
  employeeId: string,
  options?: { serviceDurationMinutes?: number; showForDays?: number; startDate?: string }
): Promise<{ schedule_windows: ScheduleWindow[] }> {
  const serviceDurationMinutes = options?.serviceDurationMinutes;
  const showForDays = options?.showForDays;
  const startDate = options?.startDate;

  const qs = new URLSearchParams({
    employee_ids: employeeId,
    ...(serviceDurationMinutes && serviceDurationMinutes > 0 ? { service_duration: String(serviceDurationMinutes) } : {}),
    ...(showForDays && showForDays > 0 ? { show_for_days: String(showForDays) } : {}),
    ...(startDate ? { start_date: startDate } : {}),
  });

  // Schedule Windows:
  // https://api.housecallpro.com/company/schedule_availability
  // Response shape: { daily_availabilities: { data: [ { day_name, schedule_windows: [{ start_time, end_time }] } ] } }
  const res = await fetchHCP<Record<string, unknown>>(`/company/schedule_availability?${qs.toString()}`);

  const dailyAvail = res.daily_availabilities ?? (res as { dailyAvailabilities?: unknown }).dailyAvailabilities;
  const dayData = (dailyAvail as { data?: unknown[] })?.data;
  const windows: ScheduleWindow[] = [];

  if (Array.isArray(dayData)) {
    for (const day of dayData) {
      const sw = (day as { schedule_windows?: unknown[] }).schedule_windows ??
        (day as { scheduleWindows?: unknown[] }).scheduleWindows;
      if (Array.isArray(sw)) {
        for (const w of sw) {
          const win = w as { start_time?: string; end_time?: string };
          if (win?.start_time) {
            windows.push({
              start_time: win.start_time,
              end_time: win.end_time ?? undefined,
            });
          }
        }
      }
    }
  }

  return { schedule_windows: windows };
}

export interface CreateJobPayload {
  customer_id: string;
  address_id?: string;
  description?: string;
  // Some job fields (including schedule/assignment) are accepted at the top level.
  // We keep `schedule` too, but prefer top-level for compatibility with PATCH semantics.
  scheduled_start?: string;
  scheduled_end?: string;
  assigned_employee_ids?: string[];
  property?: {
    address_line_1?: string;
    address_line_2?: string;
    city?: string;
    state?: string;
    zip?: string;
  };
  schedule?: {
    scheduled_start?: string;
    scheduled_end?: string;
    arrival_window?: number;
    anytime?: boolean;
    anytime_start_date?: string;
    assigned_employee_ids?: string[];
  };
  notes?: string;
  job_fields?: {
    job_type_id?: string;
    business_unit_id?: string;
  };
}

export async function createJob(payload: CreateJobPayload): Promise<{ job?: { id: string } }> {
  const res = await fetchHCP<Record<string, unknown>>("/jobs", {
    method: "POST",
    body: payload,
  });
  return res as { job?: { id: string } };
}

export async function addJobNote(jobId: string, content: string): Promise<void> {
  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}/notes`, {
    method: "POST",
    body: { content },
  });
}

export async function updateJobSchedule(
  jobId: string,
  scheduledStart: string,
  scheduledEnd: string
): Promise<void> {
  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    body: { scheduled_start: scheduledStart, scheduled_end: scheduledEnd },
  });
}

export async function dispatchJobToEmployee(jobId: string, employeeId: string): Promise<void> {
  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}/dispatch`, {
    method: "PUT",
    body: { employee_ids: [employeeId] },
  });
}
