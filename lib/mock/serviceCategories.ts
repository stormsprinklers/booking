import type { ServiceCategory } from "@/lib/types";

export const serviceCategories: ServiceCategory[] = [
  {
    id: "repair",
    title: "Repair / Troubleshooting",
    description: "Fix leaks, broken heads, pressure issues, or system not turning on",
  },
  {
    id: "upgrade",
    title: "System Upgrade / Install",
    description: "New system install, zones, smart controller, or major upgrades",
  },
  {
    id: "seasonal",
    title: "Seasonal Service",
    description: "Spring start-up, winterization, or regular maintenance",
  },
];
