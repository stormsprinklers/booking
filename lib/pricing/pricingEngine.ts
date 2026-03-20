import type { PricingInputs, PricingOption } from "@/lib/types";
import { addOns } from "@/lib/mock/addOns";
import { REPAIR_ISSUES } from "@/lib/mock/repairIssues";
import { getInstallationEstimate } from "./installationEngine";

const REPAIR_MINIMUM = 50;

/** Personalized repair title based on selected issues and follow-ups */
function getRepairTitle(issueIds: string[], repairFollowUps: Record<string, string>): string {
  const titles: string[] = [];
  for (const issueId of issueIds) {
    const followUp = repairFollowUps[issueId];
    let title: string;
    switch (issueId) {
      case "not-turning-on":
        title =
          followUp === "one-section"
            ? "Solenoid or wiring repair"
            : followUp === "one-section-old"
              ? "Valve box repair"
              : followUp === "whole-system"
                ? "System startup repair"
                : "Won't turn on repair";
        break;
      case "not-turning-off":
        title =
          followUp === "no"
            ? "Valve diaphragm repair"
            : followUp === "yes"
              ? "Valve box replacement"
              : "Won't turn off repair";
        break;
      case "low-pressure":
        title = "Low pressure diagnosis & repair";
        break;
      case "leak":
        title = followUp === "yes" ? "Leak repair (difficult access)" : "Leak repair";
        break;
      case "coverage-issues":
        title = "Coverage tune-up";
        break;
      case "broken-backflow":
        title =
          followUp === "install"
            ? "Backflow device installation"
            : followUp === "crack"
              ? "Backflow device replacement"
              : followUp === "vent"
                ? "Backflow drain repair"
                : "Backflow repair service";
        break;
      case "main-shutoff":
        title = "Main shutoff valve replacement";
        break;
      case "electrical-error":
        title = "Electrical wiring repair";
        break;
      case "broken-heads":
        title = "Sprinkler head replacement";
        break;
      case "moving-adding-heads":
        title = "Sprinkler head move or add";
        break;
      case "drip-irrigation":
        title = "Drip irrigation installation";
        break;
      case "general":
        title = "Sprinkler system diagnosis";
        break;
      default:
        title = "Repair service";
    }
    titles.push(title);
  }
  if (titles.length === 0) return "Sprinkler system diagnosis";
  if (titles.length === 1) return titles[0];
  if (titles.length === 2) return `${titles[0]} & ${titles[1]}`;
  return `${titles[0]}, ${titles[1]} & more`;
}

export function getPricingOptions(inputs: PricingInputs): PricingOption[] {
  const { serviceCategory, addOnIds = [] } = inputs;

  switch (serviceCategory) {
    case "repair":
      return getRepairPricing(inputs);
    case "seasonal":
      return getSeasonalPricing(inputs);
    case "installation":
      return getInstallationPricing(inputs);
    default:
      return [];
  }
}

function getRepairPricing(inputs: PricingInputs): PricingOption[] {
  const { issueTypes = [], repairFollowUps = {}, headCount = 1, addOnIds = [] } = inputs;
  const issueIds = issueTypes.length ? issueTypes : ["general"];

  let totalMin = 0;
  let totalMax = 0;

  for (const issueId of issueIds) {
    const issue = REPAIR_ISSUES.find((i) => i.id === issueId);
    if (!issue) continue;

    let min: number;
    let max: number;

    if (issue.id === "moving-adding-heads") {
      const heads = Math.max(1, headCount);
      min = 149 * heads;
      max = 199 * heads;
    } else if (issue.hasFollowUp && issue.followUpOptions && repairFollowUps[issueId]) {
      const opt = issue.followUpOptions.find((o) => o.id === repairFollowUps[issueId]);
      if (opt) {
        min = opt.min;
        max = opt.max;
      } else {
        min = issue.min;
        max = issue.max;
      }
    } else {
      min = issue.min;
      max = issue.max;
    }

    totalMin += min;
    totalMax += max;
  }

  const addOnTotal = addOns
    .filter((a) => addOnIds.includes(a.id))
    .reduce((sum, a) => sum + a.price, 0);

  totalMin = Math.max(REPAIR_MINIMUM, Math.round(totalMin + addOnTotal));
  totalMax = Math.max(REPAIR_MINIMUM, Math.round(totalMax + addOnTotal));

  const selectedAddOns = addOns.filter((a) => addOnIds.includes(a.id));
  const repairTitle = getRepairTitle(issueIds, repairFollowUps);

  return [
    {
      id: "repair-basic",
      tier: "single",
      title: repairTitle,
      price: totalMin,
      priceRange: { min: totalMin, max: totalMax },
      description:
        issueIds.length > 1
          ? "Our technician will diagnose and fix all selected sprinkler issues."
          : "Our technician will diagnose and fix your sprinkler issue.",
      estimatedDuration: selectedAddOns.length ? "1.5–2.5 hours" : "1–2 hours",
      includes: [
        "Diagnosis",
        "Repair labor",
        "Flat-rate pricing—no surprise charges",
        "5-year warranty when we winterize your system",
      ],
      addOns: selectedAddOns.length ? selectedAddOns : undefined,
      customerMessage: `Most customers pay between $${totalMin}–$${totalMax} for this kind of repair.`,
    },
  ];
}

