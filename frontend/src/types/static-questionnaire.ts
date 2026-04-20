/**
 * Static Questionnaire Type Definitions
 * Version 2 - Enhanced with ID/LXD best practices
 */

// ==================== STEP 1: Role ====================
export type RoleData = string;

// ==================== STEP 2: Organization ====================
export interface OrganizationData {
  name: string;
  industry: string;
  size: '1-50' | '51-200' | '201-1000' | '1000+';
  regions?: string[];
}

// ==================== STEP 3: Learner Profile ====================
export interface LearnerProfileData {
  audienceSize: '1-10' | '11-50' | '51-200' | '201-1000' | '1000+';
  priorKnowledge: 1 | 2 | 3 | 4 | 5;
  motivation: ('mandatory' | 'career' | 'performance' | 'certification' | 'personal')[];
  environment: string[];
  devices: ('desktop' | 'laptop' | 'tablet' | 'smartphone')[];
  timeAvailable: number; // hours per week
  accessibility?: string[];
}

// ==================== STEP 4: Learning Gap & Objectives ====================
export type GapType = 'knowledge' | 'skill' | 'behavior' | 'performance';
export type BloomsLevel = 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

export interface LearningGapData {
  description: string;
  gapType: GapType;
  urgency: 1 | 2 | 3 | 4 | 5;
  impact: 1 | 2 | 3 | 4 | 5;
  impactAreas: (
    | 'revenue'
    | 'productivity'
    | 'compliance'
    | 'customer'
    | 'safety'
    | 'quality'
    | 'retention'
  )[];
  bloomsLevel: BloomsLevel;
  objectives: string; // Rich text
}

// ==================== STEP 5: Resources & Budget ====================
export interface ResourcesData {
  budget: {
    amount: number;
    flexibility: 'fixed' | 'flexible';
  };
  timeline: {
    targetDate: string; // ISO date
    flexibility: 'fixed' | 'flexible';
    duration: number; // weeks
  };
  team: {
    instructionalDesigners: number;
    contentDevelopers: number;
    multimediaSpecialists: number;
    smeAvailability: 1 | 2 | 3 | 4 | 5;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  };
  technology: {
    lms: string;
    authoringTools: string[];
    otherTools: string[];
  };
  contentStrategy: {
    source: 'scratch' | 'adapt' | 'license' | 'curate' | 'hybrid';
    existingMaterials?: string[]; // File paths or URLs
  };
}

// ==================== STEP 6: Delivery Strategy ====================
export type Modality = 'self-paced' | 'ilt' | 'blended' | 'microlearning' | 'simulation' | 'video';

export interface DeliveryStrategyData {
  modality: Modality;
  duration?: number; // minutes (conditional)
  sessionStructure?: '1-day' | 'multi-day' | 'weekly' | 'monthly'; // conditional
  interactivityLevel: 1 | 2 | 3 | 4 | 5;
  practiceOpportunities: string[];
  socialLearning: string[];
  reinforcement: 'none' | 'emails' | 'microlearning' | 'coaching' | 'community';
}

// ==================== STEP 7: Constraints ====================
export type ConstraintsData = string[];

// ==================== STEP 8: Assessment & Evaluation ====================
export interface EvaluationData {
  level1: {
    methods: string[];
    satisfactionTarget: number; // percentage
  };
  level2: {
    assessmentMethods: string[];
    passingRequired: boolean;
    passingScore?: number; // percentage
    attemptsAllowed?: number;
  };
  level3: {
    measureBehavior: boolean;
    methods?: string[];
    followUpTiming?: string;
    behaviors?: string;
  };
  level4: {
    measureROI: boolean;
    metrics?: string[];
    owner?: string;
    timing?: string;
  };
  certification: 'internal' | 'industry' | 'ceu' | 'pdh' | 'none';
}

// ==================== MAIN TYPE ====================
export interface StaticQuestionsFormValuesV2 {
  version?: 2; // Optional in form, added on save
  role: RoleData;
  organization: OrganizationData;
  learnerProfile: LearnerProfileData;
  learningGap: LearningGapData;
  resources: ResourcesData;
  deliveryStrategy: DeliveryStrategyData;
  constraints: ConstraintsData;
  evaluation: EvaluationData;
}

// Use V2 as the main type for consistency
export type StaticQuestionsFormValues = StaticQuestionsFormValuesV2;

// Backward compatibility
export interface StaticQuestionsFormValuesV1 {
  version?: 1;
  role: string;
  organization: string;
  learningGap: string;
  resources: string;
  constraints: string[];
}

// Union type for backward compatibility
export type StaticQuestionsFormValuesUnion =
  | StaticQuestionsFormValuesV1
  | StaticQuestionsFormValuesV2;

// Type guards
export function isV2Schema(data: unknown): data is StaticQuestionsFormValuesV2 {
  return typeof data === 'object' && data !== null && 'version' in data && data.version === 2;
}

export function isV1Schema(data: unknown): data is StaticQuestionsFormValuesV1 {
  return typeof data === 'object' && data !== null && (!('version' in data) || data.version === 1);
}
