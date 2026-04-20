'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import { StaticQuestionnaireFormData } from '@/app/demo-v2-questionnaire/page';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { QuestionnaireSelect } from '@/components/wizard/static-questions/QuestionnaireSelect';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';
import { cn } from '@/lib/utils';

const INDUSTRY_SECTORS = [
  { value: 'Technology', label: 'Technology' },
  { value: 'Healthcare', label: 'Healthcare' },
  { value: 'Financial Services', label: 'Financial Services' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Education', label: 'Education' },
  { value: 'Government/Public Sector', label: 'Government/Public Sector' },
  { value: 'Retail/E-commerce', label: 'Retail/E-commerce' },
  { value: 'Professional Services', label: 'Professional Services' },
  { value: 'Non-Profit', label: 'Non-Profit' },
  { value: 'Other', label: 'Other' },
];

const ORGANIZATION_SIZES = [
  { value: '1-50', label: 'Small (1-50 employees)' },
  { value: '51-200', label: 'Medium (51-200 employees)' },
  { value: '201-1000', label: 'Large (201-1000 employees)' },
  { value: '1001-5000', label: 'Very Large (1001-5000 employees)' },
  { value: '5001-10000', label: 'Enterprise (5001-10000 employees)' },
  { value: '10000+', label: 'Mega Enterprise (10000+ employees)' },
];

const GEOGRAPHIC_REGIONS = [
  { value: 'North America', label: 'North America' },
  { value: 'South America', label: 'South America' },
  { value: 'Europe', label: 'Europe' },
  { value: 'Asia', label: 'Asia' },
  { value: 'Africa', label: 'Africa' },
  { value: 'Oceania', label: 'Oceania' },
  { value: 'Middle East', label: 'Middle East' },
  { value: 'Global', label: 'Global' },
];

const COMPLIANCE_REQUIREMENTS = [
  { value: 'GDPR', label: 'GDPR (EU Data Protection)' },
  { value: 'HIPAA', label: 'HIPAA (Healthcare)' },
  { value: 'SOX', label: 'SOX (Financial Reporting)' },
  { value: 'PCI DSS', label: 'PCI DSS (Payment Cards)' },
  { value: 'ISO 27001', label: 'ISO 27001 (Information Security)' },
  { value: 'FedRAMP', label: 'FedRAMP (US Government)' },
  { value: 'CCPA', label: 'CCPA (California Privacy)' },
  { value: 'Industry-Specific', label: 'Industry-Specific Regulations' },
  { value: 'None', label: 'No Specific Compliance Requirements' },
  { value: 'Other', label: 'Other (Specify)' },
];

const DATA_SHARING_POLICIES = [
  { value: 'Unrestricted', label: 'Unrestricted - Can share freely' },
  { value: 'Internal Only', label: 'Internal Only - Limited to organization' },
  { value: 'Need-to-Know', label: 'Need-to-Know - Only essential personnel' },
  { value: 'Highly Restricted', label: 'Highly Restricted - Strict controls' },
  { value: 'Classified', label: 'Classified - Government/military level' },
];

const SECURITY_CLEARANCES = [
  { value: 'None', label: 'No Security Clearance Required' },
  { value: 'Confidential', label: 'Confidential' },
  { value: 'Secret', label: 'Secret' },
  { value: 'Top Secret', label: 'Top Secret' },
  { value: 'Other', label: 'Other (Specify)' },
];

export function OrganizationDetailsSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionnaireFormData>();

  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedCompliance, setSelectedCompliance] = useState<string[]>([]);
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [customIndustryValue, setCustomIndustryValue] = useState('');
  const [showOtherIndustryInput, setShowOtherIndustryInput] = useState(false);
  const [customComplianceInput, setCustomComplianceInput] = useState('');
  const [showOtherComplianceInput, setShowOtherComplianceInput] = useState(false);

  // Register the fields
  useEffect(() => {
    register('section_2_organization.organization_name', {
      required: 'Organization name is required',
      minLength: { value: 2, message: 'Organization name must be at least 2 characters' },
      maxLength: { value: 200, message: 'Organization name must be less than 200 characters' },
    });
    register('section_2_organization.industry_sector', { required: 'Industry sector is required' });
    register('section_2_organization.organization_size', {
      required: 'Organization size is required',
    });
    register('section_2_organization.geographic_regions', {
      required: 'Please select at least one region',
    });
    register('section_2_organization.compliance_requirements', {
      required: 'Please select at least one compliance requirement',
    });
    register('section_2_organization.data_sharing_policies', {
      required: 'Data sharing policy is required',
    });
    register('section_2_organization.security_clearance');
    register('section_2_organization.legal_restrictions');
  }, [register]);

  const section2Data = watch('section_2_organization');
  const organizationName = section2Data?.organization_name || '';
  const industrySector = section2Data?.industry_sector || 'Technology';
  const organizationSize = section2Data?.organization_size || '1-50';
  const dataSharingPolicy = section2Data?.data_sharing_policies || 'Unrestricted';
  const securityClearance = section2Data?.security_clearance || 'None';
  const legalRestrictions = section2Data?.legal_restrictions || '';
  const complianceRequirements = section2Data?.compliance_requirements || [];

  // Initialize state from form values
  useEffect(() => {
    const regions = section2Data?.geographic_regions || [];
    const compliance = section2Data?.compliance_requirements || [];
    setSelectedRegions(regions);
    setSelectedCompliance(compliance);

    // Show custom industry input if "Other" is selected
    const industry = section2Data?.industry_sector || 'Technology';
    setShowOtherIndustryInput(industry === 'Other');

    // Initialize custom industry value if it exists
    if (
      industry !== 'Technology' &&
      !INDUSTRY_SECTORS.some((sector) => sector.value === industry)
    ) {
      setCustomIndustryValue(industry);
    }

    // Show custom compliance input if user has interacted with Other option
    // (We'll show it when they click Other, not based on existing entries)
    // Existing entries are shown as bubbles and don't affect input visibility
  }, [section2Data]);

  const handleRegionChange = (region: string, checked: boolean) => {
    let newRegions;
    if (checked) {
      newRegions = [...selectedRegions, region];
    } else {
      newRegions = selectedRegions.filter((r) => r !== region);
    }
    setSelectedRegions(newRegions);
    setValue('section_2_organization.geographic_regions', newRegions, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleComplianceChange = (requirement: string, checked: boolean) => {
    if (requirement === 'Other') {
      if (checked && !showOtherComplianceInput) {
        // Show input for adding custom compliance requirements
        setShowOtherComplianceInput(true);
        setCustomComplianceInput('');
      } else if (!checked) {
        // Hide input when unselecting Other
        setShowOtherComplianceInput(false);
        setCustomComplianceInput('');
      }
      // Don't add "Other" to selectedCompliance array
      return;
    } else {
      let newCompliance;
      if (checked) {
        newCompliance = [...selectedCompliance, requirement];
      } else {
        newCompliance = selectedCompliance.filter((c) => c !== requirement);
      }
      setSelectedCompliance(newCompliance);
      setValue('section_2_organization.compliance_requirements', newCompliance, {
        shouldValidate: true,
        shouldDirty: true,
      });
    }
  };

  const handleCustomComplianceSubmit = () => {
    if (customComplianceInput.trim()) {
      const customCompliance = `Other: ${customComplianceInput.trim()}`;
      // Add new custom compliance (allow multiple)
      const newCompliance = [...selectedCompliance, customCompliance];
      setSelectedCompliance(newCompliance);
      setValue('section_2_organization.compliance_requirements', newCompliance, {
        shouldValidate: true,
        shouldDirty: true,
      });
      setCustomComplianceInput('');
      // Keep the input open for adding more entries
    }
  };

  const handleCustomComplianceKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomComplianceSubmit();
    }
  };

  const handleCustomComplianceRemove = (customValue: string) => {
    // Remove the specific custom compliance entry
    const newCompliance = selectedCompliance.filter((c) => c !== `Other: ${customValue}`);
    setSelectedCompliance(newCompliance);
    setValue('section_2_organization.compliance_requirements', newCompliance, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleCustomIndustrySubmit = () => {
    if (customIndustryInput.trim()) {
      const customIndustry = customIndustryInput.trim();
      setCustomIndustryValue(customIndustry);
      setValue('section_2_organization.industry_sector', 'Other');
      setCustomIndustryInput(''); // Clear the input after successful submission
    }
  };

  // Handle switching away from Other without custom input
  const handleIndustryChange = (newIndustry: string) => {
    if (newIndustry !== 'Other' && industrySector === 'Other') {
      // Switching away from Other - clear any custom input and custom value
      setCustomIndustryInput('');
      setCustomIndustryValue('');
    }
    setValue('section_2_organization.industry_sector', newIndustry);
    setShowOtherIndustryInput(newIndustry === 'Other');
  };

  const handleCustomIndustryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomIndustrySubmit();
    }
  };

  // Custom validation for industry sector
  const getIndustryError = () => {
    if (industrySector === 'Other' && !customIndustryValue) {
      return 'Please specify your industry';
    }
    return errors.section_2_organization?.industry_sector?.message;
  };

  return (
    <div className="animate-fade-in-up space-y-7">
      {/* Organization Name */}
      <QuestionnaireInput
        label="Organization Name"
        value={organizationName}
        onChange={(value) => setValue('section_2_organization.organization_name', value)}
        placeholder="Enter your organization name"
        error={errors.section_2_organization?.organization_name?.message}
        helpText="The name of your organization or company"
        required
      />

      {/* Industry Sector */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Industry Sector *
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select one
          </span>
        </div>

        {/* Industry Options */}
        <div className="flex flex-wrap gap-3">
          {INDUSTRY_SECTORS.map((sector) => {
            const isSelected = industrySector === sector.value;
            return (
              <button
                key={sector.value}
                type="button"
                onClick={() => handleIndustryChange(sector.value)}
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
                  {sector.value === 'Other' && customIndustryValue
                    ? customIndustryValue
                    : sector.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Custom Industry Input - only show when Other is selected */}
        {showOtherIndustryInput && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input
              type="text"
              value={
                customIndustryInput !== undefined ? customIndustryInput : customIndustryValue || ''
              }
              onChange={(e) => setCustomIndustryInput(e.target.value)}
              onKeyDown={handleCustomIndustryKeyDown}
              placeholder={
                customIndustryValue
                  ? `Currently: ${customIndustryValue}`
                  : 'Enter custom industry...'
              }
              className="text-foreground focus:border-primary focus:ring-primary/30 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-white/50 focus:ring-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCustomIndustrySubmit}
              disabled={!customIndustryInput?.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              {customIndustryValue ? 'Update' : 'Add'}
            </button>
          </div>
        )}

        {getIndustryError() && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">{getIndustryError()}</span>
          </div>
        )}
      </div>

      {/* Organization Size */}
      <QuestionnaireSelect
        label="Organization Size"
        value={organizationSize}
        onChange={(value) => setValue('section_2_organization.organization_size', value)}
        options={ORGANIZATION_SIZES}
        placeholder="Select organization size..."
        error={errors.section_2_organization?.organization_size?.message}
        helpText="Number of employees in your organization"
        required
      />

      {/* Geographic Regions - Multiselect Bubbles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Geographic Regions *
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select all that apply
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {GEOGRAPHIC_REGIONS.map((region) => {
            const isSelected = selectedRegions.includes(region.value);
            return (
              <button
                key={region.value}
                type="button"
                onClick={() => handleRegionChange(region.value, !isSelected)}
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
                  {region.label}
                </span>
              </button>
            );
          })}
        </div>
        {errors.section_2_organization?.geographic_regions && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_2_organization.geographic_regions.message}
            </span>
          </div>
        )}
      </div>

      {/* Compliance Requirements - Multiselect Bubbles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Compliance Requirements *
          </label>
          <span className="text-primary bg-primary/20 border-primary/30 shadow-primary/25 rounded-full border px-2 py-1 text-xs shadow-md">
            Select all that apply
          </span>
        </div>
        <div className="flex flex-wrap gap-3">
          {/* Regular compliance requirements */}
          {COMPLIANCE_REQUIREMENTS.map((requirement) => {
            const isSelected =
              requirement.value === 'Other'
                ? showOtherComplianceInput
                : selectedCompliance.includes(requirement.value);
            return (
              <button
                key={requirement.value}
                type="button"
                onClick={() => handleComplianceChange(requirement.value, !isSelected)}
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
                  {requirement.label}
                </span>
              </button>
            );
          })}

          {/* Custom compliance requirements as bubbles */}
          {selectedCompliance
            .filter((compliance) => compliance.startsWith('Other: '))
            .map((customCompliance, index) => {
              const customValue = customCompliance.replace('Other: ', '');
              return (
                <button
                  key={`custom-${index}`}
                  type="button"
                  onClick={() => handleCustomComplianceRemove(customValue)}
                  className="bg-primary text-primary-foreground border-primary ring-primary/30 hover:bg-primary/90 relative rounded-lg border px-4 py-2 text-sm font-medium shadow-lg ring-2 transition-all duration-200"
                >
                  <span className="flex items-center gap-2">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    {customValue}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCustomComplianceRemove(customValue);
                      }}
                      className="hover:bg-primary-foreground/20 ml-1 rounded-full p-0.5 transition-colors"
                    >
                      <svg
                        className="h-3 w-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </span>
                </button>
              );
            })}
        </div>

        {/* Custom Compliance Input */}
        {showOtherComplianceInput && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input
              type="text"
              value={customComplianceInput}
              onChange={(e) => setCustomComplianceInput(e.target.value)}
              onKeyDown={handleCustomComplianceKeyDown}
              placeholder="Enter custom compliance requirement..."
              className="text-foreground focus:border-primary focus:ring-primary/30 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-white/50 focus:ring-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCustomComplianceSubmit}
              disabled={!customComplianceInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {errors.section_2_organization?.compliance_requirements && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_2_organization.compliance_requirements.message}
            </span>
          </div>
        )}
      </div>

      {/* Data Sharing Policies */}
      <QuestionnaireSelect
        label="Data Sharing Policies"
        value={dataSharingPolicy}
        onChange={(value) => setValue('section_2_organization.data_sharing_policies', value)}
        options={DATA_SHARING_POLICIES}
        placeholder="Select data sharing policy..."
        error={errors.section_2_organization?.data_sharing_policies?.message}
        helpText="How data and content can be shared within and outside your organization"
        required
      />

      {/* Security Clearance */}
      <QuestionnaireSelect
        label="Security Clearance Requirements"
        value={securityClearance}
        onChange={(value) => setValue('section_2_organization.security_clearance', value)}
        options={SECURITY_CLEARANCES}
        placeholder="Select security clearance level..."
        error={errors.section_2_organization?.security_clearance?.message}
        helpText="Any security clearance requirements for accessing learning content"
      />

      {/* Legal Restrictions */}
      <QuestionnaireInput
        label="Legal Restrictions"
        value={legalRestrictions}
        onChange={(value) => setValue('section_2_organization.legal_restrictions', value)}
        placeholder="Describe any legal restrictions or requirements..."
        helpText="Any legal constraints that might affect content creation or delivery"
        multiline
        rows={3}
      />
    </div>
  );
}
