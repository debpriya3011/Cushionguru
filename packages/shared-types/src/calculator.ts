/**
 * Shared TypeScript types for Cushion Calculator
 */

// ==================== ENUMS ====================

export type CushionShape =
  | 'Rectangle'
  | 'Trapezium'
  | 'T Cushion'
  | 'L Shape'
  | 'Round'
  | 'Triangle';

export type FoamType =
  | 'High Density Foam'
  | 'Dry Fast Foam'
  | 'Fiber Fill'
  | 'Covers Only';

export type ZipperPosition = 'Long Side' | 'Short Side' | 'No Zipper';
export type PipingOption = 'Piping' | 'No Piping';
export type TiesOption = 'No ties' | '2 Side' | '4 Side' | '4 Corner' | '6 Side' | '8 Side';

export type FabricPriceTier = 1 | 2 | 3 | 4 | 5 | 6;

// ==================== DIMENSIONS ====================

export interface Dimensions {
  length?: number;
  width?: number;
  thickness?: number;
  diameter?: number;      // For Round
  bottomWidth?: number;   // For Trapezium, T, L
  topWidth?: number;      // For Trapezium, T, L
  ear?: number;           // For T, L shapes
  quantity?: number;
}

export interface DimensionRange {
  min: number;
  max: number;
  step: number;
  unit: string;
}

export interface DimensionRanges {
  length: DimensionRange;
  width: DimensionRange;
  thickness: DimensionRange;
  diameter: DimensionRange;
  bottomWidth: DimensionRange;
  topWidth: DimensionRange;
  ear: DimensionRange;
}

// ==================== CALCULATOR SELECTIONS ====================

export interface CalculatorSelections {
  productType: string;
  shape: CushionShape;
  dimensions: Dimensions;
  foamType: FoamType;
  fabricCode: string;
  fabricPrice?: number;
  zipperPosition: ZipperPosition;
  piping: PipingOption;
  ties: TiesOption;
  quantity: number;
  instructions?: string;
  attachments?: string[];
}

// ==================== CALCULATED VALUES ====================

export interface CalculatedValues {
  // Intermediate values
  minDimension: number;
  maxDimension: number;
  fabricMeters: number;
  fabricTier: number;

  // Individual costs
  sewingCost: number;
  fiberfillCost: number;
  pipingCost: number;
  tiesCost: number;
  fabricCost: number;

  // Totals
  baseSubtotal: number;
  finalPrice: number;
}

export interface CalculatedValuesWithMarkup extends CalculatedValues {
  markupAmount: number;
  finalPriceWithMarkup: number;
}

// ==================== CONFIGURATION ====================

export interface ShapeConfig {
  id: CushionShape;
  name: string;
  imageUrl: string;
  dimensions: DimensionField[];
  description?: string;
}

export interface DimensionField {
  name: keyof Dimensions;
  label: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  required: boolean;
  placeholder?: string;
}

export interface FoamConfig {
  id: FoamType;
  name: string;
  description?: string;
  imageUrl: string;
  priceModifier?: number;
}

export interface FabricConfig {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  priceTier: FabricPriceTier;
  price?: number;
  description?: string;
  colors?: string[];
}

export interface FabricBrandConfig {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  fabrics: FabricConfig[];
}

export interface OptionConfig {
  id: string;
  name: string;
  imageUrl?: string;
  description?: string;
  priceModifier?: number;
}

export interface CalculatorConfig {
  id?: string;
  name: string;
  description?: string;

  // Product types
  productTypes: ProductTypeConfig[];

  // Shapes
  shapes: ShapeConfig[];

  // Foam types
  foamTypes: FoamConfig[];

  // Fabric brands
  fabricBrands: FabricBrandConfig[];

  // Options
  zipperPositions: OptionConfig[];
  pipingOptions: OptionConfig[];
  tiesOptions: OptionConfig[];

  // Dimension ranges
  dimensionRanges: DimensionRanges;

  // Default values
  defaults?: Partial<CalculatorSelections>;
}

export interface ProductTypeConfig {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  availableShapes: CushionShape[];
}

// ==================== VALIDATION ====================

export interface ValidationError {
  field: string;
  message: string;
}

// ==================== API TYPES ====================

export interface CalculateQuoteRequest {
  selections: CalculatorSelections;
  retailerId?: string;
}

export interface CalculateQuoteResponse {
  calculations: CalculatedValues;
  errors?: ValidationError[];
}

export interface SaveQuoteRequest {
  selections: CalculatorSelections;
  calculations: CalculatedValues;
  customerDetails: CustomerDetails;
}

export interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: Address;
}

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  zip: string;
  country?: string;
}

// ==================== COMPONENT PROPS ====================

export interface CalculatorComponentProps {
  config: CalculatorConfig;
  selections: CalculatorSelections;
  onChange: (selections: CalculatorSelections) => void;
  onCalculate?: (calculations: CalculatedValues) => void;
  readOnly?: boolean;
}

export interface PriceDisplayProps {
  calculations: CalculatedValues | null;
  markup?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  showBreakdown?: boolean;
  currency?: string;
}

export interface Preview3DProps {
  selections: CalculatorSelections;
  width?: number;
  height?: number;
}
