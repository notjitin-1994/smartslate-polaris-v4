'use client';

import React, { useState, useEffect } from 'react';
import { useFormContext } from 'react-hook-form';
import type { StaticQuestionsFormValues } from '@/components/wizard/static-questions/types';
import { QuestionnaireInput } from '@/components/wizard/static-questions/QuestionnaireInput';
import { QuestionnaireSelect } from '@/components/wizard/static-questions/QuestionnaireSelect';
import { QuestionnaireInfoBox } from '@/components/wizard/static-questions/QuestionnaireInfoBox';
import { cn } from '@/lib/utils';

const INDUSTRIES = [
  'Technology',
  'Healthcare',
  'Financial Services',
  'Manufacturing',
  'Education',
  'Government/Public Sector',
  'Retail/E-commerce',
  'Professional Services',
  'Non-Profit',
];

const TEAM_SIZES = [
  { value: 'Solo', label: 'Solo (Just me)' },
  { value: '2-5', label: 'Small Team (2-5 people)' },
  { value: '6-10', label: 'Medium Team (6-10 people)' },
  { value: '11-25', label: 'Large Team (11-25 people)' },
  { value: '26-50', label: 'Very Large Team (26-50 people)' },
  { value: '51+', label: 'Enterprise Team (51+ people)' },
];

const PREDEFINED_ROLES = [
  'Learning & Development Manager',
  'HR Director',
  'Training Specialist',
  'Instructional Designer',
  'Corporate Trainer',
  'Chief Learning Officer',
  'Talent Development Manager',
  'L&D Consultant',
  'Education Manager',
  'Custom (Specify below)',
];

const TECHNICAL_SKILLS = [
  { value: 'LMS Admin', label: 'Learning Management System Administration' },
  { value: 'SCORM/xAPI', label: 'SCORM/xAPI Standards' },
  { value: 'Video Production', label: 'Video Production & Editing' },
  { value: 'Graphic Design', label: 'Graphic Design & Visual Content' },
  { value: 'HTML/CSS', label: 'HTML/CSS Development' },
  { value: 'Instructional Design Tools', label: 'Instructional Design Software' },
  { value: 'Data Analytics', label: 'Learning Analytics & Data Analysis' },
  { value: 'Other', label: 'Other Technical Skills' },
];

