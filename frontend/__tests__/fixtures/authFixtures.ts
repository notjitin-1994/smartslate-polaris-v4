/**
 * Shared test fixtures for authentication tests
 * Provides consistent mock data across API and component tests
 */

import type { User, Session } from '@supabase/supabase-js';

// Mock User Data
export const mockNewUser: Partial<User> = {
  id: 'new-user-123',
  email: 'newuser@example.com',
  email_confirmed_at: null,
  confirmed_at: null,
  identities: [
    {
      id: 'identity-1',
      user_id: 'new-user-123',
      provider: 'email',
      identity_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
    },
  ],
  app_metadata: {
    provider: 'email',
  },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockExistingUserPassword: Partial<User> = {
  id: 'existing-user-456',
  email: 'existing@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  identities: [
    {
      id: 'identity-2',
      user_id: 'existing-user-456',
      provider: 'email',
      identity_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
    },
  ],
  app_metadata: {
    provider: 'email',
  },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockExistingUserGoogle: Partial<User> = {
  id: 'existing-user-789',
  email: 'googleuser@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  identities: [
    {
      id: 'identity-3',
      user_id: 'existing-user-789',
      provider: 'google',
      identity_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
    },
  ],
  app_metadata: {
    provider: 'google',
  },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockExistingUserGithub: Partial<User> = {
  id: 'existing-user-101',
  email: 'githubuser@example.com',
  email_confirmed_at: '2024-01-01T00:00:00Z',
  confirmed_at: '2024-01-01T00:00:00Z',
  identities: [
    {
      id: 'identity-4',
      user_id: 'existing-user-101',
      provider: 'github',
      identity_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
    },
  ],
  app_metadata: {
    provider: 'github',
  },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

export const mockUnconfirmedUser: Partial<User> = {
  id: 'unconfirmed-user-999',
  email: 'unconfirmed@example.com',
  email_confirmed_at: null,
  confirmed_at: null,
  identities: [
    {
      id: 'identity-5',
      user_id: 'unconfirmed-user-999',
      provider: 'email',
      identity_data: {},
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      last_sign_in_at: '2024-01-01T00:00:00Z',
    },
  ],
  app_metadata: {
    provider: 'email',
  },
  user_metadata: {},
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock Session Data
export const mockSession: Session = {
  access_token: 'mock-access-token-xyz',
  refresh_token: 'mock-refresh-token-abc',
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  token_type: 'bearer',
  user: mockNewUser as User,
};

// Mock Signup Request Data
export const validSignupData = {
  email: 'test@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
};

export const invalidSignupData = {
  invalidEmail: {
    email: 'not-an-email',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: 'Doe',
  },
  shortPassword: {
    email: 'test@example.com',
    password: 'short',
    firstName: 'John',
    lastName: 'Doe',
  },
  missingFirstName: {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: '',
    lastName: 'Doe',
  },
  missingLastName: {
    email: 'test@example.com',
    password: 'SecurePass123!',
    firstName: 'John',
    lastName: '',
  },
};

// Mock API Responses
export const mockSignupSuccessResponse = {
  success: true,
  user: mockNewUser,
  session: mockSession,
  message: 'Account created successfully. Please check your email to confirm your account.',
};

export const mockUserExistsPasswordResponse = {
  error: 'An account with this email already exists',
  code: 'USER_EXISTS',
  reason: 'password',
  message:
    'An account with this email already exists. Please sign in or use the forgot password link to recover your account.',
};

export const mockUserExistsOAuthResponse = {
  error: 'An account with this email already exists',
  code: 'USER_EXISTS',
  reason: 'oauth',
  provider: 'google',
  message: 'An account with this email already exists. Please sign in using Google.',
};

export const mockUserExistsUnconfirmedResponse = {
  error: 'An account with this email already exists but is not confirmed',
  code: 'USER_EXISTS',
  reason: 'unconfirmed',
  message:
    'An account with this email already exists but hasn\'t been confirmed. Please check your email for the confirmation link or click "Resend confirmation email" below.',
};

export const mockValidationErrorResponse = {
  error: 'Invalid email address',
  code: 'VALIDATION_ERROR',
};

export const mockInternalErrorResponse = {
  error: 'An unexpected error occurred. Please try again later.',
  code: 'INTERNAL_ERROR',
};

// Helper function to create custom user with specific properties
export function createMockUser(overrides: Partial<User> = {}): Partial<User> {
  return {
    ...mockNewUser,
    ...overrides,
  };
}

// Helper function to create custom signup data
export function createSignupData(overrides: Partial<typeof validSignupData> = {}) {
  return {
    ...validSignupData,
    ...overrides,
  };
}
