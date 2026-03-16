'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ShapeSelector } from './ShapeSelector';
import { DimensionForm } from './DimensionForm';
import { FoamSelector } from './FoamSelector';
import { FabricSelector } from './FabricSelector';
import { ZipperSelector } from './ZipperSelector';
import { PipingSelector } from './PipingSelector';
import { TiesSelector } from './TiesSelector';
import { CustomerForm } from './CustomerForm';
import { Preview3D } from './Preview3D';
import { PriceDisplay } from './PriceDisplay';
import { calculateQuote, validateSelections } from '@calculator-engine';
import { CalculatorSelections, CushionShape, FoamType, CalculatorConfig, CalculatedValues } from '@shared-types/calculator';

interface CalculatorProps {
  retailerId: string;
  config?: CalculatorConfig;
  features?: { show3D?: boolean; showPrices?: boolean; showBreakdown?: boolean };
  markup?: { type: 'PERCENTAGE' | 'FIXED'; value: number };
  onCalculate?: (calculations: CalculatedValues, selections: CalculatorSelections) => void;
  onSubmit?: (selections: CalculatorSelections, calculations: CalculatedValues, customerData: any) => void;
}

const INITIAL_SELECTIONS: CalculatorSelections = {
  productType: 'sofa-cushion',
  shape: 'Rectangle',
  dimensions: {
    length: 20,
    width: 15,
    thickness: 3,
    quantity: 1,
  },
  quantity: 1,
  foamType: 'High Density Foam',
  fabricCode: 'SOLID_3737_ARDOISE',
  zipperPosition: 'No Zipper',
  piping: 'No Piping',
  ties: 'No ties',
};

// Default configuration
const DEFAULT_CONFIG: CalculatorConfig = {
  name: 'Default Calculator',
  productTypes: [
    { id: 'sofa-cushion', name: 'Sofa Cushion', availableShapes: ['Rectangle', 'T Cushion', 'L Shape'] },
    { id: 'pillow', name: 'Pillow', availableShapes: ['Rectangle', 'Round'] },
    { id: 'outdoor-cushion', name: 'Outdoor Cushion', availableShapes: ['Rectangle', 'Trapezium', 'Round'] },
  ],
  shapes: [
    { id: 'Rectangle', name: 'Rectangle', imageUrl: '/shapes/rectangle.svg', dimensions: ['length', 'width', 'thickness'] as any },
    { id: 'Round', name: 'Round', imageUrl: '/shapes/round.svg', dimensions: ['diameter', 'thickness'] as any },
    { id: 'Triangle', name: 'Triangle', imageUrl: '/shapes/triangle.svg', dimensions: ['length', 'width', 'thickness'] as any },
    { id: 'Trapezium', name: 'Trapezium', imageUrl: '/shapes/trapezium.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness'] as any },
    { id: 'T Cushion', name: 'T Cushion', imageUrl: '/shapes/t-cushion.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness', 'ear'] as any },
    { id: 'L Shape', name: 'L Shape', imageUrl: '/shapes/l-shape.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness', 'ear'] as any },
  ],
  foamTypes: [
    { id: 'High Density Foam', name: 'High Density Foam', imageUrl: '/foams/high-density.svg' },
    { id: 'Dry Fast Foam', name: 'Dry Fast Foam', imageUrl: '/foams/dry-fast.svg' },
    { id: 'Fiber Fill', name: 'Fiber Fill', imageUrl: '/foams/fiber-fill.svg' },
    { id: 'Covers Only', name: 'Covers Only', imageUrl: '/foams/covers-only.svg' },
  ],
  fabricBrands: [],
  zipperPositions: [
    { id: 'No Zipper', name: 'No Zipper' },
    { id: 'Long Side', name: 'Long Side', imageUrl: '/options/zipper-long.svg' },
    { id: 'Short Side', name: 'Short Side', imageUrl: '/options/zipper-short.svg' },
  ],
  pipingOptions: [
    { id: 'No Piping', name: 'No Piping', imageUrl: '/options/no-piping.svg' },
    { id: 'Piping', name: 'Piping', imageUrl: '/options/piping.svg' },
  ],
  tiesOptions: [
    { id: 'No ties', name: 'No Ties', imageUrl: '/options/no-ties.svg' },
    { id: '2 Side', name: '2 Side', imageUrl: '/options/ties-2.svg' },
    { id: '4 Side', name: '4 Side', imageUrl: '/options/ties-4.svg' },
    { id: '4 Corner', name: '4 Corner', imageUrl: '/options/ties-4c.svg' },
  ],
  dimensionRanges: {
    length: { min: 6, max: 120, step: 0.5, unit: 'inches' },
    width: { min: 6, max: 120, step: 0.5, unit: 'inches' },
    thickness: { min: 1, max: 12, step: 0.5, unit: 'inches' },
    diameter: { min: 6, max: 60, step: 0.5, unit: 'inches' },
    bottomWidth: { min: 6, max: 120, step: 0.5, unit: 'inches' },
    topWidth: { min: 6, max: 120, step: 0.5, unit: 'inches' },
    ear: { min: 2, max: 24, step: 0.5, unit: 'inches' },
  },
};

