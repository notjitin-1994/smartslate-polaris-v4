import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { StaticQuestionsFormValues } from '@/types/static-questionnaire';

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

type WizardState = {
  currentStepIndex: number;
  blueprintId: string | null;
  values: StaticQuestionsFormValues;
  questionnaireVersion: 1 | 2;
  completedSteps: number[];
  saveState: SaveState;
  errorMessage: string | null;

  // Actions
  setStep: (index: number) => void;
  markStepComplete: (index: number) => void;
  setBlueprintId: (id: string | null) => void;
  setValues: (values: Partial<StaticQuestionsFormValues>) => void;
  setSaveState: (state: SaveState, errorMessage?: string | null) => void;
  setQuestionnaireVersion: (version: 1 | 2) => void;
  reset: () => void;
};

const defaultValues: StaticQuestionsFormValues = {
  role: '',
  organization: {
    name: '',
    industry: '',
    size: '1-50',
    regions: [],
  },
  learnerProfile: {
    audienceSize: '1-10',
    priorKnowledge: 3,
    motivation: [],
    environment: [],
    devices: [],
    timeAvailable: 0,
    accessibility: [],
  },
  learningGap: {
    description: '',
    gapType: 'knowledge',
    urgency: 3,
    impact: 3,
    impactAreas: [],
    bloomsLevel: 'apply',
    objectives: '',
  },
  resources: {
    budget: { amount: 0, flexibility: 'flexible' },
    timeline: { targetDate: '', flexibility: 'flexible', duration: 12 },
    team: {
      instructionalDesigners: 0,
      contentDevelopers: 0,
      multimediaSpecialists: 0,
      smeAvailability: 3,
      experienceLevel: 'intermediate',
    },
    technology: { lms: '', authoringTools: [], otherTools: [] },
    contentStrategy: { source: 'scratch', existingMaterials: [] },
  },
  deliveryStrategy: {
    modality: 'self-paced',
    interactivityLevel: 3,
    practiceOpportunities: [],
    socialLearning: [],
    reinforcement: 'none',
  },
  constraints: [],
  evaluation: {
    level1: { methods: [], satisfactionTarget: 80 },
    level2: { assessmentMethods: [], passingRequired: false },
    level3: { measureBehavior: false },
    level4: { measureROI: false },
    certification: 'none',
  },
};

export const useWizardStore = create<WizardState>()(
  persist(
    (set) => ({
      currentStepIndex: 0,
      blueprintId: null,
      values: defaultValues,
      questionnaireVersion: 2,
      completedSteps: [],
      saveState: 'idle',
      errorMessage: null,

      setStep: (index) => set({ currentStepIndex: index }),

      markStepComplete: (index) =>
        set((state) => ({
          completedSteps: Array.from(new Set([...state.completedSteps, index])).sort(),
        })),

      setBlueprintId: (id) => set({ blueprintId: id }),

      setValues: (values) =>
        set((state) => ({
          values: { ...state.values, ...values } as StaticQuestionsFormValues,
        })),

      setSaveState: (state, errorMessage = null) => set({ saveState: state, errorMessage }),

      setQuestionnaireVersion: (version) => set({ questionnaireVersion: version }),

      reset: () =>
        set({
          currentStepIndex: 0,
          blueprintId: null,
          values: defaultValues,
          questionnaireVersion: 2,
          completedSteps: [],
          saveState: 'idle',
          errorMessage: null,
        }),
    }),
    {
      name: 'wizard-storage',
      version: 2,
    }
  )
);
