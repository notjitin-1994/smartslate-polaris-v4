/**
 * Unit Tests: usePasswordCheck Hook
 *
 * Tests the password check hook with mock fetch and auth context
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePasswordCheck } from '@/lib/hooks/usePasswordCheck';
import { mockApiResponses, mockFetchResponse } from '@/__tests__/fixtures/auth';

// Mock useAuth hook
const mockUser = {
  id: 'user-123',
  email: 'user@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
  })),
}));

describe('usePasswordCheck', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock global fetch
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Initial State', () => {
    it('should return initial loading state', () => {
      // Arrange
      fetchSpy.mockImplementation(() => new Promise(() => {})); // Never resolves

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      expect(result.current.loading).toBe(true);
      expect(result.current.hasPassword).toBe(true); // Default to true
      expect(result.current.error).toBe(null);
    });
  });

  describe('Successful API Calls', () => {
    it('should set hasPassword to false for OAuth-only user', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(false);
      expect(result.current.error).toBe(null);
      expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
    });

    it('should set hasPassword to true for user with password', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true);
      expect(result.current.error).toBe(null);
    });

    it('should call API only once on mount', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Act
      renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle 401 unauthorized error gracefully', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(
        mockFetchResponse(mockApiResponses.checkPassword.unauthorized, 401)
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true); // Default to true on error
      expect(result.current.error).toBeTruthy();
    });

    it('should handle 500 server error', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(
        mockFetchResponse(mockApiResponses.checkPassword.serverError, 500)
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true); // Default to true on error
      expect(result.current.error).toContain('Failed to check password status');
    });

    it('should handle network error', async () => {
      // Arrange
      fetchSpy.mockRejectedValue(new Error('Network error'));

      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true); // Default to true on error
      expect(result.current.error).toBeTruthy();
      expect(consoleSpy).toHaveBeenCalledWith('Error checking password status:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle malformed JSON response', async () => {
      // Arrange
      fetchSpy.mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true); // Default to true on error
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('Manual Refetch', () => {
    it('should allow manual password check via checkPassword function', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear previous calls
      fetchSpy.mockClear();

      // Manually trigger recheck
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));
      await result.current.checkPassword();

      // Assert
      await waitFor(() => {
        expect(result.current.hasPassword).toBe(false);
      });

      expect(fetchSpy).toHaveBeenCalledTimes(1);
    });

    it('should update loading state during manual refetch', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger manual refetch with delayed response
      let resolvePromise: any;
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      const refetchPromise = result.current.checkPassword();

      // Assert: Should show loading
      await waitFor(() => {
        expect(result.current.loading).toBe(true);
      });

      // Resolve the fetch
      resolvePromise(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));
      await refetchPromise;

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });
    });
  });

  describe('User Changes', () => {
    it('should refetch when user ID changes', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      const { useAuth } = await import('@/contexts/AuthContext');
      const mockUseAuth = vi.mocked(useAuth);

      // Initial user
      mockUseAuth.mockReturnValue({ user: { id: 'user-1', email: 'user1@example.com' } } as any);

      // Act
      const { rerender } = renderHook(() => usePasswordCheck());

      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(1);
      });

      // Change user
      mockUseAuth.mockReturnValue({ user: { id: 'user-2', email: 'user2@example.com' } } as any);
      rerender();

      // Assert: Should refetch
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(2);
      });
    });

    it('should not fetch when user is null', async () => {
      // Arrange
      const { useAuth } = await import('@/contexts/AuthContext');
      const mockUseAuth = vi.mocked(useAuth);
      mockUseAuth.mockReturnValue({ user: null } as any);

      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Act
      renderHook(() => usePasswordCheck());

      // Assert: Should not call fetch
      await waitFor(() => {
        expect(fetchSpy).not.toHaveBeenCalled();
      });
    });
  });

  describe('Response Handling', () => {
    it('should handle response with hasPassword field correctly', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          hasPassword: false,
          userId: 'user-123',
          email: 'user@example.com',
        })
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.hasPassword).toBe(false);
      });
    });

    it('should default to true when hasPassword is null', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          hasPassword: null,
          userId: 'user-123',
          email: 'user@example.com',
        })
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true); // Should use nullish coalescing
    });

    it('should default to true when hasPassword is undefined', async () => {
      // Arrange
      fetchSpy.mockResolvedValue(
        mockFetchResponse({
          userId: 'user-123',
          email: 'user@example.com',
          // hasPassword is undefined
        })
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      // Assert
      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.hasPassword).toBe(true);
    });
  });

  describe('Concurrent Requests', () => {
    it('should handle multiple concurrent checkPassword calls', async () => {
      // Arrange
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () => resolve(mockFetchResponse(mockApiResponses.checkPassword.hasPassword)),
              50
            )
          )
      );

      // Act
      const { result } = renderHook(() => usePasswordCheck());

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Trigger multiple concurrent checks
      const promise1 = result.current.checkPassword();
      const promise2 = result.current.checkPassword();
      const promise3 = result.current.checkPassword();

      await Promise.all([promise1, promise2, promise3]);

      // Assert: Should have made 3 calls (initial + 3 manual)
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledTimes(4); // 1 initial + 3 manual
      });
    });
  });

  describe('Memory Leaks', () => {
    it('should not update state after unmount', async () => {
      // Arrange
      let resolvePromise: any;
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      // Act
      const { result, unmount } = renderHook(() => usePasswordCheck());

      // Unmount before promise resolves
      unmount();

      // Resolve the promise after unmount
      resolvePromise(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Assert: Should not throw or cause errors
      // (React will log warnings if we try to update state after unmount)
      await new Promise((resolve) => setTimeout(resolve, 100));
    });
  });
});
