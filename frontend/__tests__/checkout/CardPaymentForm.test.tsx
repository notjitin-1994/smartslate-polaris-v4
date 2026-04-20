import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CardPaymentForm } from '@/components/checkout/CardPaymentForm';
import { checkoutSchema } from '@/lib/validation/checkoutSchemas';
import type { CheckoutFormData } from '@/types/checkout';

// Wrapper component to provide form context
function FormWrapper({ children }: { children: React.ReactNode }) {
  const methods = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'card',
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      nameOnCard: '',
      saveCard: false,
    },
  });

  return <FormProvider {...methods}>{children}</FormProvider>;
}

describe('CardPaymentForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render all form fields', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name on card/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/save this card/i)).toBeInTheDocument();
    });

    it('should show accepted card types', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      expect(screen.getByAltText('Visa')).toBeInTheDocument();
      expect(screen.getByAltText('Mastercard')).toBeInTheDocument();
      expect(screen.getByAltText('Amex')).toBeInTheDocument();
      expect(screen.getByAltText('RuPay')).toBeInTheDocument();
    });

    it('should have proper input attributes', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      expect(cardInput).toHaveAttribute('inputMode', 'numeric');
      expect(cardInput).toHaveAttribute('autoComplete', 'cc-number');

      const expiryInput = screen.getByLabelText(/expiry date/i);
      expect(expiryInput).toHaveAttribute('placeholder', 'MM/YY');
      expect(expiryInput).toHaveAttribute('autoComplete', 'cc-exp');

      const cvvInput = screen.getByLabelText(/cvv/i);
      expect(cvvInput).toHaveAttribute('inputMode', 'numeric');
      expect(cvvInput).toHaveAttribute('autoComplete', 'cc-csc');

      const nameInput = screen.getByLabelText(/name on card/i);
      expect(nameInput).toHaveAttribute('autoComplete', 'cc-name');
    });
  });

  describe('Card Number Validation', () => {
    it('should format card number with spaces', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i) as HTMLInputElement;
      await user.type(cardInput, '4111111111111111');

      expect(cardInput.value).toBe('4111 1111 1111 1111');
    });

    it('should detect Visa cards', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '4111');

      const visaIcon = screen.getByAltText('Visa');
      expect(visaIcon.parentElement).toHaveClass('opacity-100');
    });

    it('should detect Mastercard cards', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '5500');

      const mastercardIcon = screen.getByAltText('Mastercard');
      expect(mastercardIcon.parentElement).toHaveClass('opacity-100');
    });

    it('should detect Amex cards', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '3782');

      const amexIcon = screen.getByAltText('Amex');
      expect(amexIcon.parentElement).toHaveClass('opacity-100');
    });

    it('should detect RuPay cards', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '6071');

      const rupayIcon = screen.getByAltText('RuPay');
      expect(rupayIcon.parentElement).toHaveClass('opacity-100');
    });

    it('should validate card number length', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i) as HTMLInputElement;

      // Standard card - 16 digits max
      await user.type(cardInput, '41111111111111112222');
      expect(cardInput.value).toBe('4111 1111 1111 1111'); // Should be limited to 16 digits

      // Amex - 15 digits
      await user.clear(cardInput);
      await user.type(cardInput, '378282246310005999');
      expect(cardInput.value).toBe('3782 822463 10005'); // Should be limited to 15 digits for Amex
    });

    it('should show error for invalid card number', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);

      // Invalid card number (fails Luhn check)
      await user.type(cardInput, '4111111111111112');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid card number/i)).toBeInTheDocument();
      });
    });

    it('should accept valid card number', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);

      // Valid test card numbers
      const validCards = [
        '4111111111111111', // Visa
        '5500000000000004', // Mastercard
        '378282246310005', // Amex
        '6071263100002919', // RuPay
      ];

      for (const cardNumber of validCards) {
        await user.clear(cardInput);
        await user.type(cardInput, cardNumber);
        await user.tab();

        await waitFor(() => {
          expect(screen.queryByText(/invalid card number/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('Expiry Date Validation', () => {
    it('should format expiry date automatically', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const expiryInput = screen.getByLabelText(/expiry date/i) as HTMLInputElement;

      await user.type(expiryInput, '1225');
      expect(expiryInput.value).toBe('12/25');
    });

    it('should validate expiry date format', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const expiryInput = screen.getByLabelText(/expiry date/i);

      // Invalid month
      await user.type(expiryInput, '13/25');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid expiry date/i)).toBeInTheDocument();
      });

      // Valid expiry
      await user.clear(expiryInput);
      await user.type(expiryInput, '12/25');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/invalid expiry date/i)).not.toBeInTheDocument();
      });
    });

    it('should reject expired dates', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const expiryInput = screen.getByLabelText(/expiry date/i);

      // Expired date
      await user.type(expiryInput, '01/20');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/card has expired/i)).toBeInTheDocument();
      });
    });

    it('should limit input to 5 characters (MM/YY)', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const expiryInput = screen.getByLabelText(/expiry date/i) as HTMLInputElement;

      await user.type(expiryInput, '12/2599');
      expect(expiryInput.value).toBe('12/25');
    });
  });

  describe('CVV Validation', () => {
    it('should limit CVV to 3 digits for standard cards', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cvvInput = screen.getByLabelText(/cvv/i) as HTMLInputElement;

      await user.type(cvvInput, '1234');
      expect(cvvInput.value).toBe('123');
    });

    it('should limit CVV to 4 digits for Amex', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      // First enter an Amex card
      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '378282246310005');

      const cvvInput = screen.getByLabelText(/cvv/i) as HTMLInputElement;
      await user.type(cvvInput, '12345');
      expect(cvvInput.value).toBe('1234');
    });

    it('should only accept numeric input', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cvvInput = screen.getByLabelText(/cvv/i) as HTMLInputElement;

      await user.type(cvvInput, 'abc123def');
      expect(cvvInput.value).toBe('123');
    });

    it('should validate CVV length', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cvvInput = screen.getByLabelText(/cvv/i);

      // Too short
      await user.type(cvvInput, '12');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/cvv must be 3 digits/i)).toBeInTheDocument();
      });

      // Valid
      await user.type(cvvInput, '3');
      await user.tab();

      await waitFor(() => {
        expect(screen.queryByText(/cvv must be 3 digits/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Name on Card Validation', () => {
    it('should accept valid names', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const nameInput = screen.getByLabelText(/name on card/i);

      const validNames = ['John Doe', 'Mary Jane Smith', "O'Brien", 'Jean-Pierre', 'Dr. Smith Jr.'];

      for (const name of validNames) {
        await user.clear(nameInput);
        await user.type(nameInput, name);
        await user.tab();

        await waitFor(() => {
          expect(screen.queryByText(/invalid name/i)).not.toBeInTheDocument();
        });
      }
    });

    it('should require name to be provided', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const nameInput = screen.getByLabelText(/name on card/i);
      await user.click(nameInput);
      await user.tab(); // Move away without entering

      await waitFor(() => {
        expect(screen.getByText(/name on card is required/i)).toBeInTheDocument();
      });
    });

    it('should validate minimum name length', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const nameInput = screen.getByLabelText(/name on card/i);

      await user.type(nameInput, 'J');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument();
      });
    });
  });

  describe('Save Card Checkbox', () => {
    it('should be unchecked by default', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const saveCardCheckbox = screen.getByLabelText(/save this card/i) as HTMLInputElement;
      expect(saveCardCheckbox.checked).toBe(false);
    });

    it('should toggle when clicked', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const saveCardCheckbox = screen.getByLabelText(/save this card/i) as HTMLInputElement;

      await user.click(saveCardCheckbox);
      expect(saveCardCheckbox.checked).toBe(true);

      await user.click(saveCardCheckbox);
      expect(saveCardCheckbox.checked).toBe(false);
    });

    it('should show secure save message', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      expect(screen.getByText(/card details are encrypted/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      expect(screen.getByLabelText(/card number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/cvv/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/name on card/i)).toBeInTheDocument();
    });

    it('should have proper error associations', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      await user.type(cardInput, '4111111111111112'); // Invalid
      await user.tab();

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid card number/i);
        expect(errorMessage).toBeInTheDocument();
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      // Tab through all inputs
      await user.tab();
      expect(screen.getByLabelText(/card number/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/expiry date/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/cvv/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/name on card/i)).toHaveFocus();

      await user.tab();
      expect(screen.getByLabelText(/save this card/i)).toHaveFocus();
    });
  });

  describe('Security Features', () => {
    it('should mask CVV input', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cvvInput = screen.getByLabelText(/cvv/i);
      expect(cvvInput).toHaveAttribute('type', 'password');
    });

    it('should show security tooltip for CVV', async () => {
      const user = userEvent.setup();
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cvvTooltip = screen.getByTestId('cvv-tooltip-trigger');
      await user.hover(cvvTooltip);

      await waitFor(() => {
        expect(screen.getByText(/3-digit security code/i)).toBeInTheDocument();
      });
    });

    it('should have autocomplete attributes for security', () => {
      render(
        <FormWrapper>
          <CardPaymentForm />
        </FormWrapper>
      );

      const cardInput = screen.getByLabelText(/card number/i);
      const cvvInput = screen.getByLabelText(/cvv/i);
      const nameInput = screen.getByLabelText(/name on card/i);

      expect(cardInput).toHaveAttribute('autoComplete', 'cc-number');
      expect(cvvInput).toHaveAttribute('autoComplete', 'cc-csc');
      expect(nameInput).toHaveAttribute('autoComplete', 'cc-name');
    });
  });
});
