# Razorpay Testing Guide

## ⚠️ IMPORTANT: Always Use Test Mode for Development

**Before testing, ensure your `.env.local` uses TEST mode keys:**

- Key ID should start with: `rzp_test_` (NOT `rzp_live_`)
- Test mode keys process **fake payments** and don't charge real money
- Live mode keys will process **REAL payments** and charge actual money!

## Setting Up Test Mode for Safe Testing

### 1. Get Test Credentials from Razorpay

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Toggle to **Test Mode** (switch at the top of dashboard)
3. Go to **Settings → API Keys**
4. Generate new test API keys (they start with `rzp_test_`)
5. Copy both the Key ID and Key Secret

### 2. Update Environment Variables

Replace the LIVE keys in `.env.local` with TEST keys:

```bash
# Razorpay TEST MODE Configuration (for development/testing)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# Optional: Test webhook secret (configure in test mode dashboard)
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_TEST_WEBHOOK_SECRET
```

### 3. Test Card Details

Use these test card numbers in the custom checkout:

#### Successful Payment Cards

- **Visa**: `4111 1111 1111 1111`
- **Mastercard**: `5555 5555 5555 4444`
- **Mastercard (2-series)**: `2223 0000 4841 0010`

#### Card Details for All Test Cards

- **CVV**: Any 3 digits (e.g., `123`)
- **Expiry**: Any future date (e.g., `12/25`)
- **Name**: Any name
- **OTP**: `123456` (if required)

#### Failure Test Cards

- **Card Declined**: `4000 0000 0000 0002`
- **Insufficient Balance**: `4000 0000 0000 0341`
- **Network Error**: `4000 0000 0000 0036`

### 4. Test UPI IDs

For UPI testing in test mode:

- **Success**: `success@razorpay`
- **Failure**: `failure@razorpay`

### 5. Test Netbanking

Select any bank and use:

- **Username**: `razorpay`
- **Password**: `razorpay`

### 6. Test Wallets

All wallets work with:

- **Phone**: Any 10-digit number
- **OTP**: `123456`

## Production Readiness Checklist

Before going live with REAL payments:

### ✅ Configuration

- [ ] Switch back to LIVE keys in production environment
- [ ] Configure webhook endpoint and secret
- [ ] Set up webhook URL in Razorpay Dashboard: `https://yourdomain.com/api/webhooks/razorpay`
- [ ] Enable webhook events: payment.captured, payment.failed, refund.processed

### ✅ Testing Completed

- [ ] Card payments (all supported card types)
- [ ] UPI payments
- [ ] Netbanking
- [ ] Wallet payments
- [ ] Payment failure scenarios
- [ ] Refund process
- [ ] Webhook handling

### ✅ Error Handling

- [ ] Network timeout handling
- [ ] Payment failure recovery
- [ ] Duplicate payment prevention
- [ ] Session expiry handling

### ✅ Security

- [ ] PCI DSS compliance (no card data stored)
- [ ] HTTPS enabled on production
- [ ] Webhook signature verification
- [ ] Rate limiting on payment endpoints
- [ ] CSRF protection

### ✅ Database

- [ ] Payment tracking table ready
- [ ] Subscription status updates
- [ ] Audit logging enabled
- [ ] Backup strategy in place

### ✅ User Experience

- [ ] Clear error messages
- [ ] Loading states
- [ ] Success confirmations
- [ ] Email receipts configured
- [ ] Invoice generation

## Current Implementation Status

### ✅ Completed

- Custom checkout modal with brand styling
- Razorpay SDK integration service
- Payment processing for all methods (Card, UPI, Netbanking, Wallets)
- Order creation and verification endpoints
- Subscription activation flow
- Error handling components
- Configuration validation

### 🔄 Pending

- Webhook endpoint implementation (`/api/webhooks/razorpay`)
- Email receipt service integration
- Invoice generation
- Refund processing UI
- Admin payment dashboard

## Testing Your Integration

1. **Start Development Server**

   ```bash
   cd frontend
   npm run dev
   ```

2. **Navigate to Pricing Page**
   - Open: http://localhost:3002/pricing
   - Select any plan
   - Click "Upgrade Now"

3. **Test Payment Flow**
   - Use test card: `4111 1111 1111 1111`
   - CVV: `123`
   - Expiry: `12/25`
   - Complete payment

4. **Verify Success**
   - Check console for payment logs
   - Verify database updates
   - Confirm redirect to dashboard

## Troubleshooting

### Common Issues

1. **"Razorpay not defined" error**
   - Ensure Razorpay SDK loads properly
   - Check network tab for script loading
   - Verify NEXT_PUBLIC_RAZORPAY_KEY_ID is set

2. **Payment fails immediately**
   - Check if using test keys in test mode
   - Verify API secret on server side
   - Check server logs for detailed errors

3. **Webhook not received**
   - Ensure webhook URL is publicly accessible
   - Check webhook secret matches
   - Verify webhook events are enabled in dashboard

## Support

- [Razorpay Documentation](https://razorpay.com/docs/)
- [Test Card Reference](https://razorpay.com/docs/payments/payments/test-card-details/)
- [Webhook Integration](https://razorpay.com/docs/webhooks/)
