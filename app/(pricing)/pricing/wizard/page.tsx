"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Card, Stepper } from "@/components/ui";
import { usePricing } from "@/contexts/PricingContext";
import { serviceCategories } from "@/lib/mock/serviceCategories";
import { addOns } from "@/lib/mock/addOns";
import { getPricingOptions } from "@/lib/pricing/pricingEngine";
import type { ServiceCategoryId } from "@/lib/types";

const PROPERTY_SIZES = [
  { id: "small", label: "Small (under 5,000 sq ft)" },
  { id: "medium", label: "Medium (5,000–15,000 sq ft)" },
  { id: "large", label: "Large (over 15,000 sq ft)" },
] as const;

const REPAIR_ISSUES = [
  { id: "not-turning-on", label: "Sprinklers not turning on" },
  { id: "not-turning-off", label: "Sprinklers not turning off" },
  { id: "low-pressure", label: "Low pressure" },
  { id: "controller-issue", label: "Controller / timer issue" },
  { id: "leak", label: "Leak or wet spots" },
  { id: "broken-backflow", label: "Broken backflow preventer" },
  { id: "broken-filter", label: "Broken filter" },
  { id: "adding-upgrade", label: "Adding an upgrade" },
  { id: "main-shutoff", label: "Main shutoff valve (stop and waste)" },
  { id: "valve-repair", label: "Sprinkler valve repair" },
  { id: "broken-heads", label: "Broken or misaligned heads" },
  { id: "general", label: "Not sure / other" },
];

const ISSUE_START_OPTIONS: {
  id: "today" | "within-week" | "weeks-ago" | "ongoing" | "dont-know";
  label: string;
}[] = [
  { id: "today", label: "Today" },
  { id: "within-week", label: "Within the week" },
  { id: "weeks-ago", label: "Multiple weeks ago" },
  { id: "ongoing", label: "Ongoing / long-term issue" },
  { id: "dont-know", label: "Don't know" },
];

const UPGRADE_SCOPES = [
  { id: "zones", label: "Add zones to existing system" },
  { id: "smart", label: "Smart controller upgrade" },
  { id: "full", label: "New system install" },
];

const REPAIR_ADDONS = [
  { id: "tuneup", title: "Full System Tune-Up", price: 79 },
  { id: "smart-controller", title: "Smart Sprinkler Controller", price: 199 },
  { id: "annual-plan", title: "Annual Maintenance Plan", price: 149 },
];

