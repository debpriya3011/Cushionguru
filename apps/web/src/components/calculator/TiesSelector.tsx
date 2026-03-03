'use client';

import Image from 'next/image';

interface OptionConfig {
  id: string;
  name: string;
  imageUrl?: string;
}

interface TiesSelectorProps {
  options: OptionConfig[];
  selected: string;
  onSelect: (option: string) => void;
}

export function TiesSelector({ options, selected, onSelect }: TiesSelectorProps) {
  return (
    <div className="flex flex-wrap gap-4">
      {options.map((option) => (
        <button
          key={option.id}
          onClick={() => onSelect(option.id)}
          className={`flex flex-col items-center p-4 rounded-lg border-2 transition-all min-w-[100px] ${
            selected === option.id
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
          }`}
        >
          {option.imageUrl ? (
            <div className="relative w-12 h-12 mb-2">
              <Image
                src={option.imageUrl}
                alt={option.name}
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <TiesIcon type={option.id} />
          )}
          <span className={`text-sm font-medium text-center ${selected === option.id ? 'text-blue-700' : 'text-gray-700'}`}>
            {option.name}
          </span>
          {selected === option.id && (
            <svg className="w-5 h-5 text-blue-500 mt-2" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}

function TiesIcon({ type }: { type: string }) {
  const tiePositions: Record<string, Array<{ x: number; y: number }>> = {
    'No ties': [],
    '2 Side': [{ x: 12, y: 24 }, { x: 36, y: 24 }],
    '4 Side': [{ x: 12, y: 12 }, { x: 36, y: 12 }, { x: 12, y: 36 }, { x: 36, y: 36 }],
    '4 Corner': [{ x: 8, y: 8 }, { x: 40, y: 8 }, { x: 8, y: 40 }, { x: 40, y: 40 }],
    '6 Side': [{ x: 12, y: 12 }, { x: 36, y: 12 }, { x: 12, y: 24 }, { x: 36, y: 24 }, { x: 12, y: 36 }, { x: 36, y: 36 }],
    '8 Side': [{ x: 8, y: 12 }, { x: 24, y: 8 }, { x: 40, y: 12 }, { x: 8, y: 36 }, { x: 24, y: 40 }, { x: 40, y: 36 }, { x: 12, y: 24 }, { x: 36, y: 24 }],
  };

  const positions = tiePositions[type] || [];

  return (
    <svg className="w-12 h-12 text-gray-400" viewBox="0 0 48 48">
      {/* Cushion base */}
      <rect x="8" y="8" width="32" height="32" rx="4" fill="none" stroke="currentColor" strokeWidth="2" />
      
      {/* Ties */}
      {positions.map((pos, i) => (
        <g key={i}>
          <circle cx={pos.x} cy={pos.y} r="3" fill="#92400e" />
          <line 
            x1={pos.x} 
            y1={pos.y} 
            x2={pos.x + (pos.x < 24 ? -6 : 6)} 
            y2={pos.y + (pos.y < 24 ? -6 : 6)} 
            stroke="#92400e" 
            strokeWidth="2" 
          />
        </g>
      ))}
    </svg>
  );
}
