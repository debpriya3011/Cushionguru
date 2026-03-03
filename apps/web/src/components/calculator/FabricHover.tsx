'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

interface Fabric {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  priceTier: number;
  description?: string;
}

interface FabricHoverProps {
  fabric: Fabric | null;
  position: { x: number; y: number };
}

// Tier color mapping
const TIER_COLORS: Record<number, string> = {
  1: 'bg-green-100 text-green-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-purple-100 text-purple-800',
  6: 'bg-red-100 text-red-800',
};

const TIER_NAMES: Record<number, string> = {
  1: 'Standard',
  2: 'Premium',
  3: 'Luxury',
  4: 'Designer',
  5: 'Heritage',
  6: 'Exclusive',
};

export function FabricHover({ fabric, position }: FabricHoverProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (fabric) {
      setIsVisible(true);
    } else {
      // Small delay before hiding to prevent flickering
      const timer = setTimeout(() => setIsVisible(false), 100);
      return () => clearTimeout(timer);
    }
  }, [fabric]);

  if (!isVisible || !fabric) return null;

  // Ensure preview stays within viewport
  const previewWidth = 280;
  const previewHeight = 320;
  
  const adjustedX = Math.min(
    position.x,
    typeof window !== 'undefined' ? window.innerWidth - previewWidth - 20 : position.x
  );
  
  const adjustedY = Math.min(
    position.y,
    typeof window !== 'undefined' ? window.innerHeight - previewHeight - 20 : position.y
  );

  return (
    <div
      className="fixed z-50 pointer-events-none transition-opacity duration-150"
      style={{
        left: adjustedX,
        top: adjustedY,
        opacity: fabric ? 1 : 0,
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl p-4 w-64 border border-gray-100">
        {/* Fabric Image */}
        <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-gray-100">
          {fabric.imageUrl ? (
            <Image
              src={fabric.imageUrl}
              alt={fabric.name}
              fill
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
        </div>

        {/* Fabric Info */}
        <div className="space-y-2">

          <h4 className="font-semibold text-gray-900 text-lg leading-tight">
            {fabric.name}
          </h4>
          {/* <h4 className="font-semibold text-gray-900 text-lg leading-tight">
            {fabric.code}
          </h4> */}
          
          {/* <p className="text-sm text-gray-500 font-mono">
            {fabric.code}
          </p> */}

          {fabric.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {fabric.description}
            </p>
          )}

          {/* Price Tier Badge */}
          {/* <div className="pt-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
              TIER_COLORS[fabric.priceTier] || 'bg-gray-100 text-gray-800'
            }`}>
              Tier {fabric.priceTier} - {TIER_NAMES[fabric.priceTier] || 'Standard'}
            </span>
          </div> */}

          {/* Price info */}
          {/* <p className="text-xs text-gray-500 pt-1">
            Price multiplier: {getTierMultiplier(fabric.priceTier)}x
          </p> */}
        </div>
      </div>
    </div>
  );
}

function getTierMultiplier(tier: number): string {
  const multipliers: Record<number, string> = {
    1: '1.0',
    2: '1.1',
    3: '1.16',
    4: '1.55',
    5: '1.68',
    6: '3.36',
  };
  return multipliers[tier] || '1.0';
}
