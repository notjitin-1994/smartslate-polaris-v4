'use client';

import React, { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { StandardHeader } from '@/components/layout/StandardHeader';
import { RoleExperienceSection } from '@/components/demo-v2-questionnaire/sections/RoleExperienceSection';
import { OrganizationDetailsSection } from '@/components/demo-v2-questionnaire/sections/OrganizationDetailsSection';
import { LearningGapSection } from '@/components/demo-v2-questionnaire/sections/LearningGapSection';
import { QuestionnaireProgress } from '@/components/demo-v2-questionnaire/QuestionnaireProgress';
import { QuestionnaireButton } from '@/components/demo-v2-questionnaire/QuestionnaireButton';

// Form validation schema for the 3-section static questionnaire
const staticQuestionnaireSchema = z.object({
  // Section 1: Role & Experience
  section_1_role_experience: z
    .object({
      current_role: z.string().min(1, 'Please select a role'),
      custom_role: z.string().optional(),
      years_in_role: z.number().min(0).max(50),
      industry_experience: z.array(z.string()).min(1, 'Please select at least one industry'),
      team_size: z.enum(['Solo', '2-5', '6-10', '11-25', '26-50', '51+']),
      technical_skills: z.array(z.string()).optional(),
    })
    .refine(
      (data) => {
        // If "Other" is selected, custom_role must be provided and not empty
        if (data.current_role === 'Other') {
          return data.custom_role && data.custom_role.trim().length > 0;
        }
        return true;
      },
      {
        message: 'Please specify your role',
        path: ['custom_role'],
      }
    ),

  // Section 2: Organization Details
  section_2_organization: z
    .object({
      organization_name: z
        .string()
        .min(2, 'Organization name must be at least 2 characters')
        .max(200),
      industry_sector: z.enum([
        'Technology',
        'Healthcare',
        'Financial Services',
        'Manufacturing',
        'Education',
        'Government/Public Sector',
        'Retail/E-commerce',
        'Professional Services',
        'Non-Profit',
        'Other',
      ]),
      organization_size: z.enum([
        '1-50',
        '51-200',
        '201-1000',
        '1001-5000',
        '5001-10000',
        '10000+',
      ]),
      geographic_regions: z.array(z.string()).min(1, 'Please select at least one region'),
      compliance_requirements: z
        .array(z.string())
        .min(1, 'Please select at least one compliance requirement'),
      data_sharing_policies: z.enum([
        'Unrestricted',
        'Internal Only',
        'Need-to-Know',
        'Highly Restricted',
        'Classified',
      ]),
      security_clearance: z
        .enum(['None', 'Confidential', 'Secret', 'Top Secret', 'Other'])
        .optional(),
      legal_restrictions: z.string().max(1000).optional(),
    })
    .refine(
      (data) => {
        // If "Other" is selected for industry_sector, we need a custom industry value
        // For now, we'll validate this in the component since we need access to the custom input state
        return true;
      },
      {
        message: 'Please specify your industry',
        path: ['industry_sector'],
      }
    ),

  // Section 3: Learning Gap & Learner Details
  section_3_learning_gap: z.object({
    learning_gap_description: z.string().min(10, 'Please provide a detailed description').max(2000),
    total_learners_range: z.enum([
      '1-10',
      '11-25',
      '26-50',
      '51-100',
      '101-250',
      '251-500',
      '501-1000',
      '1000+',
    ]),
    current_knowledge_level: z.number().min(1).max(5),
    motivation_factors: z.array(z.string()).min(1, 'Please select at least one motivation factor'),
    learning_location: z.array(z.string()).min(1, 'Please select at least one learning location'),
    devices_used: z.array(z.string()).min(1, 'Please select at least one device type'),
    hours_per_week: z.enum([
      '<1 hour',
      '1-2 hours',
      '3-5 hours',
      '6-10 hours',
      '11-20 hours',
      '20+ hours',
    ]),
    learning_deadline: z.string().optional(),
    budget_available: z
      .object({
        currency: z.string().optional(),
        amount: z.number().min(0).optional(),
      })
      .optional(),
  }),
});

type StaticQuestionnaireFormData = z.infer<typeof staticQuestionnaireSchema>;

const defaultValues: StaticQuestionnaireFormData = {
  section_1_role_experience: {
    current_role: '',
    custom_role: '',
    years_in_role: 0,
    industry_experience: [],
    team_size: 'Solo',
    technical_skills: [],
  },
  section_2_organization: {
    organization_name: '',
    industry_sector: 'Technology',
    organization_size: '1-50',
    geographic_regions: [],
    compliance_requirements: [],
    data_sharing_policies: 'Unrestricted',
    security_clearance: 'None',
    legal_restrictions: '',
  },
  section_3_learning_gap: {
    learning_gap_description: '',
    total_learners_range: '1-10',
    current_knowledge_level: 3,
    motivation_factors: [],
    learning_location: [],
    devices_used: [],
    hours_per_week: '<1 hour',
    learning_deadline: '',
    budget_available: {
      currency: 'USD',
      amount: 0,
    },
  },
};

const sections = [
  {
    id: 1,
    title: 'Role & Experience',
    description:
      'Tell us about your professional background and current responsibilities. This helps us understand your perspective and tailor recommendations to your specific needs.',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            The information you provide here forms the foundation of your personalized learning
            blueprint. Each detail helps us create recommendations that are precisely tailored to
            your unique context and challenges.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">🎯 Your Role & Experience</h4>
              <p className="text-text-secondary text-sm">
                Your position determines the lens through which we view your learning needs. A
                manager focuses on strategic ROI and organizational impact, while a specialist needs
                deep technical implementation guidance.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">🏢 Industry Context</h4>
              <p className="text-text-secondary text-sm">
                Different industries have unique compliance requirements, learning cultures, and
                operational constraints. Healthcare organizations need HIPAA-compliant solutions,
                while financial services prioritize security and regulatory compliance.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">👥 Team & Budget Realities</h4>
              <p className="text-text-secondary text-sm">
                Your team size and budget constraints directly impact implementation feasibility.
                We&apos;ll recommend scalable solutions that fit your resources while maximizing
                learning outcomes and organizational impact.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">⚡ Technical Capabilities</h4>
              <p className="text-text-secondary text-sm">
                Your existing technical skills and tools influence which solutions are practical.
                We&apos;ll leverage your current tech stack while identifying opportunities to
                enhance your L&D technology ecosystem.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 text-sm font-medium">💡 The Result</p>
            <p className="text-text-secondary text-sm">
              By providing detailed, accurate information, you&apos;ll receive a learning blueprint
              that addresses your specific challenges, fits your organizational context, and
              delivers measurable results. Think of this as investing 10 minutes to save 10 months
              of trial and error.
            </p>
          </div>

          <p className="text-text-secondary text-center text-xs italic">
            Every detail matters. The more precisely you describe your situation, the more precisely
            we can solve it.
          </p>
        </div>
      ),
    },
  },
  {
    id: 2,
    title: 'Organization Details',
    description: 'Help us understand your organization context',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Your organization&apos;s structure, industry, and operational environment significantly
            influence the type of learning solutions that will work best for your team.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">🏢 Organizational Structure</h4>
              <p className="text-text-secondary text-sm">
                Understanding your company size, hierarchy, and decision-making processes helps us
                recommend solutions that align with your organizational culture and approval
                workflows.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">🏭 Industry Requirements</h4>
              <p className="text-text-secondary text-sm">
                Different sectors have unique compliance needs, learning preferences, and
                operational constraints. We tailor our recommendations to ensure they meet your
                industry&apos;s specific standards and expectations.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">
                🌍 Geographic & Compliance Factors
              </h4>
              <p className="text-text-secondary text-sm">
                Your organization&apos;s geographic footprint and regulatory requirements directly
                impact content delivery, data handling, and compliance considerations in your
                learning solutions.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 text-sm font-medium">🎯 Organizational Alignment</p>
            <p className="text-text-secondary text-sm">
              This information ensures your learning blueprint integrates seamlessly with your
              existing systems, respects your organizational boundaries, and supports your strategic
              objectives.
            </p>
          </div>
        </div>
      ),
    },
  },
  {
    id: 3,
    title: 'Learning Gap & Learners',
    description: 'Define what needs to be learned and who needs it',
    whyThisMatters: {
      title: 'Why does this matter?',
      content: (
        <div className="space-y-4">
          <p className="text-[15px] leading-relaxed">
            Clearly defining your learning objectives and target audience ensures we create
            solutions that address real gaps and resonate with your learners&apos; needs and
            motivations.
          </p>

          <div className="grid gap-4">
            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">🎯 Learning Objectives</h4>
              <p className="text-text-secondary text-sm">
                Specific, measurable learning goals help us design targeted interventions rather
                than generic training. We align content with your desired outcomes and success
                metrics.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">👥 Target Audience</h4>
              <p className="text-text-secondary text-sm">
                Understanding your learners&apos; prior knowledge, motivation factors, and learning
                preferences allows us to create engaging, relevant content that respects their time
                and learning styles.
              </p>
            </div>

            <div className="bg-primary/5 border-primary/10 rounded-lg border p-3">
              <h4 className="text-primary mb-2 font-semibold">⏰ Timeline & Resources</h4>
              <p className="text-text-secondary text-sm">
                Your available time and budget constraints shape the scope and delivery method of
                your learning solution, ensuring it&apos;s realistic and sustainable within your
                operational context.
              </p>
            </div>
          </div>

          <div className="from-primary/10 to-secondary/10 border-primary/20 rounded-lg border bg-gradient-to-r p-4">
            <p className="text-primary mb-2 text-sm font-medium">📊 Outcome-Focused Design</p>
            <p className="text-text-secondary text-sm">
              This precision ensures your learning solution delivers measurable improvements in
              knowledge, skills, and performance, with clear evaluation criteria and success
              metrics.
            </p>
          </div>
        </div>
      ),
    },
  },
];

