'use client';

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Calculator, ArrowRight, Loader2 } from 'lucide-react';
import Modal from '@/components/pricing/ui/Modal';
import { SeatSelector } from '@/components/pricing/SeatSelector';
import CurrencyToggle from '@/components/pricing/pricing/CurrencyToggle';
import BillingCycleToggle from '@/components/pricing/pricing/BillingCycleToggle';
import { useCurrency } from '@/contexts/CurrencyContext';

interface TeamPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  tierName: 'Crew' | 'Fleet' | 'Armada';
  tierLabel: string;
  priceUSD: number; // Monthly price per seat in USD
  priceINR: number; // Monthly price per seat in INR
  isProcessing?: boolean; // Loading state for checkout
  onNext: (
    seats: number,
    totalUSD: number,
    totalINR: number,
    currency: 'USD' | 'INR',
    billingCycle: 'monthly' | 'yearly'
  ) => void;
}

const TeamPlanModal: React.FC<TeamPlanModalProps> = ({
  isOpen,
  onClose,
  tierName,
  tierLabel,
  priceUSD,
  priceINR,
  isProcessing = false,
  onNext,
}) => {
  // State for seat selection and billing cycle
  const [seats, setSeats] = useState<number>(2);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // Get currency context
  const { currency } = useCurrency();

  // Calculate base price per seat based on billing cycle (yearly = 10x monthly)
  const pricePerSeatUSD = useMemo(
    () => (billingCycle === 'yearly' ? priceUSD * 10 : priceUSD),
    [priceUSD, billingCycle]
  );
  const pricePerSeatINR = useMemo(
    () => (billingCycle === 'yearly' ? priceINR * 10 : priceINR),
    [priceINR, billingCycle]
  );

  // Calculate totals
  const totalUSD = useMemo(() => seats * pricePerSeatUSD, [seats, pricePerSeatUSD]);
  const totalINR = useMemo(() => seats * pricePerSeatINR, [seats, pricePerSeatINR]);

  // Format currency based on selected currency
  const formatCurrency = (amountUSD: number, amountINR: number): string => {
    if (currency === 'USD') {
      return `$${amountUSD.toLocaleString('en-US')}`;
    }
    return `₹${amountINR.toLocaleString('en-IN')}`;
  };

  // Get currency symbol
  const getCurrencySymbol = (): string => {
    return currency === 'USD' ? '$' : '₹';
  };

  // Get billing period text
  const getBillingPeriod = (): string => {
    return billingCycle === 'yearly' ? 'per year' : 'per month';
  };

  // Get monthly equivalent text for yearly billing
  const getMonthlyEquivalent = (): string | null => {
    if (billingCycle === 'yearly') {
      const monthlyUSD = priceUSD;
      const monthlyINR = priceINR;
      return `${formatCurrency(monthlyUSD, monthlyINR)} per seat/month`;
    }
    return null;
  };

  // Handle Next button click
  const handleNext = () => {
    onNext(seats, totalUSD, totalINR, currency, billingCycle);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      maxWidth="md"
      showCloseButton={true}
      labelledById="team-plan-modal-title"
      describedById="team-plan-modal-description"
    >
      {/* Modal Content */}
      <div className="flex flex-col bg-[rgb(2,12,27)] p-4 sm:p-6 md:p-8">
        {/* Header */}
        <div className="mb-6 space-y-3 sm:mb-8 sm:space-y-4">
          <h2
            id="team-plan-modal-title"
            className="text-xl leading-tight font-bold text-[rgb(167,218,219)] sm:text-2xl md:text-3xl"
          >
            Configure Your Team Plan
          </h2>
          <div id="team-plan-modal-description" className="flex flex-col gap-3">
            <span className="flex inline-block min-h-[44px] w-fit items-center rounded-full border border-[rgba(167,218,219,0.3)] bg-[rgba(167,218,219,0.15)] px-4 py-2 text-base font-semibold text-[rgb(167,218,219)] sm:px-5 sm:py-2.5 sm:text-lg">
              {tierName} Plan
            </span>
            <span className="text-sm leading-relaxed text-[rgb(176,197,198)] sm:text-base">
              {tierLabel}
            </span>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="scrollbar-thin scrollbar-thumb-[rgba(167,218,219,0.3)] scrollbar-track-transparent max-h-[55vh] space-y-6 overflow-y-auto px-1 pb-2 sm:max-h-[60vh] sm:space-y-8 md:max-h-[65vh]">
          {/* Seat Selector Section */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex min-h-[44px] items-center gap-3">
              <Users
                className="h-6 w-6 flex-shrink-0 text-[rgb(167,218,219)] sm:h-5 sm:w-5"
                aria-hidden="true"
              />
              <h3 className="text-base leading-snug font-semibold text-[rgb(224,224,224)] sm:text-lg">
                Number of Seats
              </h3>
            </div>
            <div className="touch-manipulation">
              <SeatSelector value={seats} onChange={setSeats} min={2} max={100} />
            </div>
          </div>

          {/* Billing Cycle Toggle Section */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="flex min-h-[44px] items-center text-base leading-snug font-semibold text-[rgb(224,224,224)] sm:text-lg">
              Billing Cycle
            </h3>
            <div className="touch-manipulation">
              <BillingCycleToggle
                billingCycle={billingCycle}
                onBillingCycleChange={setBillingCycle}
              />
            </div>
          </div>

          {/* Currency Toggle Section */}
          <div className="space-y-4 sm:space-y-5">
            <h3 className="flex min-h-[44px] items-center text-base leading-snug font-semibold text-[rgb(224,224,224)] sm:text-lg">
              Choose Currency
            </h3>
            <div className="touch-manipulation">
              <CurrencyToggle />
            </div>
          </div>

          {/* Price Breakdown Section */}
          <div className="space-y-4 sm:space-y-5">
            <div className="flex min-h-[44px] items-center gap-3">
              <Calculator
                className="h-6 w-6 flex-shrink-0 text-[rgb(167,218,219)] sm:h-5 sm:w-5"
                aria-hidden="true"
              />
              <h3 className="text-base leading-snug font-semibold text-[rgb(224,224,224)] sm:text-lg">
                Price Breakdown
              </h3>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${seats}-${currency}-${billingCycle}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="space-y-5 rounded-lg border border-[rgba(167,218,219,0.2)] bg-[rgba(167,218,219,0.05)] p-4 sm:space-y-4 sm:p-5 md:p-6"
              >
                {/* Price per seat */}
                <div className="flex min-h-[44px] flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm leading-relaxed text-[rgb(224,224,224)] sm:text-base">
                    Price per seat
                  </span>
                  <motion.div
                    key={`price-${currency}-${billingCycle}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex flex-col items-start sm:items-end"
                  >
                    <span className="text-base leading-tight font-semibold text-[rgb(167,218,219)] sm:text-lg">
                      {formatCurrency(pricePerSeatUSD, pricePerSeatINR)}/
                      {billingCycle === 'yearly' ? 'year' : 'month'}
                    </span>
                    {getMonthlyEquivalent() && (
                      <span className="mt-1 text-xs text-[rgb(176,197,198)] sm:text-sm">
                        {getMonthlyEquivalent()}
                      </span>
                    )}
                  </motion.div>
                </div>

                {/* Number of seats */}
                <div className="flex min-h-[44px] flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-sm leading-relaxed text-[rgb(224,224,224)] sm:text-base">
                    Number of seats
                  </span>
                  <motion.span
                    key={`seats-${seats}`}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-base leading-tight font-semibold text-[rgb(167,218,219)] sm:text-lg"
                  >
                    {seats}
                  </motion.span>
                </div>

                {/* Divider */}
                <div className="my-4 border-t border-[rgba(167,218,219,0.2)]" />

                {/* Total */}
                <div className="flex flex-col justify-between gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4">
                  <span className="text-lg leading-tight font-semibold text-[rgb(224,224,224)] sm:text-xl">
                    Total
                  </span>
                  <motion.div
                    key={`total-${seats}-${currency}-${billingCycle}`}
                    initial={{ opacity: 0, scale: 0.95, x: 10 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    transition={{ duration: 0.3, type: 'spring', stiffness: 200 }}
                    className="flex flex-col items-start sm:items-end"
                  >
                    <span className="text-2xl leading-none font-bold text-[rgb(167,218,219)] sm:text-3xl md:text-4xl">
                      {getCurrencySymbol()}
                      {currency === 'USD'
                        ? totalUSD.toLocaleString('en-US')
                        : totalINR.toLocaleString('en-IN')}
                    </span>
                    <span className="mt-2 text-sm text-[rgb(176,197,198)] sm:text-base">
                      {getBillingPeriod()}
                    </span>
                  </motion.div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Footer - Full width on mobile, auto on desktop */}
        <div className="mt-6 flex sm:mt-8">
          <button
            onClick={handleNext}
            disabled={isProcessing}
            className="group inline-flex min-h-[48px] w-full touch-manipulation items-center justify-center gap-2.5 rounded-lg bg-[rgb(79,70,229)] px-6 py-3 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:bg-[rgb(67,56,202)] hover:shadow-xl focus-visible:ring-2 focus-visible:ring-[rgb(79,70,229)] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(2,12,27)] focus-visible:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:min-h-[52px] sm:w-auto sm:gap-3 sm:px-8 sm:py-3.5 sm:text-lg md:px-10"
            aria-label={`Proceed to checkout with ${seats} seats for ${getCurrencySymbol()}${
              currency === 'USD'
                ? totalUSD.toLocaleString('en-US')
                : totalINR.toLocaleString('en-IN')
            } ${getBillingPeriod()} - ${tierName} plan`}
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin sm:h-6 sm:w-6" aria-hidden="true" />
                <span className="leading-none">Processing...</span>
              </>
            ) : (
              <>
                <span className="leading-none">Next</span>
                <ArrowRight
                  className="h-5 w-5 transition-transform duration-200 group-hover:translate-x-1 sm:h-6 sm:w-6"
                  aria-hidden="true"
                />
              </>
            )}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default TeamPlanModal;
