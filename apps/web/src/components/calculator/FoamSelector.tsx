'use client';

import Image from 'next/image';
import { FoamType } from '@shared-types/calculator';

interface FoamConfig {
  id: FoamType;
  name: string;
  description?: string;
  imageUrl: string;
}

interface FoamSelectorProps {
  foams: FoamConfig[];
  selected: FoamType;
  onSelect: (foam: FoamType) => void;
}

const FOAM_DESCRIPTIONS: Record<FoamType, string> = {
  'High Density Foam': 'Durable, firm support. Best for everyday seating.',
  'Dry Fast Foam': 'Open-cell foam for outdoor use. Drains water quickly.',
  'Fiber Fill': 'Soft, plush feel. Good for decorative pillows.',
  'Covers Only': 'Fabric cover without any fill. You provide the insert.',
};

export function FoamSelector({ foams, selected, onSelect }: FoamSelectorProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {foams.map((foam) => (
        <button
          key={foam.id}
          onClick={() => onSelect(foam.id)}
          className={`group relative flex flex-col p-4 rounded-xl border-2 transition-all ${
            selected === foam.id
              ? 'border-blue-500 bg-blue-50 shadow-md'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
          }`}
        >
          <div className="relative w-16 h-16 mx-auto mb-3">
            {foam.imageUrl ? (
              <Image
                src={foam.imageUrl}
                alt={foam.name}
                fill
                className="object-contain"
              />
            ) : (
              <FoamPlaceholder type={foam.id} />
            )}
          </div>
          
          <span className={`text-sm font-medium text-center ${
            selected === foam.id ? 'text-blue-700' : 'text-gray-700'
          }`}>
            {foam.name}
          </span>
          
          <p className="text-xs text-gray-500 text-center mt-2 line-clamp-2">
            {foam.description || FOAM_DESCRIPTIONS[foam.id]}
          </p>

          {selected === foam.id && (
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

function FoamPlaceholder({ type }: { type: FoamType }) {
  const icons: Record<FoamType, JSX.Element> = {
    'High Density Foam': (
      <svg viewBox="0 0 64 64" className="w-full h-full text-gray-400">
        <rect x="8" y="20" width="48" height="32" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
        <path d="M8 28 L56 28" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
        <path d="M8 36 L56 36" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
        <path d="M8 44 L56 44" stroke="currentColor" strokeWidth="1" strokeDasharray="4" />
      </svg>
    ),
    'Dry Fast Foam': (
      <svg viewBox="0 0 64 64" className="w-full h-full text-gray-400">
        <rect x="8" y="20" width="48" height="32" fill="none" stroke="currentColor" strokeWidth="2" rx="4" />
        <circle cx="20" cy="36" r="4" fill="currentColor" opacity="0.3" />
        <circle cx="32" cy="32" r="5" fill="currentColor" opacity="0.3" />
        <circle cx="44" cy="40" r="3" fill="currentColor" opacity="0.3" />
        <path d="M16 16 L24 24 M40 16 L48 24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
    'Fiber Fill': (
      <svg viewBox="0 0 64 64" className="w-full h-full text-gray-400">
        <path d="M16 24 Q32 16 48 24 Q52 36 48 48 Q32 52 16 48 Q12 36 16 24" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M24 32 Q32 28 40 32" stroke="currentColor" strokeWidth="1" fill="none" />
        <path d="M24 40 Q32 44 40 40" stroke="currentColor" strokeWidth="1" fill="none" />
      </svg>
    ),
    'Covers Only': (
      <svg viewBox="0 0 64 64" className="w-full h-full text-gray-400">
        <rect x="12" y="16" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2" rx="2" />
        <rect x="16" y="20" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4" rx="1" />
      </svg>
    ),
  };

  return icons[type];
}
