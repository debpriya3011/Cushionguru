import { CushionShape, Dimensions, FoamType, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Convert inches to meters
 */
function inchesToMeters(inches: number): number {
  return inches * 0.0254;
}

/**
 * Calculate volume in cubic meters for rectangular cushion
 */
function calculateRectangleVolume(dimensions: Dimensions): number {
  const { width = 0, length = 0, depth = 0 } = dimensions;
  return (
    inchesToMeters(width) *
    inchesToMeters(length) *
    inchesToMeters(depth)
  );
}

/**
 * Calculate volume for round cushion (cylinder)
 */
function calculateRoundVolume(dimensions: Dimensions): number {
  const { diameter = 0, depth = 0 } = dimensions;
  const radius = inchesToMeters(diameter) / 2;
  return Math.PI * radius * radius * inchesToMeters(depth);
}

/**
 * Calculate volume for triangular cushion (prism)
 */
function calculateTriangleVolume(dimensions: Dimensions): number {
  const { base = 0, height = 0, depth = 0 } = dimensions;
  const baseArea = (inchesToMeters(base) * inchesToMeters(height)) / 2;
  return baseArea * inchesToMeters(depth);
}

/**
 * Calculate volume for trapezium cushion
 */
function calculateTrapeziumVolume(dimensions: Dimensions): number {
  const { topWidth = 0, bottomWidth = 0, height = 0, depth = 0 } = dimensions;
  const avgWidth = (inchesToMeters(topWidth) + inchesToMeters(bottomWidth)) / 2;
  const baseArea = avgWidth * inchesToMeters(height);
  return baseArea * inchesToMeters(depth);
}

/**
 * Calculate volume for T-cushion
 * Approximated as main section plus leg section
 */
function calculateTCushionVolume(dimensions: Dimensions): number {
  const { armWidth = 0, legWidth = 0, seatDepth = 0, depth = 0 } = dimensions;

  // Main body (arm section)
  const mainVolume =
    inchesToMeters(armWidth) *
    inchesToMeters(seatDepth) *
    inchesToMeters(depth);

  // Leg section (typically 60% of depth)
  const legVolume =
    inchesToMeters(legWidth) *
    inchesToMeters(seatDepth * 0.6) *
    inchesToMeters(depth);

  return mainVolume + legVolume;
}

/**
 * Calculate volume for L-shaped cushion
 */
function calculateLShapeVolume(dimensions: Dimensions): number {
  const { legWidth = 0, armWidth = 0, seatDepth = 0, depth = 0 } = dimensions;

  // Two sections forming L
  const section1Volume =
    inchesToMeters(legWidth) *
    inchesToMeters(seatDepth) *
    inchesToMeters(depth);

  const section2Volume =
    inchesToMeters(armWidth) *
    inchesToMeters(seatDepth) *
    inchesToMeters(depth);

  // Subtract overlapping volume (estimated as 30% of smaller section)
  const overlapVolume = Math.min(section1Volume, section2Volume) * 0.3;

  return section1Volume + section2Volume - overlapVolume;
}

/**
 * Calculate cushion volume based on shape
 */
export function calculateVolume(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  switch (shape) {
    case 'RECTANGLE':
      return calculateRectangleVolume(dimensions);

    case 'ROUND':
      return calculateRoundVolume(dimensions);

    case 'TRIANGLE':
      return calculateTriangleVolume(dimensions);

    case 'TRAPEZIUM':
      return calculateTrapeziumVolume(dimensions);

    case 'T_CUSHION':
      return calculateTCushionVolume(dimensions);

    case 'L_SHAPE':
      return calculateLShapeVolume(dimensions);

    default:
      return 0;
  }
}

/**
 * Calculate fiberfill cost based on foam type and cushion volume
 * Memory foam and latex don't need fiberfill
 */
export function calculateFiberfillCost(
  shape: CushionShape,
  dimensions: Dimensions,
  foamType: FoamType
): number {
  const { fiberfillPrices } = DEFAULT_PRICING_CONFIG;

  // Memory foam and latex don't need fiberfill
  if (foamType === 'MEMORY_FOAM' || foamType === 'LATEX') {
    return 0;
  }

  const volume = calculateVolume(shape, dimensions);

  // Fiberfill price is per cubic meter
  const fiberfillPrice = fiberfillPrices[foamType] || fiberfillPrices.STANDARD_25D;

  // Calculate cost (volume * price per cubic meter)
  // Add 20% extra for stuffing density
  return volume * fiberfillPrice * 1.2;
}

/**
 * Get fiberfill price for foam type
 */
export function getFiberfillPrice(foamType: FoamType): number {
  const { fiberfillPrices } = DEFAULT_PRICING_CONFIG;
  return fiberfillPrices[foamType] || 0;
}

/**
 * Check if foam type requires fiberfill
 */
export function requiresFiberfill(foamType: FoamType): boolean {
  return foamType !== 'MEMORY_FOAM' && foamType !== 'LATEX';
}