export default function PricingWizardPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const categoryParam = (searchParams.get("category") ?? "repair") as ServiceCategoryId;
  const category = serviceCategories.find((c) => c.id === categoryParam) ?? serviceCategories[0];

  const { inputs, setInputs, computePricing } = usePricing();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setInputs({ serviceCategory: categoryParam });
  }, [categoryParam, setInputs]);

  const totalSteps = categoryParam === "repair" ? 3 : categoryParam === "upgrade" ? 3 : 2;
  const stepLabels =
    categoryParam === "repair"
      ? ["Issue", "Property", "When"]
      : categoryParam === "upgrade"
        ? ["Scope", "Property", "Add-ons"]
        : ["Service", "Add-ons"];

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setLoading(true);
      computePricing();
      router.push("/pricing/results");
    }
  };

  const handleBack = () => setStep(Math.max(1, step - 1));

  const canProceed = () => {
    if (categoryParam === "repair") {
      if (step === 1) return (inputs.issueTypes ?? []).length > 0;
      if (step === 2) return !!inputs.propertySize;
      if (step === 3) return true;
    }
    if (categoryParam === "upgrade") {
      if (step === 1) return !!inputs.scope;
      if (step === 2) return !!inputs.propertySize;
      if (step === 3) return true;
    }
    if (categoryParam === "seasonal") {
      if (step === 1) return true;
      if (step === 2) return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Stepper currentStep={step} totalSteps={totalSteps} labels={stepLabels} />

        <div className="mt-10">
          <h1 className="text-2xl font-bold text-[#102341]">{category.title}</h1>
          <p className="mt-1 text-[#102341]/70">{category.description}</p>
        </div>

        <div className="mt-8 space-y-6">
          {categoryParam === "repair" && (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 font-medium text-[#102341]">
                      What issues are you experiencing? (select all that apply)
                    </p>
                    <div className="space-y-2">
                      {REPAIR_ISSUES.map((opt) => {
                        const selected = (inputs.issueTypes ?? []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const current = inputs.issueTypes ?? [];
                              const next = selected
                                ? current.filter((x) => x !== opt.id)
                                : [...current, opt.id];
                              setInputs({ issueTypes: next });
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                              selected
                                ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                                : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                            }`}
                          >
                            {opt.label}
                            {selected && <span className="text-[#4C9BC8]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="mb-3 font-medium text-[#102341]">
                      Add to your repair
                    </p>
                    <div className="space-y-2">
                      {REPAIR_ADDONS.map((opt) => {
                        const selected = (inputs.addOnIds ?? []).includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const ids = inputs.addOnIds ?? [];
                              const next = selected
                                ? ids.filter((x) => x !== opt.id)
                                : [...ids, opt.id];
                              setInputs({ addOnIds: next });
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                              selected
                                ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                                : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                            }`}
                          >
                            <span>
                              {opt.title}{" "}
                              <span className="text-[#102341]/60">+${opt.price}</span>
                            </span>
                            {selected && <span className="text-[#4C9BC8]">✓</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Property size
                  </p>
                  <div className="space-y-2">
                    {PROPERTY_SIZES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInputs({ propertySize: opt.id })}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.propertySize === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    When did the issue start?
                  </p>
                  <div className="space-y-2">
                    {ISSUE_START_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInputs({ issueStartTime: opt.id })}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.issueStartTime === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {categoryParam === "upgrade" && (
            <>
              {step === 1 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    What do you need?
                  </p>
                  <div className="space-y-2">
                    {UPGRADE_SCOPES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInputs({ scope: opt.id })}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.scope === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Property size
                  </p>
                  <div className="space-y-2">
                    {PROPERTY_SIZES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInputs({ propertySize: opt.id })}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.propertySize === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Optional add-ons
                  </p>
                  <div className="space-y-2">
                    {addOns
                      .filter((a) => a.id !== "membership")
                      .map((opt) => {
                        const selected =
                          (inputs.addOnIds ?? []).indexOf(opt.id) >= 0;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const ids = inputs.addOnIds ?? [];
                              const next = selected
                                ? ids.filter((x) => x !== opt.id)
                                : [...ids, opt.id];
                              setInputs({ addOnIds: next });
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                              selected
                                ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                                : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                            }`}
                          >
                            <span>
                              {opt.title}{" "}
                              {opt.price > 0 && (
                                <span className="text-[#102341]/60">
                                  +${opt.price}
                                </span>
                              )}
                            </span>
                            {selected && <span className="text-[#4C9BC8]">✓</span>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}

          {categoryParam === "seasonal" && (
            <>
              {step === 1 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    We offer spring start-up, winterization, or both. Select any
                    that apply.
                  </p>
                  <p className="text-sm text-[#102341]/60">
                    (Pricing will show options on the next step.)
                  </p>
                </div>
              )}
              {step === 2 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Optional add-ons
                  </p>
                  <div className="space-y-2">
                    {addOns
                      .filter((a) => a.id !== "membership")
                      .map((opt) => {
                        const selected =
                          (inputs.addOnIds ?? []).indexOf(opt.id) >= 0;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => {
                              const ids = inputs.addOnIds ?? [];
                              const next = selected
                                ? ids.filter((x) => x !== opt.id)
                                : [...ids, opt.id];
                              setInputs({ addOnIds: next });
                            }}
                            className={`flex w-full items-center justify-between rounded-xl border-2 p-4 text-left transition ${
                              selected
                                ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                                : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                            }`}
                          >
                            <span>
                              {opt.title}{" "}
                              {opt.price > 0 && (
                                <span className="text-[#102341]/60">
                                  +${opt.price}
                                </span>
                              )}
                            </span>
                            {selected && <span className="text-[#4C9BC8]">✓</span>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="mt-10 flex gap-4">
          {step > 1 && (
            <Button
              variant="outline"
              onClick={handleBack}
              className="flex-1 sm:flex-initial"
            >
              Back
            </Button>
          )}
          <Button
            variant="primary"
            fullWidth
            onClick={handleNext}
            disabled={!canProceed() || loading}
            className="flex-1"
          >
            {step < totalSteps ? "Continue" : "See pricing"}
          </Button>
        </div>
      </div>
    </div>
  );
}
