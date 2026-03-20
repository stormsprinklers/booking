"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Card } from "@/components/ui";
import { usePricing } from "@/contexts/PricingContext";
import { track } from "@/lib/analytics";

const STORAGE_KEY_CONTACT = "storm_booking_contact";
const STORAGE_KEY_PRICING_INPUTS = "storm_booking_pricing_inputs";

function formatPrice(opt: { price: number; priceRange?: { min: number; max: number } }) {
  if (opt.priceRange) {
    return `$${opt.priceRange.min}–$${opt.priceRange.max}`;
  }
  return `$${opt.price}`;
}

export default function PricingResultsPage() {
  const router = useRouter();
  const { inputs, options, selectedOption, setSelectedOption } = usePricing();

  useEffect(() => {
    track("pricing_completed", { optionCount: options.length });
  }, [options.length]);

  const priceForBooking = selectedOption?.priceRange
    ? Math.round((selectedOption.priceRange.min + selectedOption.priceRange.max) / 2)
    : selectedOption?.price;
  const bookingHref = selectedOption
    ? `/schedule?category=${inputs.serviceCategory}&optionId=${selectedOption.id}&price=${priceForBooking ?? selectedOption.price}&title=${encodeURIComponent(selectedOption.title)}&description=${encodeURIComponent(selectedOption.description ?? "")}`
    : "#";

  const storeForBooking = () => {
    try {
      sessionStorage.setItem(
        STORAGE_KEY_CONTACT,
        JSON.stringify({
          name: inputs.contactName?.trim() ?? "",
          email: inputs.contactEmail?.trim() ?? "",
          phone: inputs.contactPhone?.trim() ?? "",
          consentToContact: inputs.consentToContact ?? false,
        })
      );
      sessionStorage.setItem(STORAGE_KEY_PRICING_INPUTS, JSON.stringify(inputs));
    } catch {
      // ignore
    }
  };

  const handleBookOnSite = () => {
    if (!selectedOption) return;
    storeForBooking();
    router.push(bookingHref);
  };

  const handleBookVideoQuote = () => {
    if (!selectedOption) return;
    storeForBooking();
    router.push(
      `/schedule/video-quote?category=${inputs.serviceCategory}&optionId=${selectedOption.id}&price=${priceForBooking ?? selectedOption.price}&title=${encodeURIComponent(selectedOption.title)}&description=${encodeURIComponent(selectedOption.description ?? "")}`
    );
  };

  if (options.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-[#102341]">No pricing options yet.</p>
          <Link href="/pricing" className="mt-4 inline-block text-[#4C9BC8] underline">
            Start over
          </Link>
        </div>
      </div>
    );
  }

  const handleBook = (opt: (typeof options)[0]) => {
    setSelectedOption(opt);
    track("option_selected", { optionId: opt.id });
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="text-2xl font-bold text-[#102341] sm:text-3xl">
          Your pricing options
        </h1>
        <p className="mt-2 text-[#102341]/70">
          Choose the option that fits your needs, then book online in minutes.
        </p>

        <div className="mt-10 space-y-4">
          {options.map((opt) => (
            <Card
              key={opt.id}
              hover
              selected={selectedOption?.id === opt.id}
              className="cursor-pointer"
              onClick={() => handleBook(opt)}
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-semibold text-[#102341]">
                      {opt.title}
                    </h2>
                    {opt.tier && opt.tier !== "single" && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          opt.tier === "best"
                            ? "bg-[#4C9BC8] text-white"
                            : "bg-[#F0F0F0] text-[#102341]"
                        }`}
                      >
                        {opt.tier}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[#102341]/80">{opt.description}</p>
                  <ul className="mt-2 space-y-1 text-sm text-[#102341]/70">
                    {opt.includes.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                  <p className="mt-2 text-sm text-[#102341]/60">
                    Est. {opt.estimatedDuration}
                  </p>
                  {opt.customerMessage && (
                    <p className="mt-2 text-sm text-[#4C9BC8] font-medium">
                      {opt.customerMessage}
                    </p>
                  )}
                </div>
                <div className="mt-4 flex items-center gap-4 sm:mt-0 sm:flex-col sm:items-end">
                  <span className="text-2xl font-bold text-[#102341]">
                    {formatPrice(opt)}
                  </span>
                  <Button
                    size="md"
                    variant="primary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleBook(opt);
                    }}
                  >
                    {inputs.serviceCategory === "installation" ? "Book an Appointment" : "Book this"}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-lg bg-[#F8FAFC] p-4 text-sm text-[#102341]/80 space-y-1">
            <p>We always give a full quote before work begins—no surprise charges.</p>
            <p>5-year warranty when we winterize your system. Same-day or next-day service often available.</p>
          </div>
        </div>

        <div className="mt-10 space-y-4">
          {selectedOption ? (
            inputs.serviceCategory === "installation" ? (
              <>
                <p className="font-medium text-[#102341]">
                  How would you like to get your quote?
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button
                    variant="secondary"
                    fullWidth
                    size="lg"
                    onClick={handleBookVideoQuote}
                    className="h-auto flex-col items-start gap-2 py-4 text-left"
                  >
                    <span className="font-semibold">Video call quote</span>
                    <span className="text-sm font-normal text-[#102341]/70">
                      Get a quote for your project from the convenience of a zoom call. Not for new construction homes.
                    </span>
                  </Button>
                  <Button
                    variant="primary"
                    fullWidth
                    size="lg"
                    onClick={handleBookOnSite}
                    className="h-auto flex-col items-start gap-2 py-4 text-left"
                  >
                    <span className="font-semibold">On-site quote</span>
                    <span className="text-sm font-normal text-white/90">
                      Book an in-person visit to get a detailed quote at your property.
                    </span>
                  </Button>
                </div>
              </>
            ) : (
              <Button
                variant="primary"
                fullWidth
                size="lg"
                className="w-full"
                onClick={handleBookOnSite}
              >
                Book this service →
              </Button>
            )
          ) : (
            <Button variant="primary" fullWidth size="lg" disabled className="w-full">
              Select an option above
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

