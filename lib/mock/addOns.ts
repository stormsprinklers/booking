import type { AddOn } from "@/lib/types";

export const addOns: AddOn[] = [
  {
    id: "tuneup",
    title: "Full System Tune-Up",
    price: 249,
    description: "Comprehensive check, adjustment, and optimization—up to 8 zones, +$25 per additional zone",
  },
  {
    id: "winterization",
    title: "Winterization",
    price: 175,
    description: "Blow-out and winter prep—up to 8 zones, +$15 per additional zone",
  },
  {
    id: "smart-controller",
    title: "Smart Sprinkler Controller",
    price: 499,
    description: "Install and set up a WiFi smart controller with hardware included",
  },
  {
    id: "maintenance-plan",
    title: "Storm Shield Maintenance Plan",
    price: 349,
    description: "Tune-up + winterization, priority scheduling, and more. See stormsprinklers.com/sprinkler-maintenance-plans",
  },
];
