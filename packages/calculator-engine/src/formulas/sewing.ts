import { CushionShape, Dimensions, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Calculate the minimum dimension of a cushion based on shape and dimensions
 */
export function calculateMinDimension(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  switch (shape) {
    case 'RECTANGLE':
      return Math.min(dimensions.width || 0, dimensions.length || 0);

    case 'ROUND':
      return dimensions.diameter || 0;

    case 'TRIANGLE':
      return Math.min(dimensions.base || 0, dimensions.height || 0);

    case 'TRAPEZIUM':
      return Math.min(
        dimensions.topWidth || 0,
        dimensions.bottomWidth || 0,
        dimensions.height || 0
      );

    case 'T_CUSHION':
      return Math.min(
        dimensions.seatDepth || 0,
        dimensions.armWidth || 0,
        dimensions.legWidth || 0
      );

    case 'L_SHAPE':
      return Math.min(
        dimensions.legWidth || 0,
        dimensions.armWidth || 0,
        dimensions.seatDepth || 0
      );

    default:
      return 0;
  }
}

/**
 * Calculate the maximum dimension of a cushion based on shape and dimensions
 */
export function calculateMaxDimension(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  switch (shape) {
    case 'RECTANGLE':
      return Math.max(dimensions.width || 0, dimensions.length || 0);

    case 'ROUND':
      return dimensions.diameter || 0;

    case 'TRIANGLE':
      return Math.max(dimensions.base || 0, dimensions.height || 0);

    case 'TRAPEZIUM':
      return Math.max(
        dimensions.topWidth || 0,
        dimensions.bottomWidth || 0,
        dimensions.height || 0
      );

    case 'T_CUSHION': {
      // T-cushion total width = armWidth + legWidth
      const totalWidth = (dimensions.armWidth || 0) + (dimensions.legWidth || 0);
      return Math.max(totalWidth, dimensions.seatDepth || 0);
    }

    case 'L_SHAPE': {
      // L-shape total dimensions
      const totalWidth = (dimensions.legWidth || 0) + (dimensions.armWidth || 0);
      return Math.max(totalWidth, dimensions.seatDepth || 0);
    }

    default:
      return 0;
  }
}

/**
 * Calculate sewing cost based on minimum dimension
 * Uses tiered pricing based on cushion size
 */
export function calculateSewingCost(minDimension: number): number {
  const { sewingTiers } = DEFAULT_PRICING_CONFIG;

  // Find the appropriate tier
  const tier = sewingTiers.find(
    (t) => minDimension >= t.min && minDimension < t.max
  );

  if (!tier) {
    // Default to highest tier if not found
    return sewingTiers[sewingTiers.length - 1].cost;
  }

  return tier.cost;
}

/**
 * Get sewing tier info for display
 */
export function getSewingTierInfo(minDimension: number): {
  tier: number;
  range: string;
  cost: number;
} {
  const { sewingTiers } = DEFAULT_PRICING_CONFIG;

  const tier = sewingTiers.find(
    (t) => minDimension >= t.min && minDimension < t.max
  );

  if (!tier) {
    const lastTier = sewingTiers[sewingTiers.length - 1];
    return {
      tier: sewingTiers.length,
      range: `${lastTier.min}+ inches`,
      cost: lastTier.cost,
    };
  }

  const tierIndex = sewingTiers.indexOf(tier) + 1;
  const maxDisplay = tier.max === Infinity ? '+' : `-${tier.max}`;

  return {
    tier: tierIndex,
    range: `${tier.min}${maxDisplay} inches`,
    cost: tier.cost,
  };
}
