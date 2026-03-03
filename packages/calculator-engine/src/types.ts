export type CushionShape =
  | 'RECTANGLE'
  | 'ROUND'
  | 'TRIANGLE'
  | 'TRAPEZIUM'
  | 'T_CUSHION'
  | 'L_SHAPE';

export type FoamType =
  | 'STANDARD_25D'
  | 'STANDARD_28D'
  | 'PREMIUM_30D'
  | 'PREMIUM_35D'
  | 'MEMORY_FOAM'
  | 'LATEX';

export type ZipperOption = 'NONE' | 'STANDARD' | 'WATER_RESISTANT' | 'HEAVY_DUTY';

export type PipingOption = 'NONE' | 'SINGLE' | 'DOUBLE';

export type TieOption = 'NONE' | 'STANDARD' | 'VELCRO' | 'ZIPPER';

export interface Dimensions {
  width?: number;
  length?: number;
  depth?: number;
  diameter?: number;
  base?: number;
  height?: number;
  topWidth?: number;
  bottomWidth?: number;
  legWidth?: number;
  armWidth?: number;
  seatDepth?: number;
}

export interface CalculatorSelections {
  productType: string;
  shape: CushionShape;
  dimensions: Dimensions;
  foamType: FoamType;
  fabricCode: string;
  fabricTier: number;
  zipperOption: ZipperOption;
  pipingOption: PipingOption;
  tieOption: TieOption;
  specialInstructions?: string;
}

export interface CostBreakdown {
  sewingCost: number;
  fabricMeters: number;
  fabricCost: number;
  fiberfillCost: number;
  pipingCost: number;
  tiesCost: number;
  zipperCost: number;
  foamCost: number;
  baseCost: number;
  markupAmount: number;
  totalPrice: number;
}

export interface CalculationResult {
  selections: CalculatorSelections;
  breakdown: CostBreakdown;
  minDimension: number;
  maxDimension: number;
  valid: boolean;
  errors?: string[];
}

// Pricing Configuration
export interface PricingConfig {
  sewingTiers: {
    min: number;
    max: number;
    cost: number;
  }[];
  fabricTiers: {
    tier: number;
    pricePerMeter: number;
    name: string;
  }[];
  foamPrices: Record<FoamType, number>;
  zipperPrices: Record<ZipperOption, number>;
  pipingPricePerMeter: number;
  tiePrices: Record<TieOption, number>;
  fiberfillPrices: Record<FoamType, number>;
  fabricWidth: number;
  seamAllowance: number;
}

export const DEFAULT_PRICING_CONFIG: PricingConfig = {
  // Sewing cost tiers based on minimum dimension
  sewingTiers: [
    { min: 0, max: 10, cost: 18 },
    { min: 10, max: 20, cost: 22 },
    { min: 20, max: 30, cost: 28 },
    { min: 30, max: 40, cost: 35 },
    { min: 40, max: 50, cost: 42 },
    { min: 50, max: 60, cost: 50 },
    { min: 60, max: Infinity, cost: 60 },
  ],

  // Fabric pricing tiers
  fabricTiers: [
    { tier: 1, pricePerMeter: 21.89375, name: 'Tier 1 - Basic' },
    { tier: 2, pricePerMeter: 32.840625, name: 'Tier 2 - Standard' },
    { tier: 3, pricePerMeter: 43.7875, name: 'Tier 3 - Premium' },
    { tier: 4, pricePerMeter: 54.734375, name: 'Tier 4 - Deluxe' },
    { tier: 5, pricePerMeter: 65.68125, name: 'Tier 5 - Luxury' },
    { tier: 6, pricePerMeter: 73.45, name: 'Tier 6 - Ultra' },
  ],

  // Foam prices per cubic meter (approximate)
  foamPrices: {
    STANDARD_25D: 45,
    STANDARD_28D: 55,
    PREMIUM_30D: 70,
    PREMIUM_35D: 90,
    MEMORY_FOAM: 150,
    LATEX: 200,
  },

  // Zipper prices
  zipperPrices: {
    NONE: 0,
    STANDARD: 3,
    WATER_RESISTANT: 8,
    HEAVY_DUTY: 12,
  },

  // Piping price per meter
  pipingPricePerMeter: 2.5,

  // Tie prices
  tiePrices: {
    NONE: 0,
    STANDARD: 4,
    VELCRO: 6,
    ZIPPER: 8,
  },

  // Fiberfill prices based on foam type
  fiberfillPrices: {
    STANDARD_25D: 8,
    STANDARD_28D: 8,
    PREMIUM_30D: 10,
    PREMIUM_35D: 10,
    MEMORY_FOAM: 0, // Memory foam doesn't need fiberfill
    LATEX: 0, // Latex doesn't need fiberfill
  },

  // Standard fabric width in meters
  fabricWidth: 1.4,

  // Seam allowance in meters
  seamAllowance: 0.025,
};
