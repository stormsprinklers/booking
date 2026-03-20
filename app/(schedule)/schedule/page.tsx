"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { useBooking } from "@/contexts/BookingContext";
import { validateAddress } from "@/lib/service-area/validateAddress";
import { track } from "@/lib/analytics";
import type { ServiceCategoryId } from "@/lib/types";
import type { PricingOption } from "@/lib/types";

const STORAGE_KEY_SELECTED_OPTION = "storm_booking_selected_option";

function buildPricingOptionFromParams(params: URLSearchParams): PricingOption | null {
  const optionId = params.get("optionId");
  const title = params.get("title");
  const price = params.get("price");
  const description = params.get("description") ?? "";
  if (!optionId || !title || !price) return null;
  let stored: PricingOption | null = null;
  try {
    const raw = typeof window !== "undefined" ? sessionStorage.getItem(STORAGE_KEY_SELECTED_OPTION) : null;
    if (raw) stored = JSON.parse(raw) as PricingOption;
  } catch {
    // ignore
  }
  if (stored?.id === optionId) return stored;
  return {
    id: optionId,
    tier: "single",
    title,
    price: parseInt(price, 10),
    description,
    estimatedDuration: "1–2 hours",
    includes: [],
  };
}

export default function ScheduleAddressPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setServiceCategory, setPricingOption, pricingOption, address, setAddress, setServiceAreaId } = useBooking();
  const [inputValue, setInputValue] = useState(address);
  const [validating, setValidating] = useState(false);
  const [result, setResult] = useState<{ valid: boolean; message: string } | null>(null);

  useEffect(() => {
    track("booking_started");
    fetch("/api/sync/housecall", { method: "POST" }).catch(() => {});
    const cat = (searchParams.get("category") ?? "repair") as ServiceCategoryId;
    const opt = buildPricingOptionFromParams(searchParams);
    setServiceCategory(cat);
    if (opt) {
      setPricingOption(opt);
    } else {
      setPricingOption(null);
    }
  }, [searchParams, setServiceCategory, setPricingOption]);

  const handleValidate = async () => {
    const zip = inputValue.trim().replace(/\D/g, "").slice(0, 5);
    if (zip.length !== 5) {
      setResult({ valid: false, message: "Please enter a valid 5-digit zip code." });
      return;
    }
    setValidating(true);
    setResult(null);
    setAddress(zip);
    try {
      const res = await fetch(`/api/address/validate?zip=${encodeURIComponent(zip)}`);
      const data = await res.json();
      setValidating(false);
      if (data.valid && data.serviceArea) {
        setServiceAreaId(data.serviceArea.id);
        setResult({ valid: true, message: `We serve your area: ${data.serviceArea.name}` });
      } else {
        const fallback = validateAddress(zip);
        if (fallback.valid && fallback.serviceArea) {
          setServiceAreaId(fallback.serviceArea.id);
          setResult({ valid: true, message: `We serve your area: ${fallback.serviceArea.name}` });
        } else {
          setServiceAreaId(null);
          setResult({ valid: false, message: "We don't serve this area yet. Please call us for options." });
        }
      }
    } catch {
      const res = validateAddress(zip);
      setValidating(false);
      if (res.valid && res.serviceArea) {
        setServiceAreaId(res.serviceArea.id);
        setResult({ valid: true, message: `We serve your area: ${res.serviceArea.name}` });
      } else {
        setServiceAreaId(null);
        setResult({ valid: false, message: "We don't serve this area yet. Please call us for options." });
      }
    }
  };

  const handleContinue = () => {
    if (result?.valid) {
      track("address_entered", { address: inputValue });
      router.push("/schedule/availability");
    }
  };

  const hasPricingFromUrl = !!searchParams.get("optionId");

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-xl px-4 py-12">
        {hasPricingFromUrl && pricingOption && (
          <div className="mb-6 rounded-xl bg-[#C2E4F0]/30 p-4">
            <p className="text-sm text-[#102341]/70">Booking</p>
            <p className="font-semibold text-[#102341]">{pricingOption.title}</p>
          </div>
        )}
        {!hasPricingFromUrl && (
          <div className="mb-6 rounded-xl border border-[#F0F0F0] bg-[#F0F0F0]/50 p-4">
            <p className="text-[#102341]">
              No service selected.{" "}
              <a href="/pricing" className="font-medium text-[#4C9BC8] underline">
                Get pricing first
              </a>
            </p>
          </div>
        )}
        <h1 className="text-2xl font-bold text-[#102341]">Are we in your area?</h1>
        <p className="mt-2 text-[#102341]/70">
          Enter your zip code to check if we serve your location.
        </p>

        <div className="mt-8">
          <Input
            label="Enter your Zip Code"
            placeholder="12345"
            inputMode="numeric"
            maxLength={5}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.replace(/\D/g, "").slice(0, 5));
              setResult(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && handleValidate()}
          />
          <Button
            variant="secondary"
            fullWidth
            className="mt-4"
            onClick={handleValidate}
            disabled={validating}
          >
            {validating ? "Checking..." : "Check service area"}
          </Button>

          {result && (
            <Card className={`mt-4 ${result.valid ? "border-[#4C9BC8] bg-[#C2E4F0]/20" : "border-red-200 bg-red-50"}`}>
              <p className={result.valid ? "text-[#102341]" : "text-red-700"}>
                {result.message}
              </p>
              {result.valid && (
                <Button variant="primary" fullWidth className="mt-4" onClick={handleContinue}>
                  See available times →
                </Button>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
