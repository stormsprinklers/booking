import type { Technician } from "@/lib/types";

export const technicians: Technician[] = [
  { id: "t1", name: "Mike Johnson", serviceAreaIds: ["north-metro"], serviceTypes: ["repair", "seasonal"] },
  { id: "t2", name: "Sarah Williams", serviceAreaIds: ["north-metro", "west-metro"], serviceTypes: ["repair", "upgrade", "seasonal"] },
  { id: "t3", name: "Dave Martinez", serviceAreaIds: ["south-metro"], serviceTypes: ["repair", "seasonal"] },
  { id: "t4", name: "Amy Chen", serviceAreaIds: ["south-metro", "west-metro"], serviceTypes: ["upgrade", "repair", "seasonal"] },
];
