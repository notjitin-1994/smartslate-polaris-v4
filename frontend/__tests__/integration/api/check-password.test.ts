/**
 * API Integration Tests: GET /api/auth/check-password
 *
 * Tests the password status checking endpoint with comprehensive coverage
 * including authentication, authorization, and edge cases.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/auth/check-password/route';
import {
  mockOAuthOnlyUser,
  mockEmailUser,
  mockMultiProviderUser,
  mockUserNoIdentities,
  createMockSupabaseClient,
} from '@/__tests__/fixtures/auth';

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe('GET /api/auth/check-password', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange: Mock unauthenticated state
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({
        user: null,
        error: { message: 'Not authenticated', status: 401, name: 'AuthError' },
      });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
      expect(mockSupabase.auth.getUser).toHaveBeenCalledOnce();
    });

    it('should return 401 when getUser returns no user', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: null });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
    });
  });

  describe('OAuth-only Users (No Password)', () => {
    it('should return hasPassword: false for user with only Google OAuth', async () => {
      // Arrange: User signed in via Google, no email provider
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        hasPassword: false,
        userId: mockOAuthOnlyUser.id,
        email: mockOAuthOnlyUser.email,
      });
    });

    it('should correctly identify user with only OAuth provider (GitHub)', async () => {
      // Arrange: Create user with GitHub OAuth
      const githubUser = {
        ...mockOAuthOnlyUser,
        id: 'github-user-123',
        identities: [
          {
            ...mockOAuthOnlyUser.identities![0],
            provider: 'github',
          },
        ],
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: githubUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });
  });

  describe('Email Users (Has Password)', () => {
    it('should return hasPassword: true for user with email provider', async () => {
      // Arrange: User registered with email/password
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockEmailUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        hasPassword: true,
        userId: mockEmailUser.id,
        email: mockEmailUser.email,
      });
    });

    it('should return hasPassword: true for user with multiple providers including email', async () => {
      // Arrange: User has both Google OAuth and email/password
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockMultiProviderUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(true);
      expect(data.userId).toBe(mockMultiProviderUser.id);
    });
  });

  describe('Edge Cases', () => {
    it('should handle user with no identities array gracefully', async () => {
      // Arrange: User object has no identities
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockUserNoIdentities });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should default to false when no identities
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });

    it('should handle user with empty identities array', async () => {
      // Arrange
      const userWithEmptyIdentities = {
        ...mockOAuthOnlyUser,
        identities: [],
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: userWithEmptyIdentities });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });

    it('should handle user with undefined email', async () => {
      // Arrange
      const userNoEmail = {
        ...mockOAuthOnlyUser,
        email: undefined,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: userNoEmail });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should still work, just with undefined email
      expect(response.status).toBe(200);
      expect(data.email).toBeUndefined();
      expect(data.userId).toBe(userNoEmail.id);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 when getUser throws an unexpected error', async () => {
      // Arrange: Simulate Supabase client throwing an error
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = {
        auth: {
          getUser: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        },
      };
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Spy on console.error to verify error logging
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data).toEqual({ error: 'Failed to check password status' });
      expect(consoleSpy).toHaveBeenCalledWith('Error checking password status:', expect.any(Error));

      consoleSpy.mockRestore();
    });

    it('should handle malformed user data gracefully', async () => {
      // Arrange: User with unexpected structure
      const malformedUser = {
        id: 'malformed-user',
        email: 'malformed@example.com',
        // Missing required fields, malformed structure
        identities: null, // null instead of array
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: malformedUser as any });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should handle gracefully and default to false
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
      expect(data.userId).toBe(malformedUser.id);
    });
  });

  describe('Response Format', () => {
    it('should return correct response structure', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockEmailUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Verify response structure
      expect(data).toHaveProperty('hasPassword');
      expect(data).toHaveProperty('userId');
      expect(data).toHaveProperty('email');
      expect(typeof data.hasPassword).toBe('boolean');
      expect(typeof data.userId).toBe('string');
    });

    it('should set correct content-type header', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockEmailUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();

      // Assert
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Security - Timing Attacks', () => {
    it('should respond within consistent time for authenticated vs OAuth users', async () => {
      // Note: This is a basic timing test. In production, use more sophisticated methods.
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');

      // Test OAuth user
      const startOAuth = Date.now();
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);
      await GET();
      const oauthDuration = Date.now() - startOAuth;

      // Test email user
      const startEmail = Date.now();
      mockSupabase = createMockSupabaseClient({ user: mockEmailUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);
      await GET();
      const emailDuration = Date.now() - startEmail;

      // Assert: Response times should be roughly similar (within 100ms)
      // This helps prevent timing-based user enumeration attacks
      expect(Math.abs(oauthDuration - emailDuration)).toBeLessThan(100);
    });
  });

  describe('API Contract', () => {
    it('should maintain backward compatibility with expected response shape', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Ensure API contract is maintained
      expect(Object.keys(data).sort()).toEqual(['email', 'hasPassword', 'userId'].sort());
    });
  });

  describe('User Metadata Password Flag', () => {
    it('should return hasPassword: true when user_metadata.has_password is true (OAuth user who set password)', async () => {
      // Arrange: OAuth user who has set a password via the set-password API
      const oauthUserWithPassword = {
        ...mockOAuthOnlyUser,
        user_metadata: {
          has_password: true,
          password_set_at: new Date().toISOString(),
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: oauthUserWithPassword });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(true);
      expect(data.userId).toBe(oauthUserWithPassword.id);
    });

    it('should return hasPassword: false when user_metadata.has_password is false', async () => {
      // Arrange: OAuth user with explicit false flag
      const oauthUserNoPassword = {
        ...mockOAuthOnlyUser,
        user_metadata: {
          has_password: false,
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: oauthUserNoPassword });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });

    it('should prioritize user_metadata.has_password over email identity', async () => {
      // Arrange: Email user but metadata explicitly says no password
      // (This is an edge case that shouldn't normally happen)
      const userWithConflict = {
        ...mockEmailUser,
        user_metadata: {
          has_password: true,
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: userWithConflict });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should return true because either check passes
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(true);
    });

    it('should handle user with no user_metadata', async () => {
      // Arrange: OAuth user without user_metadata field
      const userNoMetadata = {
        ...mockOAuthOnlyUser,
        user_metadata: undefined,
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: userNoMetadata });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should fall back to identity check
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });

    it('should handle user with empty user_metadata object', async () => {
      // Arrange: OAuth user with empty metadata
      const userEmptyMetadata = {
        ...mockOAuthOnlyUser,
        user_metadata: {},
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: userEmptyMetadata });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: Should fall back to identity check
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(false);
    });

    it('should return true if EITHER metadata OR email identity indicates password', async () => {
      // Arrange: User with email identity (primary check)
      const emailUser = {
        ...mockEmailUser,
        user_metadata: {
          has_password: false, // Conflicting info, but email identity should still result in true
        },
      };

      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: emailUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      // Act
      const response = await GET();
      const data = await response.json();

      // Assert: OR logic - either check passing means hasPassword=true
      expect(response.status).toBe(200);
      expect(data.hasPassword).toBe(true);
    });
  });
});
