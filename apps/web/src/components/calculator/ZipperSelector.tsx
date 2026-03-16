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
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {positions.map((position) => (
        <button
          key={position.id}
          onClick={() => onSelect(position.id)}
          className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${selected === position.id
              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
            }`}
        >
          <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-lg bg-white/60 flex items-center justify-center">
            {position.imageUrl ? (
              <Image
                src={position.imageUrl}
                alt={position.name}
                fill
                className="object-cover"
              />
            ) : (
              <ZipperIcon type={position.id} />
            )}
          </div>
          <span className={`text-sm font-medium text-center ${selected === position.id ? 'text-blue-700' : 'text-gray-700'
            }`}>
            {position.name}
          </span>
          {selected === position.id && (
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

function ZipperIcon({ type }: { type: string }) {
  if (type === 'No Zipper') {
    return (
      <svg className="w-16 h-16 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="32" height="24" rx="2" />
        <path d="M16 12 L16 36" strokeDasharray="4" />
      </svg>
    );
  }

  if (type === 'Long Side') {
    return (
      <svg className="w-16 h-16 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="8" y="12" width="32" height="24" rx="2" />
        <line x1="8" y1="20" x2="40" y2="20" />
        <circle cx="36" cy="20" r="2" fill="currentColor" />
        <line x1="36" y1="20" x2="36" y2="24" />
      </svg>
    );
  }

  // Short Side
  return (
    <svg className="w-16 h-16 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="12" y="8" width="24" height="32" rx="2" />
      <line x1="20" y1="8" x2="20" y2="40" />
      <circle cx="20" cy="12" r="2" fill="currentColor" />
      <line x1="20" y1="12" x2="24" y2="12" />
    </svg>
  );
}