export function Calculator({
  retailerId,
  config: propConfig,
  features = { show3D: true, showPrices: true },
  markup,
  onCalculate,
  onSubmit
}: CalculatorProps) {
  const [config, setConfig] = useState<CalculatorConfig>(propConfig || DEFAULT_CONFIG);
  const [selections, setSelections] = useState<CalculatorSelections>(INITIAL_SELECTIONS);
  const [calculations, setCalculations] = useState<CalculatedValues | null>(null);
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([]);
  const [customerData, setCustomerData] = useState<any>(null);
  const [isFloatingOpen, setIsFloatingOpen] = useState(true);
  const [preferences, setPreferences] = useState<any>(null);
  const [showBottomBar, setShowBottomBar] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        // Scrolling down
        setShowBottomBar(false);
      } else {
        // Scrolling up
        setShowBottomBar(true);
      }
      lastScrollY.current = currentScrollY;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Fetch calculator config for retailer
  useEffect(() => {
    if (propConfig) return;

    fetch(`/api/retailers/${retailerId}/calculator-config`)
      .then(res => res.json())
      .then(data => {
        if (data.config) {
          setConfig(data.config);
        }
        if (data.preferences) {
          setPreferences(data.preferences);
        }
      })
      .catch(console.error);
  }, [retailerId, propConfig]);

  const onCalculateRef = useRef(onCalculate);
  useEffect(() => {
    onCalculateRef.current = onCalculate;
  }, [onCalculate]);

  // Trigger calculation on changes
  useEffect(() => {
    const validationErrors = validateSelections(selections);
    setErrors(validationErrors);

    if (validationErrors.length === 0) {
      const calc = calculateQuote(selections);
      setCalculations(calc);
      onCalculateRef.current?.(calc, selections);
    }
  }, [selections]);

  const updateSelection = useCallback(<K extends keyof CalculatorSelections>(
    key: K,
    value: CalculatorSelections[K]
  ) => {
    setSelections(prev => ({ ...prev, [key]: value }));
  }, []);

  const updateDimensions = useCallback((dims: Partial<CalculatorSelections['dimensions']>) => {
    setSelections(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, ...dims }
    }));
  }, []);

  const handleShapeChange = (shape: CushionShape) => {
    // Reset dimensions when shape changes
    const newDimensions: CalculatorSelections['dimensions'] = { quantity: selections.dimensions.quantity || 1 };

    switch (shape) {
      case 'Rectangle':
        newDimensions.length = 20;
        newDimensions.width = 15;
        newDimensions.thickness = 3;
        break;
      case 'Round':
        newDimensions.diameter = 18;
        newDimensions.thickness = 3;
        break;
      case 'Triangle':
        newDimensions.length = 20;
        newDimensions.width = 15;
        newDimensions.thickness = 3;
        break;
      case 'Trapezium':
      case 'T Cushion':
      case 'L Shape':
        newDimensions.length = 24;
        newDimensions.bottomWidth = 20;
        newDimensions.topWidth = 16;
        newDimensions.thickness = 4;
        if (shape === 'T Cushion' || shape === 'L Shape') {
          newDimensions.ear = 8;
        }
        break;
    }

    setSelections(prev => ({ ...prev, shape, dimensions: newDimensions }));
  };

  const handleSubmit = async () => {
    if (!calculations || !customerData) return;

    await fetch('/api/quotes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: [
          {
            selections,
            calculations
          }
        ],
        customerDetails: customerData,
        status: 'DRAFT'
      }),
    });

    alert("Draft Quote Saved");
  };

  return (
    <>
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-24 relative">
        {/* Main Form Content */}
        <div className="flex-1 space-y-8 w-full">
          {/* Step 1: Product Type */}
          <CalculatorSection title="1. Product Type" step={1}>
            <div className="flex flex-wrap gap-3">
              {config.productTypes.map(type => (
                <button
                  key={type.id}
                  onClick={() => updateSelection('productType', type.id)}
                  className={`px-5 py-3 rounded-lg border-2 font-medium transition-all ${selections.productType === type.id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {type.name}
                </button>
              ))}
            </div>
          </CalculatorSection>

          {/* Step 2: Shape Selection */}
          <CalculatorSection title="2. Select Shape" step={2}>
            <ShapeSelector
              shapes={config.shapes}
              selected={selections.shape}
              onSelect={handleShapeChange}
            />
          </CalculatorSection>

          {/* Step 3: Dimensions */}
          <CalculatorSection title="3. Dimensions" step={3}>
            <DimensionForm
              shape={selections.shape}
              dimensions={selections.dimensions}
              ranges={config.dimensionRanges}
              onChange={updateDimensions}
            />
            <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between sm:justify-start gap-4">
              <label className="block text-sm font-medium text-gray-700">Quantity</label>
              <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden shrink-0 shadow-sm">
                <button
                  type="button"
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 border-r border-gray-200 transition-colors"
                  onClick={() => updateSelection('quantity', Math.max(1, selections.quantity - 1))}
                >
                  <span className="text-xl leading-none font-medium">&minus;</span>
                </button>
                <input
                  type="number"
                  min="1"
                  className="w-16 p-3 text-center focus:outline-none text-gray-900 bg-transparent font-medium"
                  value={selections.quantity}
                  onChange={(e) => updateSelection('quantity', Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  type="button"
                  className="px-4 py-3 bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 border-l border-gray-200 transition-colors"
                  onClick={() => updateSelection('quantity', selections.quantity + 1)}
                >
                  <span className="text-xl leading-none font-medium">&#43;</span>
                </button>
              </div>
            </div>
          </CalculatorSection>

          {/* Step 4: Foam Type */}
          <CalculatorSection title="4. Fill Type" step={4}>
            <FoamSelector
              foams={config.foamTypes}
              selected={selections.foamType}
              onSelect={(foam) => updateSelection('foamType', foam as FoamType)}
            />
          </CalculatorSection>

          {/* Step 5: Fabric Selection */}
          <CalculatorSection title="5. Fabric Selection" step={5}>
            <FabricSelector
              brands={config.fabricBrands.map(b => ({
                ...b,
                name: b.name.replace("Bulk Import - ", "")
              }))}
              selected={selections.fabricCode}
              onSelect={(code, tier, price) => {
                setSelections(prev => ({
                  ...prev,
                  fabricCode: code,
                  fabricPrice: price
                }));
              }}
            />
          </CalculatorSection>

          {/* Step 6: Zipper Position */}
          <CalculatorSection title="6. Zipper Position" step={6}>
            <ZipperSelector
              positions={config.zipperPositions}
              selected={selections.zipperPosition}
              onSelect={(pos) => updateSelection('zipperPosition', pos as any)}
            />
          </CalculatorSection>

          {/* Step 7: Piping */}
          <CalculatorSection title="7. Piping" step={7}>
            <PipingSelector
              options={config.pipingOptions}
              selected={selections.piping}
              onSelect={(piping) => updateSelection('piping', piping as any)}
            />
          </CalculatorSection>

          {/* Step 8: Ties */}
          <CalculatorSection title="8. Ties" step={8}>
            <TiesSelector
              options={config.tiesOptions}
              selected={selections.ties}
              onSelect={(ties) => updateSelection('ties', ties as any)}
            />
          </CalculatorSection>

          {/* Step 9: Instructions */}
          <CalculatorSection title="9. Special Instructions" step={9}>
            <div className="space-y-4">
              <textarea
                value={selections.instructions || ''}
                onChange={(e) => updateSelection('instructions', e.target.value)}
                placeholder="Enter any special instructions, notes, or requirements..."
                className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white"
                rows={4}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Attachments (images, sketches, etc.)
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
              </div>
            </div>
          </CalculatorSection>

          {/* Step 10: Customer Details */}
          <CalculatorSection title="10. Customer Details" step={10}>
            <CustomerForm onChange={setCustomerData} />
          </CalculatorSection>
        </div>

        {/* Floating Price & 3D Box (If toggled by admin) */}
        {(features?.show3D || features?.showPrices) && (
          <div className="w-full lg:w-[380px] lg:shrink-0 lg:sticky lg:top-24 lg:self-start mt-8 lg:mt-0">
            <div className="flex flex-col gap-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setIsFloatingOpen(!isFloatingOpen)}
                  className="bg-white shadow-sm rounded-full px-4 py-2 text-sm font-medium text-gray-700 border hover:bg-gray-50 transition-colors"
                >
                  {isFloatingOpen ? 'Hide Preview' : 'Show Preview'}
                </button>
              </div>

              {isFloatingOpen && (
                <div className="flex flex-col gap-4 max-h-[calc(100vh-140px)] overflow-y-auto hide-scrollbar rounded-xl drop-shadow-xl">
                  {features.show3D && (
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0 w-full">
                      {/* width/height omitted – Preview3D adapts to container via ResizeObserver */}
                      <Preview3D selections={selections} height={300} />
                    </div>
                  )}
                  {features.showPrices && (
                    <div className="bg-white rounded-xl overflow-hidden border border-gray-100 flex-shrink-0">
                      <PriceDisplay
                        calculations={calculations}
                        markup={markup}
                        showBreakdown={features.showBreakdown !== undefined ? features.showBreakdown : true}
                        preferences={preferences}
                        quantity={selections.quantity}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Original Bottom Nav for Submit (Only if onSubmit provided) */}
      {onSubmit && (
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t p-3 lg:p-4 z-40 shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.1)] transition-transform duration-300 ease-in-out ${showBottomBar ? 'translate-y-0' : 'translate-y-[120%]'}`}>
          <div className="max-w-4xl mx-auto flex flex-col xs:flex-row justify-between items-center gap-3 xs:gap-0">
            <div>
              {calculations && (
                <p className="text-lg font-semibold">
                  Total: ${calculations.finalPrice.toFixed(2)}
                </p>
              )}
            </div>
            <button
              onClick={handleSubmit}
              disabled={!calculations || errors.length > 0 || !customerData}
              className="w-full sm:w-auto px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Draft Quote
            </button>
          </div>
        </div>
      )}
    </>
  );
}

// ==================== HELPER COMPONENTS ====================

interface CalculatorSectionProps {
  title: string;
  step: number;
  children: React.ReactNode;
}

function CalculatorSection({ title, step, children }: CalculatorSectionProps) {
  return (
    <section className="bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100">
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center gap-3">
        <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
