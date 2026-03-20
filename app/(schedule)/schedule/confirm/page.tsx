"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { QuoteBreakdown } from "@/components/QuoteBreakdown";
import { useBooking } from "@/contexts/BookingContext";
import { track } from "@/lib/analytics";
import { formatTechnicianDisplayName } from "@/lib/format/technicianName";
import { formatPricingNotesForJob } from "@/lib/format/pricingNotesForJob";
import { INSTALL_QUOTE_EMPLOYEE_ID } from "@/lib/config/installQuoteTech";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

function toISO(slot: { date: string; startTime: string; endTime: string }): { start: string; end: string } {
  const start = `${slot.date}T${slot.startTime}:00`;
  const end = `${slot.date}T${slot.endTime}:00`;
  return { start, end };
}

export default function ScheduleConfirmPage() {
  const router = useRouter();
  const { pricingOption, slot, address, customer, serviceCategory } = useBooking();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slot) router.push("/schedule/availability");
    else if (!pricingOption) router.push("/schedule");
  }, [slot, pricingOption, router]);

  const buildJobNotes = () => {
    const categoryLabel = { repair: "Repair", installation: "Installation", seasonal: "Seasonal" }[serviceCategory] ?? serviceCategory;
    const parts: string[] = [
      `Service category: ${categoryLabel}`,
      `Service: ${pricingOption?.title ?? "Online booking"}`,
      pricingOption?.description ? `Problem/Scope: ${pricingOption.description}` : "",
      pricingOption?.price != null ? `Quoted price online: $${pricingOption.price}${pricingOption?.priceRange ? `–$${pricingOption.priceRange.max}` : ""}` : "",
    ].filter(Boolean);

    // Add diagnostic info from pricing wizard
    try {
      const raw = typeof window !== "undefined" ? sessionStorage.getItem("storm_booking_pricing_inputs") : null;
      if (raw) {
        const pricingInputs = JSON.parse(raw) as Record<string, unknown>;
        const diagnosticNotes = formatPricingNotesForJob(pricingInputs);
        if (diagnosticNotes.trim()) {
          parts.push("Customer selections from online quote:\n" + diagnosticNotes);
        }
      }
    } catch {
      // ignore
    }

    if (customer.notes?.trim()) parts.push(`Customer notes: ${customer.notes.trim()}`);
    return parts.join("\n\n");
  };

  const handleConfirm = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    if (!slot || !pricingOption) return;
    setSubmitting(true);
    setError(null);
    try {
      const { start, end } = toISO(slot);
      const effectiveEmployeeId =
        slot.technicianId ?? (serviceCategory === "installation" ? INSTALL_QUOTE_EMPLOYEE_ID : undefined);
      if (serviceCategory !== "installation" && !effectiveEmployeeId) {
        setError("No technician is available for this time. Please choose another slot.");
        setSubmitting(false);
        return;
      }
      const res = await fetch("/api/housecall/create-job", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: `${pricingOption.title}: ${pricingOption.description}`,
          scheduledStart: start,
          scheduledEnd: end,
          customer: { name: customer.name, email: customer.email, phone: customer.phone },
          addressLine1: customer.addressLine1,
          addressLine2: customer.addressLine2,
          city: customer.city,
          state: customer.state ?? "UT",
          zip: customer.zip ?? address,
          employeeId: effectiveEmployeeId,
          jobNotes: buildJobNotes(),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create job");
      try {
        sessionStorage.removeItem("storm_booking_pricing_inputs");
      } catch {
        // ignore
      }
      track("booking_completed", { service: pricingOption.title, slotId: slot.id, jobId: data.jobId });
      router.push("/schedule/success");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  if (!slot || !pricingOption) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-bold text-[#102341]">Confirm your booking</h1>
        <p className="mt-2 text-[#102341]/70">
          Review everything below, then confirm.
        </p>

        <Card className="mt-8 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Service</p>
            <p className="font-semibold text-[#102341]">{pricingOption.title}</p>
            <p className="text-sm text-[#102341]/80">{pricingOption.description}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Price estimate</p>
            {pricingOption.lineItems && pricingOption.lineItems.length > 0 ? (
              <QuoteBreakdown
                lineItems={pricingOption.lineItems}
                totalMin={pricingOption.priceRange?.min ?? pricingOption.price}
                totalMax={pricingOption.priceRange?.max ?? pricingOption.price}
                className="mt-2"
              />
            ) : (
              <p className="text-xl font-bold text-[#102341]">
                ${pricingOption.price}
                {pricingOption.priceRange && `–$${pricingOption.priceRange.max}`}
              </p>
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Time</p>
            <p className="text-[#102341]">
              {formatDayLabel(slot.date)}, {slot.label}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Address</p>
            <p className="whitespace-pre-line text-[#102341]">
              {[
                customer.addressLine1,
                customer.addressLine2,
                [customer.city, customer.state, customer.zip ?? address].filter(Boolean).join(", "),
              ]
                .filter(Boolean)
                .join("\n") || address || "—"}
            </p>
          </div>
          {slot.technicianName && (
            <div>
              <p className="text-sm font-medium text-[#102341]/60">Technician</p>
              <p className="text-[#102341]">
                {formatTechnicianDisplayName(slot.technicianName)}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Contact</p>
            <p className="text-[#102341]">
              {customer.name}, {customer.phone}, {customer.email}
            </p>
          </div>
          {customer.notes && (
            <div>
              <p className="text-sm font-medium text-[#102341]/60">Notes</p>
              <p className="text-[#102341]">{customer.notes}</p>
            </div>
          )}
        </Card>

        {error && (
          <p className="mt-4 text-sm text-red-600">{error}</p>
        )}
        <Button
          type="button"
          variant="primary"
          fullWidth
          size="lg"
          className="mt-8"
          onClick={handleConfirm}
          disabled={submitting}
        >
          {submitting ? "Creating job…" : "Confirm booking"}
        </Button>
      </div>
    </div>
  );
}
