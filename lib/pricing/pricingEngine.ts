import type { PricingInputs, PricingOption } from "@/lib/types";
import { addOns } from "@/lib/mock/addOns";

export function getPricingOptions(inputs: PricingInputs): PricingOption[] {
  const { serviceCategory, propertySize, issueType, issueTypes, scope, addOnIds = [], urgency } = inputs;

  switch (serviceCategory) {
    case "repair":
      return getRepairPricing(
        issueTypes?.length ? issueTypes : issueType ? [issueType] : ["general"],
        propertySize ?? "medium",
        addOnIds
      );
    case "upgrade":
      return getUpgradePricing(scope ?? "standard", propertySize ?? "medium", addOnIds);
    case "seasonal":
      return getSeasonalPricing(addOnIds);
    default:
      return [];
  }
}

function getRepairPricing(
  issueTypes: string[],
  propertySize: string,
  addOnIds: string[]
): PricingOption[] {
  const basePrices: Record<string, { min: number; max: number }> = {
    leak: { min: 125, max: 250 },
    "not-turning-on": { min: 100, max: 200 },
    "not-turning-off": { min: 100, max: 225 },
    "low-pressure": { min: 150, max: 300 },
    "controller-issue": { min: 75, max: 200 },
    "broken-backflow": { min: 150, max: 350 },
    "broken-filter": { min: 75, max: 175 },
    "adding-upgrade": { min: 99, max: 250 },
    "main-shutoff": { min: 125, max: 275 },
    "valve-repair": { min: 100, max: 250 },
    "broken-heads": { min: 75, max: 150 },
    general: { min: 99, max: 199 },
  };

  const prices = issueTypes.map((id) => basePrices[id] ?? basePrices.general);
  const price = prices.length
    ? {
        min: prices.reduce((s, p) => s + p.min, 0),
        max: prices.reduce((s, p) => s + p.max, 0),
      }
    : basePrices.general;
  const sizeMultiplier = propertySize === "large" ? 1.2 : propertySize === "small" ? 0.9 : 1;

  const addOnTotal = addOns
    .filter((a) => addOnIds.includes(a.id) && a.id !== "membership")
    .reduce((sum, a) => sum + a.price, 0);

  const min = Math.round(price.min * sizeMultiplier + addOnTotal);
  const max = Math.round(price.max * sizeMultiplier + addOnTotal);

  const selectedAddOns = addOns.filter((a) => addOnIds.includes(a.id) && a.id !== "membership");

  return [
    {
      id: "repair-basic",
      tier: "single",
      title: "Repair Service",
      price: min,
      priceRange: { min, max },
      description:
        issueTypes.length > 1
          ? "Our technician will diagnose and fix all selected sprinkler issues."
          : "Our technician will diagnose and fix your sprinkler issue.",
      estimatedDuration: selectedAddOns.length ? "1.5–2.5 hours" : "1–2 hours",
      includes: ["Diagnosis", "Repair labor", "Basic parts up to $50"],
      addOns: selectedAddOns.length ? selectedAddOns : undefined,
    },
  ];
}

function getUpgradePricing(scope: string, propertySize: string, addOnIds: string[]): PricingOption[] {
  const addOnTotal = addOns
    .filter((a) => addOnIds.includes(a.id) && a.id !== "membership")
    .reduce((sum, a) => sum + a.price, 0);

  const sizeMultiplier = propertySize === "large" ? 1.3 : propertySize === "small" ? 0.8 : 1;

  const baseGood = Math.round(500 * sizeMultiplier) + addOnTotal;
  const baseBetter = Math.round(1200 * sizeMultiplier) + addOnTotal;
  const baseBest = Math.round(2500 * sizeMultiplier) + addOnTotal;

  return [
    {
      id: "upgrade-good",
      tier: "good",
      title: "Zone Addition",
      price: baseGood,
      description: "Add 1–2 zones to your existing system.",
      estimatedDuration: "4–6 hours",
      includes: ["New zones", "Standard controller compatible", "Basic installation"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    },
    {
      id: "upgrade-better",
      tier: "better",
      title: "Smart Upgrade",
      price: baseBetter,
      description: "Upgrade to a smart controller + zone additions.",
      estimatedDuration: "1 day",
      includes: ["Smart WiFi controller", "2–4 new zones", "App-based control"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    },
    {
      id: "upgrade-best",
      tier: "best",
      title: "New System Install",
      price: baseBest,
      description: "Full new sprinkler system for your property.",
      estimatedDuration: "2–3 days",
      includes: ["Complete design", "All zones", "Smart controller", "Warranty"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    },
  ];
}

function getSeasonalPricing(addOnIds: string[]): PricingOption[] {
  const addOnTotal = addOns
    .filter((a) => addOnIds.includes(a.id) && a.id !== "membership")
    .reduce((sum, a) => sum + a.price, 0);

  return [
    {
      id: "seasonal-startup",
      tier: "single",
      title: "Spring Start-Up",
      price: 75 + addOnTotal,
      description: "Wake up your system for the season. Flush, test, adjust.",
      estimatedDuration: "45–60 minutes",
      includes: ["System flush", "Head adjustment", "Zone test", "Controller check"],
    },
    {
      id: "seasonal-winter",
      tier: "single",
      title: "Winterization",
      price: 85 + addOnTotal,
      description: "Blow out lines and prepare for winter.",
      estimatedDuration: "45–60 minutes",
      includes: ["Blow-out", "Shut-off", "Winter prep"],
    },
    {
      id: "seasonal-both",
      tier: "best",
      title: "Start-Up + Winterization",
      price: 140 + addOnTotal,
      description: "Both spring and fall service. Best value.",
      estimatedDuration: "2 visits",
      includes: ["Spring start-up", "Fall winterization", "Priority scheduling"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    },
  ];
}
