/**
 * Housecall Pro API response types.
 * Ref: https://docs.housecallpro.com/docs/housecall-public-api
 */

export interface HCPEmployee {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  service_zone_ids?: string[];
  active?: boolean;
}

export interface HCPServiceZone {
  id: string;
  name?: string;
  description?: string;
  zip_codes?: string[];
  territory?: string;
}

export interface HCPCustomer {
  id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  zip?: string;
}

export interface HCPBookingWindow {
  id?: string;
  start_time: string;
  end_time: string;
  employee_id?: string;
}
