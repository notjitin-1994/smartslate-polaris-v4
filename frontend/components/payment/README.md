# Custom Razorpay Payment Modal

A premium, branded payment modal for Smartslate Polaris that provides a seamless and secure payment experience with modern design elements.

## Features

- **🎨 Smartslate Brand Integration**: Perfectly matches the Polaris design system
- **🔐 Security & Trust**: PCI DSS compliant, 256-bit SSL encryption indicators
- **📱 Mobile-Responsive**: Optimized for all devices with touch-friendly interactions
- **✨ Modern Animations**: Smooth transitions and micro-interactions
- **🔧 Easy Integration**: Simple hooks and utilities for existing payment flows
- **♿ Accessibility**: WCAG AA compliant with keyboard navigation and screen reader support
- **🎭 Glass Morphism**: Premium visual effects with backdrop blur and transparency

## Quick Start

### 1. Basic Usage

```tsx
import { useCustomRazorpayModal } from '@/lib/hooks/useCustomRazorpayModal';

function PaymentExample() {
  const { openModal, ModalComponent } = useCustomRazorpayModal();

  const handlePayment = () => {
    openModal({
      subscriptionId: 'sub_12345',
      plan: {
        name: 'Navigator',
        description: 'Advanced AI-powered learning',
        price: 29,
        billingCycle: 'monthly',
        features: [
          'Unlimited blueprint generation',
          'Priority AI processing',
          'Advanced export options',
          'Email support',
        ],
      },
      customer: {
        name: 'John Doe',
        email: 'john@example.com',
        contact: '+1234567890',
      },
      onSuccess: (response) => {
        console.log('Payment successful:', response);
        // Handle success (redirect, show success message, etc.)
      },
      onFailure: (error) => {
        console.error('Payment failed:', error);
        // Handle failure
      },
    });
  };

  return (
    <>
      <button onClick={handlePayment}>Upgrade Plan</button>
      {ModalComponent}
    </>
  );
}
```

### 2. Enhanced Pricing Card

```tsx
import EnhancedPricingCard from '@/components/pricing/EnhancedPricingCard';

function PricingPage() {
  const plans = [
    {
      id: 'navigator',
      name: 'Navigator',
      tagline: 'Perfect for serious learners',
      price: 29,
      features: ['25 blueprints per month', 'AI-powered generation', 'PDF export', 'Email support'],
      popular: true,
      limits: {
        blueprints: 25,
        exports: 25,
        support: 'Email (24h response)',
      },
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
      {plans.map((plan, index) => (
        <EnhancedPricingCard
          key={plan.id}
          plan={plan}
          billing="monthly"
          delay={index * 0.1}
          user={{
            name: 'John Doe',
            email: 'john@example.com',
          }}
          onPaymentSuccess={(response) => {
            // Handle successful payment
            console.log('Payment successful:', response);
          }}
          onPaymentFailure={(error) => {
            // Handle payment failure
            console.error('Payment failed:', error);
          }}
        />
      ))}
    </div>
  );
}
```

## Configuration Options

### CustomModalOptions

```typescript
interface CustomModalOptions {
  // Payment details
  subscriptionId?: string; // For recurring payments
  orderId?: string; // For one-time payments
  amount?: number; // Amount in paise
  plan?: {
    name: string;
    description?: string;
    price: number;
    currency?: string;
    billingCycle?: 'monthly' | 'annual';
    features?: string[];
  };

  // Customer information
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };

  // Callbacks
  onSuccess?: (response: RazorpaySuccessResponse) => void;
  onFailure?: (error: RazorpayFailureResponse | Error) => void;

  // Customization
  theme?: {
    primary?: string;
    secondary?: string;
  };
  showTrustIndicators?: boolean;
  successMessage?: string;
  errorMessage?: string;
}
```

## Utility Functions

### createSubscriptionModalOptions

```tsx
import { createSubscriptionModalOptions } from '@/lib/hooks/useCustomRazorpayModal';

const options = createSubscriptionModalOptions(
  'sub_12345',
  {
    name: 'Navigator',
    description: 'Advanced AI features',
    price: 29,
    billingCycle: 'monthly',
    features: ['Unlimited blueprints', 'Priority support'],
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
  }
);
```

### createPaymentModalOptions

```tsx
import { createPaymentModalOptions } from '@/lib/hooks/useCustomRazorpayModal';

const options = createPaymentModalOptions(
  2900, // $29 in paise
  'order_12345',
  {
    name: 'One-time Purchase',
    description: 'Premium features bundle',
  }
);
```

