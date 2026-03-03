/**
 * Cushion Calculator Engine
 * Core calculation logic for cushion pricing
 */

import { CalculatorSelections, CalculatedValues, CushionShape } from '@shared-types/calculator';

// ==================== FORMULA CONSTANTS ====================

const SEWING_COST_RATES = [
  { max: 24, rate: 7.5 },
  { max: 48, rate: 11.25 },
  { max: 72, rate: 15 },
  { max: 96, rate: 18.75 },
  { max: 120, rate: 21.25 },
];

const PIPING_COST_RATES = [
  { max: 24, rate: 3 },
  { max: 48, rate: 6 },
  { max: 72, rate: 7.5 },
  { max: 96, rate: 9 },
  { max: 120, rate: 10 },
];

const FIBERFILL_RATES: Record<string, Array<{ max: number; rate: number }>> = {
  'High Density Foam': [
    { max: 12, rate: 0.06237 },
    { max: 18, rate: 0.093555 },
    { max: 36, rate: 0.176715 },
    { max: 48, rate: 0.259875 },
    { max: 60, rate: 0.3170475 },
    { max: 72, rate: 0.384615 },
    { max: 84, rate: 0.4521825 },
    { max: 96, rate: 0.51975 },
    { max: 108, rate: 0.5873175 },
    { max: 120, rate: 0.654885 },
  ],
  'Dry Fast Foam': [
    { max: 12, rate: 0.081081 },
    { max: 18, rate: 0.1216215 },
    { max: 36, rate: 0.2297295 },
    { max: 48, rate: 0.3378375 },
    { max: 60, rate: 0.41216175 },
    { max: 72, rate: 0.4999995 },
    { max: 84, rate: 0.58783725 },
    { max: 96, rate: 0.675675 },
    { max: 108, rate: 0.76351275 },
    { max: 120, rate: 0.8513505 },
  ],
};

const TIES_COSTS: Record<string, number> = {
  'No ties': 0,
  '2 Side': 20,
  '4 Side': 30,
  '4 Corner': 30,
  '6 Side': 30,
  '8 Side': 40,
};

const FABRIC_PRICE_TIERS: Record<number, number> = {
  1: 21.89375,
  2: 24.0125,
  3: 25.425,
  4: 33.90,
  5: 36.725,
  6: 73.45,
};

