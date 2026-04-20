'use client';

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useWizardStore } from '@/store/wizardStore';
import {
  staticQuestionsSchema,
  defaultValues,
  wizardSteps,
  type StaticQuestionsFormValues,
} from '@/components/wizard/static-questions/types';
import {
  RoleStep,
  OrganizationStep,
  LearnerProfileStep,
  LearningGapStep,
  ResourcesStep,
  DeliveryStrategyStep,
  ConstraintsStep,
  EvaluationStep,
} from '@/components/wizard/static-questions/steps';
import { QuestionnaireProgress } from '@/components/wizard/static-questions/QuestionnaireProgress';
import { QuestionnaireButton } from '@/components/wizard/static-questions/QuestionnaireButton';
import { useSession } from '@/hooks/useSession';
import { useAutoSave } from '@/components/wizard/static-questions/hooks/useAutoSave';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

// V2: 8 steps - role → organization → learnerProfile → learningGap → resources → deliveryStrategy → constraints → evaluation
const StepComponents: Record<number, React.FC> = {
  0: RoleStep,
  1: OrganizationStep,
  2: LearnerProfileStep,
  3: LearningGapStep,
  4: ResourcesStep,
  5: DeliveryStrategyStep,
  6: ConstraintsStep,
  7: EvaluationStep,
};

