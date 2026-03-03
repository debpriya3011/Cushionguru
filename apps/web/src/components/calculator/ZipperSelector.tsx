'use client';

import Image from 'next/image';

interface OptionConfig {
  id: string;
  name: string;
  imageUrl?: string;
}

interface ZipperSelectorProps {
  positions: OptionConfig[];
  selected: string;
  onSelect: (position: string) => void;
}

export function ZipperSelector({ positions, selected, onSelect }: ZipperSelectorProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {positions.map((position) => (
        <button
          key={position.id}
          onClick={() => onSelect(position.id)}
          className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all ${
            selected === position.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {position.imageUrl ? (
            <div className="relative w-10 h-10">
              <Image
                src={position.imageUrl}
                alt={position.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <ZipperIcon type={position.id} />
          )}
          <span className={`font-medium ${selected === position.id ? 'text-blue-700' : 'text-gray-700'}`}>
            {position.name}
          </span>
          {selected === position.id && (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function ZipperIcon({ type }: { type: string }) {
  if (type === 'No Zipper') {
    return (
      <svg className="w-10 h-10 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="32" height="24" rx="2" />
        <path d="M16 12 L16 36" strokeDasharray="4" />
      </svg>
    );
  }
  
  if (type === 'Long Side') {
    return (
      <svg className="w-10 h-10 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="32" height="24" rx="2" />
        <line x1="8" y1="20" x2="40" y2="20" />
        <circle cx="36" cy="20" r="2" fill="currentColor" />
        <line x1="36" y1="20" x2="36" y2="24" />
      </svg>
    );
  }
  
  // Short Side
  return (
    <svg className="w-10 h-10 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="8" width="24" height="32" rx="2" />
      <line x1="20" y1="8" x2="20" y2="40" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}
