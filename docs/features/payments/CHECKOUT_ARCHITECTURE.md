# Custom Checkout Architecture
**SmartSlate Polaris - System Design Overview**

---

## Component Hierarchy

```
CustomCheckoutModal (Main Container)
│
├── Header
│   ├── Logo
│   ├── Title (Plan + Billing Cycle)
│   ├── Description
│   └── Close Button (X)
│
├── Content (Grid Layout: 2/3 + 1/3)
│   │
│   ├── Left Column (Payment Form)
│   │   │
│   │   ├── PaymentMethodTabs
│   │   │   ├── Card Tab
│   │   │   ├── UPI Tab
│   │   │   ├── Netbanking Tab
│   │   │   └── Wallet Tab
│   │   │
│   │   └── Active Form (Tab Panel)
│   │       │
│   │       ├── CardPaymentForm
│   │       │   ├── Card Number (with type detection)
│   │       │   ├── Expiry Date (MM/YY)
│   │       │   ├── CVV
│   │       │   ├── Name on Card
│   │       │   └── Save Card Checkbox
│   │       │
│   │       ├── UPIPaymentForm
│   │       │   ├── UPI ID Input
│   │       │   ├── Verify Button
│   │       │   ├── QR Code Toggle
│   │       │   └── Quick Tips
│   │       │
│   │       ├── NetbankingForm
│   │       │   ├── Popular Banks Grid
│   │       │   ├── Other Banks Dropdown
│   │       │   └── Selected Bank Display
│   │       │
│   │       └── WalletSelector
│   │           ├── Wallet Grid (6 options)
│   │           ├── Balance Display
│   │           └── Wallet Offers
│   │
│   └── Right Column (Summary)
│       │
│       ├── OrderSummary
│       │   ├── Plan Details
│       │   ├── Base Price
│       │   ├── GST (18%)
│       │   ├── Total Amount
│       │   └── Billing Cycle Badge
│       │
│       └── Status Messages
│           ├── Success Alert
│           └── Error Alert
│
└── Footer
    ├── Pay Button (Primary CTA)
    └── SecurityBadges
        ├── PCI DSS
        ├── SSL
        ├── Secure Payment
        └── Powered by Razorpay
```

---

## Data Flow Architecture

```
User Action (Click Subscribe)
    │
    ▼
Pricing Page Handler
    │
    ├── Load Razorpay SDK
    ├── Calculate Pricing (Base + GST)
    ├── Create OrderDetails Object
    └── Open CustomCheckoutModal
        │
        ▼
    CustomCheckoutModal Opens
        │
        ├── Display OrderSummary
        ├── Render PaymentMethodTabs
        └── Show Default Payment Form (Card)
            │
            ▼
        User Selects Payment Method
            │
            ├── Card → CardPaymentForm
            ├── UPI → UPIPaymentForm
            ├── Netbanking → NetbankingForm
            └── Wallet → WalletSelector
                │
                ▼
            User Fills Form
                │
                ├── Real-time Validation (Zod)
                ├── Error Display (if invalid)
                └── Enable Pay Button (if valid)
                    │
                    ▼
                User Clicks Pay Button
                    │
                    ▼
                Payment Processing Flow
                    │
                    ├── Create Order (API: /api/payment/create-order)
                    │   ├── Server creates Razorpay order
                    │   └── Returns order_id
                    │
                    ├── Process Payment (Razorpay SDK)
                    │   ├── User completes payment
                    │   └── Returns payment response
                    │
                    ├── Verify Signature (API: /api/payment/verify)
                    │   ├── Server verifies signature
                    │   └── Returns verification status
                    │
                    └── Activate Subscription (API: /api/subscription/activate)
                        ├── Update user_profiles table
                        ├── Send confirmation email
                        └── Return success
                            │
                            ▼
                        Payment Success
                            │
                            ├── Show Success Message
                            ├── Close Modal (after 2s)
                            └── Redirect to Dashboard
```

---

## State Management

