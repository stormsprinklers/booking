import type { ServiceCategory } from "@/lib/types";

export const serviceCategories: ServiceCategory[] = [
  {
    id: "repair",
    title: "Repair / Troubleshooting",
    description: "Fix leaks, broken heads, pressure issues, or system not turning on",
  },
  {
    id: "seasonal",
    title: "Seasonal Service",
    description: "Spring start-up, winterization, or regular maintenance",
  },
  {
    id: "installation",
    title: "New Sprinkler System / Installation",
    description: "Turf irrigation, sod, mulch, rock—new system design and install",
  },
];
