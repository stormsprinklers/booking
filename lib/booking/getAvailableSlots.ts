import type { AvailabilitySlot } from "@/lib/types";

const SLOT_DURATIONS = [
  { start: "09:00", end: "11:00", label: "9–11 AM" },
  { start: "11:00", end: "13:00", label: "11 AM–1 PM" },
  { start: "13:00", end: "15:00", label: "1–3 PM" },
  { start: "15:00", end: "17:00", label: "3–5 PM" },
];

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function formatDateKey(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Generate mock availability slots for the next 7 days.
 * In production, query technician schedules, capacity, routing.
 */
export function getAvailableSlots(
  _serviceAreaId: string,
  _serviceCategory: string,
  _durationMinutes?: number
): AvailabilitySlot[] {
  const slots: AvailabilitySlot[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = addDays(today, dayOffset);
    const dateKey = formatDateKey(date);

    SLOT_DURATIONS.forEach((dur, i) => {
      const id = `${dateKey}-${dur.start}`;
      const spotsLeft = dayOffset === 1 && i < 2 ? 2 : 5;
      slots.push({
        id,
        date: dateKey,
        startTime: dur.start,
        endTime: dur.end,
        label: dur.label,
        spotsLeft,
      });
    });
  }

  return slots;
}