// Fabric tier mapping based on the extensive fabric list
const FABRIC_TIER_MAP: Record<string, number> = {
  // Tier 1 fabrics ($21.89375)
  'SOLID_SJA 3757_FLANELLE': 1,
  'SOLID_SJA 3938_MIMOSA': 1,
  'SOLID_3738_MACAO': 1,
  'SOLID_3737_ARDOISE': 1,
  'SOLID_5416_ARUBA': 1,
  'SOLID_3706_SHINGLES': 1,
  'SOLID_5404_NATURAL': 1,
  'SOLID_SJA 5453_NATTE_SJA 10021_CANVAS': 1,
  'STRIPE_3777_PORTO NATTE_10022_SAVANE_J234_GREY CHINE': 1,
  'SOLID_SJA 48009/00_ARBOR PEBBLE': 1,
  'SOLID_SJA 5476_NATTE_SJA 10028_HEATHER BEIGE': 1,
  'STRIPE_3776_PORTO BLUE CHINE': 1,
  'SOLID_SJA 3793_MINERAL BLUE CHINE': 1,
  'SOLID_3705_HERITAGE_SJA 18009 00_CHARCOAL': 1,
  'SOLID_SJA 3907_SOLID_SJA 3729_TAUPE CHINE': 1,
  'SOLID_5408_BLACK': 1,
  'SOLID_SJA 5422_LOPI_R034_ANTIQUE BEIGE': 1,
  'SOLID_3728_PARIS RED': 1,
  'SOLID_5436_BURGUNDY': 1,
  'SOLID_SJA 3127_MINK BROWN': 1,
  'SOLID_5477_LOGO RED': 1,
  'STRIPE_3778_QUADRI SAVANE_J234_GREY': 1,
  'STRIPE_3756_LEAD CHINE': 1,
  'SOLID_3741_SILVER SAVANE_J234_GREY': 1,
  'SOLID_SJA 3729_TAUPE': 1,
  'DARK SMOKE': 1,
  'SOLID_SJA 5499_TRUE_BLUE': 1,
  'SOLID_SJA 3965_BLUSH': 1,
  'SOLID_SJA 3969_PUMPKIN': 1,
  'SOLID_SJA 3970_LICHEN': 1,
  'SOLID_SJA 3967_MINT': 1,
  'SOLID_SJA 3966_LOPI_R018_MARBLE': 1,
  'SOLID_SJA 3964_CURACAO': 1,
  'SOLID_SJA 3941_ADRIATIC': 1,
  'SOLID_SJA 3758_NATTE_10030_SOOTY': 1,
  'SOLID_SJA 3906_CARBON': 1,
  'SOLID_SJA 3968_PEPPER': 1,
  'SOLID_SJA 3780_LIN': 1,
  'SOLID_SJA 3991_BLAZER': 1,
  'Remix_Camel_48145 0002': 1,
  'Remix_Denim_48145 0006': 1,
  'Remix_Mesa_48145 0005': 1,
  'Remix_Mushroom_48145 0004': 1,
  'Remix_Parchment_48145 0001': 1,
  'Remix_Silk_48145 0003': 1,
  'Bliss_Aloe_48135 0017': 1,
  'Bliss_Breeze_48135 0016': 1,
  'Bliss_Dew_48135 0014': 1,
  'Bliss_Linen_48135 0001': 1,
  'Bliss_Sand_48135 0002': 1,
  'Bliss_Smoke_48135 0003': 1,
  'Spectrum_Carbon_48085 0000': 1,
  'Spectrum_Caribou_48083 0000': 1,
  'Spectrum_Cayenne_48026 0000': 1,
  'Spectrum_Cilantro_48022 0000': 1,
  'Spectrum_Cherry_48096 0000': 1,
  'Spectrum_Daffodil_48024 0000': 1,
  'Spectrum_Denim_Spectrum_Indigo_48080 0000': 1,
  'Spectrum_Dove_48032 0000': 1,
  'Spectrum_Eggshell_48018 0000': 1,
  'Spectrum_Graphite_48030 0000': 1,
  'Spectrum_Mushroom_48031 0000': 1,
  'Spectrum_Peacock_48081 0000': 1,
  'Spectrum_Sand_48019 0000': 1,
  'Shadow_Sand_51000 0001': 1,
  'Shadow_Snow_51000 0000': 1,
  'Cast_Ash_40428 0000': 1,
  'Cast_Breeze_48094 0000': 1,
  'Cast_Charcoal_40483 0001': 1,
  'Cast_Coral_48108 0000': 1,
  'Cast_Horizon_48091 0000': 1,
  'Cast_Ivy_48141 0000': 1,
  'Cast_Lagoon_40456 0000': 1,
  'Cast_Mist_40429 0000': 1,
  'Cast_Oasis_40430 0000': 1,
  'Cast_Ocean_48103 0000': 1,
  'Cast_Pumice_48114 0000': 1,
  'Cast_Sage_48092 0000': 1,
  'Cast_Shale_40432 0000': 1,
  'Cast_Silver_40433 0000': 1,
  'Cast_Slate_40434 0000': 1,
  'Cast_Teak_48093 0000': 1,

  // Tier 2 fabrics ($24.0125)
  'Solids_Almond_SJA 3983': 2,
  'Solids_Antelope_SJA P107': 2,
  'Solids_Belharra_SJA P105': 2,
  'Solids_Cadet Grey_SJA 5530': 2,
  'Solids_Captain Navy_SJA 5057': 2,
  'Solids_Celadon_SJA P103': 2,
  'Solids_Como_SJA P089': 2,
  'Solids_Coral_SJA P101': 2,
  'Solids_Cusrcuma_SJA P106': 2,
  'Solids_Ebene_SJA P091': 2,
  'Solids_Fjord_SJA P093': 2,
  'Solids_Mistral_SJA P104': 2,
  'Solids_Papyrus_SJA P055': 2,
  'Solids_Steel_SJA P053': 2,
  'Solids_Stone_SJA 3988': 2,
  'Solids_Titanium_SJA P045': 2,
  'Solids_Wadi_SJA P102': 2,
  'Trusted_Coast_40524 0002': 2,
  'Trusted_Fog_40524 0001': 2,
  'Newport_Teak_F014': 2,
  'Yatch Stripe_Grey_SJA 3723': 2,
  'NATTE_SJA 10029_HEATHER SAVANE_J234_GREY': 2,
  'NATTE_10014_NATURE': 2,
  'NATTE_10020_WHITE': 2,
  'NATTE_10022_SAVANE_J234_GREY CHINE': 2,
  'SOLID_3705_NATTE_SJA 10063_HERITAGE_SJA 18009 00_CHARCOAL CHINE': 2,
  'SOLID_SJA_3758_NATTE_10030_SOOTY': 2,
  'SOLID_SJA_5453_NATTE_SJA 10021_CANVAS': 2,
  'NATTE_10025_FROSTY CHINE': 2,
  'SOLID_SJA 3906_NATTE_SJA 10064_CARBON SKY': 2,
  'DARK SOLID_SJA 3729_TAUPE': 2,
  'SOLID_SJA_5476_NATTE_SJA 10028_HEATHER BEIGE': 2,
  'NATTE_10014_NATTE_NAT 10040_NATURE SAVANE_J234_GREY': 2,
  'SOLID_SJA 3780_NATTE_10151_LINEN CHALK': 2,
  'SOLID_SJA 3729_NATTE_10155_TAUPE CHALK': 2,
  'SOLID_SJA 3906_NATTE_10065_CARBON BEIGE': 2,
  'NATTE_NAT 10152_GRAUMEL CHALK': 2,
  'NATTE_NAT 10150_HEATHER CHALK': 2,

  // Tier 3 fabrics ($25.425)
  'Natte_Agave_NAT P097': 3,
  'Natte_Antique_NAT 5077': 3,
  'Natte_Bamboo_NAT 10112': 3,
  'Natte_Bluestone_NAT 10083': 3,
  'Natte_Cadet Grey_NAT 5073': 3,
  'Natte_Charcoal Black_NAT 5075': 3,
  'Natte_Chestnut_NAT 10102': 3,
  'Natte_Clay_NAT P048': 3,
  'Natte_Cosmo_NAT P094': 3,
  'Natte_Dragonfly_NAT P095': 3,
  'Natte_Eclipse_NAT 5057': 3,
  'Natte_Freesia_NAT P099': 3,
  'Natte_Jaspe_NAT P100': 3,
  'Natte_Mango_NAT P098': 3,
  'Natte_Marine_NAT 5076': 3,
  'Natte_Mirage_NAT P096': 3,
  'Natte_Oyster_NAT 5030': 3,
  'Natte_Posedonia_NAT 10111': 3,
  'Natte_Stone_NAT 5078': 3,
  'Natte_Sunlight_NAT 10250': 3,
  'Natte_Tonka_NAT 10101': 3,

  // Tier 4 fabrics ($33.90)
  'SAVANE_J234_GREY': 4,
  'SAVANE_SAV2 J351_TORNADO': 4,

  // Tier 5 fabrics ($36.725)
  'HERITAGE_SJA 18009 00_CHAR': 5,
  'HERITAGE_SJA 18001 00_ASH': 5,
  'HERITAGE_SJA 18021_RUST': 5,
  'HERITAGE_SJA 18017 00_INDIGO': 5,

  // Tier 6 fabrics ($73.45)
  'LOPI_R013_SHADOW': 6,
  'LOPI_R034_ANTIQUE': 6,
  'SOLID_SJA_3966_LOPI_R018_MARBLE': 6,
  'LOPI_LOP R014_COCONUT': 6,
};

