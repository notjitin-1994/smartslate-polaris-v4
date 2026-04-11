import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDiscovery } from '../useDiscovery';
import { useChat } from '@ai-sdk/react';

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
    const { result } = renderHook(() => useDiscovery());
    expect(result.current.currentStage).toBe(1);
  });

  it('passes initialMessages to useChat', () => {
    const mockMessages: any[] = [{ id: '1', role: 'user', parts: [] }];
    renderHook(() => useDiscovery('test-id', mockMessages));
    
    expect(useChat).toHaveBeenCalledWith(expect.objectContaining({
      messages: mockMessages
    }));
  });

  it('provides sendMessage function', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(typeof result.current.sendMessage).toBe('function');
  });

  it('provides approveStage function', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(typeof result.current.approveStage).toBe('function');
  });

  it('provides rejectStage function', () => {
    const { result } = renderHook(() => useDiscovery());
    expect(typeof result.current.rejectStage).toBe('function');
  });

  it('increments stage on approve', () => {
    const { result } = renderHook(() => useDiscovery());

    act(() => {
      result.current.approveStage('tool-call-id');
    });

    expect(result.current.currentStage).toBe(2);
  });

  it('does not increment stage beyond 8', () => {
    const { result } = renderHook(() => useDiscovery());

    // Set to stage 8
    act(() => {
      for (let i = 0; i < 7; i++) {
        result.current.approveStage(`tool-call-${i}`);
      }
    });

    expect(result.current.currentStage).toBe(8);

    // Try to approve again
    act(() => {
      result.current.approveStage('tool-call-final');
    });

    expect(result.current.currentStage).toBe(8);
  });
});
