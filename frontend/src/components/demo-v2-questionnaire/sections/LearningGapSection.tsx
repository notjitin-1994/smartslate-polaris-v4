'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import { cn } from '@/lib/utils';
import { StaticQuestionnaireFormData } from '@/app/demo-v2-questionnaire/page';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { QuestionnaireSelect } from '@/components/wizard/static-questions/QuestionnaireSelect';

const MOTIVATION_FACTORS = [
  { value: 'Career Advancement', label: 'Career Advancement' },
  { value: 'Compliance Requirement', label: 'Compliance Requirement' },
  { value: 'Performance Improvement', label: 'Performance Improvement' },
  { value: 'New Role/Responsibility', label: 'New Role/Responsibility' },
  { value: 'Personal Interest', label: 'Personal Interest' },
  { value: 'Manager Request', label: 'Manager Request' },
  { value: 'Industry Trend', label: 'Industry Trend' },
  { value: 'Other', label: 'Other' },
];

const LEARNING_LOCATIONS = [
  { value: 'Office/Workplace', label: 'Office/Workplace' },
  { value: 'Home', label: 'Home' },
  { value: 'During Commute', label: 'During Commute' },
  { value: 'While Traveling', label: 'While Traveling' },
  { value: 'Flexible/Any Location', label: 'Flexible/Any Location' },
];

const DEVICES_USED = [
  { value: 'Desktop Computer', label: 'Desktop Computer' },
  { value: 'Laptop', label: 'Laptop' },
  { value: 'Tablet', label: 'Tablet' },
  { value: 'Mobile Phone', label: 'Mobile Phone' },
  { value: 'VR Headset', label: 'VR Headset' },
  { value: 'Other', label: 'Other' },
];

const HOURS_PER_WEEK = [
  { value: '<1 hour', label: 'Less than 1 hour per week' },
  { value: '1-2 hours', label: '1-2 hours per week' },
  { value: '3-5 hours', label: '3-5 hours per week' },
  { value: '6-10 hours', label: '6-10 hours per week' },
  { value: '11-20 hours', label: '11-20 hours per week' },
  { value: '20+ hours', label: '20+ hours per week' },
];

const LEARNER_COUNT_RANGES = [
  { value: '1-10', label: '1-10 learners' },
  { value: '11-25', label: '11-25 learners' },
  { value: '26-50', label: '26-50 learners' },
  { value: '51-100', label: '51-100 learners' },
  { value: '101-250', label: '101-250 learners' },
  { value: '251-500', label: '251-500 learners' },
  { value: '501-1000', label: '501-1000 learners' },
  { value: '1000+', label: '1000+ learners' },
];

const KNOWLEDGE_LEVELS = [
  { value: 1, label: 'No Knowledge', description: 'Complete beginner, no prior exposure' },
  { value: 2, label: 'Beginner', description: 'Basic understanding, limited experience' },
  { value: 3, label: 'Intermediate', description: 'Some experience, can perform basic tasks' },
  { value: 4, label: 'Advanced', description: 'Extensive experience, can handle complex tasks' },
  { value: 5, label: 'Expert', description: 'Expert-level knowledge and experience' },
];