export default function DemoV2QuestionnairePage(): React.JSX.Element {
  const [currentSection, setCurrentSection] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [blueprintId, setBlueprintId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const methods = useForm<StaticQuestionnaireFormData>({
    resolver: zodResolver(staticQuestionnaireSchema),
    mode: 'onChange',
    defaultValues,
  });

  const {
    handleSubmit,
    trigger,
    formState: { errors, isValid },
    getValues,
  } = methods;

  // Function to save questionnaire data
  const saveQuestionnaire = async (data?: StaticQuestionnaireFormData): Promise<string | null> => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const formData = data || getValues();

      const response = await fetch('/api/questionnaire/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          staticAnswers: formData,
          blueprintId: blueprintId || undefined,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to save questionnaire');
      }

      if (result.blueprintId && !blueprintId) {
        setBlueprintId(result.blueprintId);
      }

      return result.blueprintId;
    } catch (error) {
      console.error('Error saving questionnaire:', error);
      setSaveError(error instanceof Error ? error.message : 'Failed to save questionnaire');
      return null;
    } finally {
      setIsSaving(false);
    }
  };

  const goToNextSection = async () => {
    console.log('Next button clicked. Current section:', currentSection);
    console.log('Form isValid:', isValid);
    console.log('Form errors:', errors);

    if (currentSection < 3) {
      // Save current form data before proceeding
      const formData = getValues();
      await saveQuestionnaire(formData);

      setCurrentSection(currentSection + 1);
      console.log('Moved to section:', currentSection + 1);
    } else {
      console.log('Already at last section');
    }
  };

  const goToPreviousSection = () => {
    if (currentSection > 1) {
      setCurrentSection(currentSection - 1);
    }
  };

  const getFieldsForSection = (section: number): string[] => {
    switch (section) {
      case 1:
        return ['section_1_role_experience'];
      case 2:
        return ['section_2_organization'];
      case 3:
        return ['section_3_learning_gap'];
      default:
        return [];
    }
  };

  const onSubmit = async (data: StaticQuestionnaireFormData) => {
    setIsSubmitting(true);
    setSaveError(null);

    try {
      console.log('Form submitted with data:', data);

      // Save the final form data
      const savedBlueprintId = await saveQuestionnaire(data);

      if (!savedBlueprintId) {
        throw new Error('Failed to save questionnaire data');
      }

      console.log('Triggering dynamic question generation for blueprint:', savedBlueprintId);

      // Trigger dynamic questionnaire generation using the new V2.0 service
      const generateResponse = await fetch('/api/generate-dynamic-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          blueprintId: savedBlueprintId,
        }),
      });

      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        throw new Error(errorData.error || 'Failed to generate dynamic questions');
      }

      const generateResult = await generateResponse.json();
      console.log('Dynamic questions generated:', generateResult);

      // Show success message and redirect to dynamic questionnaire
      alert(
        `✅ Static questionnaire completed!\n\n${generateResult.message}\n\nGenerated ${generateResult.dynamicQuestions?.length || 0} sections with dynamic questions.`
      );

      // TODO: Redirect to dynamic questionnaire page
      // window.location.href = `/dynamic-questionnaire/${savedBlueprintId}`;
    } catch (error) {
      console.error('Error submitting form:', error);
      setSaveError(error instanceof Error ? error.message : 'Error submitting form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderCurrentSection = () => {
    switch (currentSection) {
      case 1:
        return <RoleExperienceSection />;
      case 2:
        return <OrganizationDetailsSection />;
      case 3:
        return <LearningGapSection />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#020C1B]">
      <StandardHeader
        title="Static Questionnaire Demo (v2.0)"
        backHref="/"
        backLabel="Back to Dashboard"
        backButtonStyle="icon-only"
        showDarkModeToggle={false}
        showUserAvatar={false}
        size="compact"
        user={undefined}
      />

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="max-w-6xl text-left">
            {/* Main Title */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-8"
            >
              <h1 className="font-heading lg:text-10xl text-7xl font-bold tracking-tight text-white sm:text-8xl md:text-9xl">
                <span>Blueprint </span>
                <span className="text-primary">Builder</span>
              </h1>
            </motion.div>

            {/* Subtitle */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="mb-12"
            >
              <p className="text-xl leading-relaxed text-white/70 sm:text-2xl lg:text-3xl">
                Complete this{' '}
                <span className="text-primary font-medium">comprehensive questionnaire</span> to
                help us understand your{' '}
                <span className="text-primary font-medium">professional context</span>,{' '}
                <span className="text-primary font-medium">organizational requirements</span>, and{' '}
                <span className="text-primary font-medium">learning objectives</span>.
              </p>
            </motion.div>

            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
              className="bg-primary mt-16 h-px w-24"
            />
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="w-full px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FormProvider {...methods}>
            <form onSubmit={handleSubmit(onSubmit)}>
              {/* Main Questionnaire Card */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="glass-card space-y-8 p-8 md:p-10"
              >
                {/* Progress Indicator */}
                <QuestionnaireProgress
                  currentStep={currentSection - 1}
                  totalSteps={3}
                  sections={sections}
                />

                {/* Current Section */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentSection}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="animate-fade-in-up space-y-7"
                  >
                    {renderCurrentSection()}
                  </motion.div>
                </AnimatePresence>

                {/* Error Display */}
                {saveError && (
                  <div className="bg-error/10 border-error/20 rounded-lg border p-4">
                    <p className="text-error text-sm">⚠️ {saveError}</p>
                  </div>
                )}

                {/* Navigation */}
                <div className="flex items-center justify-end border-t border-white/10 pt-8">
                  <div className="flex items-center gap-3">
                    {currentSection > 1 && (
                      <QuestionnaireButton
                        type="button"
                        onClick={goToPreviousSection}
                        variant="ghost"
                        disabled={isSaving || isSubmitting}
                      >
                        Previous
                      </QuestionnaireButton>
                    )}
                    {currentSection < 3 ? (
                      <QuestionnaireButton
                        type="button"
                        onClick={goToNextSection}
                        variant="primary"
                        disabled={isSaving || isSubmitting}
                      >
                        {isSaving ? 'Saving...' : 'Next Section'}
                      </QuestionnaireButton>
                    ) : (
                      <QuestionnaireButton
                        type="submit"
                        disabled={!isValid || isSubmitting || isSaving}
                        variant="primary"
                      >
                        {isSubmitting ? 'Processing...' : 'Complete Questionnaire'}
                      </QuestionnaireButton>
                    )}
                  </div>
                </div>
              </motion.div>
            </form>
          </FormProvider>
        </div>
      </main>
    </div>
  );
}
