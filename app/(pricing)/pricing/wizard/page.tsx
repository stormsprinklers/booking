"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button, Input, Stepper } from "@/components/ui";
import { usePricing } from "@/contexts/PricingContext";
import { serviceCategories } from "@/lib/mock/serviceCategories";
import { addOns } from "@/lib/mock/addOns";
import { REPAIR_ISSUES } from "@/lib/mock/repairIssues";
import type { ServiceCategoryId } from "@/lib/types";

const PROPERTY_SIZES = [
  { id: "small", label: "Small - 2,000 sq ft" },
  { id: "medium", label: "Medium - 5,000 sq ft" },
  { id: "large", label: "Large - 8,000 sq ft" },
] as const;

const SEASONAL_SERVICES = [
  { id: "tuneup" as const, label: "Spring Start-Up / Tune-Up" },
  { id: "winterization" as const, label: "Winterization" },
  { id: "both" as const, label: "Both - Maintenance Plan" },
];

const ZONE_OPTIONS = [
  { id: 4, label: "4 zones or fewer" },
  { id: 6, label: "5–6 zones" },
  { id: 8, label: "7–8 zones" },
  { id: 10, label: "9–10 zones" },
  { id: 12, label: "11+ zones" },
];

function getMonthBasedAddOns() {
  const month = new Date().getMonth() + 1; // 1–12
  const tuneupMonths = [1, 2, 3, 4, 5, 6, 7, 8]; // Jan–Aug
  const winterMonths = [9, 10, 11]; // Sep–Nov
  return addOns.filter((a) => {
    if (a.id === "tuneup") return tuneupMonths.includes(month);
    if (a.id === "winterization") return winterMonths.includes(month);
    if (a.id === "smart-controller") return true;
    if (a.id === "maintenance-plan") return true;
    return false;
  });
}

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

  const repairSteps = 4;
  const seasonalSteps = 4;
  const installSteps = 5;

  const totalSteps =
    categoryParam === "repair"
      ? repairSteps
      : categoryParam === "seasonal"
        ? seasonalSteps
        : categoryParam === "installation"
          ? installSteps
          : 2;

  const repairStepLabels = ["Issue", "Details", "Add-ons", "Contact"];
  const seasonalStepLabels = ["Service", "Zones", "Add-ons", "Contact"];
  const installStepLabels = ["Turf area", "Existing sprinklers", "Water type", "Extras", "Contact"];

  const stepLabels =
    categoryParam === "repair"
      ? repairStepLabels
      : categoryParam === "seasonal"
        ? seasonalStepLabels
        : categoryParam === "installation"
          ? installStepLabels
          : ["Step 1", "Step 2"];

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

  const issuesNeedingFollowUp = (inputs.issueTypes ?? []).filter((id) => {
    const issue = REPAIR_ISSUES.find((i) => i.id === id);
    return issue?.hasFollowUp;
  });

  const hasUnansweredFollowUps =
    categoryParam === "repair" &&
    step === 2 &&
    issuesNeedingFollowUp.some((id) => !(inputs.repairFollowUps ?? {})[id]);

  const canProceed = () => {
    if (categoryParam === "repair") {
      if (step === 1) return (inputs.issueTypes ?? []).length > 0;
      if (step === 2) {
        const needsHeadCount = (inputs.issueTypes ?? []).includes("moving-adding-heads");
        if (needsHeadCount && (!inputs.headCount || inputs.headCount < 1)) return false;
        return true;
      }
      if (step === 3) return true;
      if (step === 4)
        return !!(
          inputs.contactName?.trim() &&
          inputs.contactEmail?.trim() &&
          inputs.contactPhone?.trim()
        );
    }
    if (categoryParam === "seasonal") {
      if (step === 1) return !!inputs.seasonalServiceType;
      if (step === 2) return inputs.zoneCount !== undefined || inputs.zoneCountUnknown === true;
      if (step === 3) return true;
      if (step === 4)
        return !!(
          inputs.contactName?.trim() &&
          inputs.contactEmail?.trim() &&
          inputs.contactPhone?.trim()
        );
    }
    if (categoryParam === "installation") {
      if (step === 1) return (inputs.turfSqFt ?? 0) > 0 || !!inputs.propertySize;
      if (step === 2) return inputs.hasExistingSprinklers !== undefined;
      if (step === 3) return !!inputs.waterType;
      if (step === 4) return true;
      if (step === 5)
        return !!(
          inputs.contactName?.trim() &&
          inputs.contactEmail?.trim() &&
          inputs.contactPhone?.trim()
        );
    }
    return false;
  };

  const repairAddOns = getMonthBasedAddOns();

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-2xl px-4 py-8 sm:py-12">
        <Stepper currentStep={step} totalSteps={totalSteps} labels={stepLabels} />

        <div className="mt-10">
          <h1 className="text-2xl font-bold text-[#102341]">{category.title}</h1>
        </div>

        <div className="mt-8 space-y-6">
          {categoryParam === "repair" && (
            <>
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="mb-3 font-medium text-[#102341]">
                      What issues are you experiencing?
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
                </div>
              )}
              {step === 2 && (
                <div className="space-y-6">
                  {!(
                    (inputs.issueTypes ?? []).includes("moving-adding-heads") ||
                    issuesNeedingFollowUp.filter((id) => id !== "moving-adding-heads").length > 0
                  ) && (
                    <p className="text-[#102341]/70">
                      No additional details needed. Click Continue.
                    </p>
                  )}
                  {(inputs.issueTypes ?? []).includes("moving-adding-heads") && (
                    <div>
                      <p className="mb-3 font-medium text-[#102341]">
                        How many heads are you adding or moving?
                      </p>
                      <Input
                        type="number"
                        min={1}
                        max={20}
                        placeholder="1"
                        value={inputs.headCount ?? ""}
                        onChange={(e) =>
                          setInputs({ headCount: parseInt(e.target.value, 10) || undefined })
                        }
                      />
                    </div>
                  )}
                  {issuesNeedingFollowUp
                    .filter((id) => id !== "moving-adding-heads")
                    .map((issueId) => {
                      const issue = REPAIR_ISSUES.find((i) => i.id === issueId);
                      if (!issue?.followUpOptions) return null;
                      const selected = (inputs.repairFollowUps ?? {})[issueId];
                      return (
                        <div key={issueId}>
                          <p className="mb-3 font-medium text-[#102341]">
                            {issue.followUpQuestion}
                          </p>
                          <div className="space-y-2">
                            {issue.followUpOptions.map((opt) => (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() =>
                                  setInputs({
                                    repairFollowUps: {
                                      ...(inputs.repairFollowUps ?? {}),
                                      [issueId]: opt.id,
                                    },
                                  })
                                }
                                className={`w-full rounded-xl border-2 p-4 text-left transition ${
                                  selected === opt.id
                                    ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                                    : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Optional add-ons
                  </p>
                  <div className="space-y-2">
                    {repairAddOns.map((opt) => {
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
                            {opt.price > 0 && (
                              <span className="text-[#102341]/60">+${opt.price}</span>
                            )}
                          </span>
                          {selected && <span className="text-[#4C9BC8]">✓</span>}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="font-medium text-[#102341]">
                    We&apos;ll show your estimate and can schedule a visit.
                  </p>
                  <Input
                    label="Name"
                    placeholder="Jane Smith"
                    value={inputs.contactName ?? ""}
                    onChange={(e) => setInputs({ contactName: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@example.com"
                    value={inputs.contactEmail ?? ""}
                    onChange={(e) => setInputs({ contactEmail: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="555-123-4567"
                    value={inputs.contactPhone ?? ""}
                    onChange={(e) => setInputs({ contactPhone: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inputs.consentToContact ?? false}
                      onChange={(e) => setInputs({ consentToContact: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-[#102341]/80">
                      I would like to be contacted about this project, and I understand that my quote is subject to on-site confirmation.
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {categoryParam === "seasonal" && (
            <>
              {step === 1 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    What service do you need?
                  </p>
                  <div className="space-y-2">
                    {SEASONAL_SERVICES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setInputs({ seasonalServiceType: opt.id })}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.seasonalServiceType === opt.id
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
                    How many zones does your system have?
                  </p>
                  <div className="space-y-2">
                    {ZONE_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setInputs({ zoneCount: opt.id, zoneCountUnknown: false });
                        }}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.zoneCount === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => setInputs({ zoneCountUnknown: true, zoneCount: 8 })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.zoneCountUnknown
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      Don&apos;t know
                    </button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">Optional add-ons</p>
                  <div className="space-y-2">
                    {addOns
                      .filter((a) => a.id !== "tuneup" && a.id !== "winterization")
                      .map((opt) => {
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
                              {opt.price > 0 && (
                                <span className="text-[#102341]/60">+${opt.price}</span>
                              )}
                            </span>
                            {selected && <span className="text-[#4C9BC8]">✓</span>}
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
              {step === 4 && (
                <div className="space-y-4">
                  <p className="font-medium text-[#102341]">
                    We&apos;ll show your estimate and can schedule a visit.
                  </p>
                  <Input
                    label="Name"
                    placeholder="Jane Smith"
                    value={inputs.contactName ?? ""}
                    onChange={(e) => setInputs({ contactName: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@example.com"
                    value={inputs.contactEmail ?? ""}
                    onChange={(e) => setInputs({ contactEmail: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="555-123-4567"
                    value={inputs.contactPhone ?? ""}
                    onChange={(e) => setInputs({ contactPhone: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inputs.consentToContact ?? false}
                      onChange={(e) => setInputs({ consentToContact: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-[#102341]/80">
                      I would like to be contacted about this project, and I understand that my quote is subject to on-site confirmation.
                    </span>
                  </label>
                </div>
              )}
            </>
          )}

          {categoryParam === "installation" && (
            <>
              {step === 1 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Turf area in sq ft
                  </p>
                  <div className="space-y-2">
                    {PROPERTY_SIZES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          const sqft =
                            opt.id === "small" ? 2000 : opt.id === "medium" ? 5000 : 8000;
                          setInputs({
                            propertySize: opt.id,
                            turfSqFt: sqft,
                          });
                        }}
                        className={`w-full rounded-xl border-2 p-4 text-left transition ${
                          inputs.propertySize === opt.id
                            ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                            : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                    <div>
                      <Input
                        label="Or enter specific sq ft"
                        type="number"
                        min={500}
                        placeholder="e.g. 3500"
                        value={inputs.turfSqFt && !inputs.propertySize ? inputs.turfSqFt : ""}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setInputs({
                            turfSqFt: v > 0 ? v : undefined,
                            propertySize: undefined,
                          });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}
              {step === 2 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Do you already have sprinklers in the front yard?
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setInputs({ hasExistingSprinklers: true })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.hasExistingSprinklers === true
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs({ hasExistingSprinklers: false })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.hasExistingSprinklers === false
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              )}
              {step === 3 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    What kind of water source are your sprinklers connected to?
                  </p>
                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={() => setInputs({ waterType: "culinary" })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.waterType === "culinary"
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      City water
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs({ waterType: "secondary" })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.waterType === "secondary"
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      Irrigation water
                    </button>
                    <button
                      type="button"
                      onClick={() => setInputs({ waterType: "dont-know" })}
                      className={`w-full rounded-xl border-2 p-4 text-left transition ${
                        inputs.waterType === "dont-know"
                          ? "border-[#4C9BC8] bg-[#C2E4F0]/30"
                          : "border-[#F0F0F0] hover:border-[#4C9BC8]/50"
                      }`}
                    >
                      Don&apos;t know
                    </button>
                  </div>
                </div>
              )}
              {step === 4 && (
                <div>
                  <p className="mb-3 font-medium text-[#102341]">
                    Would you like to add sod, mulch, or decorative rock?
                  </p>
                  <p className="mb-4 text-sm text-[#102341]/70">
                    Enter the total square footage for each item you want included.
                  </p>
                  <Input
                    label="Sod"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={inputs.sodSqFt ?? ""}
                    onChange={(e) =>
                      setInputs({
                        sodSqFt: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                  />
                  <Input
                    label="Mulch"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={inputs.mulchSqFt ?? ""}
                    onChange={(e) =>
                      setInputs({
                        mulchSqFt: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                    className="mt-4"
                  />
                  <Input
                    label="Rock"
                    type="number"
                    min={0}
                    placeholder="0"
                    value={inputs.rockSqFt ?? ""}
                    onChange={(e) =>
                      setInputs({
                        rockSqFt: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                    className="mt-4"
                  />
                </div>
              )}
              {step === 5 && (
                <div className="space-y-4">
                  <p className="font-medium text-[#102341]">
                    We&apos;ll show your estimate. Free on-site quote always available.
                  </p>
                  <Input
                    label="Name"
                    placeholder="Jane Smith"
                    value={inputs.contactName ?? ""}
                    onChange={(e) => setInputs({ contactName: e.target.value })}
                  />
                  <Input
                    label="Email"
                    type="email"
                    placeholder="jane@example.com"
                    value={inputs.contactEmail ?? ""}
                    onChange={(e) => setInputs({ contactEmail: e.target.value })}
                  />
                  <Input
                    label="Phone"
                    type="tel"
                    placeholder="555-123-4567"
                    value={inputs.contactPhone ?? ""}
                    onChange={(e) => setInputs({ contactPhone: e.target.value })}
                  />
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={inputs.consentToContact ?? false}
                      onChange={(e) => setInputs({ consentToContact: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-[#102341]/80">
                      I would like to be contacted about this project, and I understand that my quote is subject to on-site confirmation.
                    </span>
                  </label>
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
