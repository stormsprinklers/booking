import type { ServiceArea } from "@/lib/types";
import { serviceAreas } from "@/lib/mock/serviceAreas";

export interface AddressValidationResult {
  valid: boolean;
  serviceArea: ServiceArea | null;
  normalizedAddress?: string;
}

/**
 * Mock address validation. In production, wire to Google Places / address validation API.
 */
export function validateAddress(address: string): AddressValidationResult {
  const normalized = address.trim().toLowerCase();

  // Extract potential zip code (5 digits)
  const zipMatch = normalized.match(/\b(\d{5})\b/);
  if (zipMatch) {
    const zip = zipMatch[1];
    const area = serviceAreas.find((a) => a.zipCodes.includes(zip));
    if (area) {
      return {
        valid: true,
        serviceArea: area,
        normalizedAddress: address.trim(),
      };
    }
  }

  // Fallback: check for city/region keywords (mock)
  if (
    normalized.includes("minneapolis") ||
    normalized.includes("saint paul") ||
    normalized.includes("bloomington") ||
    normalized.includes("edina") ||
    normalized.includes("eden prairie")
  ) {
    return {
      valid: true,
      serviceArea: serviceAreas[0] ?? null,
      normalizedAddress: address.trim(),
    };
  }

  return {
    valid: false,
    serviceArea: null,
  };
}
