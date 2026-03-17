// Service categories
export type ServiceCategoryId = "repair" | "upgrade" | "seasonal";

export interface ServiceCategory {
  id: ServiceCategoryId;
  title: string;
  description: string;
  icon?: string;
}

// Pricing
export interface PricingOption {
  id: string;
  tier: "good" | "better" | "best" | "single";
  title: string;
  price: number;
  priceRange?: { min: number; max: number };
  description: string;
  estimatedDuration: string;
  includes: string[];
  addOns?: AddOn[];
}

export interface AddOn {
  id: string;
  title: string;
  price: number;
  description?: string;
}

// Pricing wizard inputs
export interface PricingInputs {
  serviceCategory: ServiceCategoryId;
  propertySize?: "small" | "medium" | "large";
  issueType?: string;
  issueTypes?: string[];
  scope?: string;
  addOnIds?: string[];
  urgency?: "standard" | "priority" | "emergency";
  issueStartTime?: "today" | "within-week" | "weeks-ago" | "ongoing" | "dont-know";
}

// Service area & technicians
export interface ServiceArea {
  id: string;
  name: string;
  zipCodes: string[];
  region: string;
}

export interface Technician {
  id: string;
  name: string;
  serviceAreaIds: string[];
  serviceTypes: ServiceCategoryId[];
}

export interface AvailabilitySlot {
  id: string;
  date: string; // ISO date
  startTime: string; // "09:00"
  endTime: string; // "11:00"
  label: string; // "9–11 AM"
  technicianId?: string;
  spotsLeft?: number;
}

// Booking
export interface Customer {
  name: string;
  email: string;
  phone: string;
  address?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zip?: string;
  notes?: string;
}

export interface Booking {
  id: string;
  customer: Customer;
  serviceCategory: ServiceCategoryId;
  pricingOptionId: string;
  pricingOption: PricingOption;
  slot: AvailabilitySlot;
  address: string;
  status: "confirmed" | "pending" | "completed";
  createdAt: string;
}

// Analytics
export type FunnelEvent =
  | "landing_view"
  | "category_selected"
  | "pricing_completed"
  | "option_selected"
  | "booking_started"
  | "address_entered"
  | "slot_selected"
  | "details_entered"
  | "booking_completed"
  | "drop_off";
