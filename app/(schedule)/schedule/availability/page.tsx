"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import { getAvailableSlots } from "@/lib/booking/getAvailableSlots";
import type { AvailabilitySlot } from "@/lib/types";
import { track } from "@/lib/analytics";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
  if (diff === 1) return "Tomorrow";
  if (diff === 2) return "In 2 days";
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

export default function ScheduleAvailabilityPage() {
  const router = useRouter();
  const { serviceAreaId, serviceCategory, setSlot } = useBooking();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);

  useEffect(() => {
    if (!serviceAreaId) {
      router.push("/schedule");
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch(`/api/housecall/availability?service_zone_id=${encodeURIComponent(serviceAreaId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        const apiSlots = (data.slots ?? []).map(
          (s: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string }) =>
            ({ ...s, spotsLeft: undefined } as AvailabilitySlot)
        );
        if (apiSlots.length > 0) {
          setSlots(apiSlots);
        } else {
          setSlots(getAvailableSlots(serviceAreaId, serviceCategory));
        }
      })
      .catch(() => {
        if (!cancelled) setSlots(getAvailableSlots(serviceAreaId, serviceCategory));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [serviceAreaId, serviceCategory, router]);

  const handleSelect = (slot: AvailabilitySlot) => {
    setSelected(slot);
    setSlot(slot);
    track("slot_selected", { slotId: slot.id });
  };

  const handleContinue = () => {
    if (selected) router.push("/schedule/details");
  };

  const byDate = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    (acc[s.date] = acc[s.date] ?? []).push(s);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-[#102341]">Choose a time</h1>
        <p className="mt-2 text-[#102341]/70">
          Select an available slot. All times are in your local timezone.
        </p>

        <div className="mt-8 space-y-6">
          {Object.entries(byDate).map(([date, daySlots]) => (
            <div key={date}>
              <h2 className="mb-3 font-semibold text-[#102341]">
                {formatDayLabel(date)}
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {daySlots.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => handleSelect(slot)}
                    className={`rounded-xl border-2 p-3 text-left text-sm font-medium transition ${
                      selected?.id === slot.id
                        ? "border-[#F17388] bg-[#F17388]/10 text-[#102341]"
                        : "border-[#F0F0F0] text-[#102341] hover:border-[#4C9BC8]"
                    }`}
                  >
                    {slot.label}
                    {slot.spotsLeft && slot.spotsLeft <= 2 && (
                      <span className="mt-1 block text-xs text-[#F17388]">
                        Only {slot.spotsLeft} left
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {loading && (
          <p className="mt-8 text-[#102341]/70">Loading availability...</p>
        )}
        {!loading && slots.length === 0 && (
          <p className="mt-8 text-[#102341]/70">No available slots. Please try again or call to schedule.</p>
        )}

        {selected && (
          <div className="sticky bottom-0 mt-10 border-t border-[#F0F0F0] bg-white pt-6">
            <Button variant="primary" fullWidth size="lg" onClick={handleContinue}>
              Continue with {selected.label} on {formatDayLabel(selected.date)} →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