export function RoleExperienceSection(): React.JSX.Element {
  const {
    register,
    formState: { errors },
    watch,
    setValue,
  } = useFormContext<StaticQuestionsFormValues>();

  // Register the field with correct nested names
  useEffect(() => {
    register('section_1_role_experience.current_role', { required: 'Role is required' });
    register('section_1_role_experience.years_in_role', {
      required: 'Years in role is required',
      min: 0,
      max: 20,
    });
    register('section_1_role_experience.industry_experience', {
      required: 'Please select at least one industry',
    });
    register('section_1_role_experience.team_size', { required: 'Team size is required' });
    register('section_1_role_experience.technical_skills');
    register('section_1_role_experience.custom_role');
  }, [register]);

  const role = watch('section_1_role_experience.current_role');
  const yearsInRole = watch('section_1_role_experience.years_in_role');
  const industryExperience = watch('section_1_role_experience.industry_experience') || [];
  const technicalSkills = watch('section_1_role_experience.technical_skills') || [];

  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customIndustryInput, setCustomIndustryInput] = useState('');
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [customTechnicalSkillInput, setCustomTechnicalSkillInput] = useState('');
  const [showOtherTechnicalSkillInput, setShowOtherTechnicalSkillInput] = useState(false);

  // Initialize selected option based on existing role value
  useEffect(() => {
    if (role) {
      if (PREDEFINED_ROLES.includes(role)) {
        setSelectedOption(role);
        setShowCustomInput(false);
      } else {
        setSelectedOption('Custom (Specify below)');
        setShowCustomInput(true);
      }
    }
  }, []);

  const handleDropdownChange = (value: string) => {
    setSelectedOption(value);

    if (value === 'Custom (Specify below)') {
      setShowCustomInput(true);
      setValue('section_1_role_experience.current_role', 'Other');
      setValue('section_1_role_experience.custom_role', '');
    } else {
      setShowCustomInput(false);
      setValue('section_1_role_experience.current_role', value);
      setValue('section_1_role_experience.custom_role', '');
    }
  };

  const handleSliderChange = (value: number) => {
    setValue('section_1_role_experience.years_in_role', value);
  };

  const handleIndustryChange = (industry: string, checked: boolean) => {
    if (industry === 'Other') {
      if (checked) {
        setShowOtherInput(true);
        setCustomIndustryInput('');
      } else {
        setShowOtherInput(false);
        setCustomIndustryInput('');
      }
    } else {
      if (checked) {
        setValue('section_1_role_experience.industry_experience', [
          ...industryExperience,
          industry,
        ]);
      } else {
        setValue(
          'section_1_role_experience.industry_experience',
          industryExperience.filter((i) => i !== industry)
        );
      }
    }
  };

  const handleCustomIndustrySubmit = () => {
    if (customIndustryInput.trim()) {
      const newCustomIndustry = `Other: ${customIndustryInput.trim()}`;
      setValue('section_1_role_experience.industry_experience', [
        ...industryExperience,
        newCustomIndustry,
      ]);
      setCustomIndustryInput('');
      setShowOtherInput(false); // Unselect "Other" button after submission
    }
  };

  const handleCustomIndustryKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomIndustrySubmit();
    }
  };

  const handleCustomTechnicalSkillSubmit = () => {
    if (customTechnicalSkillInput.trim()) {
      const newCustomTechnicalSkill = `Other: ${customTechnicalSkillInput.trim()}`;
      setValue('section_1_role_experience.technical_skills', [
        ...technicalSkills,
        newCustomTechnicalSkill,
      ]);
      setCustomTechnicalSkillInput('');
      setShowOtherTechnicalSkillInput(false); // Unselect "Other" button after submission
    }
  };

  const handleCustomTechnicalSkillKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCustomTechnicalSkillSubmit();
    }
  };

  const handleTechnicalSkillChange = (skill: string, checked: boolean) => {
    if (skill === 'Other') {
      if (checked) {
        setShowOtherTechnicalSkillInput(true);
        setCustomTechnicalSkillInput('');
      } else {
        setShowOtherTechnicalSkillInput(false);
        setCustomTechnicalSkillInput('');
      }
    } else {
      if (checked) {
        setValue('section_1_role_experience.technical_skills', [...technicalSkills, skill]);
      } else {
        setValue(
          'section_1_role_experience.technical_skills',
          technicalSkills.filter((s) => s !== skill)
        );
      }
    }
  };

  return (
    <div className="animate-fade-in-up space-y-7">
      {/* Role Selection */}
      <QuestionnaireSelect
        label="What is your role?"
        value={selectedOption}
        onChange={handleDropdownChange}
        options={PREDEFINED_ROLES.map((r) => ({ value: r, label: r }))}
        placeholder="Select your role..."
        error={errors.section_1_role_experience?.current_role?.message}
        helpText="Your role relevant to this learning initiative"
        required
      />

      {/* Custom Input */}
      {showCustomInput && (
        <div className="animate-fade-in-up">
          <QuestionnaireInput
            label="Specify your custom role"
            value={watch('section_1_role_experience.custom_role') || ''}
            onChange={(value) => setValue('section_1_role_experience.custom_role', value)}
            placeholder="e.g., Chief Learning Officer, Curriculum Developer, etc."
            error={errors.section_1_role_experience?.custom_role?.message}
            helpText="Enter your specific role title"
            required
          />
        </div>
      )}

      {/* Years in Role - Slider */}
      <div className="space-y-3">
        <label className="text-foreground block text-[15px] leading-tight font-medium">
          Years in Current Role *
        </label>
        <div className="px-3">
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              value={yearsInRole || 0}
              onChange={(e) => handleSliderChange(parseFloat(e.target.value))}
              className="slider budget-slider h-2 w-full cursor-pointer appearance-none rounded-lg bg-white/20"
              style={{
                background: `linear-gradient(to right, #a7dadb 0%, #a7dadb ${(yearsInRole || 0) * 5}%, rgba(255,255,255,0.2) ${(yearsInRole || 0) * 5}%, rgba(255,255,255,0.2) 100%)`,
              }}
            />
          </div>
          <div className="flex justify-between text-sm text-white/60">
            <span>0 years</span>
            <span className="text-primary font-medium">{yearsInRole || 0} years</span>
            <span>20+ years</span>
          </div>
        </div>
        {errors.section_1_role_experience?.years_in_role && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_1_role_experience.years_in_role.message}
            </span>
          </div>
        )}
      </div>

      {/* Industry Experience - Multiselect Rounded Bubbles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Industries You've Worked In *
          </label>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            Select all that apply
          </span>
        </div>

        {/* All Industries */}
        <div className="flex flex-wrap gap-3">
          {INDUSTRIES.map((industry) => {
            const isSelected = industryExperience.includes(industry);
            return (
              <button
                key={industry}
                type="button"
                onClick={() => handleIndustryChange(industry, !isSelected)}
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
                  {industry}
                </span>
              </button>
            );
          })}

          {/* Custom Industries as bubbles */}
          {industryExperience
            .filter((industry) => industry.startsWith('Other:'))
            .map((customIndustry, index) => (
              <div
                key={`custom-${index}`}
                className="bg-primary text-primary-foreground border-primary ring-primary/30 relative rounded-lg border px-4 py-2 text-sm font-medium shadow-lg ring-2"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {customIndustry.replace('Other: ', '')}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = industryExperience.filter((i) => i !== customIndustry);
                      setValue('industryExperience', filtered);
                    }}
                    className="hover:bg-primary/30 ml-1 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              </div>
            ))}

          {/* Other button */}
          <button
            type="button"
            onClick={() => handleIndustryChange('Other', !showOtherInput)}
            className={cn(
              'relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95',
              showOtherInput
                ? 'bg-primary text-primary-foreground border-primary ring-primary/30 shadow-lg ring-2'
                : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20'
            )}
          >
            <span className="flex items-center gap-2">
              {showOtherInput && (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              Other
            </span>
          </button>
        </div>

        {/* Custom Industry Input */}
        {showOtherInput && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input
              type="text"
              value={customIndustryInput}
              onChange={(e) => setCustomIndustryInput(e.target.value)}
              onKeyDown={handleCustomIndustryKeyDown}
              onBlur={handleCustomIndustrySubmit}
              placeholder="Enter custom industry..."
              className="text-foreground focus:border-primary focus:ring-primary/30 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-white/50 focus:ring-2 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomIndustrySubmit}
              disabled={!customIndustryInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}

        {errors.section_1_role_experience?.industry_experience && (
          <div className="animate-fade-in text-error flex items-start gap-2 text-[13px] font-medium">
            <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">
              {errors.section_1_role_experience.industry_experience.message}
            </span>
          </div>
        )}
      </div>

      {/* Team Size - Dropdown */}
      <QuestionnaireSelect
        label="Team Size"
        value={watch('section_1_role_experience.team_size')}
        onChange={(value) => setValue('section_1_role_experience.team_size', value)}
        options={TEAM_SIZES}
        placeholder="Select team size..."
        error={errors.section_1_role_experience?.team_size?.message}
        helpText="Number of people in your L&D team"
        required
      />

      {/* Technical Skills - Multiselect Bubbles */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-foreground block text-[15px] leading-tight font-medium">
            Technical Skills Relevant to L&D
          </label>
          <span className="rounded-full bg-white/10 px-2 py-1 text-xs text-white/60">
            Select all that apply
          </span>
        </div>

        {/* All Technical Skills */}
        <div className="flex flex-wrap gap-3">
          {TECHNICAL_SKILLS.map((skill) => {
            const isSelected = technicalSkills.includes(skill.value);
            return (
              <button
                key={skill.value}
                type="button"
                onClick={() => handleTechnicalSkillChange(skill.value, !isSelected)}
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
                  {skill.label}
                </span>
              </button>
            );
          })}

          {/* Custom Technical Skills as bubbles */}
          {technicalSkills
            .filter((skill) => skill.startsWith('Other:'))
            .map((customSkill, index) => (
              <div
                key={`custom-tech-${index}`}
                className="bg-primary text-primary-foreground border-primary ring-primary/30 relative rounded-lg border px-4 py-2 text-sm font-medium shadow-lg ring-2"
              >
                <span className="flex items-center gap-2">
                  <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  {customSkill.replace('Other: ', '')}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      const filtered = technicalSkills.filter((s) => s !== customSkill);
                      setValue('technicalSkills', filtered);
                    }}
                    className="hover:bg-primary/30 ml-1 rounded-full p-0.5 transition-colors"
                  >
                    <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </span>
              </div>
            ))}

          {/* Other button */}
          <button
            type="button"
            onClick={() => handleTechnicalSkillChange('Other', !showOtherTechnicalSkillInput)}
            className={cn(
              'relative rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200',
              'hover:scale-105 active:scale-95',
              showOtherTechnicalSkillInput
                ? 'bg-primary text-primary-foreground border-primary ring-primary/30 shadow-lg ring-2'
                : 'border-white/20 bg-white/10 text-white/80 hover:border-white/30 hover:bg-white/20'
            )}
          >
            <span className="flex items-center gap-2">
              {showOtherTechnicalSkillInput && (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              Other
            </span>
          </button>
        </div>

        {/* Custom Technical Skill Input */}
        {showOtherTechnicalSkillInput && (
          <div className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
            <input
              type="text"
              value={customTechnicalSkillInput}
              onChange={(e) => setCustomTechnicalSkillInput(e.target.value)}
              onKeyDown={handleCustomTechnicalSkillKeyDown}
              onBlur={handleCustomTechnicalSkillSubmit}
              placeholder="Enter custom technical skill..."
              className="text-foreground focus:border-primary focus:ring-primary/30 flex-1 rounded-md border border-white/20 bg-white/10 px-3 py-2 text-sm placeholder:text-white/50 focus:ring-2 focus:outline-none"
              autoFocus
            />
            <button
              type="button"
              onClick={handleCustomTechnicalSkillSubmit}
              disabled={!customTechnicalSkillInput.trim()}
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-3 py-2 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50"
            >
              Add
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
