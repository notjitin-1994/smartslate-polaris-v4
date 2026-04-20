import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useUIStore } from '@/lib/stores/uiStore';

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

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state
    useUIStore.getState().reset();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useUIStore.getState();

    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.canGoNext).toBe(false);
    expect(state.canGoPrevious).toBe(false);
    expect(state.modals).toEqual({
      resumeDialog: false,
      conflictDialog: false,
      exportDialog: false,
      settingsDialog: false,
    });
    expect(state.notifications).toEqual([]);
    expect(state.loadingStates).toEqual({
      saving: false,
      loading: false,
      exporting: false,
    });
  });

  it('should set current step', () => {
    // First set total steps to allow step 2
    useUIStore.getState().setTotalSteps(5);
    useUIStore.getState().setCurrentStep(2);

    const state = useUIStore.getState();
    expect(state.currentStep).toBe(2);
  });

  it('should set total steps', () => {
    useUIStore.getState().setTotalSteps(5);

    const state = useUIStore.getState();
    expect(state.totalSteps).toBe(5);
  });

  it('should update can go next/previous when setting step', () => {
    useUIStore.getState().setTotalSteps(5);
    useUIStore.getState().setCurrentStep(2);

    const state = useUIStore.getState();
    expect(state.canGoNext).toBe(true);
    expect(state.canGoPrevious).toBe(true);
  });

  it('should not allow going beyond bounds', () => {
    useUIStore.getState().setTotalSteps(3);
    useUIStore.getState().setCurrentStep(5); // Beyond total steps

    const state = useUIStore.getState();
    expect(state.currentStep).toBe(2); // Should be clamped to last valid step
  });

  it('should open modal', () => {
    useUIStore.getState().openModal('resumeDialog');

    const state = useUIStore.getState();
    expect(state.modals.resumeDialog).toBe(true);
  });

  it('should close modal', () => {
    useUIStore.getState().openModal('resumeDialog');
    useUIStore.getState().closeModal('resumeDialog');

    const state = useUIStore.getState();
    expect(state.modals.resumeDialog).toBe(false);
  });

  it('should add notification', () => {
    useUIStore.getState().addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
    });

    const state = useUIStore.getState();
    expect(state.notifications).toHaveLength(1);
    expect(state.notifications[0].type).toBe('success');
    expect(state.notifications[0].title).toBe('Success');
    expect(state.notifications[0].message).toBe('Operation completed');
  });

  it('should remove notification', () => {
    useUIStore.getState().addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
    });

    const state = useUIStore.getState();
    const notificationId = state.notifications[0].id;

    useUIStore.getState().removeNotification(notificationId);

    const updatedState = useUIStore.getState();
    expect(updatedState.notifications).toHaveLength(0);
  });

  it('should auto-remove notification after duration', async () => {
    vi.useFakeTimers();

    useUIStore.getState().addNotification({
      type: 'info',
      title: 'Info',
      message: 'This will disappear',
      duration: 1000,
    });

    const state = useUIStore.getState();
    expect(state.notifications).toHaveLength(1);

    vi.advanceTimersByTime(1000);

    const updatedState = useUIStore.getState();
    expect(updatedState.notifications).toHaveLength(0);

    vi.useRealTimers();
  });

  it('should set loading state', () => {
    useUIStore.getState().setLoadingState('saving', true);

    const state = useUIStore.getState();
    expect(state.loadingStates.saving).toBe(true);
  });

  it('should reset to initial state', () => {
    useUIStore.getState().setCurrentStep(3);
    useUIStore.getState().setTotalSteps(5);
    useUIStore.getState().openModal('resumeDialog');
    useUIStore.getState().addNotification({
      type: 'success',
      title: 'Success',
      message: 'Operation completed',
    });
    useUIStore.getState().setLoadingState('saving', true);

    useUIStore.getState().reset();

    const state = useUIStore.getState();
    expect(state.currentStep).toBe(0);
    expect(state.totalSteps).toBe(0);
    expect(state.canGoNext).toBe(false);
    expect(state.canGoPrevious).toBe(false);
    expect(state.modals).toEqual({
      resumeDialog: false,
      conflictDialog: false,
      exportDialog: false,
      settingsDialog: false,
    });
    expect(state.notifications).toEqual([]);
    expect(state.loadingStates).toEqual({
      saving: false,
      loading: false,
      exporting: false,
    });
  });
});