function getSeasonalPricing(inputs: PricingInputs): PricingOption[] {
  const { seasonalServiceType, zoneCount = 8, zoneCountUnknown, addOnIds = [] } = inputs;
  const zones = zoneCountUnknown ? 8 : Math.max(1, zoneCount);

  const tuneupBase = 249;
  const tuneupPerZone = 25;
  const winterBase = 175;
  const winterPerZone = 15;

  const tuneupPrice = zones <= 8 ? tuneupBase : tuneupBase + (zones - 8) * tuneupPerZone;
  const winterPrice = zones <= 8 ? winterBase : winterBase + (zones - 8) * winterPerZone;

  const addOnTotal = addOns
    .filter((a) => addOnIds.includes(a.id) && a.id !== "maintenance-plan")
    .reduce((sum, a) => sum + a.price, 0);

  const options: PricingOption[] = [];

  if (seasonalServiceType === "tuneup" || !seasonalServiceType) {
    options.push({
      id: "seasonal-tuneup",
      tier: "single",
      title: "Spring Start-Up / Tune-Up",
      price: tuneupPrice + addOnTotal,
      description: `Wake up your system for the season. Up to 8 zones included, +$25 per additional zone.`,
      estimatedDuration: "45–60 minutes",
      includes: ["System flush", "Head adjustment", "Zone test", "Controller check"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    });
  }

  if (seasonalServiceType === "winterization" || !seasonalServiceType) {
    options.push({
      id: "seasonal-winter",
      tier: "single",
      title: "Winterization",
      price: winterPrice + addOnTotal,
      description: `Blow-out and winter prep. Up to 8 zones included, +$15 per additional zone.`,
      estimatedDuration: "45–60 minutes",
      includes: ["Blow-out", "Shut-off", "Winter prep"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    });
  }

  if (seasonalServiceType === "both") {
    options.push({
      id: "seasonal-plan",
      tier: "best",
      title: "Storm Shield Maintenance Plan",
      price: 349 + addOnTotal,
      description: "Tune-up + winterization together. Best value. See stormsprinklers.com/sprinkler-maintenance-plans",
      estimatedDuration: "2 visits per year",
      includes: ["Spring tune-up ($199 value)", "Fall winterization ($150 value)", "Priority scheduling", "Additional benefits"],
      addOns: addOns.filter((a) => addOnIds.includes(a.id)),
    });
  }

  if (options.length === 0) {
    options.push({
      id: "seasonal-tuneup",
      tier: "single",
      title: "Spring Start-Up / Tune-Up",
      price: tuneupPrice + addOnTotal,
      description: `Up to 8 zones included, +$25 per additional zone.`,
      estimatedDuration: "45–60 minutes",
      includes: ["System flush", "Head adjustment", "Zone test", "Controller check"],
    });
  }

  return options;
}

function getInstallationPricing(inputs: PricingInputs): PricingOption[] {
  const result = getInstallationEstimate(inputs);
  if (!result) return [];

  return [
    {
      id: "installation-estimate",
      tier: "single",
      title: "New Sprinkler System",
      price: result.min,
      priceRange: { min: result.min, max: result.max },
      description: result.description,
      estimatedDuration: "Varies by scope",
      includes: [
        "Free on-site or online quote",
        "Turf irrigation (tiered pricing)",
        "Connection (city or irrigation water)",
        result.hasSod || result.hasMulch || result.hasRock ? "Sod/mulch/rock as selected" : "Optional sod, mulch, rock available",
      ],
      customerMessage: `Most installations in this range run $${result.min}–$${result.max}. We'll give you a full quote before any work begins.`,
    },
  ];
}
