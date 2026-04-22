/**
 * Payment Method Tabs Component
 * Tab navigation for different payment methods
 */

'use client';

import { CreditCard, Smartphone, Building2, Wallet } from 'lucide-react';
import type { PaymentMethod } from '@/types/checkout';

interface PaymentMethodTabsProps {
  selectedMethod: PaymentMethod;
  onMethodChange: (method: PaymentMethod) => void;
}

const paymentMethods = [
  {
    id: 'card' as PaymentMethod,
    label: 'Card',
    icon: CreditCard,
  },
  {
    id: 'upi' as PaymentMethod,
    label: 'UPI',
    icon: Smartphone,
  },
  {
    id: 'netbanking' as PaymentMethod,
    label: 'Netbanking',
    icon: Building2,
  },
  {
    id: 'wallet' as PaymentMethod,
    label: 'Wallets',
    icon: Wallet,
  },
];

export function PaymentMethodTabs({ selectedMethod, onMethodChange }: PaymentMethodTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Payment methods"
      className="glass-card grid grid-cols-4 gap-2 p-2"
    >
      {paymentMethods.map((method) => {
        const Icon = method.icon;
        const isSelected = selectedMethod === method.id;

        return (
          <button
            key={method.id}
            role="tab"
            aria-selected={isSelected}
            aria-controls={`${method.id}-panel`}
            id={`${method.id}-tab`}
            onClick={() => onMethodChange(method.id)}
            className={`focus-visible:ring-primary-accent/50 flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-md px-4 py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none ${
              isSelected
                ? 'bg-primary-accent/10 border-primary-accent/30 border shadow-sm'
                : 'border border-transparent hover:bg-white/5'
            } `}
          >
            <Icon
              className={`h-5 w-5 ${isSelected ? 'text-primary-accent' : 'text-text-secondary'}`}
              aria-hidden="true"
            />
            <span
              className={`text-caption font-medium ${
                isSelected ? 'text-primary-accent' : 'text-text-secondary'
              }`}
            >
              {method.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
