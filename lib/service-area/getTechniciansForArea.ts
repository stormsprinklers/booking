import type { Technician } from "@/lib/types";
import { technicians } from "@/lib/mock/technicians";

export function getTechniciansForArea(serviceAreaId: string): Technician[] {
  return technicians.filter((t) => t.serviceAreaIds.includes(serviceAreaId));
}
