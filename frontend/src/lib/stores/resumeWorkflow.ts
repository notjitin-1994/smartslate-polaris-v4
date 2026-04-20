import type { ResumeData, BlueprintData } from './types';

// Resume workflow detection and restoration
export class ResumeWorkflowManager {
  private static readonly STORAGE_KEY = 'resume-workflow-data';
  private static readonly MAX_RESUME_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

  // Detect incomplete blueprints on app initialization
  static detectIncompleteBlueprints(): ResumeData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];

      const resumeData: ResumeData[] = JSON.parse(stored);
      const now = Date.now();

      // Filter out expired resume data
      const validResumeData = resumeData.filter((data) => {
        const resumeAge = now - new Date(data.lastSaved).getTime();
        return resumeAge < this.MAX_RESUME_AGE;
      });

      // Update storage with filtered data
      if (validResumeData.length !== resumeData.length) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(validResumeData));
      }

      return validResumeData;
    } catch (error) {
      console.error('Error detecting incomplete blueprints:', error);
      return [];
    }
  }

  // Save resume data for a blueprint
  static saveResumeData(blueprint: BlueprintData, currentStep: number, totalSteps: number): void {
    try {
      const resumeData: ResumeData = {
        blueprintId: blueprint.id,
        progress: this.calculateProgress(currentStep, totalSteps),
        lastSaved: new Date(),
        currentStep,
        totalSteps,
        hasUnsavedChanges: true,
        version: blueprint.version,
      };

      const existing = this.getResumeData();
      const updated = existing.filter((data) => data.blueprintId !== blueprint.id);
      updated.push(resumeData);

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error saving resume data:', error);
    }
  }

  // Get resume data for a specific blueprint
  static getResumeDataForBlueprint(blueprintId: string): ResumeData | null {
    const allResumeData = this.getResumeData();
    return allResumeData.find((data) => data.blueprintId === blueprintId) || null;
  }

  // Clear resume data for a blueprint
  static clearResumeData(blueprintId: string): void {
    try {
      const existing = this.getResumeData();
      const updated = existing.filter((data) => data.blueprintId !== blueprintId);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Error clearing resume data:', error);
    }
  }

  // Clear all resume data
  static clearAllResumeData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Calculate progress percentage
  private static calculateProgress(currentStep: number, totalSteps: number): number {
    if (totalSteps === 0) return 0;
    return Math.round(((currentStep + 1) / totalSteps) * 100);
  }

  // Get all resume data
  private static getResumeData(): ResumeData[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Error getting resume data:', error);
      return [];
    }
  }
}

// Resume workflow UI helpers
export const resumeUIHelpers = {
  // Get resume prompt data for UI
  getResumePromptData: (
    resumeData: ResumeData[]
  ): {
    count: number;
    items: Array<{
      blueprintId: string;
      progress: number;
      lastSaved: Date;
      timeAgo: string;
      canResume: boolean;
    }>;
  } => {
    const now = new Date();

    return {
      count: resumeData.length,
      items: resumeData.map((data) => ({
        blueprintId: data.blueprintId,
        progress: data.progress,
        lastSaved: new Date(data.lastSaved),
        timeAgo: this.getTimeAgo(new Date(data.lastSaved), now),
        canResume: data.progress > 0 && data.progress < 100,
      })),
    };
  },

  // Get time ago string
  getTimeAgo: (date: Date, now: Date): string => {
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  },

  // Get progress description
  getProgressDescription: (progress: number): string => {
    if (progress === 0) {
      return 'Not started';
    } else if (progress < 25) {
      return 'Just started';
    } else if (progress < 50) {
      return 'In progress';
    } else if (progress < 75) {
      return 'More than halfway';
    } else if (progress < 100) {
      return 'Almost complete';
    } else {
      return 'Complete';
    }
  },

  // Get progress color for UI
  getProgressColor: (progress: number): string => {
    if (progress === 0) {
      return 'gray';
    } else if (progress < 25) {
      return 'red';
    } else if (progress < 50) {
      return 'orange';
    } else if (progress < 75) {
      return 'yellow';
    } else if (progress < 100) {
      return 'blue';
    } else {
      return 'green';
    }
  },
};

// Resume workflow integration with stores
export const resumeWorkflowIntegration = {
  // Initialize resume workflow on app start
  initialize: (blueprintStore: any, uiStore: any) => {
    const incompleteBlueprints = ResumeWorkflowManager.detectIncompleteBlueprints();

    if (incompleteBlueprints.length > 0) {
      // Show resume dialog
      uiStore.openModal('resumeDialog');

      // Store resume data in UI store for the dialog
      uiStore.setResumeData?.(incompleteBlueprints);
    }
  },

  // Handle resume selection
  handleResume: (blueprintId: string, blueprintStore: any, uiStore: any) => {
    const resumeData = ResumeWorkflowManager.getResumeDataForBlueprint(blueprintId);

    if (resumeData) {
      // Restore blueprint state
      // This would typically involve fetching the blueprint and restoring its state
      // For now, we'll just set the current step
      uiStore.setCurrentStep(resumeData.currentStep);
      uiStore.setTotalSteps(resumeData.totalSteps);

      // Close resume dialog
      uiStore.closeModal('resumeDialog');

      // Navigate to blueprint
      // This would typically involve routing to the blueprint page
      console.log(`Resuming blueprint ${blueprintId} at step ${resumeData.currentStep}`);
    }
  },

  // Handle start fresh
  handleStartFresh: (blueprintId: string, uiStore: any) => {
    // Clear resume data
    ResumeWorkflowManager.clearResumeData(blueprintId);

    // Close resume dialog
    uiStore.closeModal('resumeDialog');

    // Start fresh
    console.log(`Starting fresh with blueprint ${blueprintId}`);
  },

  // Auto-save resume data
  autoSave: (blueprint: BlueprintData, currentStep: number, totalSteps: number) => {
    ResumeWorkflowManager.saveResumeData(blueprint, currentStep, totalSteps);
  },
};
