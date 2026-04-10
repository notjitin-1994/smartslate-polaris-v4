import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscovery } from '../useDiscovery';

// Mock the useChat hook
vi.mock('@ai-sdk/react', () => ({
  useChat: vi.fn(() => ({
    messages: [],
    sendMessage: vi.fn(),
    addToolOutput: vi.fn(),
    status: 'idle',
    error: null,
    stop: vi.fn(),
  })),
  DefaultChatTransport: vi.fn(),
  lastAssistantMessageIsCompleteWithToolCalls: vi.fn(),
}));

describe('useDiscovery', () => {
  it('initializes with current stage at 1', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));
    expect(result.current.currentStage).toBe(1);
  });

  it('provides sendMessage function', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('provides approveStage function', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));
    expect(typeof result.current.approveStage).toBe('function');
  });

  it('provides rejectStage function', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));
    expect(typeof result.current.rejectStage).toBe('function');
  });

  it('increments stage on approve', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));

    act(() => {
      result.current.approveStage('tool-call-id');
    });

    expect(result.current.currentStage).toBe(2);
  });

  it('does not increment stage beyond 7', () => {
    const { result } = renderHook(() => useDiscovery('test-starmap-id'));

    // Set to stage 7
    act(() => {
      for (let i = 0; i < 6; i++) {
        result.current.approveStage(`tool-call-${i}`);
      }
    });

    expect(result.current.currentStage).toBe(7);

    // Try to approve again
    act(() => {
      result.current.approveStage('tool-call-final');
    });

    expect(result.current.currentStage).toBe(7);
  });
});
