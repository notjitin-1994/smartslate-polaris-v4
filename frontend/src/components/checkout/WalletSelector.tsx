/**
 * Wallet Selector Component
 * Digital wallet payment options
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Wallet, AlertCircle } from 'lucide-react';
import { walletPaymentSchema, type WalletPaymentFormData } from '@/lib/validation/checkoutSchemas';
import type { Wallet as WalletType, WalletProvider } from '@/types/checkout';

interface WalletSelectorProps {
  onSubmit: (data: WalletPaymentFormData) => void;
  isProcessing?: boolean;
}

const wallets: WalletType[] = [
  {
    provider: 'paytm',
    name: 'Paytm',
    available: true,
  },
  {
    provider: 'phonepe',
    name: 'PhonePe',
    available: true,
  },
  {
    provider: 'amazonpay',
    name: 'Amazon Pay',
    available: true,
  },
  {
    provider: 'mobikwik',
    name: 'MobiKwik',
    available: true,
  },
  {
    provider: 'freecharge',
    name: 'Freecharge',
    available: true,
  },
  {
    provider: 'airtel',
    name: 'Airtel Money',
    available: true,
  },
];

export function WalletSelector({ onSubmit, isProcessing = false }: WalletSelectorProps) {
  const [selectedWallet, setSelectedWallet] = useState<WalletProvider | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<WalletPaymentFormData>({
    resolver: zodResolver(walletPaymentSchema),
    mode: 'onBlur',
  });

  const handleWalletSelect = (wallet: WalletType) => {
    if (!wallet.available) return;
    setSelectedWallet(wallet.provider);
    setValue('provider', wallet.provider);
  };

  const getWalletIcon = (provider: WalletProvider) => {
    // Return colored backgrounds for different wallets
    const colors = {
      paytm: 'from-blue-500 to-blue-600',
      phonepe: 'from-purple-500 to-purple-600',
      amazonpay: 'from-orange-500 to-orange-600',
      mobikwik: 'from-red-500 to-red-600',
      freecharge: 'from-yellow-500 to-yellow-600',
      airtel: 'from-red-600 to-red-700',
    };

    return colors[provider] || 'from-gray-500 to-gray-600';
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Wallets Grid */}
      <div className="space-y-3">
        <h4 className="text-caption text-text-primary font-semibold">Select Wallet</h4>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {wallets.map((wallet) => (
            <button
              key={wallet.provider}
              type="button"
              onClick={() => handleWalletSelect(wallet)}
              disabled={isProcessing || !wallet.available}
              className={`glass-card focus-visible:ring-primary-accent/50 flex min-h-[80px] flex-col items-center justify-center gap-2 rounded-md p-4 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                selectedWallet === wallet.provider
                  ? 'bg-primary-accent/10 border-primary-accent/30 shadow-sm'
                  : wallet.available
                    ? 'hover:bg-white/5'
                    : 'cursor-not-allowed'
              } `}
            >
              {/* Wallet Icon */}
              <div
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getWalletIcon(wallet.provider)} flex items-center justify-center`}
              >
                <Wallet className="h-5 w-5 text-white" aria-hidden="true" />
              </div>

              {/* Wallet Name */}
              <span
                className={`text-caption font-medium ${
                  selectedWallet === wallet.provider ? 'text-primary-accent' : 'text-text-primary'
                }`}
              >
                {wallet.name}
              </span>

              {/* Selection Indicator */}
              {selectedWallet === wallet.provider && (
                <div className="bg-primary-accent absolute top-2 right-2 flex h-5 w-5 items-center justify-center rounded-full">
                  <div className="h-2 w-2 rounded-full bg-white" />
                </div>
              )}

              {/* Unavailable Badge */}
              {!wallet.available && (
                <span className="text-small bg-error/20 text-error border-error/30 absolute top-2 right-2 rounded border px-2 py-0.5">
                  Soon
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Error Display */}
      {errors.provider && (
        <div className="glass-card border-error/30 bg-error/5 border p-4">
          <p className="text-caption text-error flex items-center gap-2" role="alert">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            {errors.provider.message}
          </p>
        </div>
      )}

      {/* Selected Wallet Confirmation */}
      {selectedWallet && (
        <div className="glass-card animate-fade-in-up space-y-3 p-4">
          <h4 className="text-caption text-text-primary font-semibold">Selected Wallet</h4>
          <div className="flex items-center gap-3">
            <div
              className={`h-10 w-10 rounded-lg bg-gradient-to-br ${getWalletIcon(selectedWallet)} flex items-center justify-center`}
            >
              <Wallet className="h-5 w-5 text-white" aria-hidden="true" />
            </div>
            <span className="text-body text-text-primary font-medium">
              {wallets.find((w) => w.provider === selectedWallet)?.name}
            </span>
          </div>

          {/* Balance Check (Mock) */}
          <div className="border-t border-white/10 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-caption text-text-secondary">Available Balance</span>
              <span className="text-caption text-success font-semibold">₹ XX,XXX</span>
            </div>
            <p className="text-small text-text-disabled mt-1">
              Balance will be verified during payment
            </p>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="glass-card space-y-2 p-4">
        <h4 className="text-caption text-text-primary font-semibold">How Wallet Payment Works</h4>
        <ul className="text-small text-text-secondary space-y-1">
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>You will be redirected to your wallet provider's page</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Login and authorize the payment to complete transaction</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-primary-accent mt-0.5">•</span>
            <span>Ensure sufficient balance in your wallet before proceeding</span>
          </li>
        </ul>
      </div>

      {/* Wallet Offers Section */}
      <div className="glass-card border-primary-accent/20 bg-primary-accent/5 space-y-2 border p-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary-accent/20 flex h-6 w-6 items-center justify-center rounded-full">
            <span className="text-caption text-primary-accent font-bold">%</span>
          </div>
          <h4 className="text-caption text-primary-accent font-semibold">Wallet Offers</h4>
        </div>
        <p className="text-small text-text-secondary">
          Check your wallet app for exclusive cashback offers and discounts
        </p>
      </div>

      {/* Hidden input for form submission */}
      <input type="hidden" {...register('provider')} />
    </form>
  );
}
