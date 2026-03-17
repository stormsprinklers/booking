"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Input } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import { track } from "@/lib/analytics";
import { captureAbandonmentContact } from "@/lib/abandonment";

export default function ScheduleDetailsPage() {
  const router = useRouter();
  const { slot, address, updateCustomer, customer } = useBooking();
  const [name, setName] = useState(customer.name ?? "");
  const [email, setEmail] = useState(customer.email ?? "");
  const [phone, setPhone] = useState(customer.phone ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slot) router.push("/schedule/availability");
  }, [slot, router]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (name || email || phone) {
        captureAbandonmentContact({
          email: email || undefined,
          phone: phone || undefined,
          step: "details",
        });
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [name, email, phone]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    if (!phone.trim()) e.phone = "Phone is required";
    else if (!/^\d{10}$/.test(phone.replace(/\D/g, ""))) e.phone = "Valid 10-digit phone required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateCustomer({ name: name.trim(), email: email.trim(), phone: phone.trim(), notes: notes.trim() });
    track("details_entered");
    router.push("/schedule/confirm");
  };

  if (!slot) return null;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        <h1 className="text-2xl font-bold text-[#102341]">Your details</h1>
        <p className="mt-2 text-[#102341]/70">
          We need just a few details to confirm your booking.
        </p>

        <div className="mt-8 space-y-4">
          <Input
            label="Full name"
            placeholder="Jane Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            required
          />
          <Input
            label="Email"
            type="email"
            placeholder="jane@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            required
          />
          <Input
            label="Phone"
            type="tel"
            placeholder="(555) 123-4567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            error={errors.phone}
            required
          />
          <div>
            <p className="mb-1.5 text-sm font-medium text-[#102341]">Service address</p>
            <p className="rounded-xl border-2 border-[#F0F0F0] bg-[#F0F0F0]/50 px-4 py-3 text-[#102341]/80">
              {address || "—"}
            </p>
          </div>
          <Input
            label="Notes (optional)"
            placeholder="Gate code, pet info, specific location of issue..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <Button variant="primary" fullWidth size="lg" className="mt-8" onClick={handleSubmit}>
          Review booking →
        </Button>
      </div>
    </div>
  );
}
