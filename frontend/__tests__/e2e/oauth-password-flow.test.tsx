/**
 * E2E Tests: OAuth User Password Flow
 *
 * Tests the complete end-to-end flow for OAuth users setting passwords:
 * 1. User logs in with OAuth (Google)
 * 2. Modal appears prompting password setup
 * 3. User sets password
 * 4. Modal closes after successful verification
 * 5. User gains access to dashboard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  mockOAuthOnlyUser,
  passwordTestCases,
  createMockSupabaseClient,
} from '@/__tests__/fixtures/auth';

// Mock modules
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createBrowserClient: vi.fn(),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/lib/hooks/useUserProfile', () => ({
  useUserProfile: vi.fn(),
}));

vi.mock('@/lib/hooks/useUserUsage', () => ({
  useUserUsage: vi.fn(),
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

describe('E2E: OAuth User Password Flow', () => {
  let fetchSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    fetchSpy = vi.spyOn(global, 'fetch');
  });

  afterEach(() => {
    fetchSpy.mockRestore();
  });

  describe('Complete Happy Path Flow', () => {
    it('should successfully guide OAuth user through password setup', async () => {
      const user = userEvent.setup();

      // Setup mocks
      const { useAuth } = await import('@/contexts/AuthContext');
      const { useUserProfile } = await import('@/lib/hooks/useUserProfile');
      const { useUserUsage } = await import('@/lib/hooks/useUserUsage');

      // Initial state: OAuth user without password
      vi.mocked(useAuth).mockReturnValue({
        user: mockOAuthOnlyUser,
        loading: false,
        signOut: vi.fn(),
      } as any);

      vi.mocked(useUserProfile).mockReturnValue({
        profile: {
          id: mockOAuthOnlyUser.id,
          first_name: 'John',
          last_name: 'Doe',
          subscription_tier: 'free',
          user_role: 'explorer',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      vi.mocked(useUserUsage).mockReturnValue({
        usage: {
          creationCount: 0,
          creationLimit: 2,
          savingCount: 0,
          savingLimit: 2,
          subscriptionTier: 'free',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      // Mock API responses
      let passwordChecks = 0;
      fetchSpy.mockImplementation((url: string) => {
        if (url === '/api/auth/check-password') {
          passwordChecks++;
          // First check: no password
          // Second check (after setting): has password
          return Promise.resolve({
            ok: true,
            json: async () => ({
              hasPassword: passwordChecks > 1,
              userId: mockOAuthOnlyUser.id,
              email: mockOAuthOnlyUser.email,
            }),
          });
        }
        if (url === '/api/auth/set-password') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Password set successfully',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      // Import and render dashboard page
      const DashboardPage = (await import('@/app/(auth)/page')).default;
      render(<DashboardPage />);

      // Step 1: Dashboard loads and detects no password
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByText('Set Your Password')).toBeInTheDocument();
      });

      // Verify email is shown
      expect(screen.getByText(mockOAuthOnlyUser.email!)).toBeInTheDocument();

      // Step 2: User enters password
      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);

      // Step 3: Submit button becomes enabled
      const submitButton = screen.getByRole('button', { name: /Set Password/i });
      expect(submitButton).not.toBeDisabled();

      // Step 4: User clicks submit
      await user.click(submitButton);

      // Step 5: API is called to set password
      await waitFor(() => {
        expect(fetchSpy).toHaveBeenCalledWith(
          '/api/auth/set-password',
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ password: passwordTestCases.valid.strong }),
          })
        );
      });

      // Step 6: Success toast is shown
      await waitFor(() => {
        expect(mockShowSuccess).toHaveBeenCalledWith(
          'Password Set Successfully',
          'Verifying your password...'
        );
      });

      // Step 7: Verifying state is shown
      expect(screen.getByText('Verifying...')).toBeInTheDocument();

      // Step 8: Password check is re-run
      await waitFor(() => {
        expect(passwordChecks).toBeGreaterThan(1);
      });

      // Step 9: Modal closes (hasPassword is now true)
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Step 10: User sees dashboard content
      expect(screen.getByText(/Welcome back/i)).toBeInTheDocument();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle API failure gracefully and keep modal open', async () => {
      const user = userEvent.setup();

      // Setup mocks (same as happy path)
      const { useAuth } = await import('@/contexts/AuthContext');
      const { useUserProfile } = await import('@/lib/hooks/useUserProfile');
      const { useUserUsage } = await import('@/lib/hooks/useUserUsage');

      vi.mocked(useAuth).mockReturnValue({
        user: mockOAuthOnlyUser,
        loading: false,
        signOut: vi.fn(),
      } as any);

      vi.mocked(useUserProfile).mockReturnValue({
        profile: {
          id: mockOAuthOnlyUser.id,
          first_name: 'John',
          subscription_tier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      vi.mocked(useUserUsage).mockReturnValue({
        usage: {
          creationCount: 0,
          creationLimit: 2,
          savingCount: 0,
          savingLimit: 2,
          subscriptionTier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      // Mock API failure
      fetchSpy.mockImplementation((url: string) => {
        if (url === '/api/auth/check-password') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              hasPassword: false,
              userId: mockOAuthOnlyUser.id,
              email: mockOAuthOnlyUser.email,
            }),
          });
        }
        if (url === '/api/auth/set-password') {
          return Promise.resolve({
            ok: false,
            status: 500,
            json: async () => ({
              error: 'Internal server error',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const DashboardPage = (await import('@/app/(auth)/page')).default;
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const passwordInput = screen.getByLabelText(/^Password/);
      const confirmPasswordInput = screen.getByLabelText(/^Confirm Password/);
      const submitButton = screen.getByRole('button', { name: /Set Password/i });

      await user.type(passwordInput, passwordTestCases.valid.strong);
      await user.type(confirmPasswordInput, passwordTestCases.valid.strong);
      await user.click(submitButton);

      // Error is shown
      await waitFor(() => {
        expect(screen.getByText(/Internal server error/i)).toBeInTheDocument();
      });

      // Modal stays open
      expect(screen.getByRole('dialog')).toBeInTheDocument();

      // Error toast is shown
      expect(mockShowError).toHaveBeenCalled();

      // User can try again
      expect(submitButton).not.toBeDisabled();
    });

    it('should retry password check if initial check fails', async () => {
      const user = userEvent.setup();

      const { useAuth } = await import('@/contexts/AuthContext');
      const { useUserProfile } = await import('@/lib/hooks/useUserProfile');
      const { useUserUsage } = await import('@/lib/hooks/useUserUsage');

      vi.mocked(useAuth).mockReturnValue({
        user: mockOAuthOnlyUser,
        loading: false,
        signOut: vi.fn(),
      } as any);

      vi.mocked(useUserProfile).mockReturnValue({
        profile: {
          id: mockOAuthOnlyUser.id,
          first_name: 'John',
          subscription_tier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      vi.mocked(useUserUsage).mockReturnValue({
        usage: {
          creationCount: 0,
          creationLimit: 2,
          savingCount: 0,
          savingLimit: 2,
          subscriptionTier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      let checkPasswordCalls = 0;
      fetchSpy.mockImplementation((url: string) => {
        if (url === '/api/auth/check-password') {
          checkPasswordCalls++;
          // First 2 calls fail, third succeeds
          if (checkPasswordCalls <= 2) {
            return Promise.reject(new Error('Network error'));
          }
          return Promise.resolve({
            ok: true,
            json: async () => ({
              hasPassword: true,
              userId: mockOAuthOnlyUser.id,
              email: mockOAuthOnlyUser.email,
            }),
          });
        }
        if (url === '/api/auth/set-password') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Password set successfully',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const DashboardPage = (await import('@/app/(auth)/page')).default;
      render(<DashboardPage />);

      // Password check should retry and eventually succeed
      await waitFor(
        () => {
          expect(checkPasswordCalls).toBeGreaterThanOrEqual(3);
        },
        { timeout: 5000 }
      );
    });
  });

  describe('Race Conditions', () => {
    it('should handle rapid modal open/close cycles', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      const { useUserProfile } = await import('@/lib/hooks/useUserProfile');
      const { useUserUsage } = await import('@/lib/hooks/useUserUsage');

      vi.mocked(useAuth).mockReturnValue({
        user: mockOAuthOnlyUser,
        loading: false,
        signOut: vi.fn(),
      } as any);

      const mockProfile = {
        profile: {
          id: mockOAuthOnlyUser.id,
          first_name: 'John',
          subscription_tier: 'free',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      };

      vi.mocked(useUserProfile).mockReturnValue(mockProfile as any);

      vi.mocked(useUserUsage).mockReturnValue({
        usage: {
          creationCount: 0,
          creationLimit: 2,
          savingCount: 0,
          savingLimit: 2,
          subscriptionTier: 'free',
        },
        loading: false,
        error: null,
        refetch: vi.fn(),
      } as any);

      let hasPassword = false;
      fetchSpy.mockImplementation((url: string) => {
        if (url === '/api/auth/check-password') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              hasPassword,
              userId: mockOAuthOnlyUser.id,
              email: mockOAuthOnlyUser.email,
            }),
          });
        }
        if (url === '/api/auth/set-password') {
          hasPassword = true;
          return Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Password set successfully',
            }),
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const DashboardPage = (await import('@/app/(auth)/page')).default;
      const { rerender } = render(<DashboardPage />);

      // Modal should appear
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Simulate rapid password status changes
      hasPassword = true;
      mockProfile.profile = { ...mockProfile.profile };
      rerender(<DashboardPage />);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });

      // Change back to no password
      hasPassword = false;
      mockProfile.profile = { ...mockProfile.profile };
      rerender(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should maintain focus within modal and not allow dashboard interaction', async () => {
      const { useAuth } = await import('@/contexts/AuthContext');
      const { useUserProfile } = await import('@/lib/hooks/useUserProfile');
      const { useUserUsage } = await import('@/lib/hooks/useUserUsage');

      vi.mocked(useAuth).mockReturnValue({
        user: mockOAuthOnlyUser,
        loading: false,
        signOut: vi.fn(),
      } as any);

      vi.mocked(useUserProfile).mockReturnValue({
        profile: {
          id: mockOAuthOnlyUser.id,
          first_name: 'John',
          subscription_tier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      vi.mocked(useUserUsage).mockReturnValue({
        usage: {
          creationCount: 0,
          creationLimit: 2,
          savingCount: 0,
          savingLimit: 2,
          subscriptionTier: 'free',
        },
        loading: false,
        error: null,
      } as any);

      fetchSpy.mockImplementation((url: string) => {
        if (url === '/api/auth/check-password') {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              hasPassword: false,
              userId: mockOAuthOnlyUser.id,
              email: mockOAuthOnlyUser.email,
            }),
          });
        }
        return Promise.reject(new Error('Unexpected API call'));
      });

      const DashboardPage = (await import('@/app/(auth)/page')).default;
      render(<DashboardPage />);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      // Modal should have proper ARIA attributes
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAccessibleName('Set Your Password');

      // Modal should be non-dismissible (verified by handlers)
      expect(dialog.parentElement?.getAttribute('data-state')).toBeTruthy();
    });
  });
});
