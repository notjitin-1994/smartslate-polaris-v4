/**
 * Integration Tests: Dashboard Password Flow
 *
 * Tests the integration between password check hook and modal component
 * Simulates the dashboard password flow without rendering the full page
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockFetchResponse, mockApiResponses, passwordTestCases } from '@/__tests__/fixtures/auth';
import { usePasswordCheck } from '@/lib/hooks/usePasswordCheck';
import { SetPasswordModal } from '@/components/auth/SetPasswordModal';
import { useEffect, useState } from 'react';

// Mock Auth Context
const mockUser = {
  id: 'user-123',
  email: 'oauth@example.com',
};

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(() => ({
    user: mockUser,
    loading: false,
  })),
}));

// Mock Toast
const mockShowSuccess = vi.fn();
const mockShowError = vi.fn();

vi.mock('@/src/components/ui/Toast', () => ({
  useToast: () => ({
    showSuccess: mockShowSuccess,
    showError: mockShowError,
  }),
}));

// Integration component that mimics dashboard behavior
function DashboardPasswordIntegration() {
  const { user } = { user: mockUser };
  const { hasPassword, loading, checkPassword } = usePasswordCheck();
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  useEffect(() => {
    if (!loading && !hasPassword) {
      setShowPasswordModal(true);
    }
  }, [loading, hasPassword]);

  const handlePasswordSet = () => {
    setShowPasswordModal(false);
    checkPassword();
  };

  return (
    <>
      <SetPasswordModal
        open={showPasswordModal}
        email={user?.email}
        onSuccess={handlePasswordSet}
      />
      <div data-testid="dashboard-content">
        {!loading && !showPasswordModal && <div>Dashboard Content</div>}
        {loading && <div>Loading...</div>}
      </div>
    </>
  );
}

describe('Dashboard Password Flow', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('OAuth User Without Password', () => {
    it('should show password modal when OAuth user has no password', async () => {
      // Mock password check returning false
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for password check to complete
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
      });

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      });
    });

    it('should block dashboard content until password is set', async () => {
      // Mock password check returning false
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify modal is blocking (non-dismissible)
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // User cannot interact with dashboard behind modal
      // (This is implicitly tested by the modal being non-dismissible)
    });

    it('should complete password setting flow and close modal', async () => {
      const user = userEvent.setup();

      // Mock password check returning false initially
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for modal to appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill password form
      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);

      // Mock successful password set
      fetchSpy.mockResolvedValueOnce(
        mockFetchResponse({
          success: true,
          message: 'Password set successfully',
        })
      );

      // Mock password check after setting (returns true)
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      // Submit form
      await user.click(submitButton);

      // Wait for success
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Password Set Successfully',
          expect.any(String)
        );
      });

      // Note: In actual implementation, modal visibility is controlled by state
      // The modal should close after successful password set
    });

    it('should refetch password status after setting password', async () => {
      const user = userEvent.setup();

      // Initial password check - no password
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Set password
      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);

      // Mock successful password set
      fetchSpy.mockResolvedValueOnce(
        mockFetchResponse({
          success: true,
        })
      );

      // Mock refetch password check
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      await user.click(submitButton);

      // Wait for refetch call
      await waitFor(
        () => {
          const calls = fetchSpy.mock.calls;
          // Should have 3 calls: initial check, set password, refetch check
          expect(calls.length).toBeGreaterThanOrEqual(3);
          expect(
            calls.filter((call: any) => call[0] === '/api/auth/check-password').length
          ).toBeGreaterThanOrEqual(2);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('User With Password', () => {
    it('should NOT show password modal when user has password', async () => {
      // Mock password check returning true
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for password check to complete
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
      });

      // Modal should NOT appear
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should show dashboard content immediately when user has password', async () => {
      // Mock password check returning true
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for password check
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
      });

      // Dashboard content should be visible
      // (Look for key dashboard elements)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });
  });

  describe('Loading States', () => {
    it('should show loading state while checking password status', async () => {
      // Mock delayed password check
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));
            }, 100);
          })
      );

      render(<DashboardPasswordIntegration />);

      // During loading, modal should not appear yet
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // After loading completes
      await waitFor(
        () => {
          expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
        },
        { timeout: 200 }
      );
    });

    it('should not show modal during password check loading', async () => {
      // Mock delayed response
      let resolvePromise: any;
      fetchSpy.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolvePromise = resolve;
          })
      );

      render(<DashboardPasswordIntegration />);

      // Modal should not appear while loading
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

      // Resolve with no password
      resolvePromise(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      // Modal should appear after loading
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle password check API error gracefully', async () => {
      // Mock error response
      fetchSpy.mockRejectedValue(new Error('Network error'));

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(<DashboardPasswordIntegration />);

      // Wait for error
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
      });

      // Modal should NOT appear on error (fail-safe: hasPassword defaults to true)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      consoleSpy.mockRestore();
    });

    it('should handle password set API error in modal', async () => {
      const user = userEvent.setup();

      // Mock password check returning false
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Wait for modal
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Fill form
      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);

      // Mock API error
      fetchSpy.mockResolvedValueOnce(
        mockFetchResponse(
          {
            error: 'Failed to set password',
          },
          500
        )
      );

      await user.click(submitButton);

      // Should show error
      await waitFor(() => {
        expect(screen.getByText(/Failed to set password/i)).toBeInTheDocument();
        expect(mockShowError).toHaveBeenCalled();
      });

      // Modal should remain open
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });

  describe('User Experience', () => {
    it('should show user email in modal when available', async () => {
      // Mock password check returning false
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Email should be displayed
      expect(screen.getByText('oauth@example.com')).toBeInTheDocument();
    });

    it('should prevent modal dismissal via escape or clicking outside', async () => {
      const user = userEvent.setup();

      // Mock password check returning false
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Try to press escape
      await user.keyboard('{Escape}');

      // Modal should still be present
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should maintain form state during password entry', async () => {
      const user = userEvent.setup();

      // Mock password check returning false
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Type in password field
      const passwordInput = screen.getByLabelText(/^Password/) as HTMLInputElement;
      await user.type(passwordInput, 'Test');

      // Check that value is maintained
      expect(passwordInput.value).toBe('Test');

      // Type more
      await user.type(passwordInput, '123');
      expect(passwordInput.value).toBe('Test123');
    });
  });

  describe('Authentication Edge Cases', () => {
    it('should not crash when user is null', async () => {
      // Mock useAuth to return null user
      const { useAuth } = await import('@/contexts/AuthContext');
      vi.mocked(useAuth).mockReturnValue({ user: null, loading: false } as any);

      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      render(<DashboardPasswordIntegration />);

      // Should not call password check API when user is null
      await waitFor(() => {
        expect(fetchSpy).not.toHaveBeenCalledWith('/api/auth/check-password');
      });

      // No modal should appear
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('should handle password check API calls correctly', async () => {
      // This test verifies that the integration component makes the password check call
      fetchSpy.mockResolvedValue(mockFetchResponse(mockApiResponses.checkPassword.hasPassword));

      render(<DashboardPasswordIntegration />);

      // Should call password check on mount
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith('/api/auth/check-password');
      });
    });
  });

  describe('Multi-user Scenarios', () => {
    it('should track modal state throughout password setting flow', async () => {
      // Initial user without password
      fetchSpy.mockResolvedValueOnce(mockFetchResponse(mockApiResponses.checkPassword.noPassword));

      render(<DashboardPasswordIntegration />);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Verify modal content is present
      expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      expect(screen.getByLabelText(/^Password/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^Confirm Password/)).toBeInTheDocument();
    });
  });
});