const CURRENCIES = {
  // North America
  USD: { symbol: '$', locale: 'en-US', maxValue: 4999999, label: 'Under $5M', name: 'US Dollar' },
  CAD: {
    symbol: 'C$',
    locale: 'en-CA',
    maxValue: 6500000,
    label: 'Under C$6.5M',
    name: 'Canadian Dollar',
  },
  MXN: {
    symbol: '$',
    locale: 'es-MX',
    maxValue: 90000000,
    label: 'Under $90M',
    name: 'Mexican Peso',
  },

  // Europe
  EUR: { symbol: '€', locale: 'de-DE', maxValue: 4500000, label: 'Under €4.5M', name: 'Euro' },
  GBP: {
    symbol: '£',
    locale: 'en-GB',
    maxValue: 4000000,
    label: 'Under £4M',
    name: 'British Pound',
  },
  CHF: {
    symbol: 'CHF',
    locale: 'de-CH',
    maxValue: 4500000,
    label: 'Under CHF 4.5M',
    name: 'Swiss Franc',
  },
  SEK: {
    symbol: 'kr',
    locale: 'sv-SE',
    maxValue: 50000000,
    label: 'Under 50M kr',
    name: 'Swedish Krona',
  },
  NOK: {
    symbol: 'kr',
    locale: 'nb-NO',
    maxValue: 50000000,
    label: 'Under 50M kr',
    name: 'Norwegian Krone',
  },
  DKK: {
    symbol: 'kr',
    locale: 'da-DK',
    maxValue: 35000000,
    label: 'Under 35M kr',
    name: 'Danish Krone',
  },
  PLN: {
    symbol: 'zł',
    locale: 'pl-PL',
    maxValue: 20000000,
    label: 'Under 20M zł',
    name: 'Polish Złoty',
  },
  CZK: {
    symbol: 'Kč',
    locale: 'cs-CZ',
    maxValue: 110000000,
    label: 'Under 110M Kč',
    name: 'Czech Koruna',
  },
  HUF: {
    symbol: 'Ft',
    locale: 'hu-HU',
    maxValue: 1800000000,
    label: 'Under 1.8B Ft',
    name: 'Hungarian Forint',
  },

  // Asia-Pacific
  AUD: {
    symbol: 'A$',
    locale: 'en-AU',
    maxValue: 7000000,
    label: 'Under A$7M',
    name: 'Australian Dollar',
  },
  NZD: {
    symbol: 'NZ$',
    locale: 'en-NZ',
    maxValue: 8000000,
    label: 'Under NZ$8M',
    name: 'New Zealand Dollar',
  },
  JPY: {
    symbol: '¥',
    locale: 'ja-JP',
    maxValue: 700000000,
    label: 'Under ¥700M',
    name: 'Japanese Yen',
  },
  CNY: {
    symbol: '¥',
    locale: 'zh-CN',
    maxValue: 35000000,
    label: 'Under ¥35M',
    name: 'Chinese Yuan',
  },
  HKD: {
    symbol: 'HK$',
    locale: 'zh-HK',
    maxValue: 39000000,
    label: 'Under HK$39M',
    name: 'Hong Kong Dollar',
  },
  SGD: {
    symbol: 'S$',
    locale: 'en-SG',
    maxValue: 7000000,
    label: 'Under S$7M',
    name: 'Singapore Dollar',
  },
  KRW: {
    symbol: '₩',
    locale: 'ko-KR',
    maxValue: 6000000000,
    label: 'Under ₩6B',
    name: 'South Korean Won',
  },
  INR: {
    symbol: '₹',
    locale: 'en-IN',
    maxValue: 410000000,
    label: 'Under ₹410M',
    name: 'Indian Rupee',
  },
  THB: {
    symbol: '฿',
    locale: 'th-TH',
    maxValue: 180000000,
    label: 'Under ฿180M',
    name: 'Thai Baht',
  },
  MYR: {
    symbol: 'RM',
    locale: 'ms-MY',
    maxValue: 22000000,
    label: 'Under RM22M',
    name: 'Malaysian Ringgit',
  },
  IDR: {
    symbol: 'Rp',
    locale: 'id-ID',
    maxValue: 75000000000,
    label: 'Under Rp75B',
    name: 'Indonesian Rupiah',
  },
  PHP: {
    symbol: '₱',
    locale: 'en-PH',
    maxValue: 280000000,
    label: 'Under ₱280M',
    name: 'Philippine Peso',
  },

  // Middle East & Africa
  SAR: {
    symbol: '﷼',
    locale: 'ar-SA',
    maxValue: 19000000,
    label: 'Under ﷼19M',
    name: 'Saudi Riyal',
  },
  AED: {
    symbol: 'د.إ',
    locale: 'ar-AE',
    maxValue: 18500000,
    label: 'Under د.إ18.5M',
    name: 'UAE Dirham',
  },
  ILS: {
    symbol: '₪',
    locale: 'he-IL',
    maxValue: 19000000,
    label: 'Under ₪19M',
    name: 'Israeli Shekel',
  },
  ZAR: {
    symbol: 'R',
    locale: 'en-ZA',
    maxValue: 90000000,
    label: 'Under R90M',
    name: 'South African Rand',
  },
  EGP: {
    symbol: '£',
    locale: 'ar-EG',
    maxValue: 240000000,
    label: 'Under £240M',
    name: 'Egyptian Pound',
  },

  // South America
  BRL: {
    symbol: 'R$',
    locale: 'pt-BR',
    maxValue: 25000000,
    label: 'Under R$25M',
    name: 'Brazilian Real',
  },
  ARS: {
    symbol: '$',
    locale: 'es-AR',
    maxValue: 2500000000,
    label: 'Under $2.5B',
    name: 'Argentine Peso',
  },
  CLP: {
    symbol: '$',
    locale: 'es-CL',
    maxValue: 4000000000,
    label: 'Under $4B',
    name: 'Chilean Peso',
  },
  COP: {
    symbol: '$',
    locale: 'es-CO',
    maxValue: 25000000000,
    label: 'Under $25B',
    name: 'Colombian Peso',
  },
  PEN: {
    symbol: 'S/',
    locale: 'es-PE',
    maxValue: 19000000,
    label: 'Under S/19M',
    name: 'Peruvian Sol',
  },

  // Other Major Currencies
  RUB: {
    symbol: '₽',
    locale: 'ru-RU',
    maxValue: 450000000,
    label: 'Under ₽450M',
    name: 'Russian Ruble',
  },
  TRY: {
    symbol: '₺',
    locale: 'tr-TR',
    maxValue: 140000000,
    label: 'Under ₺140M',
    name: 'Turkish Lira',
  },
  ZMW: {
    symbol: 'ZK',
    locale: 'en-ZM',
    maxValue: 130000000,
    label: 'Under ZK130M',
    name: 'Zambian Kwacha',
  },
};