// ==================== DIMENSION CALCULATIONS ====================

/**
 * Calculate minimum dimension based on shape
 */
export function calculateMinDimension(shape: CushionShape, dims: any): number {
  switch (shape) {
    case 'Rectangle':
      return Math.min(dims.length || 0, dims.width || 0);
    case 'Trapezium':
    case 'T Cushion':
    case 'L Shape':
      return Math.min(dims.length || 0, dims.bottomWidth || 0, dims.topWidth || 0);
    case 'Round':
      return dims.diameter || 0;
    case 'Triangle':
      return Math.min(dims.length || 0, dims.width || 0);
    default:
      return 0;
  }
}

/**
 * Calculate maximum dimension based on shape
 */
export function calculateMaxDimension(shape: CushionShape, dims: any): number {
  switch (shape) {
    case 'Rectangle':
      return Math.max(dims.length || 0, dims.width || 0);
    case 'Trapezium':
    case 'T Cushion':
    case 'L Shape':
      return Math.max(dims.length || 0, dims.bottomWidth || 0, dims.topWidth || 0);
    case 'Round':
      return dims.diameter || 0;
    case 'Triangle':
      return Math.max(dims.length || 0, dims.width || 0);
    default:
      return 0;
  }
}

/**
 * Calculate fabric meters required
 * Formula: Surface Area / (54 * 12 * 3)
 */
