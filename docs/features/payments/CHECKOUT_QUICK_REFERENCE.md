# Custom Checkout Quick Reference
**SmartSlate Polaris - Developer Cheat Sheet**

---

## 5-Minute Integration

```tsx
// 1. Import
import { CustomCheckoutModal } from '@/components/checkout';
import type { OrderDetails } from '@/types/checkout';

// 2. State
const [isOpen, setIsOpen] = useState(false);
const [order, setOrder] = useState<OrderDetails | null>(null);

// 3. Handler
const handleSubscribe = (tier, amount, cycle) => {
  setOrder({
    planName: `Polaris ${tier}`,
    tier, billingCycle: cycle,
    basePrice: amount,
    gst: Math.round(amount * 0.18),
    totalAmount: amount + Math.round(amount * 0.18),
    currency: 'INR',
  });
  setIsOpen(true);
};

// 4. Render
<CustomCheckoutModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  orderDetails={order!}
  onPaymentSuccess={handleSuccess}
  onPaymentError={handleError}
/>
```

---

## Brand Colors

```css
/* Primary */
--primary-accent: #A7DADB;        /* Cyan-Teal */
--secondary-accent: #4F46E5;      /* Indigo */

/* Background */
--background-dark: #020C1B;       /* Deep Space */
--background-paper: #0D1B2A;      /* Card BG */

/* Text */
--text-primary: #E0E0E0;          /* Main Text */
--text-secondary: #B0C5C6;        /* Support Text */

/* Semantic */
--success: #10B981;
--error: #EF4444;
```

---

## Component Imports

```tsx
// Main modal
import { CustomCheckoutModal } from '@/components/checkout';

// Individual forms (if needed separately)
import { CardPaymentForm } from '@/components/checkout/CardPaymentForm';
import { UPIPaymentForm } from '@/components/checkout/UPIPaymentForm';
import { NetbankingForm } from '@/components/checkout/NetbankingForm';
import { WalletSelector } from '@/components/checkout/WalletSelector';

// Supporting components
import { OrderSummary } from '@/components/checkout/OrderSummary';
import { PaymentMethodTabs } from '@/components/checkout/PaymentMethodTabs';
import { SecurityBadges } from '@/components/checkout/SecurityBadges';

// Types
import type {
  OrderDetails,
  PaymentMethod,
  RazorpaySuccessResponse,
  RazorpayErrorResponse,
} from '@/types/checkout';

// Utilities
import {
  loadRazorpayScript,
  createRazorpayOrder,
  verifyPaymentSignature,
} from '@/lib/utils/razorpayIntegration';
```

---

## Type Definitions

```typescript
// Order Details
interface OrderDetails {
  planName: string;           // "Polaris Navigator"
  tier: string;               // "Navigator"
  billingCycle: 'monthly' | 'yearly';
  basePrice: number;          // 999
  gst: number;                // 180 (18%)
  totalAmount: number;        // 1179
  currency: 'INR';
}

// Success Response
interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

// Error Response
interface RazorpayErrorResponse {
  code: string;
  description: string;
  source: string;
  step: string;
  reason: string;
  metadata: {
    order_id: string;
    payment_id: string;
  };
}
```

---

## API Endpoints

### Create Order
```typescript
// POST /api/payment/create-order
{
  amount: 1179,      // Total amount in rupees
  currency: 'INR'
}
// Returns: { order_id, amount }
```

### Verify Payment
```typescript
// POST /api/payment/verify
{
  razorpay_payment_id: 'pay_xxxxx',
  razorpay_order_id: 'order_xxxxx',
  razorpay_signature: 'signature_xxxxx'
}
// Returns: { verified: true/false }
```

### Activate Subscription
```typescript
// POST /api/subscription/activate
{
  userId: 'user-uuid',
  tier: 'navigator',
  billingCycle: 'monthly',
  paymentId: 'pay_xxxxx',
  orderId: 'order_xxxxx',
  amount: 1179
}
// Returns: { success: true/false }
```

---

## Environment Variables

```bash
# .env.local
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxx
NEXT_PUBLIC_PAYMENT_TEST_MODE=true
```

---

## Test Credentials

### Cards
```
Success: 4111 1111 1111 1111
Decline: 4000 0000 0000 0002
Insufficient: 4000 0000 0000 9995
CVV: Any 3 digits
Expiry: Any future MM/YY
```

### UPI
```
Success: success@razorpay
Failure: failure@razorpay
```

---

## Common Patterns

### Calculate GST
```typescript
const basePrice = 999;
const gst = Math.round(basePrice * 0.18);
const total = basePrice + gst;
```

