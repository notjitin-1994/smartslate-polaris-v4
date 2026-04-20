/**
 * Auth Test Fixtures
 * Reusable mock data for authentication testing
 */

import type { User, Session } from '@supabase/supabase-js';

/**
 * Mock OAuth user (Google) without email provider
 * This user needs to set a password
 */
export const mockOAuthOnlyUser: User = {
  id: 'oauth-user-123',
  email: 'oauth@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  app_metadata: {
    provider: 'google',
    providers: ['google'],
  },
  user_metadata: {
    email: 'oauth@example.com',
    full_name: 'OAuth User',
    first_name: 'OAuth',
    last_name: 'User',
    avatar_url: 'https://example.com/avatar.jpg',
  },
  identities: [
    {
      id: 'google-identity-123',
      user_id: 'oauth-user-123',
      identity_data: {
        email: 'oauth@example.com',
        email_verified: true,
        full_name: 'OAuth User',
        provider: 'google',
        sub: 'google-sub-123',
      },
      provider: 'google',
      last_sign_in_at: '2025-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  ],
};

/**
 * Mock user with email provider (has password)
 * This user doesn't need to set a password
 */
export const mockEmailUser: User = {
  id: 'email-user-456',
  email: 'email@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  app_metadata: {
    provider: 'email',
    providers: ['email'],
  },
  user_metadata: {
    email: 'email@example.com',
  },
  identities: [
    {
      id: 'email-identity-456',
      user_id: 'email-user-456',
      identity_data: {
        email: 'email@example.com',
        email_verified: true,
        sub: 'email-sub-456',
      },
      provider: 'email',
      last_sign_in_at: '2025-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  ],
};

/**
 * Mock user with multiple auth providers (Google + Email)
 * This user already has a password
 */
export const mockMultiProviderUser: User = {
  id: 'multi-user-789',
  email: 'multi@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  app_metadata: {
    provider: 'google',
    providers: ['google', 'email'],
  },
  user_metadata: {
    email: 'multi@example.com',
    full_name: 'Multi Provider User',
  },
  identities: [
    {
      id: 'google-identity-789',
      user_id: 'multi-user-789',
      identity_data: {
        email: 'multi@example.com',
        email_verified: true,
        provider: 'google',
        sub: 'google-sub-789',
      },
      provider: 'google',
      last_sign_in_at: '2025-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
    {
      id: 'email-identity-789',
      user_id: 'multi-user-789',
      identity_data: {
        email: 'multi@example.com',
        email_verified: true,
        sub: 'email-sub-789',
      },
      provider: 'email',
      last_sign_in_at: '2025-01-01T00:00:00.000Z',
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    },
  ],
};

/**
 * Mock user with no identities (edge case)
 */
export const mockUserNoIdentities: User = {
  id: 'no-identities-999',
  email: 'noidentities@example.com',
  aud: 'authenticated',
  role: 'authenticated',
  created_at: '2025-01-01T00:00:00.000Z',
  updated_at: '2025-01-01T00:00:00.000Z',
  app_metadata: {},
  user_metadata: {},
  identities: [],
};

/**
 * Create a mock session for a user
 */
export function createMockSession(user: User): Session {
  return {
    access_token: `access-token-${user.id}`,
    refresh_token: `refresh-token-${user.id}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: 'bearer',
    user,
  };
}

/**
 * Mock Supabase auth responses
 */
export const mockAuthResponses = {
  oauthUser: {
    data: { user: mockOAuthOnlyUser },
    error: null,
  },
  emailUser: {
    data: { user: mockEmailUser },
    error: null,
  },
  multiProviderUser: {
    data: { user: mockMultiProviderUser },
    error: null,
  },
  noUser: {
    data: { user: null },
    error: { message: 'User not found', status: 404, name: 'AuthError' },
  },
  unauthorizedError: {
    data: { user: null },
    error: { message: 'Not authenticated', status: 401, name: 'AuthError' },
  },
};

/**
 * Password test cases following OWASP guidelines
 */
export const passwordTestCases = {
  // Valid passwords
  valid: {
    strong: 'StrongP@ss123',
    withSpecialChars: 'MyP@ssw0rd!',
    withUnicode: 'MyПароль123Abc', // Unicode with required ASCII chars
    maxLength: 'A'.repeat(72) + 'a1', // 72 chars + lowercase + number = invalid, so make it 70
    longValid: 'A1' + 'a'.repeat(68), // exactly 70 chars
  },

  // Invalid passwords (too short)
  tooShort: {
    empty: '',
    oneChar: 'a',
    sevenChars: 'Pass123',
  },

  // Invalid passwords (too long)
  tooLong: 'A1a' + 'a'.repeat(70), // 73 chars

  // Invalid passwords (missing requirements)
  missingUppercase: 'password123',
  missingLowercase: 'PASSWORD123',
  missingNumber: 'PasswordABC',
  missingAll: 'password',

  // OWASP Top weak passwords
  weakPasswords: [
    'Password1',
    'Password123',
    'Admin123',
    'Welcome1',
    'Qwerty123',
    '123456789Aa',
    'Abc123456',
    'Password1!',
    '12345678Aa',
    'Letmein123',
  ],

  // Sequential and pattern passwords
  sequential: {
    numbers: '12345678Aa',
    letters: 'Abcdefgh1',
    keyboard: 'Qwerty123',
    repeated: 'Aaaaaa1a',
  },

  // Security test payloads
  security: {
    sqlInjection: "'; DROP TABLE users; --1A",
    xss: '<script>alert(1)</script>1A',
    nullBytes: 'Password123\x00',
    unicode: '密码Password123',
    emoji: 'Pass🔒word123',
    spaces: 'Pass word 123 A',
    allSpaces: '        A1',
  },
};

/**
 * API response mocks
 */
export const mockApiResponses = {
  checkPassword: {
    hasPassword: {
      hasPassword: true,
      userId: 'user-123',
      email: 'user@example.com',
    },
    noPassword: {
      hasPassword: false,
      userId: 'user-123',
      email: 'user@example.com',
    },
    unauthorized: {
      error: 'Not authenticated',
    },
    serverError: {
      error: 'Failed to check password status',
    },
  },

  setPassword: {
    success: {
      success: true,
      message: 'Password set successfully',
    },
    validationError: {
      error: 'Invalid password',
      details: 'Password must contain at least one uppercase letter',
    },
    unauthorized: {
      error: 'Not authenticated',
    },
    serverError: {
      error: 'Failed to set password',
    },
    supabaseError: {
      error: 'Password update failed: User not found',
    },
  },
};

/**
 * Mock factory for creating Supabase client
 */
export function createMockSupabaseClient(
  options: {
    user?: User | null;
    error?: any;
    updateUserResult?: { error: any } | { data: any };
  } = {}
) {
  const { user = null, error = null, updateUserResult } = options;

  return {
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user },
        error,
      }),
      getSession: vi.fn().mockResolvedValue({
        data: { session: user ? createMockSession(user) : null },
        error,
      }),
      updateUser: vi.fn().mockResolvedValue(
        updateUserResult || {
          data: { user },
          error: null,
        }
      ),
    },
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
  };
}

/**
 * Mock fetch responses for API testing
 */
export function mockFetchResponse(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => data,
  } as Response);
}
