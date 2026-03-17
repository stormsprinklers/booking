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
  const [addressLine1, setAddressLine1] = useState(customer.addressLine1 ?? "");
  const [addressLine2, setAddressLine2] = useState(customer.addressLine2 ?? "");
  const [city, setCity] = useState(customer.city ?? "");
  const [zip, setZip] = useState(customer.zip ?? address ?? "");
  const [notes, setNotes] = useState(customer.notes ?? "");
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!slot) router.push("/schedule/availability");
  }, [slot, router]);

  useEffect(() => {
    if (address && !zip) setZip(address);
  }, [address]);

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
    if (!addressLine1.trim()) e.addressLine1 = "Street address is required";
    if (!city.trim()) e.city = "City is required";
    if (!zip.trim()) e.zip = "Zip code is required";
    else if (!/^\d{5}$/.test(zip.replace(/\D/g, "").slice(0, 5))) e.zip = "Valid 5-digit zip required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
    updateCustomer({
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      addressLine1: addressLine1.trim(),
      addressLine2: addressLine2.trim() || undefined,
      city: city.trim(),
      state: "UT",
      zip: zip.replace(/\D/g, "").slice(0, 5),
      notes: notes.trim(),
    });
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
          <div className="space-y-4">
            <p className="text-sm font-medium text-[#102341]">Service address</p>
            <Input
              label="Street address line 1"
              placeholder="123 Main St"
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
              error={errors.addressLine1}
              required
            />
            <Input
              label="Street address line 2 (optional)"
              placeholder="Apt 4, Suite 100"
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
            <div className="grid grid-cols-3 gap-4">
              <Input
                label="City"
                placeholder="Salt Lake City"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                error={errors.city}
                required
              />
              <Input
                label="State"
                value="UT"
                readOnly
                className="bg-[#F0F0F0]/50"
              />
              <Input
                label="Zip code"
                placeholder="84101"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                error={errors.zip}
                required
              />
            </div>
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