export function calculateFabricMeters(shape: CushionShape, dims: any): number {
  const F7 = dims.length || 0;
  const F8 = dims.width || 0;
  const F10 = dims.thickness || 0;
  const F32 = dims.bottomWidth || 0;
  const F33 = dims.topWidth || 0;
  const F34 = dims.ear || 0;
  const F35 = dims.diameter || 0;

  const DENOMINATOR = 54 * 12 * 3; // = 1944

  switch (shape) {
    case 'Rectangle':
      // (2*((L*W)+(W*T)+(T*L)))/DENOMINATOR
      return (2 * ((F7 * F8) + (F8 * F10) + (F10 * F7))) / DENOMINATOR;

    case 'Trapezium': {
      // ((2*((BW+TW)/2)*L + T*(BW+TW + 2*sqrt(L^2 + (BW-TW)^2))))/DENOMINATOR
      const slantHeight = Math.pow(Math.pow(F7, 2) + Math.pow(F32 - F33, 2), 0.5);
      return ((2 * ((F32 + F33) / 2) * F7 + F10 * (F32 + F33 + 2 * slantHeight))) / DENOMINATOR;
    }

    case 'T Cushion':
    case 'L Shape':
      // (2*((E*TW)+(TW*T)+(E*T)+(T*(L-E))+(W*(L-E))))/DENOMINATOR
      return (2 * ((F34 * F33) + (F33 * F10) + (F34 * F10) + (F10 * (F7 - F34)) + (F8 * (F7 - F34)))) / DENOMINATOR;

    case 'Round':
      // ((2*(PI*(D/2)^2)+(T*PI*D)))/DENOMINATOR
      return ((2 * (Math.PI * Math.pow(F35 / 2, 2)) + (F10 * Math.PI * F35))) / DENOMINATOR;

    case 'Triangle': {
      // ((L*W)+(L*T)+(W*T)+T*sqrt(L^2+W^2))/DENOMINATOR
      const hypotenuse = Math.pow(Math.pow(F7, 2) + Math.pow(F8, 2), 0.5);
      return ((F7 * F8) + (F7 * F10) + (F8 * F10) + (F10 * hypotenuse)) / DENOMINATOR;
    }

    default:
      return 0;
  }
}

// ==================== COST CALCULATIONS ====================

