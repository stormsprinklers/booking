"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import type { AvailabilitySlot } from "@/lib/types";
import { track } from "@/lib/analytics";
import { formatTechnicianDisplayName } from "@/lib/format/technicianName";
import { getTechnicianPhotoUrl } from "@/lib/config/technicianPhotos";
import { INSTALL_QUOTE_EMPLOYEE_ID } from "@/lib/config/installQuoteTech";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const isTomorrow =
    d.getFullYear() === tomorrow.getFullYear() &&
    d.getMonth() === tomorrow.getMonth() &&
    d.getDate() === tomorrow.getDate();

  if (isTomorrow) {
    const dayLabel = d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    return `Tomorrow, ${dayLabel}`;
  }

  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

type Technician = { id: string; name: string; photoUrl?: string | null };

export default function ScheduleAvailabilityPage() {
  const router = useRouter();
  const { serviceAreaId, serviceCategory, setSlot } = useBooking();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<AvailabilitySlot | null>(null);
  const [debugInfo, setDebugInfo] = useState<any | null>(null);

  useEffect(() => {
    if (!serviceAreaId) {
      router.push("/schedule");
      return;
    }
    let cancelled = false;
    // For install quotes, fetch all employees so we can show the dedicated installer (they may not be in this zone in DB)
    const url =
      serviceCategory === "upgrade"
        ? "/api/housecall/employees"
        : `/api/housecall/employees?service_zone_id=${encodeURIComponent(serviceAreaId)}`;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        let emps = (data.employees ?? []).map(
          (e: { id: string; name: string; photoUrl?: string | null }) => ({
            id: e.id,
            name: e.name,
            photoUrl: e.photoUrl,
          })
        );
        if (serviceCategory === "upgrade") {
          const install = emps.find((e: { id: string }) => e.id === INSTALL_QUOTE_EMPLOYEE_ID);
          emps = install
            ? [install]
            : [{ id: INSTALL_QUOTE_EMPLOYEE_ID, name: "Installation specialist", photoUrl: getTechnicianPhotoUrl(INSTALL_QUOTE_EMPLOYEE_ID) }];
        }
        setTechnicians(emps);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [serviceAreaId, serviceCategory]);

  useEffect(() => {
    if (!serviceAreaId) {
      router.push("/schedule");
      return;
    }
    let cancelled = false;
    setLoading(true);
    setDebugInfo(null);
    fetch(
      `/api/housecall/availability?service_zone_id=${encodeURIComponent(
        serviceAreaId
      )}&category=${encodeURIComponent(serviceCategory)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (cancelled) return;
        setDebugInfo(data.debug ?? null);
        const apiSlots = (data.slots ?? []).map(
          (s: { id: string; date: string; startTime: string; endTime: string; label: string; technicianId?: string; technicianName?: string }) =>
            ({ ...s, spotsLeft: undefined } as AvailabilitySlot)
        );
        if (apiSlots.length > 0) {
          setSlots(apiSlots);
        } else {
          setSlots([]);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setSlots([]);
        }
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

        {technicians.length > 0 && (
          <div className="mt-6 rounded-xl border border-[#4C9BC8]/30 bg-[#C2E4F0]/20 p-4">
            <p className="text-sm font-medium text-[#102341]/80">Technicians available in your area</p>
            <div className="mt-3 flex flex-wrap gap-3">
              {technicians.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  {t.photoUrl && (
                    <img
                      src={t.photoUrl}
                      alt={formatTechnicianDisplayName(t.name)}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  )}
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-[#102341]">
                      {formatTechnicianDisplayName(t.name)}
                    </span>
                    <span className="text-xs text-[#102341]/80">
                      Hi! I&apos;m {t.name.split(" ")[0]}, and I&apos;m excited to meet you and help you with your sprinkler system!
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

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
                    <span className="block">{slot.label}</span>
                    {slot.technicianName && (
                      <span className="mt-1 block text-xs text-[#102341]/70">
                        {formatTechnicianDisplayName(slot.technicianName)}
                      </span>
                    )}
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
        {!loading && debugInfo && (
          <div className="mt-6 rounded-xl bg-[#F0F0F0] p-4">
            <p className="mb-2 text-sm font-medium text-[#102341]/70">Debug (schedule windows)</p>
            <pre className="max-h-64 overflow-auto text-xs text-[#102341]/80">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
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
