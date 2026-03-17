"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { usePricing } from "@/contexts/PricingContext";
import { track } from "@/lib/analytics";

function formatPrice(opt: { price: number; priceRange?: { min: number; max: number } }) {
  if (opt.priceRange) {
    return `$${opt.priceRange.min}–$${opt.priceRange.max}`;
  }
  return `$${opt.price}`;
}

export default function PricingResultsPage() {
  const { inputs, options, selectedOption, setSelectedOption } = usePricing();

  useEffect(() => {
    track("pricing_completed", { optionCount: options.length });
  }, [options.length]);

  const bookingHref = selectedOption
    ? `/schedule?category=${inputs.serviceCategory}&optionId=${selectedOption.id}&price=${selectedOption.price}&title=${encodeURIComponent(selectedOption.title)}&description=${encodeURIComponent(selectedOption.description)}`
    : "#";

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
                    Book this
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="mt-10">
          {selectedOption ? (
            <Link href={bookingHref}>
              <Button variant="primary" fullWidth size="lg" className="w-full">
                Book this service →
              </Button>
            </Link>
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
