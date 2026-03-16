'use client';

import Image from 'next/image';

interface OptionConfig {
  id: string;
  name: string;
  imageUrl?: string;
}

interface PipingSelectorProps {
  options: OptionConfig[];
  selected: string;
  onSelect: (option: string) => void;
}

export function PipingSelector({ options, selected, onSelect }: PipingSelectorProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`group relative flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200 ${selected === option.id
              ? 'border-blue-500 bg-blue-50 shadow-md ring-2 ring-blue-200'
              : 'border-gray-200 hover:border-gray-300 hover:shadow-md hover:bg-gray-50'
            }`}
        >
          <div className="relative w-full aspect-square mb-3 overflow-hidden rounded-lg bg-white/60 flex items-center justify-center">
            {option.imageUrl ? (
              <Image
                src={option.imageUrl}
                alt={option.name}
                fill
                className="object-cover"
              />
            ) : (
              <PipingIcon hasPiping={option.id === 'Piping'} />
            )}
          </div>
          <span className={`text-sm font-medium text-center ${selected === option.id ? 'text-blue-700' : 'text-gray-700'
            }`}>
            {option.name}
          </span>
          {selected === option.id && (
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

function PipingIcon({ hasPiping }: { hasPiping: boolean }) {
  return (
    <svg className="w-16 h-16 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="8" y="12" width="32" height="24" rx="2" />
      {hasPiping && (
        <>
          <rect x="6" y="10" width="36" height="28" rx="3" strokeWidth="1" strokeDasharray="2" />
          <text x="24" y="28" textAnchor="middle" fontSize="8" fill="currentColor" stroke="none">
            PIPING
          </text>
        </>
      )}
    </svg>
  );
}
