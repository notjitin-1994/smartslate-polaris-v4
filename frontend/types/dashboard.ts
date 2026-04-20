export interface DashboardData {
  blueprintId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'completed' | 'archived';
  kpis: DashboardKPIs;
  timeline: TimelineData[];
  modules: ModuleData[];
  activities: ActivityData[];
  resources: ResourceData[];
}

export interface DashboardKPIs {
  totalLearningHours: number;
  totalModules: number;
  completedModules: number;
  totalAssessments: number;
  completedAssessments: number;
  totalResources: number;
  estimatedCompletionDate: string;
}

export interface TimelineData {
  date: string;
  learningHours: number;
  progressPercentage: number;
  milestones: string[];
}

export interface ModuleData {
  id: string;
  title: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progressPercentage: number;
  estimatedHours: number;
  actualHours?: number;
  dueDate?: string;
  category: string;
}

export interface ActivityData {
  category: string;
  hours: number;
  percentage: number;
  color: string;
}

export interface ResourceData {
  id: string;
  title: string;
  type: 'video' | 'article' | 'book' | 'course' | 'documentation' | 'other';
  status: 'pending' | 'in_progress' | 'completed';
  estimatedTime: number;
  url?: string;
}

export interface ChartDataPoint {
  name: string;
  value: number;
  color?: string;
}

export interface DashboardFilters {
  dateRange: {
    start: string;
    end: string;
  };
  modules: string[];
  categories: string[];
  status: string[];
}

export interface DashboardSettings {
  theme: 'light' | 'dark';
  chartType: 'area' | 'line' | 'bar';
  showAnimations: boolean;
  refreshInterval: number;
}

export type DashboardView = 'overview' | 'detailed' | 'comparison' | 'export';