export function StepWizard(): React.JSX.Element {
  const { user } = useSession();
  const searchParams = useSearchParams();
  const { currentStepIndex, setStep, values, setValues, saveState, blueprintId, setBlueprintId } =
    useWizardStore();
  const [isLoadingExisting, setIsLoadingExisting] = useState(false);

  const methods = useForm<StaticQuestionsFormValues>({
    resolver: zodResolver(staticQuestionsSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: values ?? defaultValues,
    shouldUnregister: false, // Keep all fields registered even when not visible
  });

  // Keep Zustand in sync with RHF
  React.useEffect(() => {
    const subscription = methods.watch((val) => {
      setValues(val as Partial<StaticQuestionsFormValues>);
    });
    return () => subscription.unsubscribe();
  }, [methods, setValues]);

  // Load blueprint data based on ?bid param or find existing draft
  useEffect(() => {
    const loadBlueprint = async () => {
      if (!user?.id) return;

      setIsLoadingExisting(true);

      try {
        const { BlueprintService } = await import('@/lib/db/blueprints');
        const supabase = getSupabaseBrowserClient();
        const blueprintService = new BlueprintService(supabase);

        const forcedId = searchParams.get('bid');

        console.log('[StepWizard] Loading blueprint:', {
          forcedId,
          currentBlueprintId: blueprintId,
        });

        // Priority 1: Load the blueprint specified by ?bid parameter
        if (forcedId) {
          const bp = await blueprintService.getBlueprint(forcedId);

          if (bp && bp.user_id === user.id) {
            console.log('[StepWizard] Loaded blueprint from ?bid:', {
              id: bp.id,
              hasStaticAnswers: !!bp.static_answers,
              staticAnswersKeys: bp.static_answers ? Object.keys(bp.static_answers) : [],
            });

            // If blueprint ID changed, reset the form
            if (blueprintId !== bp.id) {
              console.log('[StepWizard] Blueprint changed, resetting form');
              setBlueprintId(bp.id);
              setStep(0); // Reset to first step
            }

            // Check if static_answers has actual data or is empty
            const hasData =
              bp.static_answers &&
              typeof bp.static_answers === 'object' &&
              Object.keys(bp.static_answers).length > 0;

            if (hasData) {
              // Load existing data into form
              const existingAnswers = bp.static_answers as Partial<StaticQuestionsFormValues>;
              console.log('[StepWizard] Populating form with existing data');
              setValues(existingAnswers);
              methods.reset(existingAnswers);
            } else {
              // Empty blueprint - reset to default values
              console.log('[StepWizard] New/empty blueprint - using default values');
              setValues(defaultValues);
              methods.reset(defaultValues);
            }

            setIsLoadingExisting(false);
            return;
          } else {
            console.error('[StepWizard] Blueprint not found or access denied');
            setIsLoadingExisting(false);
            return;
          }
        }

        // Priority 2: If no ?bid and no blueprintId in store, look for most recent draft
        if (!blueprintId) {
          console.log('[StepWizard] No ?bid param, searching for existing draft');
          const userBlueprints = await blueprintService.getBlueprintsByUser(user.id);
          const draftBlueprint = userBlueprints.find((bp) => bp.status === 'draft');

          if (draftBlueprint) {
            console.log('[StepWizard] Found existing draft:', draftBlueprint.id);
            setBlueprintId(draftBlueprint.id);

            const hasData =
              draftBlueprint.static_answers &&
              typeof draftBlueprint.static_answers === 'object' &&
              Object.keys(draftBlueprint.static_answers).length > 0;

            if (hasData) {
              const existingAnswers =
                draftBlueprint.static_answers as Partial<StaticQuestionsFormValues>;
              console.log('[StepWizard] Loading draft data');
              setValues(existingAnswers);
              methods.reset(existingAnswers);
            } else {
              console.log('[StepWizard] Draft exists but is empty - using default values');
              setValues(defaultValues);
              methods.reset(defaultValues);
            }
          } else {
            // No draft found - start fresh with default values
            console.log('[StepWizard] No draft found - starting fresh');
            setValues(defaultValues);
            methods.reset(defaultValues);
          }
        }
      } catch (error) {
        console.error('[StepWizard] Error loading blueprint:', error);
      } finally {
        setIsLoadingExisting(false);
      }
    };

    loadBlueprint();
  }, [user?.id, setValues, setBlueprintId, methods, searchParams, setStep, blueprintId]);

  // Auto-save on change
  useAutoSave(user?.id ?? null);

  // Auto-rename blueprint when enough static info is present
  useEffect(() => {
    const maybeRename = async () => {
      if (!user?.id || !blueprintId) return;
      const firstName = (user.user_metadata?.name as string | undefined)?.split(' ')[0] || 'Your';
      // Prefer canonical fields - handle both string and array values
      const orgValue = (values as Record<string, unknown>).organization;
      const org =
        typeof orgValue === 'string'
          ? orgValue
          : Array.isArray(orgValue)
            ? orgValue.filter((item) => typeof item === 'string').join(', ')
            : '';
      if (!org || org.trim().length < 2) return;
      const desired = `${firstName}'s Polaris Starmap for ${org}`;
      try {
        const supabase = getSupabaseBrowserClient();
        // Only set if different
        await supabase
          .from('blueprint_generator')
          .update({ title: desired })
          .eq('id', blueprintId)
          .eq('user_id', user.id);
      } catch {
        // ignore non-fatal rename errors
      }
    };
    void maybeRename();
    // run when blueprintId or org changes
  }, [user?.id, user?.user_metadata?.name, blueprintId, values]);

  const goNext = async () => {
    // For V2, we need to validate based on step index, not field names
    // Step-specific validation rules
    let isValid = false;

    switch (currentStepIndex) {
      case 0: // Role
        isValid = await methods.trigger('role');
        break;
      case 1: // Organization
        isValid = await methods.trigger([
          'organization.name',
          'organization.industry',
          'organization.size',
        ] as const);
        break;
      case 2: // Learner Profile
        isValid = await methods.trigger([
          'learnerProfile.audienceSize',
          'learnerProfile.priorKnowledge',
          'learnerProfile.motivation',
          'learnerProfile.environment',
          'learnerProfile.devices',
          'learnerProfile.timeAvailable',
        ] as const);
        break;
      case 3: // Learning Gap
        isValid = await methods.trigger([
          'learningGap.description',
          'learningGap.gapType',
          'learningGap.urgency',
          'learningGap.impact',
          'learningGap.impactAreas',
          'learningGap.bloomsLevel',
          'learningGap.objectives',
        ] as const);
        break;
      case 4: // Resources
        isValid = await methods.trigger([
          'resources.budget.amount',
          'resources.budget.flexibility',
          'resources.timeline.targetDate',
          'resources.timeline.flexibility',
          'resources.timeline.duration',
          'resources.team.instructionalDesigners',
          'resources.team.contentDevelopers',
          'resources.team.multimediaSpecialists',
          'resources.team.smeAvailability',
          'resources.team.experienceLevel',
          'resources.technology.lms',
          'resources.contentStrategy.source',
        ] as const);
        break;
      case 5: // Delivery Strategy
        isValid = await methods.trigger([
          'deliveryStrategy.modality',
          'deliveryStrategy.interactivityLevel',
          'deliveryStrategy.reinforcement',
        ] as const);
        break;
      case 6: // Constraints
        isValid = await methods.trigger('constraints');
        break;
      case 7: // Evaluation
        isValid = await methods.trigger([
          'evaluation.level1.methods',
          'evaluation.level1.satisfactionTarget',
          'evaluation.level2.assessmentMethods',
          'evaluation.level2.passingRequired',
          'evaluation.certification',
        ] as const);
        break;
      default:
        isValid = true;
    }

    if (!isValid) {
      console.log('Validation failed:', methods.formState.errors);
      return;
    }

    setStep(Math.min(currentStepIndex + 1, wizardSteps.length - 1));
  };

  const goPrev = () => {
    setStep(Math.max(currentStepIndex - 1, 0));
  };

  const _goTo = async (index: number) => {
    if (index <= currentStepIndex) return setStep(index);
    // Allow navigation without validation for now
    setStep(index);
  };

  const handleFinish = async () => {
    // Validate all required fields on finish
    const ok = await methods.trigger();
    if (!ok) {
      console.log('[StepWizard] Final validation failed:', methods.formState.errors);
      return;
    }

    console.log('[StepWizard] Validation passed, preparing to save and redirect');

    // Ensure version is set before saving
    const formData = methods.getValues();
    const dataToSave = {
      ...formData,
      version: 2, // Always save as V2
    };

    console.log('[StepWizard] Data to save:', {
      keys: Object.keys(dataToSave),
      hasRole: !!dataToSave.role,
      hasOrg: !!dataToSave.organization,
      hasLearningGap: !!dataToSave.learningGap,
    });

    // Update store with versioned data
    setValues(dataToSave);

    if (!blueprintId) {
      console.error('[StepWizard] No blueprint ID - cannot proceed');
      alert('Error: No blueprint ID found. Please try filling out the form again.');
      return;
    }

    // CRITICAL: Save immediately before redirecting (don't wait for debounced auto-save)
    console.log('[StepWizard] Saving final data before redirect...');
    try {
      const supabase = getSupabaseBrowserClient();
      const { error } = await supabase
        .from('blueprint_generator')
        .update({
          static_answers: dataToSave,
          questionnaire_version: 2,
          updated_at: new Date().toISOString(),
        })
        .eq('id', blueprintId)
        .eq('user_id', user?.id);

      if (error) {
        console.error('[StepWizard] Error saving final data:', error);
        alert('Error saving data. Please try again.');
        return;
      }

      console.log('[StepWizard] Final save successful, redirecting to loading screen');

      // Redirect to loading screen which will trigger dynamic question generation
      window.location.href = `/loading/${blueprintId}`;
    } catch (error) {
      console.error('[StepWizard] Exception during final save:', error);
      alert('Error saving data. Please try again.');
    }
  };

  const Current = StepComponents[currentStepIndex];

  if (isLoadingExisting) {
    return (
      <div className="glass-card p-6 md:p-8">
        <div className="animate-fade-in flex flex-col items-center justify-center py-12">
          <div className="border-primary/30 border-t-primary mb-4 h-12 w-12 animate-spin rounded-full border-2"></div>
          <p className="text-sm text-white/70">Loading your existing blueprint...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card animate-scale-in p-6 md:p-8">
      <FormProvider {...methods}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void goNext();
          }}
          className="w-full space-y-6"
        >
          <QuestionnaireProgress
            currentStep={currentStepIndex}
            totalSteps={wizardSteps.length}
            steps={wizardSteps}
          />

          <div className="relative min-h-[280px]">
            <Current />
          </div>

          {/* Save Status */}
          <div className="flex items-center justify-start py-2">
            {saveState === 'saving' && (
              <div className="animate-fade-in text-primary/80 flex items-center gap-2">
                <div className="border-primary/30 border-t-primary h-3 w-3 animate-spin rounded-full border-2"></div>
                <span className="text-xs font-medium">Saving...</span>
              </div>
            )}
            {saveState === 'saved' && (
              <div className="animate-fade-in text-success flex items-center gap-2">
                <div className="bg-success flex h-3 w-3 items-center justify-center rounded-full">
                  <svg className="h-2 w-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span className="text-xs font-medium">All changes saved</span>
              </div>
            )}
            {saveState === 'error' && (
              <div className="animate-fade-in text-error flex items-center gap-2">
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-xs font-medium">Save error</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex gap-3 pt-4">
            <QuestionnaireButton
              type="button"
              onClick={goPrev}
              disabled={currentStepIndex === 0}
              variant="ghost"
            >
              Previous
            </QuestionnaireButton>

            <QuestionnaireButton
              type={currentStepIndex === wizardSteps.length - 1 ? 'button' : 'submit'}
              onClick={currentStepIndex === wizardSteps.length - 1 ? handleFinish : undefined}
              disabled={currentStepIndex === wizardSteps.length - 1 && !blueprintId}
              variant="primary"
              fullWidth
            >
              {currentStepIndex === wizardSteps.length - 1
                ? 'Finish & Continue to Dynamic Questions'
                : 'Next'}
            </QuestionnaireButton>
          </div>
        </form>
      </FormProvider>
    </div>
  );
}

export default StepWizard;
