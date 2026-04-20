import type { Session, User } from '@supabase/supabase-js';
import type { StaticQuestionsFormValues } from '@/types/static-questionnaire';

// Auth Store Types
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  setAuth: (user: User | null, session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearAuth: () => void;
}

// Blueprint Store Types
export interface BlueprintState {
  currentBlueprint: BlueprintData | null;
  blueprints: BlueprintData[];
  isLoading: boolean;
  error: string | null;
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  version: number;

  // Actions
  setCurrentBlueprint: (blueprint: BlueprintData | null) => void;
  setBlueprints: (blueprints: BlueprintData[]) => void;
  updateBlueprint: (updates: Partial<BlueprintData>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSaved: (date: Date) => void;
  setHasUnsavedChanges: (hasChanges: boolean) => void;
  incrementVersion: () => void;
  reset: () => void;
}

export interface BlueprintData {
  id: string;
  title: string;
  description: string;
  learningObjective: string;
  targetAudience: string;
  deliveryMethod: string;
  duration: number;
  assessmentType: string;
  status: 'draft' | 'generating' | 'answering' | 'completed' | 'error' | 'archived';
  progress: number; // 0-100
  createdAt: Date;
  updatedAt: Date;
  version: number;
  userId: string;
  staticAnswers: StaticQuestionsFormValues;
  dynamicAnswers?: Record<string, any>;
  metadata?: Record<string, any>;
}

// UI Store Types
export interface UIState {
  // Navigation
  currentStep: number;
  totalSteps: number;
  canGoNext: boolean;
  canGoPrevious: boolean;

  // Modals
  modals: {
    resumeDialog: boolean;
    conflictDialog: boolean;
    exportDialog: boolean;
    settingsDialog: boolean;
  };

  // Notifications
  notifications: NotificationData[];

  // Loading states
  loadingStates: {
    saving: boolean;
    loading: boolean;
    exporting: boolean;
  };

  // Actions
  setCurrentStep: (step: number) => void;
  setTotalSteps: (steps: number) => void;
  setCanGoNext: (canGo: boolean) => void;
  setCanGoPrevious: (canGo: boolean) => void;
  openModal: (modal: keyof UIState['modals']) => void;
  closeModal: (modal: keyof UIState['modals']) => void;
  addNotification: (notification: Omit<NotificationData, 'id'>) => void;
  removeNotification: (id: string) => void;
  setLoadingState: (key: keyof UIState['loadingStates'], loading: boolean) => void;
  reset: () => void;
}

export interface NotificationData {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  actions?: NotificationAction[];
}

export interface NotificationAction {
  label: string;
  action: () => void;
  variant?: 'primary' | 'secondary' | 'destructive';
}

// Persistence Types
export interface PersistenceConfig {
  name: string;
  version: number;
  migrate?: (persistedState: any, version: number) => any;
  partialize?: (state: any) => any;
  onRehydrateStorage?: () => (state: any, error: any) => void;
}

// Action History Types (for undo/redo)
export interface ActionHistory {
  past: StateSnapshot[];
  present: StateSnapshot | null;
  future: StateSnapshot[];
  maxHistorySize: number;
}

export interface StateSnapshot {
  id: string;
  timestamp: Date;
  action: string;
  state: any;
  description?: string;
}

// Conflict Resolution Types
export interface ConflictData {
  id: string;
  type: 'version' | 'concurrent_edit' | 'data_corruption';
  localVersion: number;
  remoteVersion: number;
  localChanges: any;
  remoteChanges: any;
  resolution: 'local' | 'remote' | 'merge' | 'manual';
  resolvedAt?: Date;
}

// Resume Workflow Types
export interface ResumeData {
  blueprintId: string;
  progress: number;
  lastSaved: Date;
  currentStep: number;
  totalSteps: number;
  hasUnsavedChanges: boolean;
  version: number;
}

// Store Composition Types
export interface RootState {
  auth: AuthState;
  blueprint: BlueprintState;
  ui: UIState;
}

// Query Key Factories
export const queryKeys = {
  blueprints: {
    all: ['blueprints'] as const,
    lists: () => [...queryKeys.blueprints.all, 'list'] as const,
    list: (filters: Record<string, any>) => [...queryKeys.blueprints.lists(), { filters }] as const,
    details: () => [...queryKeys.blueprints.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.blueprints.details(), id] as const,
  },
  user: {
    all: ['user'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },
} as const;
