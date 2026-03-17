"use client";

import Link from "next/link";
import { Button, Card } from "@/components/ui";
import { serviceCategories } from "@/lib/mock/serviceCategories";
import { track } from "@/lib/analytics";
import { useEffect } from "react";

export default function PricingLandingPage() {
  useEffect(() => {
    track("landing_view", { page: "pricing" });
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:py-16">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-[#102341] sm:text-4xl">
            Get Instant Sprinkler Pricing
          </h1>
          <p className="mt-3 text-lg text-[#102341]/80">
            Book online in minutes. Transparent, easy, trustworthy.
          </p>
        </header>

        <div className="mt-12 grid gap-4 sm:mt-16 sm:gap-6">
          {serviceCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/pricing/wizard?category=${cat.id}`}
              onClick={() => track("category_selected", { category: cat.id })}
            >
              <Card hover className="h-full">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-[#102341]">
                      {cat.title}
                    </h2>
                    <p className="mt-1 text-[#102341]/70">{cat.description}</p>
                  </div>
                  <span className="mt-3 inline-flex text-[#4C9BC8] sm:mt-0">
                    Get pricing →
                  </span>
                </div>
              </Card>
            </Link>
          ))}
        </div>

        <p className="mt-12 text-center text-sm text-[#102341]/60">
          No contact info required to see pricing. Choose your service to get
          started.
        </p>
      </div>
    </div>
  );
}
