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
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`flex items-center gap-3 px-5 py-3 rounded-lg border-2 transition-all ${
            selected === option.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {option.imageUrl ? (
            <div className="relative w-10 h-10">
              <Image
                src={option.imageUrl}
                alt={option.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <PipingIcon hasPiping={option.id === 'Piping'} />
          )}
          <span className={`font-medium ${selected === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
            {option.name}
          </span>
          {selected === option.id && (
            <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function PipingIcon({ hasPiping }: { hasPiping: boolean }) {
  return (
    <svg className="w-10 h-10 text-gray-400" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="2">
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
