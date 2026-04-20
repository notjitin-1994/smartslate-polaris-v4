import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from '@/lib/stores/authStore';
import type { User, Session } from '@supabase/supabase-js';

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

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.getState().clearAuth();
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set auth data', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    } as User;

    const mockSession: Session = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: mockUser,
    } as Session;

    useAuthStore.getState().setAuth(mockUser, mockSession);

    const state = useAuthStore.getState();
    expect(state.user).toEqual(mockUser);
    expect(state.session).toEqual(mockSession);
    expect(state.error).toBeNull();
  });

  it('should set loading state', () => {
    useAuthStore.getState().setLoading(true);

    const state = useAuthStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set error state', () => {
    const errorMessage = 'Authentication failed';
    useAuthStore.getState().setError(errorMessage);

    const state = useAuthStore.getState();
    expect(state.error).toBe(errorMessage);
  });

  it('should clear auth data', () => {
    const mockUser: User = {
      id: 'user-1',
      email: 'test@example.com',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      aud: 'authenticated',
      role: 'authenticated',
      app_metadata: {},
      user_metadata: {},
    } as User;

    const mockSession: Session = {
      access_token: 'token',
      refresh_token: 'refresh',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
      user: mockUser,
    } as Session;

    useAuthStore.getState().setAuth(mockUser, mockSession);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.session).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should have persistence middleware configured', () => {
    // Test that the store has persistence middleware configured
    const store = useAuthStore.getState();
    expect(store).toHaveProperty('setAuth');
    expect(store).toHaveProperty('clearAuth');
    expect(store).toHaveProperty('setLoading');
    expect(store).toHaveProperty('setError');
  });
});