```
CustomCheckoutModal State
│
├── Modal State
│   ├── isOpen (boolean)
│   ├── selectedMethod (PaymentMethod)
│   └── currentOrder (OrderDetails | null)
│
├── Processing State
│   ├── isProcessing (boolean)
│   ├── paymentStatus ('idle' | 'processing' | 'success' | 'error')
│   └── errorMessage (string | null)
│
└── Form State (React Hook Form)
    ├── Card Form State
    │   ├── cardNumber
    │   ├── expiryMonth
    │   ├── expiryYear
    │   ├── cvv
    │   ├── nameOnCard
    │   └── saveCard
    │
    ├── UPI Form State
    │   ├── upiId
    │   └── verified
    │
    ├── Netbanking Form State
    │   ├── bankCode
    │   └── bankName
    │
    └── Wallet Form State
        └── provider
```

---

## API Integration Points

```
Frontend Components
    │
    ├── loadRazorpayScript()
    │   └── Loads Razorpay SDK from CDN
    │
    ├── createRazorpayOrder(amount, currency)
    │   └── POST /api/payment/create-order
    │       └── Returns: { order_id, amount }
    │
    ├── initiateRazorpayPayment(options)
    │   └── Opens Razorpay payment flow
    │       └── Returns: { razorpay_payment_id, razorpay_order_id, razorpay_signature }
    │
    ├── verifyPaymentSignature(response)
    │   └── POST /api/payment/verify
    │       └── Returns: { verified: boolean }
    │
    └── activateSubscription(userId, planId, paymentId)
        └── POST /api/subscription/activate
            └── Returns: { success: boolean }
```

---

## Validation Flow

```
User Input
    │
    ▼
Client-side Validation (Zod)
    │
    ├── Card Number
    │   ├── Format: 13-19 digits
    │   ├── Luhn Algorithm Check
    │   └── Card Type Detection
    │
    ├── Expiry Date
    │   ├── Format: MM/YY
    │   ├── Valid Month (01-12)
    │   └── Future Date Only
    │
    ├── CVV
    │   └── Format: 3-4 digits
    │
    ├── Name on Card
    │   ├── Letters & Spaces Only
    │   └── Min 3 characters
    │
    ├── UPI ID
    │   ├── Format: username@bank
    │   └── Max 50 characters
    │
    ├── Bank Selection
    │   └── Required selection
    │
    └── Wallet Selection
        └── Required selection
            │
            ▼
        Validation Result
            │
            ├── Valid → Enable Submit
            └── Invalid → Show Errors
                │
                └── Inline error messages
                    with icons and colors
```

---

## Responsive Breakpoints

```
Mobile (320px - 767px)
├── Single column layout
├── Full-screen modal
├── Stacked form fields
├── Larger touch targets (48px)
├── Simplified navigation
└── Sticky footer

Tablet (768px - 1023px)
├── Two column layout (form + summary)
├── Modal with padding
├── Side-by-side form fields
├── Standard touch targets (44px)
└── Normal navigation

Desktop (1024px+)
├── Two column layout (2/3 + 1/3)
├── Max-width modal (1024px)
├── Multi-column grids
├── Hover effects enabled
└── Keyboard shortcuts
```

---

## Accessibility Tree

```
dialog (role="dialog")
│
├── heading (level 2) "Polaris Navigator: Monthly"
│   └── describedby: "Plan description"
│
├── tablist (role="tablist")
│   ├── tab (role="tab", aria-selected="true") "Card"
│   ├── tab (role="tab", aria-selected="false") "UPI"
│   ├── tab (role="tab", aria-selected="false") "Netbanking"
│   └── tab (role="tab", aria-selected="false") "Wallets"
│
├── tabpanel (role="tabpanel")
│   └── form
│       ├── group "Card Details"
│       │   ├── input (aria-label="Card number")
│       │   │   └── describedby: "error message"
│       │   ├── input (aria-label="Expiry month")
│       │   ├── input (aria-label="Expiry year")
│       │   ├── input (aria-label="CVV")
│       │   └── input (aria-label="Name on card")
│       │
│       └── checkbox (aria-label="Save card")
│
├── region (role="region", aria-label="Order Summary")
│   ├── heading (level 3) "Order Details"
│   └── list (price breakdown)
│
└── button (primary action) "Pay ₹1,179"
    └── describedby: "Security information"
```

