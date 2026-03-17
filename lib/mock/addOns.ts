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
  {
    id: "tuneup",
    title: "Full System Tune-Up",
    price: 79,
    description: "Comprehensive check, adjustment, and optimization of all zones",
  },
  {
    id: "smart-controller",
    title: "Smart Sprinkler Controller",
    price: 199,
    description: "Install and set up a WiFi smart controller (hardware included)",
  },
  {
    id: "annual-plan",
    title: "Annual Maintenance Plan",
    price: 149,
    description: "Year-round care with seasonal service and priority scheduling",
  },
];
