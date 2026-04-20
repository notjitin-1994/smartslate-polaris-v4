import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CustomCheckoutButton } from '@/components/pricing/CustomCheckoutButton';

// Mock fetch globally
global.fetch = vi.fn();

// Mock window.location
delete (window as any).location;
window.location = { href: '' } as Location;

describe('Checkout Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.location.href = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('End-to-End Payment Flow', () => {
    it('should complete full payment flow for card payment', async () => {
      const user = userEvent.setup();

      // Mock successful API responses
      (global.fetch as any)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              order: {
                id: 'order_123',
                amount: 1179,
                currency: 'INR',
              },
              breakdown: {
                baseAmount: 999,
                gstAmount: 180,
                totalAmount: 1179,
              },
              prefill: {
                name: 'John Doe',
                email: 'john@example.com',
                contact: '9999999999',
              },
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Payment verified successfully',
              subscription: {
                tier: 'navigator',
                billingCycle: 'monthly',
                status: 'active',
                nextBillingDate: '2024-02-01',
              },
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Subscription activated successfully',
              subscription: {
                tier: 'navigator',
                billingCycle: 'monthly',
                status: 'active',
              },
              redirectUrl: '/dashboard?subscription=activated',
            }),
          })
        );

      const onSuccess = vi.fn();
      const onError = vi.fn();

      render(
        <CustomCheckoutButton
          planId="navigator"
          tier="navigator"
          billingCycle="monthly"
          onCheckoutSuccess={onSuccess}
          onCheckoutError={onError}
        />
      );

      // Click upgrade button
      const upgradeButton = screen.getByRole('button', { name: /upgrade now/i });
      await user.click(upgradeButton);

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Polaris Navigator: Monthly')).toBeInTheDocument();
      });

      // Fill card details
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');

      // Submit payment
      const payButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(payButton);

      // Verify API calls were made
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(3);
      });

      // Verify create order call
      expect(global.fetch).toHaveBeenNthCalledWith(
        1,
        '/api/payments/create-order',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tier: 'navigator',
            billingCycle: 'monthly',
            currency: 'INR',
          }),
        })
      );

      // Verify payment verification call
      expect(global.fetch).toHaveBeenNthCalledWith(
        2,
        '/api/payments/verify',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Verify activation call
      expect(global.fetch).toHaveBeenNthCalledWith(
        3,
        '/api/payments/activate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );

      // Verify success callback
      await waitFor(() => {
        expect(onSuccess).toHaveBeenCalled();
      });

      expect(onError).not.toHaveBeenCalled();

      // Verify redirect
      await waitFor(
        () => {
          expect(window.location.href).toBe('/dashboard?subscription=activated');
        },
        { timeout: 3000 }
      );
    });

    it('should handle payment failure gracefully', async () => {
      const user = userEvent.setup();

      // Mock failed payment verification
      (global.fetch as any)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              order: {
                id: 'order_123',
                amount: 1179,
                currency: 'INR',
              },
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            json: async () => ({
              error: 'Payment verification failed',
              code: 'INVALID_SIGNATURE',
            }),
          })
        );

      const onSuccess = vi.fn();
      const onError = vi.fn();

      render(
        <CustomCheckoutButton
          planId="navigator"
          tier="navigator"
          billingCycle="monthly"
          onCheckoutSuccess={onSuccess}
          onCheckoutError={onError}
        />
      );

      // Open modal
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));

      // Fill and submit
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');

      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      // Verify error handling
      await waitFor(() => {
        expect(onError).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'Payment verification failed',
          })
        );
      });

      expect(onSuccess).not.toHaveBeenCalled();
      expect(window.location.href).toBe(''); // No redirect on failure
    });

    it('should handle different payment methods', async () => {
      const user = userEvent.setup();

      // Mock successful responses
      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({
            success: true,
            order: { id: 'order_123' },
          }),
        })
      );

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));

      // Test UPI payment
      await user.click(screen.getByRole('tab', { name: /upi/i }));
      await user.type(screen.getByLabelText(/upi id/i), 'user@paytm');
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Test Netbanking
      await user.click(screen.getByRole('tab', { name: /netbanking/i }));
      await user.click(screen.getByText('HDFC Bank'));
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });

      // Test Wallet
      await user.click(screen.getByRole('tab', { name: /wallets/i }));
      await user.click(screen.getByText('Paytm').closest('button')!);
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
      });
    });
  });

  describe('Error Recovery', () => {
    it('should allow retry after payment failure', async () => {
      const user = userEvent.setup();

      // First attempt fails, second succeeds
      (global.fetch as any)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: false,
            json: async () => ({
              error: 'Network error',
              code: 'NETWORK_ERROR',
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              order: { id: 'order_123' },
            }),
          })
        );

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));

      // First attempt
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
      });

      // Retry payment
      const retryButton = screen.getByRole('button', { name: /retry payment/i });
      await user.click(retryButton);

      // Second attempt should succeed
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(2);
      });
    });

    it('should handle network timeouts gracefully', async () => {
      const user = userEvent.setup();

      // Simulate timeout
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  ok: false,
                  json: async () => ({
                    error: 'Request timeout',
                    code: 'TIMEOUT',
                  }),
                }),
              100
            );
          })
      );

      const onError = vi.fn();

      render(
        <CustomCheckoutButton
          planId="navigator"
          tier="navigator"
          billingCycle="monthly"
          onCheckoutError={onError}
        />
      );

      // Open modal and submit
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      // Should show processing state initially
      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();

      // Should handle timeout error
      await waitFor(
        () => {
          expect(onError).toHaveBeenCalled();
        },
        { timeout: 200 }
      );
    });
  });

  describe('Security Features', () => {
    it('should not submit form with invalid card details', async () => {
      const user = userEvent.setup();

      (global.fetch as any).mockImplementation(() =>
        Promise.resolve({
          ok: true,
          json: async () => ({ success: true }),
        })
      );

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));

      // Try to submit with invalid card
      await user.type(screen.getByLabelText(/card number/i), '4111111111111112'); // Invalid Luhn
      await user.type(screen.getByLabelText(/expiry date/i), '01/20'); // Expired
      await user.type(screen.getByLabelText(/cvv/i), '12'); // Too short
      await user.type(screen.getByLabelText(/name on card/i), 'J'); // Too short

      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
        expect(screen.getByText(/card has expired/i)).toBeInTheDocument();
        expect(screen.getByText(/cvv must be 3 digits/i)).toBeInTheDocument();
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });

      // Should not make API call
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('should handle concurrent payment attempts', async () => {
      const user = userEvent.setup();

      let callCount = 0;
      (global.fetch as any).mockImplementation(
        () =>
          new Promise((resolve) => {
            callCount++;
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({
                    success: true,
                    order: { id: `order_${callCount}` },
                  }),
                }),
              100
            );
          })
      );

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));

      // Fill form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');

      // Try to click pay button multiple times rapidly
      const payButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(payButton);
      await user.click(payButton);
      await user.click(payButton);

      // Should only make one API call despite multiple clicks
      await waitFor(() => {
        expect(callCount).toBe(1);
      });

      // Button should be disabled after first click
      expect(payButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should be fully keyboard navigable', async () => {
      const user = userEvent.setup();

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Navigate with keyboard
      await user.tab(); // Focus on upgrade button
      expect(screen.getByRole('button', { name: /upgrade now/i })).toHaveFocus();

      await user.keyboard('{Enter}'); // Open modal

      // Modal should open
      await waitFor(() => {
        expect(screen.getByText('Polaris Navigator: Monthly')).toBeInTheDocument();
      });

      // Tab through modal elements
      await user.tab(); // Card tab
      await user.tab(); // UPI tab
      await user.tab(); // Netbanking tab
      await user.tab(); // Wallets tab
      await user.tab(); // Card number input

      expect(screen.getByLabelText(/card number/i)).toHaveFocus();

      // Fill form with keyboard
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.tab(); // Move to expiry
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.tab(); // Move to CVV
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.tab(); // Move to name
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');
      await user.tab(); // Move to save card checkbox
      await user.keyboard(' '); // Check the checkbox
      await user.tab(); // Move to pay button

      expect(screen.getByRole('button', { name: /pay.*1,179/i })).toHaveFocus();

      // Close with Escape
      await user.keyboard('{Escape}');

      // Modal should close
      await waitFor(() => {
        expect(screen.queryByText('Polaris Navigator: Monthly')).not.toBeInTheDocument();
      });
    });

    it('should announce payment status to screen readers', async () => {
      const user = userEvent.setup();

      (global.fetch as any)
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              order: { id: 'order_123' },
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Payment verified successfully',
            }),
          })
        )
        .mockImplementationOnce(() =>
          Promise.resolve({
            ok: true,
            json: async () => ({
              success: true,
              message: 'Subscription activated',
              redirectUrl: '/dashboard',
            }),
          })
        );

      render(<CustomCheckoutButton planId="navigator" tier="navigator" billingCycle="monthly" />);

      // Open modal and submit
      await user.click(screen.getByRole('button', { name: /upgrade now/i }));
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');
      await user.click(screen.getByRole('button', { name: /pay.*1,179/i }));

      // Should announce processing
      await waitFor(() => {
        const processingMessage = screen.getByText(/processing payment/i);
        expect(processingMessage).toHaveAttribute('role', 'status');
        expect(processingMessage).toHaveAttribute('aria-live', 'polite');
      });

      // Should announce success
      await waitFor(() => {
        const successMessage = screen.getByText(/payment successful/i);
        expect(successMessage).toHaveAttribute('role', 'status');
        expect(successMessage).toHaveAttribute('aria-live', 'polite');
      });
    });
  });
});
