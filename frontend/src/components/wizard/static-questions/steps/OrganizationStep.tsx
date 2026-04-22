'use client';

import React from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { RadioPillGroup } from '@/components/wizard/inputs';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Government',
  'Non-Profit',
  'Consulting',
  'Other',
];

const ORGANIZATION_SIZES = [
  { value: '1-50', label: '1-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-1000', label: '201-1,000' },
  { value: '1000+', label: '1,000+' },
];

const REGIONS = [
  'North America',
  'Europe',
  'Asia-Pacific',
  'Latin America',
  'Middle East',
  'Africa',
];

export function OrganizationStep(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // CRITICAL: Register nested fields so React Hook Form knows they exist
  React.useEffect(() => {
    register('organization.name', { required: 'Organization name is required' });
    register('organization.industry', { required: 'Industry is required' });
    register('organization.size', { required: 'Organization size is required' });
    register('organization.regions');
  }, [register]);

  const organization = watch('organization') || {};
  const orgName = organization.name || '';
  const industry = organization.industry || '';
  const size = organization.size || '';
  const regions = organization.regions || [];

  return (
    <div className="animate-fade-in-up space-y-6">
      <QuestionnaireInput
        label="Organization Name"
        value={orgName}
        onChange={(value) => setValue('organization.name', value)}
        placeholder="e.g., Acme Corp - Learning & Development Team"
        error={errors.organization?.name?.message as string}
        helpText="Organization or team context for this learning initiative"
        required
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          Industry <span className="text-red-400">*</span>
        </label>
        <select
          value={industry}
          onChange={(e) => setValue('organization.industry', e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white transition outline-none focus:border-[#d0edf0] focus:ring-[1.2px] focus:ring-[#d0edf0]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%23a7dadb' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E")`,
            backgroundPosition: 'right 0.75rem center',
            backgroundRepeat: 'no-repeat',
            backgroundSize: '1.5em 1.5em',
            paddingRight: '2.5rem',
          }}
        >
          <option value="" disabled className="bg-[#0d1b2a] text-white/50">
            Select industry...
          </option>
          {INDUSTRIES.map((ind) => (
            <option key={ind} value={ind} className="bg-[#0d1b2a] text-white">
              {ind}
            </option>
          ))}
        </select>
        {errors.organization?.industry && (
          <p className="animate-fade-in text-sm text-red-400">
            {errors.organization.industry.message as string}
          </p>
        )}
      </div>

      <RadioPillGroup
        label="Organization Size"
        value={size}
        onChange={(value) => setValue('organization.size', value)}
        options={ORGANIZATION_SIZES}
        error={errors.organization?.size?.message as string}
        required
      />

      <div className="space-y-2">
        <label className="block text-sm font-medium text-white/90">
          Geographic Regions (Optional)
        </label>
        <p className="text-xs text-white/50">
          Select up to 3 regions where training will be delivered
        </p>
        <div className="flex flex-wrap gap-2">
          {REGIONS.map((region) => (
            <button
              key={region}
              type="button"
              onClick={() => {
                const currentRegions = regions as string[];
                const isSelected = currentRegions.includes(region);
                if (isSelected) {
                  setValue(
                    'organization.regions',
                    currentRegions.filter((r) => r !== region)
                  );
                } else {
                  if (currentRegions.length < 3) {
                    setValue('organization.regions', [...currentRegions, region]);
                  }
                }
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-all duration-200 ${
                (regions as string[]).includes(region)
                  ? 'bg-[#a7dadb] text-[#020C1B] shadow-md'
                  : 'border border-white/10 bg-white/10 text-white/80 hover:bg-white/15'
              }`}
            >
              {region}
            </button>
          ))}
        </div>
        {regions.length > 0 && (
          <p className="text-xs text-white/60">{regions.length} / 3 regions selected</p>
        )}
      </div>

      <div
        className="animate-fade-in rounded-lg p-4"
        style={{
          backgroundColor: 'rgba(167, 218, 219, 0.1)',
          border: '1px solid rgba(167, 218, 219, 0.2)',
        }}
      >
        <div className="flex items-start gap-2">
          <svg
            className="mt-0.5 h-5 w-5 flex-shrink-0"
            style={{ color: '#a7dadb' }}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="text-sm" style={{ color: '#d0edf0' }}>
            <p className="mb-2 font-medium">Why organizational context matters:</p>
            <p className="text-white/70">
              Understanding your organization helps us tailor recommendations to your industry
              standards, scale considerations, and regional requirements (language, compliance, time
              zones).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
