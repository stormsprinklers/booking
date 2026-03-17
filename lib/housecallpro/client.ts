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

type Employee = { id: string; first_name?: string; last_name?: string; name?: string; service_zone_ids?: string[] };
type ServiceZone = { id: string; name?: string; zip_codes?: string[] };
type Customer = { id: string; first_name?: string; last_name?: string; email?: string; phone?: string; address_line_1?: string; city?: string; state?: string; zip?: string };
type BookingWindow = { start_time: string; end_time: string; employee_id?: string };

export async function getEmployees(): Promise<{ employees: Employee[] }> {
  const res = await fetchHCP<Record<string, unknown>>("/employees");
  const employees = (res.employees ?? res.data ?? res.items ?? []) as Employee[];
  return { employees: Array.isArray(employees) ? employees : [] };
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

export async function getBookingWindows(employeeId: string): Promise<{ booking_windows: BookingWindow[] }> {
  const res = await fetchHCP<Record<string, unknown>>(
    `/booking_windows?employee_id=${encodeURIComponent(employeeId)}`
  );
  const windows = (res.booking_windows ?? res.data ?? res.items ?? []) as BookingWindow[];
  return { booking_windows: Array.isArray(windows) ? windows : [] };
}

export interface CreateJobPayload {
  description?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  customer_id?: string;
  customer?: { first_name?: string; last_name?: string; email?: string; phone?: string };
  property?: { address_line_1?: string; city?: string; state?: string; zip?: string };
  assigned_to?: string;
}

export async function createJob(payload: CreateJobPayload): Promise<{ job?: { id: string } }> {
  const res = await fetchHCP<Record<string, unknown>>("/jobs", {
    method: "POST",
    body: payload,
  });
  return res as { job?: { id: string } };
}
