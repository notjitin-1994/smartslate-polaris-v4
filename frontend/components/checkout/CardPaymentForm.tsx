/**
 * Card Payment Form Component
 * Comprehensive card payment form with validation
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CreditCard, AlertCircle } from 'lucide-react';
import {
  cardPaymentSchema,
  type CardPaymentFormData,
  detectCardType,
  formatCardNumber,
} from '@/lib/validation/checkoutSchemas';

interface CardPaymentFormProps {
  onSubmit: (data: CardPaymentFormData) => void;
  isProcessing?: boolean;
}

export function CardPaymentForm({ onSubmit, isProcessing = false }: CardPaymentFormProps) {
  const [cardType, setCardType] = useState<string>('unknown');

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CardPaymentFormData>({
    resolver: zodResolver(cardPaymentSchema),
    mode: 'onBlur',
  });

  const cardNumber = watch('cardNumber');

  // Detect card type as user types
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
    setCardType(detectCardType(value));
  };

  const getCardTypeIcon = () => {
    switch (cardType) {
      case 'visa':
        return <span className="text-caption text-primary-accent font-semibold">VISA</span>;
      case 'mastercard':
        return <span className="text-caption text-primary-accent font-semibold">MC</span>;
      case 'amex':
        return <span className="text-caption text-primary-accent font-semibold">AMEX</span>;
      case 'rupay':
        return <span className="text-caption text-primary-accent font-semibold">RuPay</span>;
      default:
        return <CreditCard className="text-text-disabled h-5 w-5" />;
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Card Number */}
      <div className="space-y-2">
        <label htmlFor="cardNumber" className="text-caption text-text-primary font-medium">
          Card Number
        </label>
        <div className="relative">
          <input
            id="cardNumber"
            type="text"
            inputMode="numeric"
            autoComplete="cc-number"
            maxLength={19}
            placeholder="1234 5678 9012 3456"
            {...register('cardNumber')}
            onChange={handleCardNumberChange}
            disabled={isProcessing}
            className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-full rounded-md border px-4 py-3 pr-12 backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.cardNumber ? 'border-error' : 'border-white/10 hover:border-white/20'
            } `}
            aria-invalid={errors.cardNumber ? 'true' : 'false'}
            aria-describedby={errors.cardNumber ? 'cardNumber-error' : undefined}
          />
          <div className="absolute top-1/2 right-3 -translate-y-1/2">{getCardTypeIcon()}</div>
        </div>
        {errors.cardNumber && (
          <p
            id="cardNumber-error"
            className="text-caption text-error flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors.cardNumber.message}
          </p>
        )}
      </div>

      {/* Expiry and CVV Row - Responsive layout */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Expiry Date */}
        <div className="space-y-2">
          <label htmlFor="expiryMonth" className="text-caption text-text-primary font-medium">
            Expiry Date
          </label>
          <div className="flex max-w-[200px] items-center gap-2">
            <input
              id="expiryMonth"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-month"
              maxLength={2}
              placeholder="MM"
              {...register('expiryMonth')}
              disabled={isProcessing}
              className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-20 rounded-md border px-2 py-3 text-center backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.expiryMonth ? 'border-error' : 'border-white/10 hover:border-white/20'
              } `}
              aria-invalid={errors.expiryMonth ? 'true' : 'false'}
              aria-describedby={errors.expiryMonth ? 'expiryMonth-error' : undefined}
            />
            <span className="text-text-secondary text-body px-1">/</span>
            <input
              id="expiryYear"
              type="text"
              inputMode="numeric"
              autoComplete="cc-exp-year"
              maxLength={2}
              placeholder="YY"
              {...register('expiryYear')}
              disabled={isProcessing}
              className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-20 rounded-md border px-2 py-3 text-center backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
                errors.expiryYear ? 'border-error' : 'border-white/10 hover:border-white/20'
              } `}
              aria-invalid={errors.expiryYear ? 'true' : 'false'}
              aria-describedby={errors.expiryYear ? 'expiryYear-error' : undefined}
            />
          </div>
          {(errors.expiryMonth || errors.expiryYear) && (
            <p
              id="expiryMonth-error"
              className="text-caption text-error flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errors.expiryMonth?.message || errors.expiryYear?.message}
            </p>
          )}
        </div>

        {/* CVV */}
        <div className="space-y-2">
          <label htmlFor="cvv" className="text-caption text-text-primary font-medium">
            CVV
          </label>
          <input
            id="cvv"
            type="text"
            inputMode="numeric"
            autoComplete="cc-csc"
            maxLength={4}
            placeholder="123"
            {...register('cvv')}
            disabled={isProcessing}
            className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-full rounded-md border px-3 py-3 text-center backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
              errors.cvv ? 'border-error' : 'border-white/10 hover:border-white/20'
            } `}
            aria-invalid={errors.cvv ? 'true' : 'false'}
            aria-describedby={errors.cvv ? 'cvv-error' : undefined}
          />
          {errors.cvv && (
            <p
              id="cvv-error"
              className="text-caption text-error flex items-center gap-1"
              role="alert"
            >
              <AlertCircle className="h-3 w-3" aria-hidden="true" />
              {errors.cvv.message}
            </p>
          )}
        </div>
      </div>

      {/* Name on Card */}
      <div className="space-y-2">
        <label htmlFor="nameOnCard" className="text-caption text-text-primary font-medium">
          Name on Card
        </label>
        <input
          id="nameOnCard"
          type="text"
          autoComplete="cc-name"
          placeholder="JOHN DOE"
          {...register('nameOnCard')}
          disabled={isProcessing}
          className={`bg-background-surface/50 text-text-primary placeholder:text-text-disabled focus:ring-primary-accent/50 focus:border-primary-accent/50 min-h-[44px] w-full rounded-md border px-4 py-3 uppercase backdrop-blur-sm transition-all duration-200 focus:ring-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
            errors.nameOnCard ? 'border-error' : 'border-white/10 hover:border-white/20'
          } `}
          aria-invalid={errors.nameOnCard ? 'true' : 'false'}
          aria-describedby={errors.nameOnCard ? 'nameOnCard-error' : undefined}
        />
        {errors.nameOnCard && (
          <p
            id="nameOnCard-error"
            className="text-caption text-error flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="h-3 w-3" aria-hidden="true" />
            {errors.nameOnCard.message}
          </p>
        )}
      </div>

      {/* Save Card Checkbox */}
      <div className="flex items-center gap-3 pt-2">
        <input
          id="saveCard"
          type="checkbox"
          {...register('saveCard')}
          disabled={isProcessing}
          className="bg-background-surface/50 text-primary-accent focus:ring-primary-accent/50 h-5 w-5 cursor-pointer rounded border border-white/20 focus:ring-2 focus:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <label
          htmlFor="saveCard"
          className="text-caption text-text-secondary cursor-pointer select-none"
        >
          Save card for future payments
        </label>
      </div>
    </form>
  );
}