### Format Currency
```typescript
const formatted = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 0,
}).format(amount);
// Output: "₹1,179"
```

### Load Razorpay SDK
```typescript
const loaded = await loadRazorpayScript();
if (!loaded) {
  alert('Payment gateway unavailable');
  return;
}
```

### Create Order
```typescript
const order = await createRazorpayOrder(totalAmount, 'INR');
console.log(order.order_id); // Use in payment
```

### Verify Signature
```typescript
const verification = await verifyPaymentSignature(response);
if (verification.verified) {
  // Activate subscription
}
```

---

## Keyboard Shortcuts

- `Tab` - Navigate fields
- `Enter` - Submit form / Select option
- `Escape` - Close modal
- `Arrow Keys` - Navigate tabs

---

## Accessibility Classes

```tsx
// Focus ring
className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-accent/50"

// Touch target
className="min-h-[44px] min-w-[44px]"

// ARIA labels
aria-label="Close checkout"
aria-invalid={errors.field ? 'true' : 'false'}
aria-describedby="field-error"

// Roles
role="dialog"
role="tablist"
role="tab"
role="tabpanel"
```

---

## Responsive Breakpoints

```tsx
// Mobile first approach
className="
  grid-cols-1           // Mobile
  md:grid-cols-2        // Tablet (768px+)
  lg:grid-cols-3        // Desktop (1024px+)
"

// Spacing
className="
  gap-4                 // Mobile
  md:gap-6              // Tablet+
  lg:gap-8              // Desktop+
"

// Padding
className="
  p-4                   // Mobile
  md:p-6                // Tablet+
  lg:p-8                // Desktop+
"
```

---

## Common Error Messages

```typescript
const errorMessages = {
  PAYMENT_DECLINED: 'Payment declined. Try another card.',
  INSUFFICIENT_FUNDS: 'Insufficient funds. Use different method.',
  NETWORK_ERROR: 'Network error. Check connection.',
  GATEWAY_ERROR: 'Payment gateway error. Try again later.',
  BAD_REQUEST_ERROR: 'Invalid details. Please check.',
  DEFAULT: 'Payment failed. Contact support.',
};
```

---

## Success Flow

```
1. User clicks Subscribe
2. Modal opens with order summary
3. User selects payment method
4. User fills form (validated)
5. User clicks Pay button
6. Payment processing (loading state)
7. Success response
8. Verify signature
9. Activate subscription
10. Show success message
11. Close modal (2s delay)
12. Redirect to dashboard
```

---

## File Structure

```
frontend/
├── components/checkout/
│   ├── CustomCheckoutModal.tsx      (Main)
│   ├── PaymentMethodTabs.tsx        (Tabs)
│   ├── CardPaymentForm.tsx          (Card)
│   ├── UPIPaymentForm.tsx           (UPI)
│   ├── NetbankingForm.tsx           (Banks)
│   ├── WalletSelector.tsx           (Wallets)
│   ├── OrderSummary.tsx             (Summary)
│   ├── SecurityBadges.tsx           (Trust)
│   ├── checkout.css                 (Styles)
│   ├── index.ts                     (Barrel)
│   └── README.md                    (Docs)
│
├── types/checkout.ts                (Types)
├── lib/validation/checkoutSchemas.ts (Zod)
└── lib/utils/razorpayIntegration.ts (API)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Modal doesn't open | Check `isOpen` prop is `true` |
| Form not validating | Verify Zod schemas imported |
| Payment not processing | Check Razorpay SDK loaded |
| Signature verification fails | Check `RAZORPAY_KEY_SECRET` |
| Styling broken | Ensure Tailwind compiled |
| TypeScript errors | Run `npm run typecheck` |

---

## Performance Tips

```typescript
// Lazy load SDK
const loaded = await loadRazorpayScript();

// Debounce validation
const debouncedValidate = debounce(validate, 300);

// Memoize expensive components
const MemoizedForm = React.memo(CardPaymentForm);

// Code split
const CheckoutModal = dynamic(() =>
  import('@/components/checkout')
);
```

---

## Demo Page

Visit `/checkout-demo` for interactive testing:
- Multiple plan examples
- All payment methods
- Success/error simulation
- Feature showcase

---

## Support Resources

1. **README**: `/components/checkout/README.md`
2. **Integration Guide**: `/CHECKOUT_INTEGRATION.md`
3. **Architecture**: `/CHECKOUT_ARCHITECTURE.md`
4. **Summary**: `/CHECKOUT_SUMMARY.md`
5. **Demo**: `/app/(auth)/checkout-demo/page.tsx`

---

**Keep this reference handy during integration!** 📌
