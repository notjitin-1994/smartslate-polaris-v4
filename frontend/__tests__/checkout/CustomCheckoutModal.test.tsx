import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CustomCheckoutModal } from '@/components/checkout/CustomCheckoutModal';
import type { CheckoutFormData } from '@/types/checkout';

// Mock fetch globally
global.fetch = vi.fn();

describe('CustomCheckoutModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    tier: 'navigator' as const,
    billingCycle: 'monthly' as const,
    amount: 1179, // 999 + 18% GST
    paymentStatus: 'idle' as const,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Rendering', () => {
    it('should render the modal when open', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      expect(screen.getByText('Polaris Navigator: Monthly')).toBeInTheDocument();
      expect(screen.getByText('AI-Assisted Learning Experience Design')).toBeInTheDocument();
    });

    it('should not render when closed', () => {
      render(<CustomCheckoutModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('Polaris Navigator: Monthly')).not.toBeInTheDocument();
    });

    it('should display correct tier and billing cycle', () => {
      render(<CustomCheckoutModal {...defaultProps} tier="voyager" billingCycle="annual" />);

      expect(screen.getByText('Polaris Voyager: Yearly')).toBeInTheDocument();
    });

    it('should show all payment method tabs', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      expect(screen.getByRole('tab', { name: /card/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /upi/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /netbanking/i })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: /wallets/i })).toBeInTheDocument();
    });

    it('should display order summary with correct amounts', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      const orderSummary = screen.getByTestId('order-summary');
      expect(within(orderSummary).getByText('₹999')).toBeInTheDocument(); // Base amount
      expect(within(orderSummary).getByText('₹180')).toBeInTheDocument(); // GST (18% of 999)
      expect(within(orderSummary).getByText('₹1,179')).toBeInTheDocument(); // Total
    });

    it('should show security badges', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      expect(screen.getByText(/pci dss/i)).toBeInTheDocument();
      expect(screen.getByText(/256-bit/i)).toBeInTheDocument();
      expect(screen.getByText(/powered by razorpay/i)).toBeInTheDocument();
    });
  });

  describe('Payment Methods', () => {
    describe('Card Payment', () => {
      it('should display card form fields', () => {
        render(<CustomCheckoutModal {...defaultProps} />);

        expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/name on card/i)).toBeInTheDocument();
      });

      it('should validate card number with Luhn algorithm', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const cardInput = screen.getByLabelText(/card number/i);

        // Invalid card number (fails Luhn check)
        await user.type(cardInput, '4111111111111112');
        await user.tab();

        await waitFor(() => {
          expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
        });

        // Valid card number (passes Luhn check)
        await user.clear(cardInput);
        await user.type(cardInput, '4111111111111111');
        await user.tab();

        await waitFor(() => {
          expect(screen.queryByText(/invalid card number/i)).not.toBeInTheDocument();
        });
      });

      it('should detect card type correctly', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const cardInput = screen.getByLabelText(/card number/i);

        // Visa
        await user.type(cardInput, '4111');
        expect(screen.getByAltText('Visa')).toBeInTheDocument();

        // Mastercard
        await user.clear(cardInput);
        await user.type(cardInput, '5500');
        expect(screen.getByAltText('Mastercard')).toBeInTheDocument();

        // Amex
        await user.clear(cardInput);
        await user.type(cardInput, '3782');
        expect(screen.getByAltText('Amex')).toBeInTheDocument();
      });

      it('should format expiry date correctly', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const expiryInput = screen.getByLabelText(/expiry date/i) as HTMLInputElement;

        await user.type(expiryInput, '1225');
        expect(expiryInput.value).toBe('12/25');
      });

      it('should limit CVV to appropriate length', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const cvvInput = screen.getByLabelText(/cvv/i) as HTMLInputElement;

        // Standard card - 3 digits
        await user.type(cvvInput, '1234');
        expect(cvvInput.value).toBe('123');

        // For Amex - 4 digits (when Amex card is entered)
        const cardInput = screen.getByLabelText(/card number/i);
        await user.clear(cardInput);
        await user.type(cardInput, '378282246310005'); // Amex test card

        await user.clear(cvvInput);
        await user.type(cvvInput, '12345');
        expect(cvvInput.value).toBe('1234');
      });

      it('should handle save card checkbox', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const saveCardCheckbox = screen.getByLabelText(/save card/i);

        expect(saveCardCheckbox).not.toBeChecked();
        await user.click(saveCardCheckbox);
        expect(saveCardCheckbox).toBeChecked();
      });
    });

    describe('UPI Payment', () => {
      it('should display UPI form when tab is selected', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        const upiTab = screen.getByRole('tab', { name: /upi/i });
        await user.click(upiTab);

        expect(screen.getByLabelText(/upi id/i)).toBeInTheDocument();
        expect(screen.getByText(/scan qr code/i)).toBeInTheDocument();
      });

      it('should validate UPI ID format', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /upi/i }));
        const upiInput = screen.getByLabelText(/upi id/i);

        // Invalid UPI ID
        await user.type(upiInput, 'invalidupi');
        await user.tab();

        await waitFor(() => {
          expect(screen.getByText(/invalid upi id format/i)).toBeInTheDocument();
        });

        // Valid UPI ID
        await user.clear(upiInput);
        await user.type(upiInput, 'user@paytm');
        await user.tab();

        await waitFor(() => {
          expect(screen.queryByText(/invalid upi id format/i)).not.toBeInTheDocument();
        });
      });

      it('should show QR code option', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /upi/i }));
        const qrButton = screen.getByText(/show qr code/i);

        await user.click(qrButton);
        expect(screen.getByAltText(/upi qr code/i)).toBeInTheDocument();
      });
    });

    describe('Netbanking', () => {
      it('should display bank selection when tab is selected', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /netbanking/i }));

        // Popular banks should be visible
        expect(screen.getByText('HDFC Bank')).toBeInTheDocument();
        expect(screen.getByText('ICICI Bank')).toBeInTheDocument();
        expect(screen.getByText('SBI')).toBeInTheDocument();
        expect(screen.getByText('Axis Bank')).toBeInTheDocument();
        expect(screen.getByText('Kotak Bank')).toBeInTheDocument();

        // All banks dropdown should be present
        expect(screen.getByLabelText(/select bank/i)).toBeInTheDocument();
      });

      it('should handle bank selection', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /netbanking/i }));

        // Select popular bank
        const hdfcButton = screen.getByText('HDFC Bank');
        await user.click(hdfcButton);

        expect(hdfcButton.parentElement).toHaveClass('border-[rgb(167,218,219)]');
      });
    });

    describe('Wallet Payment', () => {
      it('should display wallet options when tab is selected', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /wallets/i }));

        expect(screen.getByText('Paytm')).toBeInTheDocument();
        expect(screen.getByText('PhonePe')).toBeInTheDocument();
        expect(screen.getByText('Amazon Pay')).toBeInTheDocument();
        expect(screen.getByText('MobiKwik')).toBeInTheDocument();
      });

      it('should handle wallet selection', async () => {
        const user = userEvent.setup();
        render(<CustomCheckoutModal {...defaultProps} />);

        await user.click(screen.getByRole('tab', { name: /wallets/i }));

        const paytmButton = screen.getByText('Paytm').closest('button');
        await user.click(paytmButton!);

        expect(paytmButton).toHaveClass('border-[rgb(79,70,229)]');
      });
    });
  });

  describe('Form Submission', () => {
    it('should submit card payment with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onSubmit={onSubmit} />);

      // Fill card form
      await user.type(screen.getByLabelText(/card number/i), '4111111111111111');
      await user.type(screen.getByLabelText(/expiry date/i), '1225');
      await user.type(screen.getByLabelText(/cvv/i), '123');
      await user.type(screen.getByLabelText(/name on card/i), 'John Doe');

      // Submit
      const submitButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'card',
            cardNumber: '4111111111111111',
            expiryDate: '12/25',
            cvv: '123',
            nameOnCard: 'John Doe',
            saveCard: false,
          })
        );
      });
    });

    it('should submit UPI payment with valid data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onSubmit={onSubmit} />);

      await user.click(screen.getByRole('tab', { name: /upi/i }));
      await user.type(screen.getByLabelText(/upi id/i), 'user@paytm');

      const submitButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'upi',
            upiId: 'user@paytm',
          })
        );
      });
    });

    it('should not submit with invalid data', async () => {
      const user = userEvent.setup();
      const onSubmit = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onSubmit={onSubmit} />);

      // Try to submit without filling form
      const submitButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(onSubmit).not.toHaveBeenCalled();
        expect(screen.getByText(/card number is required/i)).toBeInTheDocument();
      });
    });
  });

  describe('Payment States', () => {
    it('should show processing state', () => {
      render(<CustomCheckoutModal {...defaultProps} paymentStatus="processing" />);

      expect(screen.getByText(/processing payment/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /processing/i })).toBeDisabled();
    });

    it('should show success state', () => {
      render(<CustomCheckoutModal {...defaultProps} paymentStatus="success" />);

      expect(screen.getByText(/payment successful/i)).toBeInTheDocument();
      expect(screen.getByTestId('success-icon')).toBeInTheDocument();
    });

    it('should show error state', () => {
      render(<CustomCheckoutModal {...defaultProps} paymentStatus="error" />);

      expect(screen.getByText(/payment failed/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /retry payment/i })).toBeInTheDocument();
    });
  });

  describe('Modal Interactions', () => {
    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onClose={onClose} />);

      const closeButton = screen.getByLabelText(/close/i);
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalled();
    });

    it('should close modal when backdrop is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onClose={onClose} />);

      const backdrop = screen.getByTestId('modal-backdrop');
      await user.click(backdrop);

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when modal content is clicked', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onClose={onClose} />);

      const modalContent = screen.getByTestId('modal-content');
      await user.click(modalContent);

      expect(onClose).not.toHaveBeenCalled();
    });

    it('should close modal on Escape key press', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(<CustomCheckoutModal {...defaultProps} onClose={onClose} />);

      await user.keyboard('{Escape}');

      expect(onClose).toHaveBeenCalled();
    });

    it('should not close modal when processing payment', async () => {
      const user = userEvent.setup();
      const onClose = vi.fn();
      render(
        <CustomCheckoutModal {...defaultProps} onClose={onClose} paymentStatus="processing" />
      );

      const closeButton = screen.getByLabelText(/close/i);
      expect(closeButton).toBeDisabled();

      await user.click(closeButton);
      expect(onClose).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby');
      expect(screen.getByRole('dialog')).toHaveAttribute('aria-describedby');
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<CustomCheckoutModal {...defaultProps} />);

      // Tab through payment method tabs
      await user.tab();
      expect(screen.getByRole('tab', { name: /card/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('tab', { name: /upi/i })).toHaveFocus();

      // Use arrow keys to navigate tabs
      await user.keyboard('{ArrowRight}');
      expect(screen.getByRole('tab', { name: /netbanking/i })).toHaveFocus();
    });

    it('should have proper form labels', () => {
      render(<CustomCheckoutModal {...defaultProps} />);

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
    });

    it('should announce errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<CustomCheckoutModal {...defaultProps} />);

      // Submit without filling form to trigger errors
      const submitButton = screen.getByRole('button', { name: /pay.*1,179/i });
      await user.click(submitButton);

      await waitFor(() => {
        const errorMessage = screen.getByText(/card number is required/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });

  describe('Responsive Design', () => {
    it('should render properly on mobile', () => {
      // Mock window.matchMedia for mobile
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(max-width: 768px)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<CustomCheckoutModal {...defaultProps} />);

      const modal = screen.getByTestId('modal-content');
      expect(modal).toHaveClass('w-full', 'h-full');
    });

    it('should render properly on desktop', () => {
      // Mock window.matchMedia for desktop
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query === '(min-width: 1024px)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(<CustomCheckoutModal {...defaultProps} />);

      const modal = screen.getByTestId('modal-content');
      expect(modal).toHaveClass('max-w-4xl');
    });
  });
});
