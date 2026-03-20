// Service categories
export type ServiceCategoryId = "repair" | "seasonal" | "installation";

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
  customerMessage?: string;
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
  addOnIds?: string[];
  // Repair
  repairFollowUps?: Record<string, string>;
  headCount?: number;
  // Seasonal
  seasonalServiceType?: "tuneup" | "winterization" | "both";
  zoneCount?: number;
  zoneCountUnknown?: boolean;
  // Installation
  turfSqFt?: number;
  hasExistingSprinklers?: boolean;
  waterType?: "culinary" | "secondary" | "dont-know";
  sodSqFt?: number;
  mulchSqFt?: number;
  rockSqFt?: number;
  // Contact (collected before price)
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  consentToContact?: boolean;
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
  technicianName?: string;
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
  consentToContact?: boolean;
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