export function calculateSewingCost(maxDimension: number, quantity: number): number {
  if (maxDimension >= 0 && maxDimension <= 24) return 7.5 * quantity;
  if (maxDimension >= 25 && maxDimension <= 48) return 11.25 * quantity;
  if (maxDimension >= 49 && maxDimension <= 72) return 15 * quantity;
  if (maxDimension >= 73 && maxDimension <= 96) return 18.75 * quantity;
  if (maxDimension >= 97 && maxDimension <= 120) return 21.25 * quantity;
  return 0;
}

export function calculateFiberfillCost(
  foamType: string,
  maxDimension: number,
  minDimension: number,
  thickness: number,
  quantity: number,
  shape: CushionShape,
  dims: any
): number {
  if (foamType === 'Covers Only') return 0;

  const F7 = dims.length || 0;
  const F8 = dims.width || 0;
  const F32 = dims.bottomWidth || 0;
  const F35 = dims.diameter || 0;
  const F10 = thickness;
  const F82 = quantity;

  // F88 historically corresponds to `minDimension`
  const F88 = minDimension;

  if (foamType === 'High Density Foam') {
    if (maxDimension >= 0 && maxDimension <= 12) return 0.06237 * F88 * F10 * F82;
    if (maxDimension >= 13 && maxDimension <= 18) return 0.093555 * F88 * F10 * F82;
    if (maxDimension >= 19 && maxDimension <= 36) return 0.176715 * F88 * F10 * F82;
    if (maxDimension >= 37 && maxDimension <= 48) return 0.259875 * F88 * F10 * F82;
    if (maxDimension >= 49 && maxDimension <= 60) return 0.3170475 * F88 * F10 * F82;
    if (maxDimension >= 61 && maxDimension <= 72) return 0.384615 * F88 * F10 * F82;
    if (maxDimension >= 73 && maxDimension <= 84) return 0.4521825 * F88 * F10 * F82;
    if (maxDimension >= 85 && maxDimension <= 96) return 0.51975 * F88 * F10 * F82;
    if (maxDimension >= 97 && maxDimension <= 108) return 0.5873175 * F88 * F10 * F82;
    if (maxDimension >= 109 && maxDimension <= 120) return 0.654885 * F88 * F10 * F82;
    return 0;
  }

  if (foamType === 'Dry Fast Foam') {
    if (maxDimension >= 0 && maxDimension <= 12) return 0.081081 * F88 * F10 * F82;
    if (maxDimension >= 13 && maxDimension <= 18) return 0.1216215 * F88 * F10 * F82;
    if (maxDimension >= 19 && maxDimension <= 36) return 0.2297295 * F88 * F10 * F82;
    if (maxDimension >= 37 && maxDimension <= 48) return 0.3378375 * F88 * F10 * F82;
    if (maxDimension >= 49 && maxDimension <= 60) return 0.41216175 * F88 * F10 * F82;
    if (maxDimension >= 61 && maxDimension <= 72) return 0.4999995 * F88 * F10 * F82;
    if (maxDimension >= 73 && maxDimension <= 84) return 0.58783725 * F88 * F10 * F82;
    if (maxDimension >= 85 && maxDimension <= 96) return 0.675675 * F88 * F10 * F82;
    if (maxDimension >= 97 && maxDimension <= 108) return 0.76351275 * F88 * F10 * F82;
    if (maxDimension >= 109 && maxDimension <= 120) return 0.8513505 * F88 * F10 * F82;
    return 0;
  }

  if (foamType === 'Fiber Fill') {
    return F88 * F10 * 0.003 * F82;
  }

  return 0;
}