---

## Security Architecture

```
Client-side (Frontend)
├── Input Validation (UX only)
├── No sensitive data storage
├── SSL/HTTPS required
└── CSP compliant

Server-side (API)
├── Order Creation
│   ├── Validate amount
│   ├── Verify user authentication
│   └── Create Razorpay order
│
├── Signature Verification
│   ├── Compute expected signature
│   ├── Compare with received
│   └── Prevent replay attacks
│
└── Subscription Activation
    ├── Verify payment completed
    ├── Update database atomically
    └── Send confirmation email

Razorpay (Payment Gateway)
├── PCI DSS Level 1 Compliant
├── 3D Secure Support
├── Tokenization
└── Fraud Detection
```

---

## Error Handling Flow

```
User Action
    │
    ▼
Try Payment Processing
    │
    ├─ Success Path
    │   ├── Display success message
    │   ├── Update UI optimistically
    │   ├── Close modal (2s delay)
    │   └── Redirect to dashboard
    │
    └─ Error Path
        │
        ├── Network Error
        │   ├── Show retry option
        │   └── Message: "Check connection"
        │
        ├── Validation Error
        │   ├── Highlight invalid fields
        │   └── Show inline errors
        │
        ├── Payment Declined
        │   ├── Show error message
        │   └── Suggest alternative method
        │
        ├── Insufficient Funds
        │   ├── Show error message
        │   └── Suggest different card
        │
        └── Server Error
            ├── Log to monitoring
            ├── Show generic error
            └── Provide support contact
```

---

## Performance Optimization

```
Initial Load
├── Lazy load Razorpay SDK
├── Code split payment forms
└── Preload critical fonts

Runtime
├── Debounce form validation (300ms)
├── Memoize expensive computations
├── Optimize re-renders with React.memo
└── Use CSS animations (GPU)

Bundle
├── Tree-shake unused code
├── Minify production build
├── Compress with Brotli
└── Total size: ~45KB gzipped
```

---

## Testing Strategy

```
Unit Tests
├── Validation schemas
│   ├── Card number Luhn check
│   ├── UPI ID format
│   └── Date validation
│
├── Utility functions
│   ├── detectCardType()
│   ├── formatCardNumber()
│   └── formatCurrency()
│
└── Component logic
    ├── Form submission
    ├── Error handling
    └── State transitions

Integration Tests
├── Full checkout flow
│   ├── Open modal
│   ├── Select payment method
│   ├── Fill form
│   ├── Submit payment
│   └── Verify success
│
├── API endpoints
│   ├── Create order
│   ├── Verify signature
│   └── Activate subscription
│
└── Database operations
    └── Update user profile

E2E Tests
├── User journey
│   ├── Browse pricing
│   ├── Select plan
│   ├── Complete payment
│   └── Access premium features
│
└── Error scenarios
    ├── Failed payment
    ├── Network error
    └── Invalid inputs

Manual Tests
├── Accessibility audit
├── Cross-browser testing
├── Mobile responsiveness
└── Screen reader compatibility
```

---

## Deployment Pipeline

```
Development
├── Local testing
├── Unit tests pass
├── Lint checks pass
└── TypeScript compiles

Staging
├── Integration tests pass
├── Manual QA testing
├── Accessibility audit
├── Performance testing
└── Security review

Production
├── Smoke tests
├── Monitoring setup
├── Error tracking active
├── Analytics configured
└── Rollback plan ready
```

---

## Monitoring & Analytics

```
User Actions Tracked
├── Modal opened
├── Payment method selected
├── Form submission attempted
├── Payment successful
├── Payment failed
└── Modal closed

Error Events
├── Validation errors
├── API failures
├── Network errors
├── Payment declines
└── Unexpected exceptions

Performance Metrics
├── Time to interactive
├── Modal render time
├── API response times
├── Success rate
└── Conversion rate

Business Metrics
├── Revenue by plan
├── Popular payment methods
├── Conversion funnel
├── Drop-off points
└── Error frequency
```

---

This architecture provides a comprehensive, scalable, and maintainable checkout system for SmartSlate Polaris.
