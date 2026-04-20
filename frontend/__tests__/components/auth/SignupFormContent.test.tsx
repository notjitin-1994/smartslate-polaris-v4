/**
 * Component integration tests for SignupFormContent
 * Tests form interactions, validation, submission, and error display
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SignupFormContent } from '@/components/auth/SignupFormContent';
import {
  mockSignupSuccessResponse,
  mockUserExistsPasswordResponse,
  mockUserExistsOAuthResponse,
  mockUserExistsUnconfirmedResponse,
  mockValidationErrorResponse,
} from '../../fixtures/authFixtures';

// Mock window.location
const mockLocationHref = vi.fn();
Object.defineProperty(window, 'location', {
  writable: true,
  value: { href: '', assign: mockLocationHref },
});

// Mock getSupabaseBrowserClient
const mockResend = vi.fn();
vi.mock('@/lib/supabase/client', () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      resend: mockResend,
    },
  }),
}));

// Mock AuthInput to avoid timing issues with useEffect
vi.mock('@/components/auth/AuthInput', () => {
  const { useState } = require('react');
  return {
    AuthInput: ({
      value,
      onChange,
    }: {
      value: string;
      onChange: (raw: string, parsed: any) => void;
    }) => {
      const [focused, setFocused] = useState(false);

      const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const trimmed = newValue.trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        const parsed = emailRegex.test(trimmed)
          ? { kind: 'email' as const, email: trimmed.toLowerCase() }
          : { kind: 'unknown' as const, raw: newValue };
        onChange(newValue, parsed);
      };

      // Determine validation state
      const hasValue = value.length > 0;
      const trimmed = value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const isValid = emailRegex.test(trimmed);
      const showValidation = hasValue && !focused;

      return (
        <div>
          <label htmlFor="email-input">Email Address</label>
          <input
            id="email-input"
            type="email"
            value={value}
            onChange={handleChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
          />
          {showValidation && !isValid && <p>Please enter a valid email address</p>}
        </div>
      );
    },
  };
});

// Mock PasswordInput to avoid state update issues
vi.mock('@/components/auth/PasswordInput', () => ({
  PasswordInput: ({
    label,
    value,
    onChange,
    onFocus,
    onBlur,
  }: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
  }) => {
    const inputId = label.toLowerCase().includes('confirm')
      ? 'confirm-password-input'
      : 'password-input';
    const labelText = label.toLowerCase().includes('confirm') ? 'Confirm password' : 'Password';

    return (
      <div>
        <label htmlFor={inputId}>{labelText}</label>
        <input
          id={inputId}
          type="password"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </div>
    );
  },
}));

// Mock NameInput for consistency
vi.mock('@/components/auth/NameInput', () => ({
  NameInput: ({
    id,
    label,
    value,
    onChange,
  }: {
    id: string;
    label: string;
    value: string;
    onChange: (value: string) => void;
  }) => {
    return (
      <div>
        <label htmlFor={id}>{label}</label>
        <input id={id} type="text" value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  },
}));

// Mock FloatingPasswordHints for testing
vi.mock('@/components/auth/FloatingPasswordHints', () => ({
  FloatingPasswordHints: ({
    show,
    password,
  }: {
    show: boolean;
    password: string;
    targetRef: any;
  }) => {
    if (!show) return null;

    const criteria = [
      { met: password.length >= 8, text: '8 characters' },
      { met: /[A-Z]/.test(password), text: 'One uppercase letter' },
      { met: /[a-z]/.test(password), text: 'One lowercase letter' },
      { met: /\d/.test(password), text: 'One number' },
      { met: /[^a-zA-Z\d]/.test(password), text: 'One special character' },
    ];

    return (
      <div data-testid="password-hints">
        {criteria.map((criterion, index) => (
          <div key={index}>
            {criterion.text}: {criterion.met ? '✓' : '✗'}
          </div>
        ))}
      </div>
    );
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('SignupFormContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLocationHref.mockClear();
    (global.fetch as any).mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Helper to wait for async state updates
  const waitForAsync = () => new Promise((resolve) => setTimeout(resolve, 100));

  // ============================================================================
  // RENDERING TESTS
  // ============================================================================
  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(<SignupFormContent />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<SignupFormContent />);

      expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<SignupFormContent />);

      expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument();
    });
  });

  // ============================================================================
  // FORM VALIDATION TESTS
  // ============================================================================
  describe('Form Validation', () => {
    it('should show error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'not-an-email');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/valid email/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty first name', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(lastNameInput, 'Doe');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter your first name/i)).toBeInTheDocument();
      });
    });

    it('should show error for empty last name', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(emailInput, 'test@example.com');
      await user.type(firstNameInput, 'John');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please enter your last name/i)).toBeInTheDocument();
      });
    });

    it('should show error for password mismatch', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'DifferentPass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument();
      });
    });

    it('should show password strength hints when password field is focused', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.click(passwordInput);

      await waitFor(() => {
        // The FloatingPasswordHints component should be visible
        expect(screen.getByText(/8 characters/i)).toBeInTheDocument();
      });
    });

    it('should hide password hints when password meets all criteria', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const passwordInput = screen.getByLabelText(/^password$/i);

      await user.click(passwordInput);
      await user.type(passwordInput, 'SecurePass123!');

      // Wait for hints to disappear
      await waitFor(() => {
        // Check if the hints are not in the document
        const hints = screen.queryByText(/8 characters/i);
        expect(hints).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // FORM SUBMISSION TESTS
  // ============================================================================
  describe('Form Submission', () => {
    it('should submit form when all fields are valid', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });

      render(<SignupFormContent />);

      // Get form fields
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);

      // Fill all fields using fireEvent (synchronous and direct)
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123!' } });

      // Wait for state updates
      await waitForAsync();

      // Get and click submit button
      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Wait for either fetch to be called OR an error to appear
      await waitFor(
        () => {
          // Check if fetch was called
          if ((global.fetch as any).mock.calls.length > 0) {
            return true;
          }

          // Check if any validation error appeared
          const errors = [
            screen.queryByText(/please enter a valid email/i),
            screen.queryByText(/please enter your first name/i),
            screen.queryByText(/please enter your last name/i),
            screen.queryByText(/passwords do not match/i),
          ].filter(Boolean);

          if (errors.length > 0) {
            throw new Error(`Validation error appeared: ${errors[0]!.textContent}`);
          }

          // Neither fetch nor error appeared yet, keep waiting
          throw new Error('Still waiting for fetch or validation error');
        },
        { timeout: 5000 }
      );

      // Verify the fetch call had correct parameters
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/auth/signup',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should call /api/auth/signup with correct data on submit', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const form = emailInput.closest('form')!;

      // Fill form using fireEvent for more reliable state updates
      fireEvent.change(firstNameInput, { target: { value: 'John' } });
      fireEvent.change(lastNameInput, { target: { value: 'Doe' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
      fireEvent.change(confirmInput, { target: { value: 'SecurePass123!' } });

      // Wait for state updates
      await waitForAsync();

      // Submit form
      fireEvent.submit(form);

      await waitFor(
        () => {
          expect(global.fetch).toHaveBeenCalledWith('/api/auth/signup', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: 'test@example.com',
              password: 'SecurePass123!',
              firstName: 'John',
              lastName: 'Doe',
            }),
          });
        },
        { timeout: 5000 }
      );
    });

    it('should show loading state during submission', async () => {
      const user = userEvent.setup();

      // Create a promise that we can control
      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockReturnValueOnce(promise);

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      // Check loading state
      await waitFor(() => {
        expect(screen.getByText(/creating account/i)).toBeInTheDocument();
        expect(submitButton).toBeDisabled();
      });

      // Resolve the promise
      resolvePromise({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });
    });

    it('should redirect to home on successful signup', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(window.location.href).toBe('/');
      });
    });

    it('should disable button during submission', async () => {
      const user = userEvent.setup();

      let resolvePromise: any;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      (global.fetch as any).mockReturnValueOnce(promise);

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      resolvePromise({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });
    });
  });

  // ============================================================================
  // ERROR DISPLAY TESTS
  // ============================================================================
  describe('Error Display', () => {
    it('should show SignupErrorMessage for existing user with password', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockUserExistsPasswordResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/please sign in or use the forgot password link/i)
        ).toBeInTheDocument();
      });
    });

    it('should show SignupErrorMessage for existing OAuth user', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockUserExistsOAuthResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'google@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/please sign in using google/i)).toBeInTheDocument();
      });
    });

    it('should show SignupErrorMessage for unconfirmed email', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockUserExistsUnconfirmedResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'unconfirmed@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/hasn't been confirmed/i)).toBeInTheDocument();
        expect(screen.getByText(/check your email for the confirmation link/i)).toBeInTheDocument();
      });
    });

    it('should show generic error for validation failures', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockValidationErrorResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toHaveTextContent(/invalid email/i);
      });
    });

    it('should show generic error for network failures', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument();
      });
    });

    it('should clear previous errors on new submission', async () => {
      const user = userEvent.setup();

      // First submission - error
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockValidationErrorResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
      });

      // Second submission - success
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => mockSignupSuccessResponse,
      });

      await user.clear(emailInput);
      await user.type(emailInput, 'newemail@example.com');
      await user.click(submitButton);

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/invalid email/i)).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================================
  // RESEND CONFIRMATION TESTS
  // ============================================================================
  describe('Resend Confirmation', () => {
    it('should show resend button for unconfirmed email error', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockUserExistsUnconfirmedResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'unconfirmed@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
      });
    });

    it('should call Supabase resend on button click', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => mockUserExistsUnconfirmedResponse,
      });

      mockResend.mockResolvedValueOnce({ error: null });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'unconfirmed@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /resend/i })).toBeInTheDocument();
      });

      const resendButton = screen.getByRole('button', { name: /resend/i });
      await user.click(resendButton);

      await waitFor(() => {
        expect(mockResend).toHaveBeenCalledWith({
          type: 'signup',
          email: 'unconfirmed@example.com',
        });
      });
    });
  });

  // ============================================================================
  // ACCESSIBILITY TESTS
  // ============================================================================
  describe('Accessibility', () => {
    it('should have accessible form labels', () => {
      render(<SignupFormContent />);

      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    });

    it('should have accessible error messages with role="alert"', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => mockValidationErrorResponse,
      });

      render(<SignupFormContent />);

      const emailInput = screen.getByLabelText(/email address/i);
      const firstNameInput = screen.getByLabelText(/first name/i);
      const lastNameInput = screen.getByLabelText(/last name/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      await user.type(firstNameInput, 'John');
      await user.type(lastNameInput, 'Doe');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'SecurePass123!');
      await user.type(confirmInput, 'SecurePass123!');
      await user.click(submitButton);

      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<SignupFormContent />);

      const firstNameInput = screen.getByLabelText(/first name/i);

      // Tab through form fields
      await user.tab();
      expect(firstNameInput).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/last name/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/email address/i)).toHaveFocus();
    });
  });
});
