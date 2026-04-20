/**
 * Netbanking Payment Form Component
 * Bank selection for netbanking payments
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, ChevronDown, AlertCircle } from 'lucide-react';
import {
  netbankingPaymentSchema,
  type NetbankingPaymentFormData,
} from '@/lib/validation/checkoutSchemas';
import type { Bank, BankCode } from '@/types/checkout';

interface NetbankingFormProps {
  onSubmit: (data: NetbankingPaymentFormData) => void;
  isProcessing?: boolean;
}

const popularBanks: Bank[] = [
  { code: 'HDFC', name: 'HDFC Bank', popular: true },
  { code: 'ICIC', name: 'ICICI Bank', popular: true },
  { code: 'SBIN', name: 'State Bank of India', popular: true },
  { code: 'UTIB', name: 'Axis Bank', popular: true },
  { code: 'KKBK', name: 'Kotak Mahindra Bank', popular: true },
];

const otherBanks: Bank[] = [
  { code: 'OTHER', name: 'Punjab National Bank', popular: false },
  { code: 'OTHER', name: 'Bank of Baroda', popular: false },
  { code: 'OTHER', name: 'Canara Bank', popular: false },
  { code: 'OTHER', name: 'Union Bank of India', popular: false },
  { code: 'OTHER', name: 'IndusInd Bank', popular: false },
  { code: 'OTHER', name: 'Yes Bank', popular: false },
  { code: 'OTHER', name: 'IDFC First Bank', popular: false },
  { code: 'OTHER', name: 'Federal Bank', popular: false },
];

export function NetbankingForm({ onSubmit, isProcessing = false }: NetbankingFormProps) {
  const [selectedBank, setSelectedBank] = useState<BankCode | null>(null);
  const [showOtherBanks, setShowOtherBanks] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<NetbankingPaymentFormData>({
    resolver: zodResolver(netbankingPaymentSchema),
    mode: 'onBlur',
  });

  const handleBankSelect = (bank: Bank) => {
    setSelectedBank(bank.code);
    setValue('bankCode', bank.code);
    setValue('bankName', bank.name);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Popular Banks Grid */}
      <div className="space-y-3">
        <h4 className="text-caption text-text-primary font-semibold">Popular Banks</h4>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {popularBanks.map((bank) => (
            <button
              key={bank.code}
              type="button"
              onClick={() => handleBankSelect(bank)}
              disabled={isProcessing}
              className={`glass-card focus-visible:ring-primary-accent/50 flex min-h-[56px] items-center gap-3 rounded-md px-4 py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedBank === bank.code
                  ? 'bg-primary-accent/10 border-primary-accent/30 shadow-sm'
                  : 'hover:bg-white/5'
              } `}
            >
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all duration-200 ${
                  selectedBank === bank.code
                    ? 'border-primary-accent bg-primary-accent'
                    : 'border-white/30'
                } `}
              >
                {selectedBank === bank.code && <div className="h-2 w-2 rounded-full bg-white" />}
              </div>
              <Building2
                className={`h-5 w-5 ${
                  selectedBank === bank.code ? 'text-primary-accent' : 'text-text-disabled'
                }`}
                aria-hidden="true"
              />
              <span
                className={`text-body font-medium ${
                  selectedBank === bank.code ? 'text-primary-accent' : 'text-text-primary'
                }`}
              >
                {bank.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Other Banks Dropdown */}
      <div className="space-y-3">
        <button
          type="button"
          onClick={() => setShowOtherBanks(!showOtherBanks)}
          disabled={isProcessing}
          className="glass-card hover-lift text-text-primary focus-visible:ring-primary-accent/50 flex min-h-[44px] w-full items-center justify-between gap-3 rounded-md px-4 py-3 font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span>Other Banks</span>
          <ChevronDown
            className={`h-5 w-5 transition-transform duration-200 ${
              showOtherBanks ? 'rotate-180' : ''
            }`}
            aria-hidden="true"
          />
        </button>

        {showOtherBanks && (
          <div className="animate-fade-in-up space-y-2">
            <div className="custom-scrollbar max-h-[240px] space-y-2 overflow-y-auto pr-2">
              {otherBanks.map((bank, index) => (
                <button
                  key={`${bank.name}-${index}`}
                  type="button"
                  onClick={() => handleBankSelect(bank)}
                  disabled={isProcessing}
                  className={`glass-card focus-visible:ring-primary-accent/50 flex min-h-[44px] w-full items-center gap-3 rounded-md px-4 py-3 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                    selectedBank === bank.code &&
                    selectedBank === 'OTHER' &&
                    selectedBank === bank.code
                      ? 'bg-primary-accent/10 border-primary-accent/30'
                      : 'hover:bg-white/5'
                  } `}
                >
                  <div
                    className={`flex h-5 w-5 items-center justify-center rounded-full border-2 border-white/30 transition-all duration-200`}
                  />
                  <span className="text-body text-text-primary">{bank.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {errors.bankCode && (
        <div className="glass-card border-error/30 bg-error/5 border p-4">
          <p className="text-caption text-error flex items-center gap-2" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {errors.bankCode.message}
          </p>
        </div>
      )}

      {/* Selected Bank Confirmation */}
      {selectedBank && (
        <div className="glass-card space-y-2 p-4">
          <h4 className="text-caption text-text-primary font-semibold">Selected Bank</h4>
          <div className="flex items-center gap-3">
            <Building2 className="text-primary-accent h-5 w-5" aria-hidden="true" />
            <span className="text-body text-text-primary font-medium">
              {popularBanks.find((b) => b.code === selectedBank)?.name ||
                otherBanks.find((b) => b.code === selectedBank)?.name ||
                'Other Bank'}
            </span>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="glass-card space-y-2 p-4">
        <h4 className="text-caption text-text-primary font-semibold">Important Note</h4>
        <ul className="text-small text-text-secondary space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>You will be redirected to your bank's secure payment page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Login with your netbanking credentials to complete payment</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Do not refresh or close the page during payment</span>
          </li>
        </ul>
      </div>

      {/* Hidden inputs for form submission */}
      <input type="hidden" {...register('bankCode')} />
      <input type="hidden" {...register('bankName')} />
    </form>
  );
}
