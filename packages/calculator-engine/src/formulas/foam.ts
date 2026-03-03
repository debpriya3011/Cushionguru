import { CushionShape, Dimensions, FoamType, DEFAULT_PRICING_CONFIG } from '../types';
import { calculateVolume } from './fiberfill';

/**
 * Calculate foam cost based on shape, dimensions, and foam type
 */
export function calculateFoamCost(
  shape: CushionShape,
  dimensions: Dimensions,
  foamType: FoamType
): number {
  const { foamPrices } = DEFAULT_PRICING_CONFIG;

  const volume = calculateVolume(shape, dimensions);
  const pricePerCubicMeter = foamPrices[foamType] || foamPrices.STANDARD_25D;

  // Calculate cost: volume * price per cubic meter
  return volume * pricePerCubicMeter;
}

/**
 * Get foam price per cubic meter
 */
export function getFoamPrice(foamType: FoamType): number {
  const { foamPrices } = DEFAULT_PRICING_CONFIG;
  return foamPrices[foamType] || 0;
}

/**
 * Get all foam options with prices
 */
export function getAllFoamOptions(): {
  type: FoamType;
  pricePerCubicMeter: number;
  name: string;
  description: string;
}[] {
  const { foamPrices } = DEFAULT_PRICING_CONFIG;

  const foamInfo: Record<
    FoamType,
    { name: string; description: string }
  > = {
    STANDARD_25D: {
      name: 'Standard 25D',
      description: 'Basic polyurethane foam, 25kg/m³ density',
    },
    STANDARD_28D: {
      name: 'Standard 28D',
      description: 'Improved polyurethane foam, 28kg/m³ density',
    },
    PREMIUM_30D: {
      name: 'Premium 30D',
      description: 'High-quality foam, 30kg/m³ density',
    },
    PREMIUM_35D: {
      name: 'Premium 35D',
      description: 'Superior quality foam, 35kg/m³ density',
    },
    MEMORY_FOAM: {
      name: 'Memory Foam',
      description: 'Viscoelastic memory foam for ultimate comfort',
    },
    LATEX: {
      name: 'Natural Latex',
      description: '100% natural latex, eco-friendly and durable',
    },
  };

  return (Object.keys(foamPrices) as FoamType[]).map((type) => ({
    type,
    pricePerCubicMeter: foamPrices[type],
    name: foamInfo[type].name,
    description: foamInfo[type].description,
  }));
}

/**
 * Get foam density rating
 */
export function getFoamDensity(foamType: FoamType): number {
  const densities: Record<FoamType, number> = {
    STANDARD_25D: 25,
    STANDARD_28D: 28,
    PREMIUM_30D: 30,
    PREMIUM_35D: 35,
    MEMORY_FOAM: 50,
    LATEX: 65,
  };

  return densities[foamType] || 25;
}

/**
 * Check if foam type is premium
 */
export function isPremiumFoam(foamType: FoamType): boolean {
  return (
    foamType === 'PREMIUM_30D' ||
    foamType === 'PREMIUM_35D' ||
    foamType === 'MEMORY_FOAM' ||
    foamType === 'LATEX'
  );
}
