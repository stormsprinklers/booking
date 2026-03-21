"use client";

import Link from "next/link";
import { useBooking } from "@/contexts/BookingContext";
import { Button, Card } from "@/components/ui";
import { QuoteBreakdown } from "@/components/QuoteBreakdown";
import { getTechnicianPhotoUrl } from "@/lib/config/technicianPhotos";
import { formatTechnicianDisplayName } from "@/lib/format/technicianName";
import { useIsBookingSite } from "@/lib/site/useSite";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function ScheduleSuccessPage() {
  const isBookingSite = useIsBookingSite();
  const { pricingOption, slot, address, customer } = useBooking();

  if (!slot || !pricingOption) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-[#102341]">Booking completed. Thank you!</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#4C9BC8] text-3xl text-white">
            ✓
          </div>
          <h1 className="mt-6 text-3xl font-bold text-[#102341]">
            You&apos;re booked
          </h1>
          <p className="mt-2 text-[#102341]/70">
            We&apos;ve got you on the schedule.
          </p>
        </div>

        <Card className="mt-10 space-y-4">
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Service</p>
            <p className="font-semibold text-[#102341]">{pricingOption.title}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">When</p>
            <p className="text-[#102341]">
              {formatDayLabel(slot.date)}, {slot.label}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Where</p>
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
          {slot.technicianId && (
            <div className="flex items-center gap-3 pt-2">
              {getTechnicianPhotoUrl(slot.technicianId) && (
                <img
                  src={getTechnicianPhotoUrl(slot.technicianId)!}
                  alt={slot.technicianName ?? "Technician"}
                  className="h-12 w-12 rounded-full object-cover"
                />
              )}
              <div>
                <p className="text-sm font-medium text-[#102341]/60">Your technician</p>
                <p className="text-[#102341]">
                  {formatTechnicianDisplayName(slot.technicianName)}
                </p>
              </div>
            </div>
          )}
        </Card>

        <div className="mt-10 rounded-xl bg-[#C2E4F0]/30 p-6">
          <h2 className="font-semibold text-[#102341]">What happens next?</h2>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-[#102341]/80">
            <li>We&apos;ll send a confirmation to {customer.email}</li>
            <li>You may receive a reminder the day before</li>
            <li>Our technician will arrive during your time window</li>
            <li>Payment is due at time of service</li>
          </ul>
        </div>

        <div className="mt-10 flex flex-col gap-4">
          <Link href={isBookingSite ? "/booking" : "/pricing"}>
            <Button variant="outline" fullWidth>
              Book another service
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
