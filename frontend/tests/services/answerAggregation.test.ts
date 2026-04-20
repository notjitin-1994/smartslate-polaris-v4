import { describe, it, expect, beforeEach, vi } from 'vitest';
import { answerAggregationService } from '@/lib/services/answerAggregation';
import { useWizardStore } from '@/store/wizardStore';
import { useFormStore } from '@/lib/dynamic-form/store/formStore';

describe('AnswerAggregationService', () => {
  beforeEach(() => {
    // Reset stores and cache before each test
    useWizardStore.setState(
      {
        values: {
          learningObjective: '',
          targetAudience: '',
          deliveryMethod: 'online',
          duration: 1,
          assessmentType: '',
        },
        blueprintId: null,
        currentStepIndex: 0,
        saveState: 'idle',
        errorMessage: null,
      },
      true
    ); // The true parameter tells Zustand to replace the state entirely

    useFormStore.setState(
      {
        formData: {},
        currentSection: '',
        completedSections: [],
        isSubmitting: false,
        isSaving: false,
        lastSaved: null,
        hasUnsavedChanges: false,
        saveStatus: 'idle',
        errors: {},
        isValid: false,
        formSchema: null,
        validationEngine: null,
      },
      true
    );

    answerAggregationService.clearCache();
    vi.clearAllMocks();
  });

  it('should aggregate static answers from wizard store', async () => {
    // Set values directly using setState instead of calling methods
    useWizardStore.setState({
      values: {
        learningObjective: 'Learn Vitest',
        targetAudience: '',
        deliveryMethod: 'online',
        duration: 5,
        assessmentType: '',
      },
    });

    const staticAnswers = await answerAggregationService.aggregateStaticAnswers();
    expect(staticAnswers).toEqual(
      expect.arrayContaining([
        { questionId: 'learningObjective', answer: 'Learn Vitest' },
        { questionId: 'duration', answer: 5 },
      ])
    );
    expect(staticAnswers.length).toBe(5); // All 5 static fields should be present even if empty
  });

  it('should aggregate dynamic answers from form store', async () => {
    // Set form data directly using setState
    useFormStore.setState({
      formData: {
        question1: 'Answer 1',
        question2: 123,
      },
    });

    const dynamicAnswers = await answerAggregationService.aggregateDynamicAnswers();
    expect(dynamicAnswers).toEqual(
      expect.arrayContaining([
        { questionId: 'question1', answer: 'Answer 1' },
        { questionId: 'question2', answer: 123 },
      ])
    );
    expect(dynamicAnswers.length).toBe(2);
  });

  it('should return aggregated answers containing both static and dynamic responses', async () => {
    // Set values directly using setState
    useWizardStore.setState({
      values: {
        learningObjective: 'Learn Aggregation',
        targetAudience: '',
        deliveryMethod: 'online',
        duration: 1,
        assessmentType: '',
      },
    });
    useFormStore.setState({
      formData: {
        dynamicQ1: 'Dynamic Answer',
      },
    });

    const aggregated = await answerAggregationService.getAggregatedAnswers();
    expect(aggregated.staticResponses).toEqual(
      expect.arrayContaining([{ questionId: 'learningObjective', answer: 'Learn Aggregation' }])
    );
    expect(aggregated.dynamicResponses).toEqual(
      expect.arrayContaining([{ questionId: 'dynamicQ1', answer: 'Dynamic Answer' }])
    );
    expect(aggregated.staticResponses.length).toBe(5);
    expect(aggregated.dynamicResponses.length).toBe(1);
  });

  it('should sanitize string answers by trimming whitespace', async () => {
    // Set values directly using setState
    useWizardStore.setState({
      values: {
        learningObjective: '  Trimmed Objective  ',
        targetAudience: '',
        deliveryMethod: 'online',
        duration: 1,
        assessmentType: '',
      },
    });

    const staticAnswers = await answerAggregationService.aggregateStaticAnswers();
    const learningObjectiveAnswer = staticAnswers.find((a) => a.questionId === 'learningObjective');
    expect(learningObjectiveAnswer?.answer).toBe('Trimmed Objective');
  });

  it('should clear the cache', async () => {
    // Populate stores and trigger aggregation using setState
    useWizardStore.setState({
      values: {
        learningObjective: 'Test',
        targetAudience: '',
        deliveryMethod: 'online',
        duration: 1,
        assessmentType: '',
      },
    });
    useFormStore.setState({
      formData: { q: 'A' },
    });
    await answerAggregationService.getAggregatedAnswers();

    answerAggregationService.clearCache();

    // Reset stores to empty state after clearing cache
    useWizardStore.setState({
      values: {
        learningObjective: '',
        targetAudience: '',
        deliveryMethod: 'online',
        duration: 1,
        assessmentType: '',
      },
    });
    useFormStore.setState({
      formData: {},
    });

    // Verify that new aggregation would not use old data (since cache is cleared)
    const newAggregated = await answerAggregationService.getAggregatedAnswers();
    expect(
      newAggregated.staticResponses.find((a) => a.questionId === 'learningObjective')?.answer
    ).toBe('');
    expect(newAggregated.dynamicResponses.length).toBe(0);
  });
});