## Integration with Existing Flow

### Replacing Default Razorpay Modal

1. **Import the custom modal:**

```tsx
import CustomRazorpayModal from '@/components/payment/CustomRazorpayModal';
```

2. **Update your payment handler:**

```tsx
// Before (default Razorpay)
const { openCheckout } = useRazorpayCheckout();

// After (custom modal)
const { openModal } = useCustomRazorpayModal();
```

3. **Update payment options:**

```tsx
// The modal accepts the same options as the default Razorpay checkout
// but with enhanced customization options
```

## Design System Integration

### Brand Colors

The modal automatically uses Smartslate's brand colors:

- **Primary**: `var(--primary-accent, #a7dadb)`
- **Secondary**: `var(--secondary-accent, #4f46e5)`
- **Background**: `var(--background-dark, #020c1b)`
- **Text**: `var(--text-primary, #e0e0e0)`

### Glass Morphism Effects

The modal uses the existing glass panel system:

```css
.glass-card {
  background:
    linear-gradient(rgba(13, 27, 42, 0.55), rgba(13, 27, 42, 0.55)) padding-box,
    linear-gradient(135deg, rgba(255, 255, 255, 0.22), rgba(255, 255, 255, 0.06)) border-box;
  backdrop-filter: blur(18px);
  /* ... */
}
```

## Accessibility Features

- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and Escape keys
- **Screen Reader**: Proper ARIA labels and announcements
- **Focus Management**: Automatic focus trapping and restoration
- **High Contrast**: WCAG AA compliant contrast ratios
- **Reduced Motion**: Respects user's motion preferences

## Mobile Optimization

- **Touch Targets**: Minimum 44x44px touch targets
- **Performance**: Reduced animations on mobile devices
- **iOS Optimizations**: Disabled backdrop filter on iOS for performance
- **Responsive Design**: Adapts to all screen sizes

## Security Features

- **PCI DSS Compliant**: All payment processing is secure
- **SSL Encryption**: 256-bit encryption for all data
- **No Data Storage**: Sensitive data is never stored on client
- **Razorpay Integration**: Leverages Razorpay's secure infrastructure

## Error Handling

The modal includes comprehensive error handling:

```tsx
const { openModal } = useCustomRazorpayModal();

openModal({
  // ... options
  onFailure: (error) => {
    // Handle different error types
    if (error.message.includes('network')) {
      // Show network error message
    } else if (error.message.includes('cancelled')) {
      // Handle user cancellation
    } else {
      // Show generic error message
    }
  },
});
```

## Testing

### Unit Tests

```tsx
import { renderHook, act } from '@testing-library/react';
import { useCustomRazorpayModal } from '@/lib/hooks/useCustomRazorpayModal';

test('should open modal with options', () => {
  const { result } = renderHook(() => useCustomRazorpayModal());

  act(() => {
    result.current.openModal({
      plan: { name: 'Test', price: 29 },
    });
  });

  expect(result.current.isModalOpen).toBe(true);
  expect(result.current.currentOptions?.plan?.name).toBe('Test');
});
```

### Integration Tests

The modal integrates seamlessly with existing Razorpay test utilities.

## Performance Considerations

- **Lazy Loading**: Modal only renders when opened
- **Optimized Animations**: Hardware-accelerated CSS transforms
- **Memory Management**: Proper cleanup on unmount
- **Bundle Size**: Tree-shakable components

## Troubleshooting

### Common Issues

1. **Modal not opening:**
   - Ensure Razorpay script is loaded
   - Check environment variables
   - Verify subscription/order IDs

2. **Payment failing:**
   - Check Razorpay configuration
   - Verify plan details
   - Check network connectivity

3. **Styling issues:**
   - Ensure CSS variables are defined
   - Check Tailwind CSS configuration
   - Verify theme integration

### Debug Mode

Enable debug logging:

```tsx
// In development, the modal logs detailed information
console.log('[CustomRazorpayModal] Payment processing started');
```

## Future Enhancements

- **Multi-language Support**: Internationalization ready
- **Payment Method Selection**: Support for multiple payment methods
- **Saved Cards**: Card saving functionality
- **Analytics Integration**: Payment analytics tracking
- **A/B Testing**: Multiple modal variants

## Support

For issues and feature requests, please refer to the main project documentation.
