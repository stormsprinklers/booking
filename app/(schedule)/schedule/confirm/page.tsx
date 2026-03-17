"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import { track } from "@/lib/analytics";

function formatDayLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

export default function ScheduleConfirmPage() {
  const router = useRouter();
  const { pricingOption, slot, address, customer } = useBooking();

  useEffect(() => {
    if (!slot) router.push("/schedule/availability");
    else if (!pricingOption) router.push("/schedule");
  }, [slot, pricingOption, router]);

  const handleConfirm = () => {
    track("booking_completed", {
      service: pricingOption?.title,
      slotId: slot?.id,
    });
    router.push("/schedule/success");
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
            <p className="text-xl font-bold text-[#102341]">
              ${pricingOption.price}
              {pricingOption.priceRange && `–$${pricingOption.priceRange.max}`}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Time</p>
            <p className="text-[#102341]">
              {formatDayLabel(slot.date)}, {slot.label}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-[#102341]/60">Address</p>
            <p className="text-[#102341]">{address}</p>
          </div>
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

        <Button
          variant="primary"
          fullWidth
          size="lg"
          className="mt-8"
          onClick={handleConfirm}
        >
          Confirm booking
        </Button>
      </div>
    </div>
  );
}
