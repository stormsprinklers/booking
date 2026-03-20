import type { PricingInputs } from "@/lib/types";

const TURF_TIERS = [
  { maxSqFt: 2000, rate: 1.75 },
  { maxSqFt: 4000, rate: 1.0 },
  { maxSqFt: 6000, rate: 0.65 },
  { maxSqFt: Infinity, rate: 0.5 },
];
const TURF_MINIMUM = 1199;
const TURF_DISCOUNT = 0.1;

const CONNECTION_CULINARY = 2058.81;
const CONNECTION_SECONDARY = 450;
const CONNECTION_DONT_KNOW = (CONNECTION_CULINARY + CONNECTION_SECONDARY) / 2;

const SOD_RATE = 0.968;
const SOD_MIN_SQFT = 2500;
const SOD_MIN_FEE = 150;

const MULCH_RATE = 1.02;
const MULCH_BLOCK_SQFT = 1500;
const MULCH_BLOCK_FEE = 199;

const ROCK_RATE = 2.0;
const ROCK_BLOCK_SQFT = 1500;
const ROCK_BLOCK_FEE = 199;

const PROPERTY_SIZE_SQFT: Record<string, number> = {
  small: 2000,
  medium: 5000,
  large: 8000,
};

export function calculateTurfIrrigation(sqFt: number): number {
  let total = 0;
  let remaining = sqFt;
  let prevMax = 0;

  for (const tier of TURF_TIERS) {
    if (remaining <= 0) break;
    const bandWidth = Math.min(tier.maxSqFt - prevMax, remaining);
    if (bandWidth > 0) {
      total += bandWidth * tier.rate;
      remaining -= bandWidth;
    }
    prevMax = tier.maxSqFt;
  }

  total = Math.max(TURF_MINIMUM, total);
  total *= 1 - TURF_DISCOUNT;
  return Math.round(total);
}

export function getConnectionCost(
  waterType: "culinary" | "secondary" | "dont-know",
  hasExistingSprinklers: boolean
): number {
  if (hasExistingSprinklers) return 0;
  switch (waterType) {
    case "culinary":
      return CONNECTION_CULINARY;
    case "secondary":
      return CONNECTION_SECONDARY;
    case "dont-know":
      return Math.round(CONNECTION_DONT_KNOW);
    default:
      return Math.round(CONNECTION_DONT_KNOW);
  }
}

export function calculateSod(sqFt: number): number {
  if (sqFt <= 0) return 0;
  let cost = sqFt * SOD_RATE;
  if (sqFt < SOD_MIN_SQFT) cost += SOD_MIN_FEE;
  return Math.round(cost);
}

export function calculateMulch(sqFt: number): number {
  if (sqFt <= 0) return 0;
  const blocks = Math.ceil(sqFt / MULCH_BLOCK_SQFT);
  return Math.round(sqFt * MULCH_RATE + blocks * MULCH_BLOCK_FEE);
}

export function calculateRock(sqFt: number): number {
  if (sqFt <= 0) return 0;
  const blocks = Math.ceil(sqFt / ROCK_BLOCK_SQFT);
  return Math.round(sqFt * ROCK_RATE + blocks * ROCK_BLOCK_FEE);
}

export interface InstallationEstimateResult {
  min: number;
  max: number;
  description: string;
  hasSod: boolean;
  hasMulch: boolean;
  hasRock: boolean;
}

export function getInstallationEstimate(inputs: PricingInputs): InstallationEstimateResult | null {
  const {
    turfSqFt,
    propertySize,
    hasExistingSprinklers = false,
    waterType = "dont-know",
    sodSqFt = 0,
    mulchSqFt = 0,
    rockSqFt = 0,
  } = inputs;

  const turfArea = turfSqFt ?? (propertySize ? PROPERTY_SIZE_SQFT[propertySize] : 5000);
  if (!turfArea || turfArea <= 0) return null;

  const turfCost = calculateTurfIrrigation(turfArea);
  const connectionCost = getConnectionCost(waterType, hasExistingSprinklers);
  const sodCost = calculateSod(sodSqFt ?? 0);
  const mulchCost = calculateMulch(mulchSqFt ?? 0);
  const rockCost = calculateRock(rockSqFt ?? 0);

  const subtotal = turfCost + connectionCost + sodCost + mulchCost + rockCost;
  const min = subtotal;
  const max = Math.round(subtotal * 1.15);

  const parts: string[] = [];
  if (turfArea) parts.push(`${turfArea.toLocaleString()} sq ft turf irrigation`);
  if (!hasExistingSprinklers) parts.push(waterType === "culinary" ? "city water connection" : waterType === "secondary" ? "irrigation water connection" : "connection (est.)");
  if (sodSqFt) parts.push(`${sodSqFt} sq ft sod`);
  if (mulchSqFt) parts.push(`${mulchSqFt} sq ft mulch`);
  if (rockSqFt) parts.push(`${rockSqFt} sq ft rock`);

  return {
    min,
    max,
    description: parts.length ? `Estimated for ${parts.join(", ")}.` : "Free on-site quote available.",
    hasSod: (sodSqFt ?? 0) > 0,
    hasMulch: (mulchSqFt ?? 0) > 0,
    hasRock: (rockSqFt ?? 0) > 0,
  };
}
