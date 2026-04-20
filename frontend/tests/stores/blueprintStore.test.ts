import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
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

describe('BlueprintStore', () => {
  beforeEach(() => {
    // Reset store state
    useBlueprintStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useBlueprintStore.getState();

    expect(state.currentBlueprint).toBeNull();
    expect(state.blueprints).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastSaved).toBeNull();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.version).toBe(1);
  });

  it('should set current blueprint', () => {
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

    useBlueprintStore.getState().setCurrentBlueprint(mockBlueprint);

    const state = useBlueprintStore.getState();
    expect(state.currentBlueprint).toEqual(mockBlueprint);
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set blueprints list', () => {
    const mockBlueprints: BlueprintData[] = [
      {
        id: 'blueprint-1',
        title: 'Test Blueprint 1',
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
      },
    ];

    useBlueprintStore.getState().setBlueprints(mockBlueprints);

    const state = useBlueprintStore.getState();
    expect(state.blueprints).toEqual(mockBlueprints);
    expect(state.error).toBeNull();
  });

  it('should update blueprint', () => {
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

    useBlueprintStore.getState().setCurrentBlueprint(mockBlueprint);
    useBlueprintStore.getState().updateBlueprint({ title: 'Updated Title' });

    const state = useBlueprintStore.getState();
    expect(state.currentBlueprint?.title).toBe('Updated Title');
    expect(state.hasUnsavedChanges).toBe(true);
    expect(state.version).toBe(2);
  });

  it('should set loading state', () => {
    useBlueprintStore.getState().setLoading(true);

    const state = useBlueprintStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const errorMessage = 'Failed to load blueprint';
    useBlueprintStore.getState().setError(errorMessage);

    const state = useBlueprintStore.getState();
    expect(state.error).toBe(errorMessage);
  });

  it('should set last saved date', () => {
    const now = new Date();
    useBlueprintStore.getState().setLastSaved(now);

    const state = useBlueprintStore.getState();
    expect(state.lastSaved).toEqual(now);
    expect(state.hasUnsavedChanges).toBe(false);
  });

  it('should set has unsaved changes', () => {
    useBlueprintStore.getState().setHasUnsavedChanges(true);

    const state = useBlueprintStore.getState();
    expect(state.hasUnsavedChanges).toBe(true);
  });

  it('should increment version', () => {
    useBlueprintStore.getState().incrementVersion();

    const state = useBlueprintStore.getState();
    expect(state.version).toBe(2);
  });

  it('should reset to initial state', () => {
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

    useBlueprintStore.getState().setCurrentBlueprint(mockBlueprint);
    useBlueprintStore.getState().setError('Some error');
    useBlueprintStore.getState().reset();

    const state = useBlueprintStore.getState();
    expect(state.currentBlueprint).toBeNull();
    expect(state.blueprints).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
    expect(state.lastSaved).toBeNull();
    expect(state.hasUnsavedChanges).toBe(false);
    expect(state.version).toBe(1);
  });
});
