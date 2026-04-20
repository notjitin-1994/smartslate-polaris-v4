# Razorpay Payment Integration - Production Readiness Checklist

## ✅ Completed Items

### 1. **Modal Positioning Fixed**

- ✅ Modal now renders at viewport center using React Portal
- ✅ Escapes parent container constraints
- ✅ Proper z-index stacking (z-[9999])

### 2. **Pricing Corrected**

- ✅ Base amounts calculate to exact GST-inclusive totals:
  - Explorer: ₹1,599/month (₹1,355 base + 18% GST)
  - Navigator: ₹3,499/month (₹2,965 base + 18% GST)
  - Voyager: ₹6,999/month (₹5,931 base + 18% GST)
  - Crew: ₹1,999/seat/month (₹1,694 base + 18% GST)
  - Fleet: ₹5,399/seat/month (₹4,575 base + 18% GST)
  - Armada: ₹10,899/seat/month (₹9,236 base + 18% GST)

### 3. **Database Schema Created**

- ✅ `payment_orders` table for tracking orders
- ✅ `subscriptions` table for active subscriptions
- ✅ `razorpay_webhook_events` table for webhook logging
- ✅ RLS policies for security
- ✅ Database trigger to update user_profiles on subscription changes

### 4. **API Endpoints Implemented**

- ✅ `POST /api/payments/create-order` - Creates Razorpay orders
- ✅ `POST /api/payments/verify` - Verifies payment signatures
- ✅ `POST /api/webhooks/razorpay` - Handles Razorpay webhooks
- ✅ `GET /api/payments/test-razorpay` - Test configuration

### 5. **Receipt Field Issue Fixed**

- ✅ Shortened receipt format to stay under 40 character limit
- ✅ Format: `ord_[last8OfUserId]_[base36Timestamp]`

### 6. **Payment Verification Flow**

- ✅ Signature verification using HMAC SHA256
- ✅ Database updates on successful payment
- ✅ Subscription activation logic
- ✅ Idempotency checks for duplicate payments

## 🔧 Required Configuration

### Environment Variables

Ensure these are set in production:

```env
# Public (can be exposed to client)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxxxxxxxxxx

# Secret (server-side only)
RAZORPAY_KEY_SECRET=your_live_secret_key_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
```

### Razorpay Dashboard Setup

1. **Live Mode Activation**
   - Complete KYC verification
   - Submit business documents
   - Get approval from Razorpay

2. **Webhook Configuration**
   - URL: `https://yourdomain.com/api/webhooks/razorpay`
   - Events to enable:
     - payment.captured
     - payment.failed
     - payment.authorized
     - order.paid
     - refund.created
     - refund.failed

3. **Webhook Secret**
   - Generate in Razorpay Dashboard → Webhooks
   - Copy and set as `RAZORPAY_WEBHOOK_SECRET`

## 🧪 Testing Checklist

### Local Testing

- [ ] Test with Razorpay test credentials
- [ ] Use test card: 4111 1111 1111 1111
- [ ] Test UPI: success@razorpay
- [ ] Test failed payment scenarios
- [ ] Verify database updates after payment

### Integration Testing

- [ ] Create order successfully
- [ ] Process payment through Razorpay checkout
- [ ] Verify payment signature
- [ ] Confirm subscription activation
- [ ] Check user_profiles.subscription_tier update
- [ ] Test webhook handling

### Edge Cases

- [ ] Duplicate payment attempts
- [ ] Network failures during payment
- [ ] Invalid signature handling
- [ ] Expired orders
- [ ] Refund processing

## 🚀 Production Deployment

### Pre-deployment

- [ ] All environment variables set in production
- [ ] Database migrations applied
- [ ] SSL certificate active (HTTPS required)
- [ ] CORS settings configured if needed

### Monitoring Setup

- [ ] Error logging for failed payments
- [ ] Webhook delivery monitoring
- [ ] Payment success rate tracking
- [ ] Database query performance

### Security Checklist

- [ ] Environment variables not exposed in client
- [ ] Webhook signature verification enabled
- [ ] RLS policies active on all tables
- [ ] Input validation on all endpoints
- [ ] Rate limiting on payment endpoints

## 📊 Key Metrics to Monitor

1. **Payment Success Rate**
   - Target: >95%
   - Alert if drops below 90%

2. **Webhook Delivery Success**
   - Target: 100%
   - Retry failed webhooks

3. **Average Payment Time**
   - Target: <30 seconds
   - Monitor for timeouts

4. **Failed Payment Reasons**
   - Track error codes
   - Identify patterns

## 🆘 Troubleshooting Guide

### Common Issues

1. **"Failed to create payment order"**
   - Check Razorpay API credentials
   - Verify account is activated
   - Check API rate limits

2. **"Invalid signature"**
   - Verify RAZORPAY_KEY_SECRET is correct
   - Check webhook secret configuration
   - Ensure proper HMAC calculation

3. **"Payment successful but subscription not activated"**
   - Check database connection
   - Verify RLS policies
   - Check webhook processing logs

4. **"Webhook not received"**
   - Verify webhook URL in Razorpay dashboard
   - Check server logs for incoming requests
   - Ensure HTTPS is working

## 📝 Support Contacts

- **Razorpay Support**: support@razorpay.com
- **Razorpay Docs**: https://razorpay.com/docs/
- **API Status**: https://status.razorpay.com/

## ✅ Final Verification

Before going live:

1. [ ] Complete test transaction in production with small amount
2. [ ] Verify webhook delivery in production
3. [ ] Check subscription activation flow
4. [ ] Confirm email notifications working
5. [ ] Backup database before first live transaction

---

**Last Updated**: November 2024
**Status**: Ready for Production Testing
