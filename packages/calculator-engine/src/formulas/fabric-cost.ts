import { DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Get fabric price per meter based on tier
 */
export function getFabricPricePerMeter(tier: number): number {
  const { fabricTiers } = DEFAULT_PRICING_CONFIG;

  const tierConfig = fabricTiers.find((t) => t.tier === tier);

  if (!tierConfig) {
    // Default to tier 1 if not found
    return fabricTiers[0].pricePerMeter;
  }

  return tierConfig.pricePerMeter;
}

/**
 * Get fabric tier name
 */
export function getFabricTierName(tier: number): string {
  const { fabricTiers } = DEFAULT_PRICING_CONFIG;

  const tierConfig = fabricTiers.find((t) => t.tier === tier);

  if (!tierConfig) {
    return 'Unknown Tier';
  }

  return tierConfig.name;
}

/**
 * Calculate fabric cost based on meters and tier
 * Formula: fabricMeters * pricePerMeter
 */
export function calculateFabricCost(
  fabricMeters: number,
  tier: number
): number {
  const pricePerMeter = getFabricPricePerMeter(tier);
  return fabricMeters * pricePerMeter;
}

/**
 * Get all fabric tiers for display
 */
export function getAllFabricTiers(): {
  tier: number;
  name: string;
  pricePerMeter: number;
}[] {
  return DEFAULT_PRICING_CONFIG.fabricTiers.map((t) => ({
    tier: t.tier,
    name: t.name,
    pricePerMeter: t.pricePerMeter,
  }));
}

/**
 * Validate fabric tier
 */
export function isValidFabricTier(tier: number): boolean {
  return DEFAULT_PRICING_CONFIG.fabricTiers.some((t) => t.tier === tier);
}

/**
 * Get fabric tier from fabric code
 * This is a simplified mapping - in production, you'd lookup from database
 */
export function getFabricTierFromCode(fabricCode: string): number {
  // Extract tier from code prefix (e.g., "T1-001" -> 1)
  const match = fabricCode.match(/^T(\d)/i);
  if (match) {
    return parseInt(match[1], 10);
  }

  // Default to tier 1
  return 1;
}
