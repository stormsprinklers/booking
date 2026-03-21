import type { PricingOption } from "@/lib/types";
import type { ServiceCategoryId } from "@/lib/types";

/** Minimal pricing options for direct booking (no pricing wizard) */
export const DIRECT_BOOKING_OPTIONS: Record<ServiceCategoryId, PricingOption> = {
  repair: {
    id: "direct-repair",
    tier: "single",
    title: "Sprinkler Repair / Diagnosis",
    price: 99,
    priceRange: { min: 99, max: 399 },
    description: "We'll diagnose and provide a quote. Most repairs run $99–$399.",
    estimatedDuration: "1–2 hours",
    includes: ["Diagnosis", "Repair labor and materials", "Flat-rate pricing—no surprise charges"],
  },
  seasonal: {
    id: "direct-seasonal",
    tier: "single",
    title: "Seasonal Service",
    price: 199,
    priceRange: { min: 175, max: 349 },
    description: "Spring tune-up or winterization. Price varies by zones.",
    estimatedDuration: "45–60 minutes",
    includes: ["System check", "Zone test", "Blow-out or start-up as needed"],
  },
  installation: {
    id: "direct-installation",
    tier: "single",
    title: "New Sprinkler System - Quote",
    price: 0,
    description: "Free on-site or video quote for your new sprinkler system.",
    estimatedDuration: "Varies by scope",
    includes: ["Free quote", "Turf irrigation", "Sod, mulch, rock options"],
  },
};
