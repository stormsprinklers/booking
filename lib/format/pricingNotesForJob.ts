import type { PricingInputs } from "@/lib/types";
import { REPAIR_ISSUES } from "@/lib/mock/repairIssues";
import { addOns } from "@/lib/mock/addOns";

/**
 * Formats the customer's pricing wizard selections into a readable notes string
 * for Housecall Pro job notes.
 */
export function formatPricingNotesForJob(inputs: Partial<PricingInputs> | null): string {
  if (!inputs) return "";
  const lines: string[] = [];

  if (inputs.serviceCategory === "repair") {
    const issueTypes = inputs.issueTypes ?? (inputs.issueType ? [inputs.issueType] : []);
    if (issueTypes.length > 0) {
      lines.push("Issues selected:");
      for (const issueId of issueTypes) {
        const issue = REPAIR_ISSUES.find((i) => i.id === issueId);
        const label = issue?.label ?? issueId;
        const followUp = inputs.repairFollowUps?.[issueId];
        if (followUp && issue?.followUpOptions) {
          const opt = issue.followUpOptions.find((o) => o.id === followUp);
          lines.push(`  • ${label}: ${opt?.label ?? followUp}`);
        } else {
          lines.push(`  • ${label}`);
        }
      }
      if (issueTypes.includes("moving-adding-heads") && (inputs.headCount ?? 0) > 0) {
        lines.push(`  Head count (moving/adding): ${inputs.headCount}`);
      }
    }
    const addOnIds = inputs.addOnIds ?? [];
    if (addOnIds.length > 0) {
      const labels = addOnIds.map((id) => addOns.find((a) => a.id === id)?.title ?? id);
      lines.push("Add-ons selected: " + labels.join(", "));
    }
  }

  if (inputs.serviceCategory === "seasonal") {
    const st = inputs.seasonalServiceType;
    if (st) {
      const labels: Record<string, string> = {
        tuneup: "Spring Start-Up / Tune-Up",
        winterization: "Winterization",
        both: "Maintenance Plan (both)",
      };
      lines.push(`Service: ${labels[st] ?? st}`);
    }
    if (inputs.zoneCountUnknown) {
      lines.push("Zone count: Don't know (estimated 8 zones)");
    } else if (inputs.zoneCount != null) {
      lines.push(`Zone count: ${inputs.zoneCount}`);
    }
    const addOnIds = inputs.addOnIds ?? [];
    if (addOnIds.length > 0) {
      const labels = addOnIds.map((id) => addOns.find((a) => a.id === id)?.title ?? id);
      lines.push("Add-ons selected: " + labels.join(", "));
    }
  }

  if (inputs.serviceCategory === "installation") {
    const turf = inputs.turfSqFt ?? (inputs.propertySize ? { small: 2000, medium: 5000, large: 8000 }[inputs.propertySize] : null);
    if (turf) lines.push(`Turf area: ${turf.toLocaleString()} sq ft`);
    if (inputs.hasExistingSprinklers === true) {
      lines.push("Existing sprinklers in front yard: Yes");
    } else if (inputs.hasExistingSprinklers === false) {
      lines.push("Existing sprinklers in front yard: No (new system)");
    }
    const wt = inputs.waterType;
    if (wt) {
      const waterLabels: Record<string, string> = {
        culinary: "City water",
        secondary: "Irrigation water",
        "dont-know": "Don't know",
      };
      lines.push(`Water source: ${waterLabels[wt] ?? wt}`);
    }
    if ((inputs.sodSqFt ?? 0) > 0) lines.push(`Sod: ${inputs.sodSqFt} sq ft`);
    if ((inputs.mulchSqFt ?? 0) > 0) lines.push(`Mulch: ${inputs.mulchSqFt} sq ft`);
    if ((inputs.rockSqFt ?? 0) > 0) lines.push(`Rock: ${inputs.rockSqFt} sq ft`);
  }

  return lines.join("\n");
}
