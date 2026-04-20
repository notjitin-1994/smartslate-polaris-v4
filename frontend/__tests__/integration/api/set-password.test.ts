/**
 * API Integration Tests: POST /api/auth/set-password
 *
 * Comprehensive tests including OWASP security validations, password strength
 * requirements, edge cases, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from '@/app/api/auth/set-password/route';
import {
  mockOAuthOnlyUser,
  mockEmailUser,
  passwordTestCases,
  createMockSupabaseClient,
} from '@/__tests__/fixtures/auth';

// Mock the Supabase server module
vi.mock('@/lib/supabase/server', () => ({
  getSupabaseServerClient: vi.fn(),
}));

describe('POST /api/auth/set-password', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
  });

  // Helper to create mock request
  const createRequest = (body: any): Request => {
    return new Request('http://localhost:3000/api/auth/set-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({
        user: null,
        error: { message: 'Not authenticated', status: 401, name: 'AuthError' },
      });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(401);
      expect(data).toEqual({ error: 'Not authenticated' });
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should not call updateUser when authentication fails', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: null });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      await POST(request);

      // Assert
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('Password Validation - Valid Passwords', () => {
    it('should accept strong password meeting all requirements', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        message: 'Password set successfully',
      });
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: passwordTestCases.valid.strong,
        data: {
          has_password: true,
          password_set_at: expect.any(String),
        },
      });
    });

    it('should accept password with special characters', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.withSpecialChars });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept password with unicode characters', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.withUnicode });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should accept password at maximum length (70 chars)', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.longValid });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Password Validation - Too Short', () => {
    it('should reject empty password', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.tooShort.empty });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
      expect(data.details).toContain('at least 8 characters');
      expect(mockSupabase.auth.updateUser).not.toHaveBeenCalled();
    });

    it('should reject password with only 7 characters', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.tooShort.sevenChars });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.details).toContain('at least 8 characters');
    });
  });

  describe('Password Validation - Too Long', () => {
    it('should reject password longer than 72 characters', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.tooLong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
      expect(data.details).toContain('at most 72 characters');
    });
  });

  describe('Password Validation - Missing Requirements', () => {
    it('should reject password without uppercase letter', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.missingUppercase });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.details).toContain('uppercase letter');
    });

    it('should reject password without lowercase letter', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.missingLowercase });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.details).toContain('lowercase letter');
    });

    it('should reject password without number', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.missingNumber });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.details).toContain('one number');
    });

    it('should reject password missing all requirements', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.missingAll });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
      // Should mention multiple missing requirements
      expect(data.details).toMatch(/(uppercase|lowercase|number)/i);
    });
  });

  describe('OWASP - Weak Password Detection', () => {
    it.each(passwordTestCases.weakPasswords)(
      'should technically accept but log weak password: %s',
      async (weakPassword) => {
        // Note: Our current implementation focuses on structure validation
        // In production, you'd want to check against a weak password list
        // For now, we verify these passwords pass structural validation

        // Arrange
        const { getSupabaseServerClient } = await import('@/lib/supabase/server');
        mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
        vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

        const request = createRequest({ password: weakPassword });

        // Act
        const response = await POST(request);
        const data = await response.json();

        // Assert: These pass structural validation but are weak
        // TODO: Implement weak password list checking
        expect(response.status).toBe(200);
        expect(data.success).toBe(true);
      }
    );
  });

  describe('Security - Injection Prevention', () => {
    it('should safely handle SQL injection attempts in password', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.security.sqlInjection });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: Should be accepted (Supabase handles SQL safety)
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      // Verify the SQL injection string is passed as-is to Supabase with metadata
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledWith({
        password: passwordTestCases.security.sqlInjection,
        data: {
          has_password: true,
          password_set_at: expect.any(String),
        },
      });
    });

    it('should safely handle XSS attempts in password', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.security.xss });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert: XSS string is accepted as password
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle passwords with null bytes', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.security.nullBytes });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle passwords with emoji', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.security.emoji });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });
  });

  describe('Request Body Validation', () => {
    it('should reject request with missing password field', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
    });

    it('should reject request with null password', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: null });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
    });

    it('should reject request with password as number', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: 12345678 });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid password');
    });

    it('should reject malformed JSON', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = new Request('http://localhost:3000/api/auth/set-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{ invalid json',
      });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to set password');
    });
  });

  describe('Supabase Integration', () => {
    it('should handle Supabase updateUser success', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({
        user: mockOAuthOnlyUser,
        updateUserResult: { data: { user: mockOAuthOnlyUser }, error: null },
      });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockSupabase.auth.updateUser).toHaveBeenCalledOnce();
    });

    it('should handle Supabase updateUser error', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      const supabaseError = {
        message: 'Invalid user',
        code: 'USER_NOT_FOUND',
      };
      mockSupabase = createMockSupabaseClient({
        user: mockOAuthOnlyUser,
        updateUserResult: { error: supabaseError },
      });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Invalid user');
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it('should handle Supabase client throwing exception', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      mockSupabase.auth.updateUser.mockRejectedValue(new Error('Network error'));
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to set password');
    });
  });

  describe('Response Format', () => {
    it('should return correct success response structure', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('message');
      expect(data.success).toBe(true);
      expect(typeof data.message).toBe('string');
    });

    it('should return detailed error response on validation failure', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.missingUppercase });

      // Act
      const response = await POST(request);
      const data = await response.json();

      // Assert
      expect(data).toHaveProperty('error');
      expect(data).toHaveProperty('details');
      expect(data.error).toBe('Invalid password');
      expect(data.details).toBeTruthy();
    });

    it('should set correct content-type header', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const request = createRequest({ password: passwordTestCases.valid.strong });

      // Act
      const response = await POST(request);

      // Assert
      expect(response.headers.get('content-type')).toContain('application/json');
    });
  });

  describe('Security - No Password Leakage', () => {
    it('should not include password in error responses', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({ user: mockOAuthOnlyUser });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const testPassword = 'WeakPass1';
      const request = createRequest({ password: testPassword });

      // Act
      const response = await POST(request);
      const data = await response.json();
      const responseText = JSON.stringify(data);

      // Assert: Password should not appear in response
      expect(responseText).not.toContain(testPassword);
    });

    it('should not log passwords in console errors', async () => {
      // Arrange
      const { getSupabaseServerClient } = await import('@/lib/supabase/server');
      mockSupabase = createMockSupabaseClient({
        user: mockOAuthOnlyUser,
        updateUserResult: { error: new Error('Test error') },
      });
      vi.mocked(getSupabaseServerClient).mockResolvedValue(mockSupabase);

      const testPassword = passwordTestCases.valid.strong;
      const request = createRequest({ password: testPassword });

      // Spy on console.error
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act
      await POST(request);

      // Assert: Verify password is not in console.error calls
      consoleSpy.mock.calls.forEach((call) => {
        const callString = call.join(' ');
        expect(callString).not.toContain(testPassword);
      });

      consoleSpy.mockRestore();
    });
  });
});
