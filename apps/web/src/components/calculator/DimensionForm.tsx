'use client';

import { useMemo } from 'react';
import { CushionShape, Dimensions, DimensionRanges } from '@shared-types/calculator';

interface DimensionFormProps {
  shape: CushionShape;
  dimensions: Dimensions;
  ranges: DimensionRanges;
  onChange: (dims: Partial<Dimensions>) => void;
}

// Define which dimensions are needed for each shape
const SHAPE_DIMENSIONS: Record<CushionShape, Array<{ key: keyof Dimensions; label: string }>> = {
  'Rectangle': [
    { key: 'length', label: 'Length' },
    { key: 'width', label: 'Width' },
    { key: 'thickness', label: 'Thickness' },
  ],
  'Round': [
    { key: 'diameter', label: 'Diameter' },
    { key: 'thickness', label: 'Thickness' },
  ],
  'Triangle': [
    { key: 'length', label: 'Length' },
    { key: 'width', label: 'Width' },
    { key: 'thickness', label: 'Thickness' },
  ],
  'Trapezium': [
    { key: 'length', label: 'Length' },
    { key: 'bottomWidth', label: 'Bottom Width' },
    { key: 'topWidth', label: 'Top Width' },
    { key: 'thickness', label: 'Thickness' },
  ],
  'T Cushion': [
    { key: 'length', label: 'Length' },
    { key: 'bottomWidth', label: 'Bottom Width' },
    { key: 'topWidth', label: 'Top Width' },
    { key: 'thickness', label: 'Thickness' },
    { key: 'ear', label: 'Ear' },
  ],
  'L Shape': [
    { key: 'length', label: 'Length' },
    { key: 'bottomWidth', label: 'Bottom Width' },
    { key: 'topWidth', label: 'Top Width' },
    { key: 'thickness', label: 'Thickness' },
    { key: 'ear', label: 'Ear' },
  ],
};

export function DimensionForm({ shape, dimensions, ranges, onChange }: DimensionFormProps) {
  const fields = SHAPE_DIMENSIONS[shape];

  // Calculate fabric meters (read-only, auto-calculated)
  const fabricMeters = useMemo(() => {
    return calculateFabricMeters(shape, dimensions);
  }, [shape, dimensions]);

  const handleDimensionChange = (key: keyof Dimensions, value: number) => {
    onChange({ [key]: value });
  };

  return (
    <div className="space-y-6">
      {/* Dimension Fields */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {fields.map(({ key, label }) => {
          const range = ranges[key as keyof DimensionRanges];
          if (!range) return null;

          const currentValue = dimensions[key] || range.min;

          return (
            <div key={key} className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                {label} <span className="text-gray-500">({range.unit})</span>
              </label>
              <div className="relative">
                <select
                  value={currentValue}
                  onChange={(e) => handleDimensionChange(key, parseFloat(e.target.value))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                >
                  {generateOptions(range.min, range.max, range.step).map((val) => (
                    <option key={val} value={val}>
                      {val}
                    </option>
                  ))}
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          );
        })}

        {/* Fabric Meters - Calculated (Read-only) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Fabric Meters <span className="text-xs text-gray-500">(auto)</span>
          </label>
          <input
            type="text"
            value={fabricMeters.toFixed(4)}
            readOnly
            className="w-full p-3 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
          />
        </div>
      </div>

      {/* Dimension Info */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-blue-700">
          <span className="font-medium">Tip:</span> All dimensions are in inches.
          Fabric meters are calculated automatically based on your shape and dimensions.
        </p>
      </div>
    </div>
  );
}

// Generate dropdown options for dimensions
function generateOptions(min: number, max: number, step: number): number[] {
  const options: number[] = [];
  for (let i = min; i <= max; i += step) {
    // Round to avoid floating point issues
    options.push(Math.round(i * 100) / 100);
  }
  return options;
}

// Calculate fabric meters (same logic as calculator-engine)
function calculateFabricMeters(shape: CushionShape, dims: Dimensions): number {
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
      return (2 * ((F7 * F8) + (F8 * F10) + (F10 * F7))) / DENOMINATOR;

    case 'Trapezium':
    case 'T Cushion':
    case 'L Shape': {
      const slantHeight = Math.sqrt(Math.pow(F7, 2) + Math.pow(F32 - F33, 2));
      return ((2 * ((F32 + F33) / 2) * F7 + F10 * (F32 + F33 + 2 * slantHeight))) / DENOMINATOR;
    }

    case 'Round':
      return ((2 * (Math.PI * Math.pow(F35 / 2, 2)) + (F10 * Math.PI * F35))) / DENOMINATOR;

    case 'Triangle': {
      const hypotenuse = Math.sqrt(Math.pow(F7, 2) + Math.pow(F8, 2));
      return ((F7 * F8) + (F7 * F10) + (F8 * F10) + (F10 * hypotenuse)) / DENOMINATOR;
    }

    default:
      return 0;
  }
}
