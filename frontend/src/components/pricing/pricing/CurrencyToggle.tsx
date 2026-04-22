'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCurrency, Currency } from '@/contexts/CurrencyContext';
import { DollarSign, IndianRupee } from 'lucide-react';

const CurrencyToggle: React.FC = () => {
  const { currency, setCurrency, loading } = useCurrency();

  const handleCurrencyChange = (newCurrency: Currency) => {
    if (!loading) {
      setCurrency(newCurrency);
    }
  };

  return (
    <div className="inline-flex items-center gap-4">
      <div className="inline-flex rounded-lg border border-[rgba(255,255,255,0.1)] bg-[rgba(255,255,255,0.05)] p-1">
        <button
          onClick={() => handleCurrencyChange('USD')}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            currency === 'USD'
              ? 'border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.15)] text-[rgb(167,218,219)]'
              : 'border-none bg-transparent text-[rgb(176,197,198)] hover:bg-[rgba(255,255,255,0.05)]'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <DollarSign className="h-4 w-4" />
          USD
        </button>

        <button
          onClick={() => handleCurrencyChange('INR')}
          disabled={loading}
          className={`flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-semibold transition-all duration-300 ${
            currency === 'INR'
              ? 'border border-[rgb(167,218,219)] bg-[rgba(167,218,219,0.15)] text-[rgb(167,218,219)]'
              : 'border-none bg-transparent text-[rgb(176,197,198)] hover:bg-[rgba(255,255,255,0.05)]'
          } disabled:cursor-not-allowed disabled:opacity-60`}
        >
          <IndianRupee className="h-4 w-4" />
          INR
        </button>
      </div>

      {/* Loading indicator - subtle shimmer effect */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.2 }}
          >
            <div className="h-2 w-2 animate-pulse rounded-full bg-[rgb(167,218,219)]" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurrencyToggle;
