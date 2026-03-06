'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import { FabricHover } from './FabricHover';

interface Fabric {
  id: string;
  code: string;
  name: string;
  imageUrl: string;
  priceTier: 1 | 2 | 3 | 4 | 5 | 6;
  price?: number;
  description?: string;
}

interface FabricBrand {
  id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  fabrics: Fabric[];
}

interface FabricSelectorProps {
  brands: FabricBrand[];
  selected: string;
  onSelect: (code: string, tier: number, price?: number) => void;
  fabricsPerPage?: number;
}

const DEFAULT_FABRICS_PER_PAGE = 50;

export function FabricSelector({
  brands,
  selected,
  onSelect,
  fabricsPerPage = DEFAULT_FABRICS_PER_PAGE
}: FabricSelectorProps) {
  const validBrands = useMemo(
    () => brands.filter(b => b.fabrics && b.fabrics.length > 0),
    [brands]
  );

  const [activeBrandId, setActiveBrandId] = useState<string>('');

  // Auto-select first brand with fabrics if nothing is selected or if activeBrandId becomes invalid
  useMemo(() => {
    if ((!activeBrandId || !validBrands.find(b => b.id === activeBrandId)) && validBrands.length > 0) {
      setActiveBrandId(validBrands[0].id);
    }
  }, [validBrands, activeBrandId]);

  const [visibleCounts, setVisibleCounts] = useState<Record<string, number>>({});
  const [hoveredFabric, setHoveredFabric] = useState<Fabric | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const activeBrand = useMemo(() =>
    validBrands.find(b => b.id === activeBrandId),
    [validBrands, activeBrandId]
  );

  const visibleCount = visibleCounts[activeBrandId] || fabricsPerPage;

  const handleMouseEnter = (fabric: Fabric, e: React.MouseEvent) => {
    setHoveredFabric(fabric);
    setMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX + 20, y: e.clientY + 20 });
  };

  const handleMouseLeave = () => {
    setHoveredFabric(null);
  };

  const loadMore = () => {
    setVisibleCounts(prev => ({
      ...prev,
      [activeBrandId]: (prev[activeBrandId] || fabricsPerPage) + fabricsPerPage
    }));
  };

  // If no brands configured, show placeholder
  if (validBrands.length === 0) {
    return (
      <div className="p-8 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <p className="text-gray-500">No fabrics configured for this calculator. Please contact admin.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Brand Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200">
        {validBrands.map((brand) => (
          <button
            key={brand.id}
            onClick={() => setActiveBrandId(brand.id)}
            className={`px-4 py-2 font-medium text-sm transition-colors relative ${activeBrandId === brand.id
              ? 'text-blue-600'
              : 'text-gray-600 hover:text-gray-800'
              }`}
          >
            {brand.name}
            {activeBrandId === brand.id && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        ))}
      </div>

      {/* Fabric Grid - 6 per row */}
      {activeBrand && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {activeBrand.fabrics.slice(0, visibleCount).map((fabric) => (
              <button
                key={fabric.id}
                onClick={() => onSelect(fabric.code, fabric.priceTier, fabric.price)}
                onMouseEnter={(e) => handleMouseEnter(fabric, e)}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                className={`group relative aspect-square rounded-lg overflow-hidden border-2 transition-all ${selected === fabric.code
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
              >
                {fabric.imageUrl ? (
                  <Image
                    src={fabric.imageUrl}
                    alt={fabric.name}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-xs">No Image</span>
                  </div>
                )}

                {/* Selection indicator */}
                {selected === fabric.code && (
                  <div className="absolute top-2 right-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shadow-md">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                {/* Fabric name overlay */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                  {/* <p className="text-white text-xs font-medium truncate">{fabric.name}</p>
                  <p className="text-white/70 text-[10px]">Tier {fabric.priceTier}</p> */}
                </div>
              </button>
            ))}
          </div>

          {/* Load More Button */}
          {activeBrand.fabrics.length > visibleCount && (
            <button
              onClick={loadMore}
              className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium text-gray-700 transition-colors"
            >
              Load More
              <span className="text-gray-500">
                ({Math.min(fabricsPerPage, activeBrand.fabrics.length - visibleCount)} of {activeBrand.fabrics.length - visibleCount} remaining)
              </span>
            </button>
          )}

          {/* Fabric count indicator */}
          <p className="text-xs text-gray-500 text-center">
            Showing {Math.min(visibleCount, activeBrand.fabrics.length)} of {activeBrand.fabrics.length} fabrics
          </p>
        </div>
      )}

      {/* Hover Preview */}
      <FabricHover fabric={hoveredFabric} position={mousePos} />
    </div>
  );
}
