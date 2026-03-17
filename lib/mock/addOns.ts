import type { AddOn } from "@/lib/types";

export const addOns: AddOn[] = [
  {
    id: "inspection",
    title: "Full System Inspection",
    price: 49,
    description: "Complete check of all zones and components",
  },
  {
    id: "priority",
    title: "Priority Scheduling",
    price: 25,
    description: "Next available slot",
  },
  {
    id: "membership",
    title: "Storm Shield Membership",
    price: 0,
    description: "Seasonal service + discounts (inquire for details)",
  },
];
