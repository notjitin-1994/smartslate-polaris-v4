import { z } from 'zod';

// ==================== STEP 1: Role (V1 compatible) ====================
export const roleSchema = z.string().min(2, 'Please provide at least 2 characters');

// ==================== STEP 2: Organization ====================
export const organizationSchemaV2 = z.object({
  name: z.string().min(2, 'Organization name required'),
  industry: z.string().min(1, 'Industry required'),
  size: z.enum(['1-50', '51-200', '201-1000', '1000+']),
  regions: z.array(z.string()).default([]),
});

// V1 backward compatibility
export const organizationSchemaV1 = z.string().min(2, 'Please provide at least 2 characters');

// ==================== STEP 3: Learner Profile ====================
export const learnerProfileSchema = z.object({
  audienceSize: z.enum(['1-10', '11-50', '51-200', '201-1000', '1000+']),
  priorKnowledge: z.number().int().min(1).max(5).default(3),
  motivation: z
    .array(z.enum(['mandatory', 'career', 'performance', 'certification', 'personal']))
    .min(1, 'Select at least one motivation'),
  environment: z.array(z.string()).min(1, 'Select at least one environment'),
  devices: z
    .array(z.enum(['desktop', 'laptop', 'tablet', 'smartphone']))
    .min(1, 'Select at least one device'),
  timeAvailable: z.number().min(0).max(168).default(0), // max hours in a week
  accessibility: z.array(z.string()).default([]),
});

// ==================== STEP 4: Learning Gap & Objectives ====================
export const learningGapSchemaV2 = z.object({
  description: z.string().min(10, 'Please provide at least 10 characters'),
  gapType: z.enum(['knowledge', 'skill', 'behavior', 'performance']),
  urgency: z.number().int().min(1).max(5).default(3),
  impact: z.number().int().min(1).max(5).default(3),
  impactAreas: z.array(z.string()).min(1, 'Select at least one impact area'),
  bloomsLevel: z.enum(['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create']),
  objectives: z.string().min(10, 'Learning objectives required'),
});

// V1 backward compatibility
export const learningGapSchemaV1 = z.string().min(10, 'Please provide at least 10 characters');

// ==================== STEP 5: Resources ====================
export const resourcesSchemaV2 = z.object({
  budget: z.object({
    amount: z.number().nonnegative('Budget must be 0 or greater'),
    flexibility: z.enum(['fixed', 'flexible']).default('flexible'),
  }),
  timeline: z.object({
    targetDate: z.string().min(1, 'Target date required'),
    flexibility: z.enum(['fixed', 'flexible']).default('flexible'),
    duration: z.number().positive('Duration must be greater than 0'),
  }),
  team: z.object({
    instructionalDesigners: z.number().int().min(0).default(0),
    contentDevelopers: z.number().int().min(0).default(0),
    multimediaSpecialists: z.number().int().min(0).default(0),
    smeAvailability: z.number().int().min(1).max(5).default(3),
    experienceLevel: z
      .enum(['beginner', 'intermediate', 'advanced', 'expert'])
      .default('intermediate'),
  }),
  technology: z.object({
    lms: z.string().min(1, 'LMS selection required'),
    authoringTools: z.array(z.string()).default([]),
    otherTools: z.array(z.string()).default([]),
  }),
  contentStrategy: z.object({
    source: z.enum(['scratch', 'adapt', 'license', 'curate', 'hybrid']),
    existingMaterials: z.array(z.string()).optional(),
  }),
});

// V1 backward compatibility
export const resourcesSchemaV1 = z.string().min(3, 'Please provide at least 3 characters');

// ==================== STEP 6: Delivery Strategy ====================
export const deliveryStrategySchema = z.object({
  modality: z.enum(['self-paced', 'ilt', 'blended', 'microlearning', 'simulation', 'video']),
  duration: z.number().positive().optional(),
  sessionStructure: z.enum(['1-day', 'multi-day', 'weekly', 'monthly']).optional(),
  interactivityLevel: z.number().int().min(1).max(5).default(3),
  practiceOpportunities: z.array(z.string()).default([]),
  socialLearning: z.array(z.string()).default([]),
  reinforcement: z
    .enum(['none', 'emails', 'microlearning', 'coaching', 'community'])
    .default('none'),
});

// ==================== STEP 7: Constraints ====================
export const constraintsSchema = z
  .array(z.string())
  .min(1, 'Please select at least one constraint');

// ==================== STEP 8: Evaluation ====================
export const evaluationSchema = z.object({
  level1: z.object({
    methods: z.array(z.string()).min(1, 'Select at least one feedback method'),
    satisfactionTarget: z.number().min(0).max(100).default(80),
  }),
  level2: z.object({
    assessmentMethods: z.array(z.string()).min(1, 'Select at least one assessment method'),
    passingRequired: z.boolean().default(false),
    passingScore: z.number().min(60).max(100).optional(),
    attemptsAllowed: z.number().int().positive().optional(),
  }),
  level3: z.object({
    measureBehavior: z.boolean().default(false),
    methods: z.array(z.string()).optional(),
    followUpTiming: z.string().optional(),
    behaviors: z.string().optional(),
  }),
  level4: z.object({
    measureROI: z.boolean().default(false),
    metrics: z.array(z.string()).optional(),
    owner: z.string().optional(),
    timing: z.string().optional(),
  }),
  certification: z.enum(['internal', 'industry', 'ceu', 'pdh', 'none']).default('none'),
});

// ==================== Full Schemas ====================

// V1 Schema (backward compatibility)
export const staticQuestionsSchemaV1 = z.object({
  version: z.literal(1).optional(),
  role: roleSchema,
  organization: organizationSchemaV1,
  learningGap: learningGapSchemaV1,
  resources: resourcesSchemaV1,
  constraints: constraintsSchema,
});

// V2 Schema (full) - version is added on save, not validated in form
export const staticQuestionsSchemaV2 = z.object({
  role: roleSchema,
  organization: organizationSchemaV2,
  learnerProfile: learnerProfileSchema,
  learningGap: learningGapSchemaV2,
  resources: resourcesSchemaV2,
  deliveryStrategy: deliveryStrategySchema,
  constraints: constraintsSchema,
  evaluation: evaluationSchema,
});

// Union type for validation
export const staticQuestionsSchema = z.union([staticQuestionsSchemaV1, staticQuestionsSchemaV2]);

// Type exports
export type StaticQuestionsFormValuesV1 = z.infer<typeof staticQuestionsSchemaV1>;
export type StaticQuestionsFormValuesV2 = z.infer<typeof staticQuestionsSchemaV2>;
export type StaticQuestionsFormValues = z.infer<typeof staticQuestionsSchema>;
