'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { CalculatedValues } from '@shared-types/calculator';

interface PriceDisplayProps {
  calculations: CalculatedValues | null;
  markup?: {
    type: 'PERCENTAGE' | 'FIXED';
    value: number;
  };
  showBreakdown?: boolean;
  currency?: string;
  preferences?: any;
  quantity?: number;
}

export function PriceDisplay({
  calculations,
  markup,
  showBreakdown = true,
  currency = '$',
  preferences,
  quantity = 1
}: PriceDisplayProps) {
  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);
  const pathname = usePathname();
  const [allowBreakdown, setAllowBreakdown] = useState(false);

  useEffect(() => {
    if (pathname?.startsWith('/admin')) {
      setAllowBreakdown(true);
      return;
    }

    fetch('/api/platform/settings')
      .then(res => res.json())
      .then(data => {
        setAllowBreakdown(data.showRetailerPriceBreakdown === true);
      })
      .catch(() => setAllowBreakdown(false));
  }, [pathname]);

  if (!calculations) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <p className="text-gray-500 text-center">Configure your cushion to see pricing</p>
      </div>
    );
  }

  const {
    sewingCost,
    fiberfillCost,
    pipingCost,
    tiesCost,
    fabricCost,
    baseSubtotal,
    fabricMeters,
    fabricTier
  } = calculations;

  // Add branding fees if preferences state "ALWAYS"
  let brandingFees = 0;
  let hasPdfFee = false;
  let hasFabricFee = false;

  if (preferences?.pdfPreference === 'ALWAYS') {
    brandingFees += 10;
    hasPdfFee = true;
  }

  if (preferences?.labelPreference === 'ALWAYS' || preferences?.labelPreference === 'PER_ORDER') {
    // Label preference cost is applied per cushion.
    if (preferences?.labelPreference === 'ALWAYS') {
      const totalQty = quantity || 1;
      brandingFees += (8 * totalQty);
      hasFabricFee = true;
    }
  }

  // Apply markup
  let finalPrice = baseSubtotal + brandingFees;
  let markupAmount = 0;

  if (markup && markup.value > 0) {
    if (markup.type === 'PERCENTAGE') {
      markupAmount = finalPrice * (markup.value / 100);
    } else {
      markupAmount = markup.value;
    }
    finalPrice = finalPrice + markupAmount;
  }

  const formatPrice = (price: number) => `${currency}${price.toFixed(2)}`;

  // Tier colors
  const tierColors: Record<number, string> = {
    1: 'bg-green-100 text-green-800',
    2: 'bg-blue-100 text-blue-800',
    3: 'bg-yellow-100 text-yellow-800',
    4: 'bg-orange-100 text-orange-800',
    5: 'bg-purple-100 text-purple-800',
    6: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Header with Total */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
        <p className="text-sm opacity-80 mb-1">Total Price</p>
        <p className="text-4xl font-bold">{formatPrice(finalPrice)}</p>

        {markup && markup.value > 0 && (
          <p className="text-xs opacity-70 mt-2">
            Includes  Markup
          </p>
        )}
      </div>

      <div className="p-4 space-y-4">
        {/* Quick Stats */}
        {/* <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Fabric Meters</p>
            <p className="text-lg font-semibold text-gray-900">{fabricMeters.toFixed(4)}m</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="text-xs text-gray-500">Fabric Tier</p>
            <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${tierColors[fabricTier] || 'bg-gray-100'}`}>
              Tier {fabricTier}
            </span>
          </div>
        </div> */}

        {/* Breakdown Toggle */}
        {(showBreakdown && allowBreakdown) && (
          <div>
            <button
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <span className="text-sm font-medium text-gray-700">Price Breakdown</span>
              <svg
                className={`w-5 h-5 text-gray-500 transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isBreakdownOpen && (
              <div className="mt-3 space-y-2 text-sm animate-in slide-in-from-top-2">
                <BreakdownItem label="Sewing" value={sewingCost} currency={currency} />
                <BreakdownItem
                  label={fiberfillCost > 0 ? 'Foam/Fill' : 'Covers Only'}
                  value={fiberfillCost}
                  currency={currency}
                />
                <BreakdownItem label="Fabric" value={fabricCost} currency={currency} />
                {pipingCost > 0 && (
                  <BreakdownItem label="Piping" value={pipingCost} currency={currency} />
                )}
                {tiesCost > 0 && (
                  <BreakdownItem label="Ties" value={tiesCost} currency={currency} />
                )}

                {hasPdfFee && (
                  <BreakdownItem label="Brand Label (PDF)" value={10} currency={currency} />
                )}
                {hasFabricFee && (
                  <BreakdownItem label={`Brand Label (Fabric) x${quantity}`} value={8 * quantity} currency={currency} />
                )}

                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-medium text-gray-900">
                    <span>Subtotal</span>
                    <span>{formatPrice(baseSubtotal + brandingFees)}</span>
                  </div>
                </div>

                {markupAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Markup</span>
                    <span>+{formatPrice(markupAmount)}</span>
                  </div>
                )}

                <div className="border-t pt-2">
                  <div className="flex justify-between text-lg font-bold text-blue-600">
                    <span>Total</span>
                    <span>{formatPrice(finalPrice)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface BreakdownItemProps {
  label: string;
  value: number;
  currency: string;
}

function BreakdownItem({ label, value, currency }: BreakdownItemProps) {
  return (
    <div className="flex justify-between text-gray-600">
      <span>{label}</span>
      <span>{currency}{value.toFixed(2)}</span>
    </div>
  );
}