export function calculatePipingCost(piping: string, maxDimension: number, quantity: number): number {
  if (piping === 'No Piping' || maxDimension === 0) return 0;
  if (piping === 'Piping' && maxDimension >= 1 && maxDimension <= 24) return 3 * quantity;
  if (piping === 'Piping' && maxDimension >= 25 && maxDimension <= 48) return 6 * quantity;
  if (piping === 'Piping' && maxDimension >= 49 && maxDimension <= 72) return 7.5 * quantity;
  if (piping === 'Piping' && maxDimension >= 73 && maxDimension <= 96) return 9 * quantity;
  if (piping === 'Piping' && maxDimension >= 97 && maxDimension <= 120) return 10 * quantity;
  return 10 * quantity;
}

export function calculateTiesCost(ties: string, quantity: number): number {
  if (ties === 'No ties') return 0;
  if (ties === '2 Side') return 20 * quantity;
  if (ties === '4 Side' || ties === '4 Corner') return 30 * quantity;
  if (ties === '6 Side') return 30 * quantity;
  if (ties === '8 Side') return 40 * quantity;
  return 0;
}

/**
 * Get fabric tier from fabric code
 */
export function getFabricTier(fabricCode: string): number {
  // Check exact match
  if (FABRIC_TIER_MAP[fabricCode]) {
    return FABRIC_TIER_MAP[fabricCode];
  }

  // Check partial matches
  for (const [key, tier] of Object.entries(FABRIC_TIER_MAP)) {
    if (fabricCode.includes(key) || key.includes(fabricCode)) {
      return tier;
    }
  }

  // Default to tier 1
  return 1;
}

export function calculateFabricCost(fabricCode: string, fabricMeters: number, quantity: number, fabricPrice?: number): number {
  if (!fabricCode) return 0;
  if (fabricPrice !== undefined && fabricPrice > 0) {
    return fabricPrice * fabricMeters * quantity;
  }

  const tier = getFabricTier(fabricCode);
  const tierPrice = FABRIC_PRICE_TIERS[tier] || 0;
  return tierPrice * fabricMeters * quantity;
}

// ==================== MAIN CALCULATOR ====================

