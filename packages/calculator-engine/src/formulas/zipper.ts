import { CushionShape, Dimensions, ZipperOption, DEFAULT_PRICING_CONFIG } from '../types';

/**
 * Calculate zipper length needed based on cushion shape and dimensions
 * Typically 60-70% of the longest dimension
 */
function calculateZipperLength(
  shape: CushionShape,
  dimensions: Dimensions
): number {
  let longestDimension = 0;

  switch (shape) {
    case 'RECTANGLE':
      longestDimension = Math.max(
        dimensions.width || 0,
        dimensions.length || 0
      );
      break;

    case 'ROUND':
      longestDimension = dimensions.diameter || 0;
      break;

    case 'TRIANGLE':
      longestDimension = Math.max(
        dimensions.base || 0,
        dimensions.height || 0
      );
      break;

    case 'TRAPEZIUM':
      longestDimension = Math.max(
        dimensions.topWidth || 0,
        dimensions.bottomWidth || 0,
        dimensions.height || 0
      );
      break;

    case 'T_CUSHION':
      longestDimension = Math.max(
        (dimensions.armWidth || 0) + (dimensions.legWidth || 0),
        dimensions.seatDepth || 0
      );
      break;

    case 'L_SHAPE':
      longestDimension = Math.max(
        (dimensions.legWidth || 0) + (dimensions.armWidth || 0),
        dimensions.seatDepth || 0
      );
      break;

    default:
      longestDimension = 0;
  }

  // Zipper is typically 60% of the longest dimension
  return longestDimension * 0.6;
}

/**
 * Calculate zipper cost based on shape, dimensions, and zipper option
 */
export function calculateZipperCost(
  shape: CushionShape,
  dimensions: Dimensions,
  zipperOption: ZipperOption
): number {
  const { zipperPrices } = DEFAULT_PRICING_CONFIG;

  if (zipperOption === 'NONE') {
    return 0;
  }

  const basePrice = zipperPrices[zipperOption] || zipperPrices.STANDARD;

  // Add length-based surcharge for larger cushions
  const zipperLength = calculateZipperLength(shape, dimensions);
  const lengthSurcharge = zipperLength > 20 ? (zipperLength - 20) * 0.1 : 0;

  return basePrice + lengthSurcharge;
}

/**
 * Get zipper length needed
 */
export function getZipperLength(
  shape: CushionShape,
  dimensions: Dimensions,
  zipperOption: ZipperOption
): number {
  if (zipperOption === 'NONE') {
    return 0;
  }

  return calculateZipperLength(shape, dimensions);
}

/**
 * Get zipper base price
 */
export function getZipperPrice(zipperOption: ZipperOption): number {
  const { zipperPrices } = DEFAULT_PRICING_CONFIG;
  return zipperPrices[zipperOption] || 0;
}

/**
 * Get all zipper options with prices
 */
export function getAllZipperOptions(): {
  option: ZipperOption;
  price: number;
  name: string;
  description: string;
}[] {
  const { zipperPrices } = DEFAULT_PRICING_CONFIG;

  const zipperInfo: Record<ZipperOption, { name: string; description: string }> = {
    NONE: {
      name: 'No Zipper',
      description: 'Sewn closed, no zipper access',
    },
    STANDARD: {
      name: 'Standard Zipper',
      description: 'Basic nylon zipper for general use',
    },
    WATER_RESISTANT: {
      name: 'Water-Resistant Zipper',
      description: 'Coated zipper for outdoor cushions',
    },
    HEAVY_DUTY: {
      name: 'Heavy-Duty Zipper',
      description: 'Metal zipper for high-traffic applications',
    },
  };

  return (Object.keys(zipperPrices) as ZipperOption[]).map((option) => ({
    option,
    price: zipperPrices[option],
    name: zipperInfo[option].name,
    description: zipperInfo[option].description,
  }));
}