export function LearningGapSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionnaireFormData>();

  const watchedValues = watch();

  // Get current currency and its configuration with proper null checks
  const currentCurrency =
    watchedValues?.section_3_learning_gap?.budget_available?.currency || 'USD';
  const currencyConfig = CURRENCIES[currentCurrency as keyof typeof CURRENCIES] || CURRENCIES.USD;

  // Format number according to currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(currencyConfig.locale).format(value);
  };

  const handleMotivationChange = (motivation: string, checked: boolean) => {
    const currentMotivations = watchedValues?.section_3_learning_gap?.motivation_factors || [];
    if (checked) {
      setValue('section_3_learning_gap.motivation_factors', [...currentMotivations, motivation]);
    } else {
      setValue(
        'section_3_learning_gap.motivation_factors',
        currentMotivations.filter((m) => m !== motivation)
      );
    }
  };

  const handleLocationChange = (location: string, checked: boolean) => {
    const currentLocations = watchedValues?.section_3_learning_gap?.learning_location || [];
    if (checked) {
      setValue('section_3_learning_gap.learning_location', [...currentLocations, location]);
    } else {
      setValue(
        'section_3_learning_gap.learning_location',
        currentLocations.filter((l) => l !== location)
      );
    }
  };

  const handleDeviceChange = (device: string, checked: boolean) => {
    const currentDevices = watchedValues?.section_3_learning_gap?.devices_used || [];
    if (checked) {
      setValue('section_3_learning_gap.devices_used', [...currentDevices, device]);
    } else {
      setValue(
        'section_3_learning_gap.devices_used',
        currentDevices.filter((d) => d !== device)
      );
    }
  };

  return (
    <div className="animate-fade-in-up space-y-7">
      {/* Learning Gap Description */}
      <QuestionnaireInput
        label="Learning Gap Description"
        value={watchedValues?.section_3_learning_gap?.learning_gap_description || ''}
        onChange={(value) => setValue('section_3_learning_gap.learning_gap_description', value)}
        placeholder="Describe in detail what knowledge or skills are missing. Be specific about the current state vs. desired state, including any business impact or performance issues."
        error={errors.section_3_learning_gap?.learning_gap_description?.message}
        helpText="Minimum 10 characters, maximum 2000 characters"
        multiline
        rows={6}
        required
      />

      {/* Total Learners */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Total Number of Learners
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select one
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {LEARNER_COUNT_RANGES.map((range) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.total_learners_range === range.value;
            return (
              <button
                key={range.value}
                type="button"
                onClick={() => setValue('section_3_learning_gap.total_learners_range', range.value)}
                className={cn(
                  'relative rounded-full border-2 px-5 py-3 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/40 shadow-lg ring-2'
                    : 'border-white/30 bg-transparent text-white/80 hover:border-white/50 hover:bg-white/10'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full border-2 transition-all duration-200',
                      isSelected
                        ? 'border-teal-400 bg-teal-400 shadow-sm'
                        : 'border-white/60 bg-white/20'
                    )}
                  >
                    {isSelected && (
                      <span className="h-full w-full scale-75 animate-pulse rounded-full bg-teal-400" />
                    )}
                  </span>
                  {range.label}
                </span>
              </button>
            );
          })}
        </div>

        {errors.section_3_learning_gap?.total_learners_range && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.total_learners_range.message}
            </span>
          </div>
        )}
      </div>

      {/* Current Knowledge Level */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Current Knowledge Level
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select one
          </span>
        </div>

        {/* Knowledge Level Options */}
        <div className="flex flex-wrap gap-3">
          {KNOWLEDGE_LEVELS.map((level) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.current_knowledge_level === level.value;
            return (
              <button
                key={level.value}
                type="button"
                onClick={() =>
                  setValue('section_3_learning_gap.current_knowledge_level', level.value)
                }
                className={cn(
                  'relative rounded-full border-2 px-5 py-3 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/40 shadow-lg ring-2'
                    : 'border-white/30 bg-transparent text-white/80 hover:border-white/50 hover:bg-white/10'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full border-2 transition-all duration-200',
                      isSelected
                        ? 'border-teal-400 bg-teal-400 shadow-sm'
                        : 'border-white/60 bg-white/20'
                    )}
                  >
                    {isSelected && (
                      <span className="h-full w-full scale-75 animate-pulse rounded-full bg-teal-400" />
                    )}
                  </span>
                  {level.label}
                </span>
              </button>
            );
          })}
        </div>

        {errors.section_3_learning_gap?.current_knowledge_level && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.current_knowledge_level.message}
            </span>
          </div>
        )}
      </div>

      {/* Motivation Factors */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Motivation Factors
          </label>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            Select all that apply
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {MOTIVATION_FACTORS.map((factor) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.motivation_factors?.includes(factor.value) ||
              false;
            return (
              <button
                key={factor.value}
                type="button"
                onClick={() => handleMotivationChange(factor.value, !isSelected)}
                className={cn(
                  'relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/30 shadow-lg ring-2'
                    : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20'
                )}
              >
                <span className="flex items-center gap-2">
                  {isSelected && (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {factor.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.section_3_learning_gap?.motivation_factors && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.motivation_factors.message}
            </span>
          </div>
        )}
      </div>

      {/* Learning Location */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Learning Location Preferences
          </label>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            Select all that apply
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {LEARNING_LOCATIONS.map((location) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.learning_location?.includes(location.value) ||
              false;
            return (
              <button
                key={location.value}
                type="button"
                onClick={() => handleLocationChange(location.value, !isSelected)}
                className={cn(
                  'relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/30 shadow-lg ring-2'
                    : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20'
                )}
              >
                <span className="flex items-center gap-2">
                  {isSelected && (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {location.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.section_3_learning_gap?.learning_location && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.learning_location.message}
            </span>
          </div>
        )}
      </div>

      {/* Devices Used */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Devices Learners Will Use
          </label>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            Select all that apply
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {DEVICES_USED.map((device) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.devices_used?.includes(device.value) || false;
            return (
              <button
                key={device.value}
                type="button"
                onClick={() => handleDeviceChange(device.value, !isSelected)}
                className={cn(
                  'relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/30 shadow-lg ring-2'
                    : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20'
                )}
              >
                <span className="flex items-center gap-2">
                  {isSelected && (
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {device.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.section_3_learning_gap?.devices_used && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.devices_used.message}
            </span>
          </div>
        )}
      </div>

      {/* Hours Per Week */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Time Available Per Week
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select one
          </span>
        </div>

        <div className="flex flex-wrap gap-3">
          {HOURS_PER_WEEK.map((option) => {
            const isSelected =
              watchedValues?.section_3_learning_gap?.hours_per_week === option.value;
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setValue('section_3_learning_gap.hours_per_week', option.value)}
                className={cn(
                  'relative rounded-full border-2 px-5 py-3 text-sm font-medium transition-all duration-200',
                  'hover:scale-105 active:scale-95',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary ring-primary/40 shadow-lg ring-2'
                    : 'border-white/30 bg-transparent text-white/80 hover:border-white/50 hover:bg-white/10'
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      'h-3 w-3 rounded-full border-2 transition-all duration-200',
                      isSelected
                        ? 'border-teal-400 bg-teal-400 shadow-sm'
                        : 'border-white/60 bg-white/20'
                    )}
                  >
                    {isSelected && (
                      <span className="h-full w-full scale-75 animate-pulse rounded-full bg-teal-400" />
                    )}
                  </span>
                  {option.label}
                </span>
              </button>
            );
          })}
        </div>

        {errors.section_3_learning_gap?.hours_per_week && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_3_learning_gap.hours_per_week.message}
            </span>
          </div>
        )}
      </div>

      {/* Learning Deadline */}
      <QuestionnaireInput
        label="Learning Deadline"
        value={watchedValues?.section_3_learning_gap?.learning_deadline || ''}
        onChange={(value) => setValue('section_3_learning_gap.learning_deadline', value)}
        placeholder="Select deadline date"
        helpText="When must this learning be completed?"
        type="date"
      />

      {/* Budget Responsibility - Slider with Input */}
      <div className="space-y-3">
        <label className="text-foreground block text-[15px] leading-tight font-medium">
          Budget Available (Optional)
        </label>

        {/* Slider and Input Container */}
        <div className="space-y-4">
          {/* Slider */}
          <div className="px-3">
            <div className="mb-2">
              <input
                type="range"
                min="0"
                max={currencyConfig.maxValue}
                step="1000"
                value={watchedValues?.section_3_learning_gap?.budget_available?.amount || 0}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  setValue('section_3_learning_gap.budget_available.amount', value);
                }}
                className="slider budget-slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
                style={{
                  background: `linear-gradient(to right, #a7dadb 0%, #a7dadb ${((watchedValues?.section_3_learning_gap?.budget_available?.amount || 0) / currencyConfig.maxValue) * 100}%, rgba(255,255,255,0.2) ${((watchedValues?.section_3_learning_gap?.budget_available?.amount || 0) / currencyConfig.maxValue) * 100}%, rgba(255,255,255,0.2) 100%)`,
                }}
              />
            </div>
            <div className="flex justify-between text-sm text-white/60">
              <span>{currencyConfig.symbol}0</span>
              <span>{currencyConfig.label}</span>
            </div>
          </div>

          {/* Budget Display and Currency */}
          <div className="flex items-center justify-between gap-4">
            {/* Budget Display */}
            <div className="flex flex-1 items-center justify-center">
              <div className="relative">
                {(watchedValues?.section_3_learning_gap?.budget_available?.amount || 0) === 0 ? (
                  <div className="w-48 bg-transparent px-4 py-2 text-center text-lg font-normal text-white/40 italic">
                    No Budget Available
                  </div>
                ) : (
                  <>
                    <span className="absolute top-1/2 left-3 -translate-y-1/2 transform text-sm text-white/60">
                      {currencyConfig.symbol}
                    </span>
                    <input
                      type="text"
                      value={formatCurrency(
                        watchedValues?.section_3_learning_gap?.budget_available?.amount || 0
                      )}
                      onChange={(e) => {
                        // Remove formatting and parse as number
                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                        const numericValue = rawValue === '' ? 0 : parseInt(rawValue) || 0;
                        // Ensure it doesn't exceed currency max
                        const clampedValue = Math.min(numericValue, currencyConfig.maxValue);
                        setValue('section_3_learning_gap.budget_available.amount', clampedValue);
                      }}
                      onBlur={(e) => {
                        // Format the number when input loses focus
                        const rawValue = e.target.value.replace(/[^\d]/g, '');
                        const numericValue = rawValue === '' ? 0 : parseInt(rawValue) || 0;
                        const clampedValue = Math.min(numericValue, currencyConfig.maxValue);
                        setValue('section_3_learning_gap.budget_available.amount', clampedValue);
                      }}
                      className="text-foreground focus:border-primary focus:ring-primary/30 w-48 rounded-lg border border-white/20 bg-white/10 px-4 py-2 pl-8 text-center text-lg font-medium focus:ring-2 focus:outline-none"
                    />
                  </>
                )}
              </div>
            </div>

            {/* Currency Dropdown */}
            <div className="w-80">
              <QuestionnaireSelect
                label=""
                value={watchedValues?.section_3_learning_gap?.budget_available?.currency || 'USD'}
                onChange={(value) => {
                  setValue('section_3_learning_gap.budget_available.currency', value);
                  // Reset budget if it exceeds the new currency's max
                  const currentBudget =
                    watchedValues?.section_3_learning_gap?.budget_available?.amount || 0;
                  const newCurrencyConfig =
                    CURRENCIES[value as keyof typeof CURRENCIES] || CURRENCIES.USD;
                  if (currentBudget > newCurrencyConfig.maxValue) {
                    setValue('section_3_learning_gap.budget_available.amount', 0);
                  }
                }}
                options={[
                  // North America
                  { value: 'USD', label: 'USD - US Dollar ($)' },
                  { value: 'CAD', label: 'CAD - Canadian Dollar (C$)' },
                  { value: 'MXN', label: 'MXN - Mexican Peso ($)' },

                  // Europe
                  { value: 'EUR', label: 'EUR - Euro (€)' },
                  { value: 'GBP', label: 'GBP - British Pound (£)' },
                  { value: 'CHF', label: 'CHF - Swiss Franc (CHF)' },
                  { value: 'SEK', label: 'SEK - Swedish Krona (kr)' },
                  { value: 'NOK', label: 'NOK - Norwegian Krone (kr)' },
                  { value: 'DKK', label: 'DKK - Danish Krone (kr)' },
                  { value: 'PLN', label: 'PLN - Polish Złoty (zł)' },
                  { value: 'CZK', label: 'CZK - Czech Koruna (Kč)' },
                  { value: 'HUF', label: 'HUF - Hungarian Forint (Ft)' },

                  // Asia-Pacific
                  { value: 'AUD', label: 'AUD - Australian Dollar (A$)' },
                  { value: 'NZD', label: 'NZD - New Zealand Dollar (NZ$)' },
                  { value: 'JPY', label: 'JPY - Japanese Yen (¥)' },
                  { value: 'CNY', label: 'CNY - Chinese Yuan (¥)' },
                  { value: 'HKD', label: 'HKD - Hong Kong Dollar (HK$)' },
                  { value: 'SGD', label: 'SGD - Singapore Dollar (S$)' },
                  { value: 'KRW', label: 'KRW - South Korean Won (₩)' },
                  { value: 'INR', label: 'INR - Indian Rupee (₹)' },
                  { value: 'THB', label: 'THB - Thai Baht (฿)' },
                  { value: 'MYR', label: 'MYR - Malaysian Ringgit (RM)' },
                  { value: 'IDR', label: 'IDR - Indonesian Rupiah (Rp)' },
                  { value: 'PHP', label: 'PHP - Philippine Peso (₱)' },

                  // Middle East & Africa
                  { value: 'SAR', label: 'SAR - Saudi Riyal (﷼)' },
                  { value: 'AED', label: 'AED - UAE Dirham (د.إ)' },
                  { value: 'ILS', label: 'ILS - Israeli Shekel (₪)' },
                  { value: 'ZAR', label: 'ZAR - South African Rand (R)' },
                  { value: 'EGP', label: 'EGP - Egyptian Pound (£)' },

                  // South America
                  { value: 'BRL', label: 'BRL - Brazilian Real (R$)' },
                  { value: 'ARS', label: 'ARS - Argentine Peso ($)' },
                  { value: 'CLP', label: 'CLP - Chilean Peso ($)' },
                  { value: 'COP', label: 'COP - Colombian Peso ($)' },
                  { value: 'PEN', label: 'PEN - Peruvian Sol (S/)' },

                  // Other Major Currencies
                  { value: 'RUB', label: 'RUB - Russian Ruble (₽)' },
                  { value: 'TRY', label: 'TRY - Turkish Lira (₺)' },
                  { value: 'ZMW', label: 'ZMW - Zambian Kwacha (ZK)' },
                ]}
                placeholder="Currency"
              />
            </div>
          </div>
        </div>

        <p className="text-text-secondary text-[13px] leading-snug">
          Total budget available for this training initiative (materials, tools, external resources,
          etc.)
        </p>
      </div>
    </div>
  );
}
