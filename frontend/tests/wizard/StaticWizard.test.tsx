import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import StaticWizardPage from '@/app/(auth)/static-wizard/page';
import { AuthProvider } from '@/contexts/AuthContext';
import { vi } from 'vitest';

// Mock Next.js router
const mockPush = vi.fn();
const mockReplace = vi.fn();
const mockBack = vi.fn();
const mockForward = vi.fn();
const mockRefresh = vi.fn();
const mockPrefetch = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    back: mockBack,
    forward: mockForward,
    refresh: mockRefresh,
    prefetch: mockPrefetch,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}));

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => Promise.resolve({ data: null, error: null }),
        }),
      }),
    }),
    auth: {
      getSession: () =>
        Promise.resolve({
          data: {
            session: {
              user: mockUser,
              access_token: 'mock-token',
              refresh_token: 'mock-refresh-token',
            },
          },
          error: null,
        }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
  }),
}));

// Mock auth store
vi.mock('@/store/authStore', () => ({
  useAuthStore: vi.fn(() => ({
    setAuth: vi.fn(),
    setStatus: vi.fn(),
    setLoading: vi.fn(),
    setError: vi.fn(),
  })),
}));

// Mock fetch for questionnaire save API
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ success: true, blueprintId: 'test-id' }),
  })
) as any;

// Mock user data for testing
const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  user_metadata: {},
};

// Provide a minimal wrapper to satisfy ProtectedRoute dependency
function Wrapper({ children }: { children: React.ReactNode }): React.JSX.Element {
  return <AuthProvider>{children}</AuthProvider>;
}

describe('Static Questions Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the questionnaire with hero section and progress indicator', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Check for hero section content
    expect(screen.getByText(/Starmap Navigator/i)).toBeInTheDocument();
    expect(screen.getByText(/Complete this comprehensive questionnaire/i)).toBeInTheDocument();

    // Check for progress indicator (should show 3 steps)
    await waitFor(() => {
      expect(screen.getByText(/Step 1 of 3/i)).toBeInTheDocument();
    });

    // Check for section title
    expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
  });

  it('shows form fields for the current section', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for form to load
    await waitFor(() => {
      expect(screen.getByLabelText(/Current Role/i)).toBeInTheDocument();
    });

    // Check for section 1 fields
    expect(screen.getByLabelText(/Current Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Years in Role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Industry Experience/i)).toBeInTheDocument();
  });

  it('navigates between sections when Next Section is clicked', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for initial section to load
    await waitFor(() => {
      expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
    });

    // Fill out required field
    const roleSelect = screen.getByLabelText(/Current Role/i);
    fireEvent.change(roleSelect, { target: { value: 'Manager' } });

    // Click Next Section
    fireEvent.click(screen.getByRole('button', { name: /Next Section/i }));

    // Wait for section 2 to load
    await waitFor(() => {
      expect(screen.getByText(/Organization Details/i)).toBeInTheDocument();
    });

    // Check progress indicator updated
    expect(screen.getByText(/Step 2 of 3/i)).toBeInTheDocument();
  });

  it('saves questionnaire data when navigating between sections', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for initial section to load
    await waitFor(() => {
      expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
    });

    // Fill out required field
    const roleSelect = screen.getByLabelText(/Current Role/i);
    fireEvent.change(roleSelect, { target: { value: 'Manager' } });

    // Click Next Section - this should trigger a save
    fireEvent.click(screen.getByRole('button', { name: /Next Section/i }));

    // Wait for the fetch call to be made
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/questionnaire/save',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });
  });

  it('shows loading states during save operations', async () => {
    // Mock a slower response to see loading state
    global.fetch = vi.fn(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ success: true, blueprintId: 'test-id' }),
              }),
            100
          )
        )
    ) as any;

    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for initial section to load
    await waitFor(() => {
      expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
    });

    // Fill out required field
    const roleSelect = screen.getByLabelText(/Current Role/i);
    fireEvent.change(roleSelect, { target: { value: 'Manager' } });

    // Click Next Section
    fireEvent.click(screen.getByRole('button', { name: /Next Section/i }));

    // Should show saving state
    expect(screen.getByText(/Saving.../i)).toBeInTheDocument();

    // Wait for save to complete
    await waitFor(() => {
      expect(screen.queryByText(/Saving.../i)).not.toBeInTheDocument();
    });
  });

  it('shows autosave status indicators', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for initial section to load
    await waitFor(() => {
      expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
    });

    // Initially should show "Unsaved changes"
    expect(screen.getByText(/Unsaved changes/i)).toBeInTheDocument();

    // Fill out a field to trigger form change watching
    const roleSelect = screen.getByLabelText(/Current Role/i);
    fireEvent.change(roleSelect, { target: { value: 'Manager' } });

    // Wait for autosave to happen (it should happen after 2 seconds of no changes)
    await waitFor(
      () => {
        expect(screen.getByText(/Saving.../i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // After autosave completes, should show "Saved Xs ago"
    await waitFor(() => {
      expect(screen.getByText(/Saved \d+s ago/i)).toBeInTheDocument();
    });
  });

  it('autosaves when form data changes', async () => {
    render(<StaticWizardPage />, { wrapper: Wrapper });

    // Wait for initial section to load
    await waitFor(() => {
      expect(screen.getByText(/Role & Experience/i)).toBeInTheDocument();
    });

    // Fill out required field
    const roleSelect = screen.getByLabelText(/Current Role/i);
    fireEvent.change(roleSelect, { target: { value: 'Manager' } });

    // Wait for autosave API call to be made
    await waitFor(
      () => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/questionnaire/save',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        );
      },
      { timeout: 3000 }
    );
  });
});
