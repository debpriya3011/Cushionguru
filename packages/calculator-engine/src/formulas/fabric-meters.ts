import { CushionShape, Dimensions, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Convert inches to meters
 */
function inchesToMeters(inches: number): number {
  return inches * 0.0254;
}

/**
 * Calculate fabric meters needed for a rectangular cushion
 * Formula: ((width + seamAllowance) * (length + seamAllowance) * 2) / fabricWidth
 */
function calculateRectangleFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { width = 0, length = 0 } = dimensions;

  // Convert to meters and add seam allowance
  const widthM = inchesToMeters(width) + seamAllowance * 2;
  const lengthM = inchesToMeters(length) + seamAllowance * 2;

  // Calculate fabric needed (2 pieces - top and bottom)
  const totalArea = widthM * lengthM * 2;
  const fabricNeeded = totalArea / fabricWidth;

  // Add 10% waste factor
  return fabricNeeded * 1.1;
}

/**
 * Calculate fabric meters needed for a round cushion
 * Formula: (π * (diameter/2 + seamAllowance)² * 2) / fabricWidth
 */
function calculateRoundFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { diameter = 0 } = dimensions;

  // Convert to meters and add seam allowance
  const radiusM = inchesToMeters(diameter) / 2 + seamAllowance;

  // Calculate fabric needed (2 circular pieces)
  const circleArea = Math.PI * radiusM * radiusM * 2;
  const fabricNeeded = circleArea / fabricWidth;

  // Add 15% waste factor for circular cuts
  return fabricNeeded * 1.15;
}

/**
 * Calculate fabric meters needed for a triangular cushion
 * Formula: ((base * height / 2) + seamAllowance) * 2 / fabricWidth
 */
function calculateTriangleFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { base = 0, height = 0 } = dimensions;

  // Convert to meters
  const baseM = inchesToMeters(base) + seamAllowance * 2;
  const heightM = inchesToMeters(height) + seamAllowance * 2;

  // Calculate triangle area (2 pieces)
  const triangleArea = (baseM * heightM) / 2 * 2;
  const fabricNeeded = triangleArea / fabricWidth;

  // Add 15% waste factor for triangular cuts
  return fabricNeeded * 1.15;
}

/**
 * Calculate fabric meters needed for a trapezium cushion
 * Formula: (((topWidth + bottomWidth) / 2 * height) + seamAllowance) * 2 / fabricWidth
 */
function calculateTrapeziumFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { topWidth = 0, bottomWidth = 0, height = 0 } = dimensions;

  // Convert to meters
  const topM = inchesToMeters(topWidth) + seamAllowance * 2;
  const bottomM = inchesToMeters(bottomWidth) + seamAllowance * 2;
  const heightM = inchesToMeters(height) + seamAllowance * 2;

  // Calculate trapezium area (average of parallel sides * height) * 2 pieces
  const avgWidth = (topM + bottomM) / 2;
  const trapeziumArea = avgWidth * heightM * 2;
  const fabricNeeded = trapeziumArea / fabricWidth;

  // Add 15% waste factor
  return fabricNeeded * 1.15;
}

/**
 * Calculate fabric meters needed for a T-cushion
 * Formula based on combined arm and leg sections
 */
function calculateTCushionFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { armWidth = 0, legWidth = 0, seatDepth = 0 } = dimensions;

  // Convert to meters
  const armM = inchesToMeters(armWidth) + seamAllowance * 2;
  const legM = inchesToMeters(legWidth) + seamAllowance * 2;
  const depthM = inchesToMeters(seatDepth) + seamAllowance * 2;

  // T-cushion: main body (arm section) + leg extension
  const mainBodyArea = armM * depthM;
  const legArea = legM * (depthM * 0.6); // Leg is typically 60% of depth

  const totalArea = (mainBodyArea + legArea) * 2;
  const fabricNeeded = totalArea / fabricWidth;

  // Add 20% waste factor for complex shape
  return fabricNeeded * 1.2;
}

/**
 * Calculate fabric meters needed for an L-shaped cushion
 * Formula based on combined sections
 */
function calculateLShapeFabricMeters(dimensions: Dimensions): number {
  const { fabricWidth, seamAllowance } = DEFAULT_PRICING_CONFIG;
  const { legWidth = 0, armWidth = 0, seatDepth = 0 } = dimensions;

  // Convert to meters
  const legM = inchesToMeters(legWidth) + seamAllowance * 2;
  const armM = inchesToMeters(armWidth) + seamAllowance * 2;
  const depthM = inchesToMeters(seatDepth) + seamAllowance * 2;

  // L-shape: two rectangular sections forming an L
  const section1Area = legM * depthM;
  const section2Area = armM * depthM;

  // Subtract overlapping area (estimated as 30% of smaller section)
  const overlapArea = Math.min(section1Area, section2Area) * 0.3;

  const totalArea = (section1Area + section2Area - overlapArea) * 2;
  const fabricNeeded = totalArea / fabricWidth;

  // Add 20% waste factor for complex shape
  return fabricNeeded * 1.2;
}

/**
 * Main function to calculate fabric meters based on shape
 */
export function calculateFabricMeters(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  let fabricMeters = 0;

  switch (shape) {
    case 'RECTANGLE':
      fabricMeters = calculateRectangleFabricMeters(dimensions);
      break;

    case 'ROUND':
      fabricMeters = calculateRoundFabricMeters(dimensions);
      break;

    case 'TRIANGLE':
      fabricMeters = calculateTriangleFabricMeters(dimensions);
      break;

    case 'TRAPEZIUM':
      fabricMeters = calculateTrapeziumFabricMeters(dimensions);
      break;

    case 'T_CUSHION':
      fabricMeters = calculateTCushionFabricMeters(dimensions);
      break;

    case 'L_SHAPE':
      fabricMeters = calculateLShapeFabricMeters(dimensions);
      break;

    default:
      fabricMeters = 0;
  }

  // Round to 3 decimal places
  return Math.round(fabricMeters * 1000) / 1000;
}

/**
 * Get fabric width from config
 */
export function getFabricWidth(): number {
  return DEFAULT_PRICING_CONFIG.fabricWidth;
}

/**
 * Get seam allowance from config
 */
export function getSeamAllowance(): number {
  return DEFAULT_PRICING_CONFIG.seamAllowance;
}
