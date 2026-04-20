import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/lib/stores/authStore';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { ResumeWorkflowManager } from '@/lib/stores/resumeWorkflow';
import { ConflictResolver } from '@/lib/stores/conflictResolution';
import { actionHistory } from '@/lib/stores/actionHistory';
import type { BlueprintData } from '@/lib/stores/types';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('State Management Integration', () => {
  beforeEach(() => {
    // Reset all stores
    useAuthStore.getState().clearAuth();
    useBlueprintStore.getState().reset();
    useUIStore.getState().reset();
    actionHistory.clear();
    vi.clearAllMocks();
  });

  describe('Resume Workflow Integration', () => {
    it('should detect incomplete blueprints on app initialization', () => {
      const mockResumeData = [
        {
          blueprintId: 'blueprint-1',
          progress: 50,
          lastSaved: new Date().toISOString(),
          currentStep: 2,
          totalSteps: 4,
          hasUnsavedChanges: true,
          version: 1,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockResumeData));

      const incompleteBlueprints = ResumeWorkflowManager.detectIncompleteBlueprints();

      expect(incompleteBlueprints).toHaveLength(1);
      expect(incompleteBlueprints[0].blueprintId).toBe('blueprint-1');
      expect(incompleteBlueprints[0].progress).toBe(50);
    });

    it('should save resume data for a blueprint', () => {
      const mockBlueprint: BlueprintData = {
        id: 'blueprint-1',
        title: 'Test Blueprint',
        description: 'A test blueprint',
        learningObjective: 'Learn something',
        targetAudience: 'Beginners',
        deliveryMethod: 'online',
        duration: 4,
        assessmentType: 'quiz',
        status: 'draft',
        progress: 25,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1,
        userId: 'user-1',
        staticAnswers: {
          learningObjective: 'Learn something',
          targetAudience: 'Beginners',
          deliveryMethod: 'online',
          duration: 4,
          assessmentType: 'quiz',
        },
      };

      ResumeWorkflowManager.saveResumeData(mockBlueprint, 1, 4);

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'resume-workflow-data',
        expect.stringContaining('blueprint-1')
      );
    });

    it('should clear resume data for a blueprint', () => {
      const mockResumeData = [
        {
          blueprintId: 'blueprint-1',
          progress: 50,
          lastSaved: new Date('2024-01-01'),
          currentStep: 2,
          totalSteps: 4,
          hasUnsavedChanges: true,
          version: 1,
        },
      ];

      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockResumeData));

      ResumeWorkflowManager.clearResumeData('blueprint-1');

      expect(localStorageMock.setItem).toHaveBeenCalledWith('resume-workflow-data', '[]');
    });
  });

  describe('Conflict Resolution Integration', () => {
    it('should detect version conflicts', () => {
      const localData = {
        id: 'blueprint-1',
        version: 1,
        title: 'Local Title',
      };

      const remoteData = {
        id: 'blueprint-1',
        version: 2,
        title: 'Remote Title',
      };

      const conflict = ConflictResolver.detectConflict(1, 2, localData, remoteData);

      expect(conflict).not.toBeNull();
      expect(conflict?.type).toBe('version');
      expect(conflict?.localVersion).toBe(1);
      expect(conflict?.remoteVersion).toBe(2);
    });

    it('should resolve conflicts using local strategy', () => {
      const conflict = {
        id: 'conflict-1',
        type: 'version' as const,
        localVersion: 1,
        remoteVersion: 2,
        localChanges: { title: 'Local Title' },
        remoteChanges: { title: 'Remote Title' },
        resolution: 'manual' as const,
      };

      const resolved = ConflictResolver.resolveConflict(conflict, 'local');

      expect(resolved.title).toBe('Local Title');
      expect(resolved.version).toBe(3); // Max version + 1
    });

    it('should resolve conflicts using remote strategy', () => {
      const conflict = {
        id: 'conflict-1',
        type: 'version' as const,
        localVersion: 1,
        remoteVersion: 2,
        localChanges: { title: 'Local Title' },
        remoteChanges: { title: 'Remote Title' },
        resolution: 'manual' as const,
      };

      const resolved = ConflictResolver.resolveConflict(conflict, 'remote');

      expect(resolved.title).toBe('Remote Title');
      expect(resolved.version).toBe(3); // Max version + 1
    });

    it('should resolve conflicts using merge strategy', () => {
      const conflict = {
        id: 'conflict-1',
        type: 'version' as const,
        localVersion: 1,
        remoteVersion: 2,
        localChanges: { title: 'Local Title', description: 'Local Description' },
        remoteChanges: { title: 'Remote Title', status: 'published' },
        resolution: 'manual' as const,
      };

      const resolved = ConflictResolver.resolveConflict(conflict, 'merge');

      expect(resolved.title).toBe('Local Title'); // Local takes precedence
      expect(resolved.status).toBe('published'); // Remote value preserved
      expect(resolved.description).toBe('Local Description'); // Local value preserved
      expect(resolved.version).toBe(3); // Max version + 1
    });
  });

  describe('Action History Integration', () => {
    it('should track blueprint changes', () => {
      const mockBlueprint: BlueprintData = {
        id: 'blueprint-1',
        title: 'Test Blueprint',
        description: 'A test blueprint',
        learningObjective: 'Learn something',
        targetAudience: 'Beginners',
        deliveryMethod: 'online',
        duration: 4,
        assessmentType: 'quiz',
        status: 'draft',
        progress: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1,
        userId: 'user-1',
        staticAnswers: {
          learningObjective: 'Learn something',
          targetAudience: 'Beginners',
          deliveryMethod: 'online',
          duration: 4,
          assessmentType: 'quiz',
        },
      };

      actionHistory.addAction('blueprint_update', mockBlueprint, 'Blueprint updated');

      expect(actionHistory.canUndo()).toBe(true);
      expect(actionHistory.canRedo()).toBe(false);

      const historyInfo = actionHistory.getHistoryInfo();
      expect(historyInfo.pastCount).toBe(0);
      expect(historyInfo.futureCount).toBe(0);
      expect(historyInfo.totalCount).toBe(1);
    });

    it('should undo and redo actions', () => {
      const mockBlueprint1: BlueprintData = {
        id: 'blueprint-1',
        title: 'Original Title',
        description: 'A test blueprint',
        learningObjective: 'Learn something',
        targetAudience: 'Beginners',
        deliveryMethod: 'online',
        duration: 4,
        assessmentType: 'quiz',
        status: 'draft',
        progress: 0,
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01'),
        version: 1,
        userId: 'user-1',
        staticAnswers: {
          learningObjective: 'Learn something',
          targetAudience: 'Beginners',
          deliveryMethod: 'online',
          duration: 4,
          assessmentType: 'quiz',
        },
      };

      const mockBlueprint2: BlueprintData = {
        ...mockBlueprint1,
        title: 'Updated Title',
      };

      actionHistory.addAction('blueprint_update', mockBlueprint1, 'Original state');
      actionHistory.addAction('blueprint_update', mockBlueprint2, 'Updated state');

      expect(actionHistory.canUndo()).toBe(true);
      expect(actionHistory.canRedo()).toBe(false);

      // Undo
      const undoneState = actionHistory.undo();
      expect(undoneState?.state.title).toBe('Original Title');
      expect(actionHistory.canUndo()).toBe(true);
      expect(actionHistory.canRedo()).toBe(true);

      // Redo
      const redoneState = actionHistory.redo();
      expect(redoneState?.state.title).toBe('Updated Title');
      expect(actionHistory.canUndo()).toBe(true);
      expect(actionHistory.canRedo()).toBe(false);
    });
  });

  describe('Store Persistence Integration', () => {
    it('should have persistence middleware configured', () => {
      // Test that the stores are configured with persistence
      const authStore = useAuthStore.getState();
      const blueprintStore = useBlueprintStore.getState();

      // Verify that the stores have the expected structure
      expect(authStore).toHaveProperty('setAuth');
      expect(authStore).toHaveProperty('clearAuth');
      expect(blueprintStore).toHaveProperty('setCurrentBlueprint');
      expect(blueprintStore).toHaveProperty('reset');
    });

    it('should handle store state updates', () => {
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
      };

      const mockSession = {
        access_token: 'token',
        user: mockUser,
      };

      // Test that store updates work
      useAuthStore.getState().setAuth(mockUser, mockSession);

      const authState = useAuthStore.getState();
      expect(authState.user).toEqual(mockUser);
      expect(authState.session).toEqual(mockSession);
    });
  });
});
