"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card, Input, StepFade } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import { validateAddress } from "@/lib/service-area/validateAddress";
import { DIRECT_BOOKING_OPTIONS } from "@/lib/config/directBookingOptions";
import { track } from "@/lib/analytics";
import type { ServiceCategoryId } from "@/lib/types";

export default function BookingPage() {
  const router = useRouter();
  const { setServiceCategory, setPricingOption, setAddress, setServiceAreaId } = useBooking();
  const [step, setStep] = useState<"zip" | "service">("zip");
  const [zipInput, setZipInput] = useState("");
  const [validating, setValidating] = useState(false);
  const [zipResult, setZipResult] = useState<{ valid: boolean; message: string } | null>(null);

  const handleValidateZip = async () => {
    const zip = zipInput.trim().replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) {
      setZipResult({ valid: false, message: "Please enter a valid 5-digit zip code." });
      return;
    }
    setValidating(true);
    setZipResult(null);
    setAddress(zip);
    try {
      const res = await fetch(`/api/address/validate?zip=${encodeURIComponent(zip)}`);
      const data = await res.json();
      setValidating(false);
      if (data.valid && data.serviceArea) {
        setServiceAreaId(data.serviceArea.id);
        setZipResult({ valid: true, message: `We serve your area: ${data.serviceArea.name}` });
      } else {
        const fallback = validateAddress(zip);
        if (fallback.valid && fallback.serviceArea) {
          setServiceAreaId(fallback.serviceArea.id);
          setZipResult({ valid: true, message: `We serve your area: ${fallback.serviceArea.name}` });
        } else {
          setServiceAreaId(null);
          setZipResult({ valid: false, message: "We don't serve this area yet. Please call us for options." });
        }
      }
    } catch {
      const res = validateAddress(zip);
      setValidating(false);
      if (res.valid && res.serviceArea) {
        setServiceAreaId(res.serviceArea.id);
        setZipResult({ valid: true, message: `We serve your area: ${res.serviceArea.name}` });
      } else {
        setServiceAreaId(null);
        setZipResult({ valid: false, message: "We don't serve this area yet. Please call us for options." });
      }
    }
  };

  const handleZipContinue = () => {
    if (zipResult?.valid) {
      track("booking_started", { source: "direct" });
      fetch("/api/sync/housecall", { method: "POST" }).catch(() => {});
      setStep("service");
    }
  };

  const handleSelectService = (categoryId: ServiceCategoryId) => {
    setServiceCategory(categoryId);
    setPricingOption(DIRECT_BOOKING_OPTIONS[categoryId]);
    track("category_selected", { category: categoryId, source: "direct-booking" });
    router.push("/schedule/availability");
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        {step === "zip" ? (
          <StepFade key="zip">
            <h1 className="text-2xl font-bold text-[#102341]">Book a service</h1>
            <p className="mt-2 text-[#102341]/70">
              Enter your zip code to see if we serve your area, then pick a service and choose a time.
            </p>

            <div className="mt-8">
              <Input
                label="What is your zip code?"
                placeholder="12345"
                inputMode="numeric"
                maxLength={5}
                value={zipInput}
                onChange={(e) => {
                  setZipInput(e.target.value.replace(/\D/g, "").slice(0, 5));
                  setZipResult(null);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleValidateZip()}
              />
              <Button
                variant="secondary"
                fullWidth
                className="mt-4"
                onClick={handleValidateZip}
                disabled={validating}
              >
                {validating ? "Checking..." : "Check service area"}
              </Button>

              {zipResult && (
                <Card
                  className={`mt-4 ${zipResult.valid ? "border-[#4C9BC8] bg-[#C2E4F0]/20" : "border-red-200 bg-red-50"}`}
                >
                  <p className={zipResult.valid ? "text-[#102341]" : "text-red-700"}>{zipResult.message}</p>
                  {zipResult.valid && (
                    <Button variant="primary" fullWidth className="mt-4" onClick={handleZipContinue}>
                      Choose your service →
                    </Button>
                  )}
                </Card>
              )}
            </div>
          </StepFade>
        ) : (
          <StepFade key="service">
            <h1 className="text-2xl font-bold text-[#102341]">What service do you need?</h1>
            <p className="mt-2 text-[#102341]/70">
              Select a service, then we&apos;ll show you available times.
            </p>

            <div className="mt-8 space-y-4">
              {(
                [
                  { id: "repair" as const, title: "Repair", description: "Fix leaks, broken heads, pressure issues, or system not turning on" },
                  { id: "seasonal" as const, title: "Maintenance", description: "Spring start-up, winterization, or regular maintenance" },
                  { id: "installation" as const, title: "Install quote", description: "New sprinkler system—free on-site or video quote" },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleSelectService(cat.id)}
                  className="block w-full text-left"
                >
                  <Card hover className="h-full">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-xl font-semibold text-[#102341]">{cat.title}</h2>
                        <p className="mt-1 text-[#102341]/70">{cat.description}</p>
                      </div>
                      <span className="mt-3 inline-flex text-[#4C9BC8] sm:mt-0">Book →</span>
                    </div>
                  </Card>
                </button>
              ))}
            </div>

            <p className="mt-6 text-center text-sm text-[#102341]/60">
              <button type="button" onClick={() => setStep("zip")} className="text-[#4C9BC8] hover:underline">
                Change zip code
              </button>
            </p>
          </StepFade>
        )}

        <p className="mt-10 text-center text-sm text-[#102341]/70">
          Want instant pricing first?{" "}
          <Link href="/pricing" className="font-medium text-[#4C9BC8] hover:underline">
            Get a quote
          </Link>
        </p>
      </div>
    </div>
  );
}
