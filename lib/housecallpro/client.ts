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
type BookingWindow = { start_time: string; end_time: string; employee_id?: string };

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

export async function getBookingWindows(employeeId: string): Promise<{ booking_windows: BookingWindow[] }> {
  const res = await fetchHCP<Record<string, unknown>>(
    `/booking_windows?employee_id=${encodeURIComponent(employeeId)}`
  );
  const windows = (res.booking_windows ?? res.data ?? res.items ?? []) as BookingWindow[];
  return { booking_windows: Array.isArray(windows) ? windows : [] };
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

export async function getJob(jobId: string): Promise<Record<string, unknown>> {
  return await fetchHCP<Record<string, unknown>>(`/jobs/${encodeURIComponent(jobId)}`);
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

export async function updateJobAssignedEmployees(jobId: string, employeeIds: string[]): Promise<void> {
  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    body: { assigned_employee_ids: employeeIds },
  });
}

export async function updateJobScheduleAssignedEmployees(jobId: string, employeeIds: string[]): Promise<void> {
  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}`, {
    method: "PATCH",
    body: { schedule: { assigned_employee_ids: employeeIds } },
  });
}

export async function dispatchJobToEmployee(jobId: string, employeeId: string): Promise<void> {
  // #region agent log
  fetch('http://127.0.0.1:7816/ingest/6871cd52-8abc-4996-a074-5937cf159ac7',{
    method:'POST',
    headers:{
      'Content-Type':'application/json',
      'X-Debug-Session-Id':'d0054e'
    },
    body:JSON.stringify({
      sessionId:'d0054e',
      runId:'dispatch',
      hypothesisId:'H4',
      location:'lib/housecallpro/client.ts:182',
      message:'dispatchJobToEmployee call',
      data:{jobId,employeeId},
      timestamp:Date.now()
    })
  }).catch(()=>{});
  // #endregion

  await fetchHCP<unknown>(`/jobs/${encodeURIComponent(jobId)}/dispatch`, {
    method: "PUT",
    body: { employee_ids: [employeeId] },
  });
}