export interface CalculationResult {
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

export function roundTo(num: number, places: number): number {
  const factor = Math.pow(10, places);
  // Using Number.EPSILON to ensure floating point math correctly rounds up .5
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * Main calculation function
 */
export function calculateQuote(selections: CalculatorSelections): CalculationResult {
  const dims = selections.dimensions;
  const qty = selections.quantity || 1;

  // Calculate dimensions
  const minDimension = calculateMinDimension(selections.shape, dims);
  const maxDimension = calculateMaxDimension(selections.shape, dims);
  const fabricMeters = roundTo(calculateFabricMeters(selections.shape, dims), 4);
  const fabricTier = getFabricTier(selections.fabricCode);

  // Calculate individual unit costs rounded precisely to 4 decimal figures mathematically per rule
  const sewingCostUnit = roundTo(calculateSewingCost(maxDimension, 1), 4);
  const fiberfillCostUnit = roundTo(calculateFiberfillCost(
    selections.foamType,
    maxDimension,
    minDimension,
    dims.thickness || 0,
    1,
    selections.shape,
    dims
  ), 4);
  const pipingCostUnit = roundTo(calculatePipingCost(selections.piping, maxDimension, 1), 4);
  const tiesCostUnit = roundTo(calculateTiesCost(selections.ties, 1), 4);

  // Fabric scaling internally 
  const fabricCostUnit = roundTo(calculateFabricCost(
    selections.fabricCode,
    fabricMeters,
    1,
    selections.fabricPrice
  ), 4);

  // Establish base cost arrays mapping scaling up properly mapping purely via quantity scalar exactly reproducing rounding structure independently 
  const unitBaseSubtotal = sewingCostUnit + fiberfillCostUnit + pipingCostUnit + fabricCostUnit;
  const unitFinalPriceBase = roundTo(unitBaseSubtotal * 4.5, 2);

  // Quantify totals natively 
  const sewingCost = sewingCostUnit * qty;
  const fiberfillCost = fiberfillCostUnit * qty;
  const pipingCost = pipingCostUnit * qty;
  const tiesCost = tiesCostUnit * qty;
  const fabricCost = fabricCostUnit * qty;

  const baseSubtotal = (unitFinalPriceBase * qty) + tiesCost;

  return {
    minDimension,
    maxDimension,
    fabricMeters,
    fabricTier,
    sewingCost,
    fiberfillCost,
    pipingCost,
    tiesCost,
    fabricCost,
    baseSubtotal,
    finalPrice: baseSubtotal,
  };
}

/**
 * Apply retailer markup to base price
 */
export function applyMarkup(
  basePrice: number,
  markupType: 'PERCENTAGE' | 'FIXED',
  markupValue: number
): number {
  if (markupType === 'PERCENTAGE') {
    return basePrice * (1 + markupValue / 100);
  }
  return basePrice + markupValue;
}

/**
 * Calculate final price with markup
 */
export function calculateFinalPrice(
  selections: CalculatorSelections,
  markupType: 'PERCENTAGE' | 'FIXED',
  markupValue: number
): CalculationResult & { markupAmount: number; finalPriceWithMarkup: number } {
  const result = calculateQuote(selections);
  const finalPriceWithMarkup = applyMarkup(result.baseSubtotal, markupType, markupValue);
  const markupAmount = finalPriceWithMarkup - result.baseSubtotal;

  return {
    ...result,
    markupAmount,
    finalPriceWithMarkup,
  };
}

// ==================== VALIDATION ====================

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate calculator selections
 */
export function validateSelections(selections: CalculatorSelections): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate dimensions based on shape
  const dims = selections.dimensions;

  switch (selections.shape) {
    case 'Rectangle':
      if (!dims.length || dims.length <= 0) {
        errors.push({ field: 'length', message: 'Length is required' });
      }
      if (!dims.width || dims.width <= 0) {
        errors.push({ field: 'width', message: 'Width is required' });
      }
      break;

    case 'Round':
      if (!dims.diameter || dims.diameter <= 0) {
        errors.push({ field: 'diameter', message: 'Diameter is required' });
      }
      break;

    case 'Triangle':
      if (!dims.length || dims.length <= 0) {
        errors.push({ field: 'length', message: 'Length is required' });
      }
      if (!dims.width || dims.width <= 0) {
        errors.push({ field: 'width', message: 'Width is required' });
      }
      break;

    case 'Trapezium':
    case 'T Cushion':
    case 'L Shape':
      if (!dims.length || dims.length <= 0) {
        errors.push({ field: 'length', message: 'Length is required' });
      }
      if (!dims.bottomWidth || dims.bottomWidth <= 0) {
        errors.push({ field: 'bottomWidth', message: 'Bottom width is required' });
      }
      if (!dims.topWidth || dims.topWidth <= 0) {
        errors.push({ field: 'topWidth', message: 'Top width is required' });
      }
      if ((selections.shape === 'T Cushion' || selections.shape === 'L Shape') &&
        (!dims.ear || dims.ear <= 0)) {
        errors.push({ field: 'ear', message: 'Ear dimension is required' });
      }
      break;
  }

  // Thickness required for all
  if (!dims.thickness || dims.thickness <= 0) {
    errors.push({ field: 'thickness', message: 'Thickness is required' });
  }

  // Validate quantity
  if (!selections.quantity || selections.quantity < 1) {
    errors.push({ field: 'quantity', message: 'Quantity must be at least 1' });
  }

  // Validate fabric selection
  if (!selections.fabricCode) {
    errors.push({ field: 'fabricCode', message: 'Fabric selection is required' });
  }

  return errors;
}

export default {
  calculateQuote,
  calculateFinalPrice,
  applyMarkup,
  validateSelections,
  calculateFabricMeters,
  calculateSewingCost,
  calculateFiberfillCost,
  calculatePipingCost,
  calculateTiesCost,
  calculateFabricCost,
  getFabricTier,
  calculateMinDimension,
  calculateMaxDimension,
};
