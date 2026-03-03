import { CushionShape, Dimensions, PipingOption, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Convert inches to meters
 */
function inchesToMeters(inches: number): number {
  return inches * 0.0254;
}

/**
 * Calculate perimeter for rectangular cushion
 */
function calculateRectanglePerimeter(dimensions: Dimensions): number {
  const { width = 0, length = 0 } = dimensions;
  return 2 * (inchesToMeters(width) + inchesToMeters(length));
}

/**
 * Calculate perimeter (circumference) for round cushion
 */
function calculateRoundPerimeter(dimensions: Dimensions): number {
  const { diameter = 0 } = dimensions;
  return Math.PI * inchesToMeters(diameter);
}

/**
 * Calculate perimeter for triangular cushion
 * Uses the three sides - assuming isosceles triangle for simplicity
 */
function calculateTrianglePerimeter(dimensions: Dimensions): number {
  const { base = 0, height = 0 } = dimensions;

  // For an isosceles triangle: two equal sides calculated from base and height
  const halfBase = inchesToMeters(base) / 2;
  const sideLength = Math.sqrt(
    halfBase * halfBase + inchesToMeters(height) * inchesToMeters(height)
  );

  return inchesToMeters(base) + 2 * sideLength;
}

/**
 * Calculate perimeter for trapezium cushion
 * Sum of all four sides
 */
function calculateTrapeziumPerimeter(dimensions: Dimensions): number {
  const { topWidth = 0, bottomWidth = 0, height = 0 } = dimensions;

  // Calculate slant sides using Pythagorean theorem
  const widthDiff = Math.abs(inchesToMeters(topWidth) - inchesToMeters(bottomWidth)) / 2;
  const slantSide = Math.sqrt(
    widthDiff * widthDiff + inchesToMeters(height) * inchesToMeters(height)
  );

  return inchesToMeters(topWidth) + inchesToMeters(bottomWidth) + 2 * slantSide;
}

/**
 * Calculate perimeter for T-cushion
 * Complex shape: outer perimeter of T shape
 */
function calculateTCushionPerimeter(dimensions: Dimensions): number {
  const { armWidth = 0, legWidth = 0, seatDepth = 0 } = dimensions;

  // Simplified T-shape perimeter calculation
  // Main body (arm section) + leg extension
  const armM = inchesToMeters(armWidth);
  const legM = inchesToMeters(legWidth);
  const depthM = inchesToMeters(seatDepth);

  // Approximate perimeter of T-shape
  // Top edge of arm + two sides of arm + bottom of arm minus leg width + two sides of leg
  const topEdge = armM;
  const armSides = 2 * depthM;
  const bottomEdge = armM - legM;
  const legSides = 2 * (depthM * 0.6); // Leg is typically 60% of depth
  const legBottom = legM;

  return topEdge + armSides + bottomEdge + legSides + legBottom;
}

/**
 * Calculate perimeter for L-shaped cushion
 */
function calculateLShapePerimeter(dimensions: Dimensions): number {
  const { legWidth = 0, armWidth = 0, seatDepth = 0 } = dimensions;

  const legM = inchesToMeters(legWidth);
  const armM = inchesToMeters(armWidth);
  const depthM = inchesToMeters(seatDepth);

  // L-shape outer perimeter
  // Two long sides + two short sides + inner corner
  const longSide = Math.max(legM, armM) + depthM;
  const shortSide = Math.min(legM, armM);
  const innerCorner = Math.abs(legM - armM);

  return 2 * longSide + 2 * shortSide + innerCorner;
}

/**
 * Calculate perimeter based on shape
 */
export function calculatePerimeter(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  switch (shape) {
    case 'RECTANGLE':
      return calculateRectanglePerimeter(dimensions);

    case 'ROUND':
      return calculateRoundPerimeter(dimensions);

    case 'TRIANGLE':
      return calculateTrianglePerimeter(dimensions);

    case 'TRAPEZIUM':
      return calculateTrapeziumPerimeter(dimensions);

    case 'T_CUSHION':
      return calculateTCushionPerimeter(dimensions);

    case 'L_SHAPE':
      return calculateLShapePerimeter(dimensions);

    default:
      return 0;
  }
}

/**
 * Calculate piping cost based on shape, dimensions, and piping option
 */
export function calculatePipingCost(
  shape: CushionShape,
  dimensions: Dimensions,
  pipingOption: PipingOption
): number {
  const { pipingPricePerMeter } = DEFAULT_PRICING_CONFIG;

  if (pipingOption === 'NONE') {
    return 0;
  }

  const perimeter = calculatePerimeter(shape, dimensions);

  // Single piping = 1x perimeter
  // Double piping = 2x perimeter
  const multiplier = pipingOption === 'DOUBLE' ? 2 : 1;

  return perimeter * pipingPricePerMeter * multiplier;
}

/**
 * Get piping length needed
 */
export function getPipingLength(
  shape: CushionShape,
  dimensions: Dimensions,
  pipingOption: PipingOption
): number {
  if (pipingOption === 'NONE') {
    return 0;
  }

  const perimeter = calculatePerimeter(shape, dimensions);
  const multiplier = pipingOption === 'DOUBLE' ? 2 : 1;

  return perimeter * multiplier;
}

/**
 * Get piping price per meter
 */
export function getPipingPricePerMeter(): number {
  return DEFAULT_PRICING_CONFIG.pipingPricePerMeter;
}
