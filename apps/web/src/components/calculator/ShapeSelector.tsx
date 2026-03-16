'use client';

import Image from 'next/image';
import { CushionShape } from '@shared-types/calculator';

interface ShapeConfig {
  id: CushionShape;
  name: string;
  imageUrl: string;
  description?: string;
}

interface ShapeSelectorProps {
  shapes: ShapeConfig[];
  selected: CushionShape;
  onSelect: (shape: CushionShape) => void;
}

export function ShapeSelector({ shapes, selected, onSelect }: ShapeSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {shapes.map((shape) => (
        <button
          key={shape.id}
          onClick={() => onSelect(shape.id)}
          className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${
            selected === shape.id
              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
          }`}
        >
          <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-lg bg-white/60 flex items-center justify-center">
            {shape.imageUrl ? (
              <Image
                src={shape.imageUrl}
                alt={shape.name}
                fill
                className="object-cover"
              />
            ) : (
              <ShapePlaceholder shape={shape.id} />
            )}
          </div>
          <span className={`text-sm font-medium text-center ${
            selected === shape.id ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {shape.name}
          </span>
          {selected === shape.id && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

// SVG Placeholder shapes when images aren't available
function ShapePlaceholder({ shape }: { shape: CushionShape }) {
  const shapes: Record<CushionShape, JSX.Element> = {
    'Rectangle': (
      <svg viewBox="0 0 100 80" className="w-full h-full">
        <rect x="10" y="10" width="80" height="60" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
      </svg>
    ),
    'Round': (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    'Triangle': (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="50,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    'Trapezium': (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <polygon points="30,10 70,10 90,90 10,90" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    'T Cushion': (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M20,10 L80,10 L80,40 L60,40 L60,90 L40,90 L40,40 L20,40 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
    'L Shape': (
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <path d="M10,10 L40,10 L40,60 L90,60 L90,90 L10,90 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      </svg>
    ),
  };

  return (
    <div className="w-full h-full p-3 text-gray-400 flex items-center justify-center">
      {shapes[shape]}
    </div>
  );
}
