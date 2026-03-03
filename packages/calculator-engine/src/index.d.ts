/**
 * Cushion Calculator Engine
 * Core calculation logic for cushion pricing
 */
import { CalculatorSelections, CushionShape } from '@shared-types/calculator';
/**
 * Calculate minimum dimension based on shape
 */
export declare function calculateMinDimension(shape: CushionShape, dims: any): number;
/**
 * Calculate maximum dimension based on shape
 */
export declare function calculateMaxDimension(shape: CushionShape, dims: any): number;
/**
 * Calculate fabric meters required
 * Formula: Surface Area / (54 * 12 * 3)
 */
export declare function calculateFabricMeters(shape: CushionShape, dims: any): number;
export declare function calculateSewingCost(maxDimension: number, quantity: number): number;
export declare function calculateFiberfillCost(foamType: string, maxDimension: number, minDimension: number, thickness: number, quantity: number, shape: CushionShape, dims: any): number;
export declare function calculatePipingCost(piping: string, maxDimension: number, quantity: number): number;
export declare function calculateTiesCost(ties: string, quantity: number): number;
/**
 * Get fabric tier from fabric code
 */
export declare function getFabricTier(fabricCode: string): number;
export declare function calculateFabricCost(fabricCode: string, fabricMeters: number, quantity: number, fabricPrice?: number): number;
export interface CalculationResult {
    minDimension: number;
    maxDimension: number;
    fabricMeters: number;
    fabricTier: number;
    sewingCost: number;
    fiberfillCost: number;
    pipingCost: number;
    tiesCost: number;
    fabricCost: number;
    baseSubtotal: number;
    finalPrice: number;
}
export declare function roundTo(num: number, places: number): number;
/**
 * Main calculation function
 */
export declare function calculateQuote(selections: CalculatorSelections): CalculationResult;
/**
 * Apply retailer markup to base price
 */
export declare function applyMarkup(basePrice: number, markupType: 'PERCENTAGE' | 'FIXED', markupValue: number): number;
/**
 * Calculate final price with markup
 */
export declare function calculateFinalPrice(selections: CalculatorSelections, markupType: 'PERCENTAGE' | 'FIXED', markupValue: number): CalculationResult & {
    markupAmount: number;
    finalPriceWithMarkup: number;
};
export interface ValidationError {
    field: string;
    message: string;
}
/**
 * Validate calculator selections
 */
export declare function validateSelections(selections: CalculatorSelections): ValidationError[];
declare const _default: {
    calculateQuote: typeof calculateQuote;
    calculateFinalPrice: typeof calculateFinalPrice;
    applyMarkup: typeof applyMarkup;
    validateSelections: typeof validateSelections;
    calculateFabricMeters: typeof calculateFabricMeters;
    calculateSewingCost: typeof calculateSewingCost;
    calculateFiberfillCost: typeof calculateFiberfillCost;
    calculatePipingCost: typeof calculatePipingCost;
    calculateTiesCost: typeof calculateTiesCost;
    calculateFabricCost: typeof calculateFabricCost;
    getFabricTier: typeof getFabricTier;
    calculateMinDimension: typeof calculateMinDimension;
    calculateMaxDimension: typeof calculateMaxDimension;
};
export default _default;
//# sourceMappingURL=index.d.ts.map