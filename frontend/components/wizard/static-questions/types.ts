import { z } from 'zod';
import {
  staticQuestionsSchemaV1,
  staticQuestionsSchemaV2,
  staticQuestionsSchema,
  type StaticQuestionsFormValuesV1,
  type StaticQuestionsFormValuesV2,
  type StaticQuestionsFormValues,
} from './validation';

// Re-export from validation for convenience
export { staticQuestionsSchemaV1, staticQuestionsSchemaV2, staticQuestionsSchema };
export type { StaticQuestionsFormValuesV1, StaticQuestionsFormValuesV2, StaticQuestionsFormValues };

// Main type is the union type for backward compatibility
export type StaticQuestionsFormValuesCompat = StaticQuestionsFormValuesV2;

// Export union schema as default for backward compatibility
export const staticQuestionsSchemaCompat = staticQuestionsSchema;

export type WizardStepConfig = {
  key: string;
  label: string;
  description?: string;
  fields: string[];
};

// V2 wizard steps (8 steps) - NOW DEFAULT
export const wizardSteps: WizardStepConfig[] = [
  {
    key: 'role',
    label: 'Role',
    description: 'Your role relevant to this learning initiative',
    fields: ['role'],
  },
  {
    key: 'organization',
    label: 'Organization',
    description: 'Organization context and industry',
    fields: ['organization'],
  },
  {
    key: 'learnerProfile',
    label: 'Learner Profile',
    description: 'Target audience analysis',
    fields: ['learnerProfile'],
  },
  {
    key: 'learningGap',
    label: 'Learning Gap & Objectives',
    description: 'Gap analysis and learning outcomes',
    fields: ['learningGap'],
  },
  {
    key: 'resources',
    label: 'Resources & Budget',
    description: 'Budget, timeline, team, and technology',
    fields: ['resources'],
  },
  {
    key: 'deliveryStrategy',
    label: 'Delivery Strategy',
    description: 'Modality, interactivity, and practice',
    fields: ['deliveryStrategy'],
  },
  {
    key: 'constraints',
    label: 'Constraints',
    description: 'Project limitations and boundaries',
    fields: ['constraints'],
  },
  {
    key: 'evaluation',
    label: 'Assessment & Evaluation',
    description: 'Measurement strategy (Kirkpatrick)',
    fields: ['evaluation'],
  },
];

// V2 default values
export const defaultValues: StaticQuestionsFormValuesV2 = {
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
