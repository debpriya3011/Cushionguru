import { CushionShape, Dimensions, TieOption, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Calculate number of ties needed based on cushion shape and dimensions
 */
function calculateTieCount(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  switch (shape) {
    case 'RECTANGLE': {
      const { width = 0, length = 0 } = dimensions;
      // One tie per corner, plus additional ties for larger cushions
      const cornerTies = 4;
      const sizeFactor = Math.floor((width + length) / 40); // Add ties for every 40 inches of perimeter
      return cornerTies + Math.max(0, sizeFactor - 1);
    }

    case 'ROUND': {
      const { diameter = 0 } = dimensions;
      // Round cushions typically have 4 ties, more for larger sizes
      const baseTies = 4;
      const sizeFactor = Math.floor(diameter / 20);
      return baseTies + Math.max(0, sizeFactor - 1);
    }

    case 'TRIANGLE': {
      // One tie per corner (3 corners)
      return 3;
    }

    case 'TRAPEZIUM': {
      // One tie per corner (4 corners)
      return 4;
    }

    case 'T_CUSHION': {
      // T-cushions need ties at corners and along edges
      const { armWidth = 0, legWidth = 0 } = dimensions;
      const cornerTies = 6; // More corners in T-shape
      const sizeFactor = Math.floor((armWidth + legWidth) / 30);
      return cornerTies + Math.max(0, sizeFactor - 1);
    }

    case 'L_SHAPE': {
      // L-shaped cushions need ties at corners and along edges
      const { legWidth = 0, armWidth = 0 } = dimensions;
      const cornerTies = 6; // More corners in L-shape
      const sizeFactor = Math.floor((legWidth + armWidth) / 30);
      return cornerTies + Math.max(0, sizeFactor - 1);
    }

    default:
      return 4;
  }
}

/**
 * Calculate ties cost based on shape, dimensions, and tie option
 */
export function calculateTiesCost(
  shape: CushionShape,
  dimensions: Dimensions,
  tieOption: TieOption
): number {
  const { tiePrices } = DEFAULT_PRICING_CONFIG;

  if (tieOption === 'NONE') {
    return 0;
  }

  const tieCount = calculateTieCount(shape, dimensions);
  const pricePerTie = tiePrices[tieOption] || tiePrices.STANDARD;

  return tieCount * pricePerTie;
}

/**
 * Get number of ties needed
 */
export function getTieCount(
  shape: CushionShape,
  dimensions: Dimensions,
  tieOption: TieOption
): number {
  if (tieOption === 'NONE') {
    return 0;
  }

  return calculateTieCount(shape, dimensions);
}

/**
 * Get tie price
 */
export function getTiePrice(tieOption: TieOption): number {
  const { tiePrices } = DEFAULT_PRICING_CONFIG;
  return tiePrices[tieOption] || 0;
}

/**
 * Get all tie options with prices
 */
export function getAllTieOptions(): {
  option: TieOption;
  price: number;
  name: string;
}[] {
  const { tiePrices } = DEFAULT_PRICING_CONFIG;

  const names: Record<TieOption, string> = {
    NONE: 'No Ties',
    STANDARD: 'Standard Ties',
    VELCRO: 'Velcro Straps',
    ZIPPER: 'Zipper Ties',
  };

  return (Object.keys(tiePrices) as TieOption[]).map((option) => ({
    option,
    price: tiePrices[option],
    name: names[option],
  }));
}
