/**
 * Blueprint Visualization Types
 * TypeScript interfaces for blueprint sections and display configurations
 */

export type DisplayType = 'infographic' | 'markdown' | 'timeline' | 'table' | 'chart';

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'radar';
  metrics?: string[];
}

export interface BlueprintMetadata {
  title: string;
  organization: string;
  role: string;
  generated_at: string;
  version: string;
  model: string;
}

export interface Objective {
  id: string;
  title: string;
  description: string;
  metric: string;
  baseline: string | number;
  target: string | number;
  due_date: string;
}

export interface LearningObjectivesSection {
  objectives: Objective[];
  displayType: 'infographic';
  chartConfig?: ChartConfig;
}

export interface ExecutiveSummarySection {
  content: string;
  displayType: 'markdown';
}

export interface TargetAudienceSection {
  demographics: {
    roles: string[];
    experience_levels: string[];
    department_distribution: Array<{
      department: string;
      percentage: number;
    }>;
  };
  learning_preferences: {
    modalities: Array<{
      type: string;
      percentage: number;
    }>;
  };
  displayType: 'infographic';
}

export interface InstructionalStrategySection {
  overview: string;
  modalities: Array<{
    type: string;
    rationale: string;
    allocation_percent: number;
    tools?: string[];
  }>;
  cohort_model?: string;
  accessibility_considerations?: string[];
  displayType: 'markdown';
}

export interface Module {
  module_id: string;
  title: string;
  description: string;
  topics: string[];
  duration: string;
  delivery_method: string;
  learning_activities?: Array<{
    activity: string;
    type: string;
    duration: string;
  }>;
  assessment?: {
    type: string;
    description: string;
  };
}

export interface ContentOutlineSection {
  modules: Module[];
  displayType: 'timeline';
}

export interface ResourcesSection {
  human_resources?: Array<{
    role: string;
    fte: number;
    duration: string;
  }>;
  tools_and_platforms?: Array<{
    category: string;
    name: string;
    cost_type: string;
  }>;
  budget?: {
    currency: string;
    items: Array<{
      item: string;
      amount: number;
    }>;
    total: number;
  };
  displayType: 'table';
}

export interface KPI {
  metric: string;
  target: string;
  measurement_method: string;
  frequency: string;
}

export interface AssessmentStrategySection {
  overview: string;
  kpis: KPI[];
  evaluation_methods?: Array<{
    method: string;
    timing: string;
    weight: string;
  }>;
  displayType: 'infographic';
  chartConfig?: ChartConfig;
}

export interface Phase {
  phase: string;
  start_date: string;
  end_date: string;
  milestones: string[];
  dependencies?: string[];
}

export interface ImplementationTimelineSection {
  phases: Phase[];
  critical_path?: string[];
  displayType: 'timeline';
}

export interface Risk {
  risk: string;
  probability: string;
  impact: string;
  mitigation_strategy: string;
}

export interface RiskMitigationSection {
  risks: Risk[];
  contingency_plans?: string[];
  displayType: 'table';
}

export interface Metric {
  metric: string;
  current_baseline: string;
  target: string;
  measurement_method: string;
  timeline: string;
}

export interface SuccessMetricsSection {
  metrics: Metric[];
  reporting_cadence?:
    | string
    | {
        weekly_reports?: boolean;
        monthly_reports?: boolean;
        quarterly_reviews?: boolean;
        annual_evaluation?: boolean;
        real_time_dashboards?: boolean;
        [key: string]: any;
      };
  dashboard_requirements?: string[];
  displayType: 'infographic';
}

export interface SustainabilityPlanSection {
  content: string;
  maintenance_schedule?: {
    review_frequency: string;
    update_triggers: string[];
  };
  scaling_considerations?: string[];
  displayType: 'markdown';
}

export interface BlueprintJSON {
  metadata: BlueprintMetadata;
  executive_summary?: ExecutiveSummarySection;
  learning_objectives?: LearningObjectivesSection;
  target_audience?: TargetAudienceSection;
  instructional_strategy?: InstructionalStrategySection;
  content_outline?: ContentOutlineSection;
  resources?: ResourcesSection;
  assessment_strategy?: AssessmentStrategySection;
  implementation_timeline?: ImplementationTimelineSection;
  risk_mitigation?: RiskMitigationSection;
  success_metrics?: SuccessMetricsSection;
  sustainability_plan?: SustainabilityPlanSection;
  [key: string]: any; // Allow additional dynamic sections
}

export interface BlueprintSectionProps {
  sectionKey: string;
  data: any;
  viewMode: 'infographic' | 'markdown';
}
