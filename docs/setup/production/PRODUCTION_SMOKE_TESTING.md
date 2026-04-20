# Production Smoke Testing Guide

## Overview

This guide provides comprehensive smoke testing procedures for validating that the SmartSlate Polaris v3 production deployment with Razorpay integration is working correctly.

## Prerequisites

- Production deployment completed successfully
- All database migrations applied
- Production environment variables configured
- Test payment methods available (credit card, UPI, etc.)
- Monitoring tools ready to capture test results

## Test Environment Setup

### Test Account Credentials

Create dedicated test accounts with these credentials:

```bash
# Test User Account 1
Email: test.user.1@yourdomain.com
Password: TestPassword123!
Name: Test User One

# Test User Account 2
Email: test.user.2@yourdomain.com
Password: TestPassword123!
Name: Test User Two
```

### Test Payment Methods

Prepare test payment methods:

1. **Test Credit Card**:
   - Use a real credit/debit card with minimum ₹1 balance
   - Ensure OTP can be received

2. **Test UPI**:
   - Use UPI app with test bank account
   - Ensure UPI ID is configured

3. **Test Net Banking**:
   - Use bank with internet banking enabled
   - Ensure test credentials are available

## Automated Smoke Testing Script

### Test Script Location

**File**: `scripts/production-smoke-tests.ts`

**Usage**:
```bash
# Run production smoke tests
npm run smoke:tests:prod

# Run specific test suite
npm run smoke:tests:prod --suite=payments
npm run smoke:tests:prod --suite=webhooks
npm run smoke:tests:prod --suite=user-management
```

### Test Suites

#### 1. Application Health Suite
- ✅ Production site accessibility
- ✅ SSL certificate validation
- ✅ API endpoint health checks
- ✅ Database connectivity
- ✅ CDN and static assets loading

#### 2. User Management Suite
- ✅ User registration flow
- ✅ User authentication flow
- ✅ User profile management
- ✅ Permission and role verification
- ✅ Session management

#### 3. Payment Processing Suite
- ✅ Pricing page accessibility
- ✅ Razorpay checkout loading
- ✅ Payment initiation flow
- ✅ Payment completion verification
- ✅ Transaction recording in database

#### 4. Webhook Processing Suite
- ✅ Webhook endpoint accessibility
- ✅ Webhook signature verification
- ✅ Subscription activation processing
- ✅ User tier updates
- ✅ Payment confirmation workflows

#### 5. Integration Suite
- ✅ End-to-end payment flow
- ✅ Blueprint creation limit updates
- ✅ Subscription management
- ✅ Error handling scenarios
- ✅ Performance validation

## Step-by-Step Manual Testing

### Step 1: Basic Application Health

1. **Site Accessibility**:
   ```bash
   # Check main site loads
   curl -I https://your-domain.com

   # Expected: HTTP/2 200 with proper headers
   ```

2. **SSL Certificate**:
   ```bash
   # Verify SSL certificate
   openssl s_client -connect your-domain.com:443 -servername your-domain.com

   # Check certificate validity and issuer
   ```

3. **Health Endpoints**:
   ```bash
   # Test application health
   curl -X GET https://your-domain.com/api/health

   # Test webhook health
   curl -X GET https://your-domain.com/api/webhooks/razorpay

   # Expected: JSON response with success: true
   ```

### Step 2: User Registration and Authentication

1. **User Registration**:
   - Navigate to `https://your-domain.com/auth/register`
   - Fill registration form with test credentials
   - Submit registration
   - Verify email confirmation received
   - Click confirmation link
   - Verify login works

2. **Authentication Flow**:
   - Logout and login again
   - Verify session persistence
   - Check user profile displays correctly
   - Verify user is "Explorer" tier by default

3. **User Profile Management**:
   - Navigate to user profile page
   - Update user information
   - Verify changes are saved
   - Check profile reflects correct tier and limits

### Step 3: Pricing Page Verification

1. **Pricing Page Access**:
   - Navigate to `https://your-domain.com/pricing`
   - Verify page loads without errors
   - Check all pricing tiers are displayed correctly
   - Verify pricing shows live amounts (₹1,599, ₹3,299, etc.)

2. **Plan Selection**:
   - Click on different plan tiers
   - Verify plan details display correctly
   - Check "Upgrade Now" buttons are clickable
   - Verify Razorpay checkout modal opens

3. **Razorpay Integration Check**:
   - Open browser developer tools (Network tab)
   - Click "Upgrade Now" on any plan
   - Verify Razorpay checkout loads with live keys
   - Check that `rzp_live_` keys are being used (not `rzp_test_`)

### Step 4: Payment Processing Test

#### 4.1 Test Payment Flow (₹1 Test)

1. **Initiate Payment**:
   - Select "Explorer" plan (₹1,599/month)
   - Click "Upgrade Now"
   - Razorpay checkout modal opens

2. **Payment Details**:
   - Select payment method (Credit Card/Debit Card)
   - Enter card details (real card, minimum ₹1 balance)
   - Enter billing information
   - Click "Pay ₹1,599"

3. **OTP Verification**:
   - Complete OTP verification if required
   - Wait for payment processing
   - Verify payment success message

4. **Post-Payment Verification**:
   - Check for success confirmation page
   - Verify user is redirected appropriately
   - Check that subscription was created

#### 4.2 Payment Completion Verification

1. **Database Verification**:
   ```sql
   -- Check subscription record
   SELECT * FROM subscriptions
   WHERE user_id = 'test-user-id'
   ORDER BY created_at DESC
   LIMIT 1;

   -- Check payment record
   SELECT * FROM payments
   WHERE user_id = 'test-user-id'
   ORDER BY created_at DESC
   LIMIT 1;

   -- Check user profile update
   SELECT subscription_tier, user_role, blueprint_creation_limit
   FROM user_profiles
   WHERE user_id = 'test-user-id';
   ```

2. **User Interface Verification**:
   - Refresh user profile page
   - Verify tier updated to "Explorer Member"
   - Check blueprint creation limits updated (25 blueprints)
   - Verify subscription details are visible

3. **Razorpay Dashboard Verification**:
   - Log in to Razorpay Dashboard (Live Mode)
   - Check Payments section for the transaction
   - Verify payment status is "Captured"
   - Check webhook delivery status

### Step 5: Webhook Processing Test

1. **Manual Webhook Test**:
   - Go to Razorpay Dashboard → Webhooks
   - Select your production webhook
   - Click "Test Webhook"
   - Send test `subscription.activated` event
   - Verify webhook processes successfully

2. **Webhook Log Verification**:
   ```sql
   -- Check webhook event logged
   SELECT * FROM razorpay_webhook_events
   WHERE event_type = 'subscription.activated'
   ORDER BY created_at DESC
   LIMIT 5;

   -- Verify processing status
   SELECT event_type, processing_status, error_message
   FROM razorpay_webhook_events
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Webhook Endpoint Test**:
   ```bash
   # Test webhook endpoint (should fail without signature)
   curl -X POST https://your-domain.com/api/webhooks/razorpay \
     -H "Content-Type: application/json" \
     -d '{"event": {"payment": {"entity": {"id": "test_payment"}}}}'

   # Expected: 401 Unauthorized
   ```

### Step 6: Blueprint Creation Test

1. **Blueprint Creation with New Limits**:
   - Navigate to questionnaire or blueprint creation
   - Create a new blueprint
   - Verify blueprint creation works with new limits
   - Check blueprint saves correctly

2. **Limit Verification**:
   - Try to create multiple blueprints
   - Verify limit enforcement works correctly
   - Check usage tracking updates

3. **Blueprint Features Test**:
   - Test blueprint generation
   - Verify AI services work correctly
   - Check export functionality

### Step 7: Error Handling Scenarios

1. **Failed Payment Test**:
   - Attempt payment with insufficient funds
   - Verify error handling works correctly
   - Check user sees appropriate error message
   - Verify no subscription created

2. **Network Interruption Test**:
   - Start payment process
   - Disconnect network during payment
   - Reconnect and verify graceful handling
   - Check for partial payment states

3. **Invalid Data Test**:
   - Try to submit invalid payment data
   - Verify validation works correctly
   - Check error messages are user-friendly

## Performance Testing

### Response Time Benchmarks

Test these response time targets:

1. **Page Load Times**:
   - Homepage: < 2 seconds
   - Pricing page: < 2 seconds
   - User profile: < 1.5 seconds

2. **API Response Times**:
   - Health check: < 500ms
   - User authentication: < 1 second
   - Payment initiation: < 2 seconds
   - Subscription lookup: < 500ms

3. **Payment Processing**:
   - Razorpay checkout load: < 3 seconds
   - Payment confirmation: < 5 seconds
   - Webhook processing: < 1 second

### Load Testing

Run basic load tests:

```bash
# Test pricing page with concurrent users
npm run load-test:pricing

# Test subscription creation
npm run load-test:subscriptions

# Test API endpoints
npm run load-test:health
```

## Security Testing

### Security Verification Tests

1. **HTTPS Enforcement**:
   ```bash
   # Try HTTP redirect
   curl -I http://your-domain.com

   # Expected: 301 redirect to HTTPS
   ```

2. **Security Headers**:
   ```bash
   # Check security headers
   curl -I https://your-domain.com/api/health

   # Verify headers:
   # - strict-transport-security
   # - x-content-type-options
   # - x-frame-options
   # - x-xss-protection
   ```

3. **Rate Limiting**:
   ```bash
   # Test rate limiting
   for i in {1..110}; do
     curl -X GET https://your-domain.com/api/health &
   done

   # Expected: 429 Too Many Requests after limit
   ```

4. **API Key Security**:
   ```bash
   # Check no secrets in client bundle
   curl -s https://your-domain.com/_next/static/chunks/*.js | \
     grep -i "secret\|key\|password" || echo "No secrets found"
   ```

## Accessibility Testing

### Accessibility Verification

1. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Verify focus indicators are visible
   - Check all buttons are accessible via keyboard

2. **Screen Reader Compatibility**:
   - Test with screen reader software
   - Verify alt text for images
   - Check semantic HTML structure

3. **Color Contrast**:
   - Verify text has sufficient contrast
   - Check color blind accessibility
   - Test with high contrast mode

## Mobile Testing

### Mobile Device Tests

1. **Responsive Design**:
   - Test on mobile phone (iOS/Android)
   - Test on tablet devices
   - Verify all functionality works on mobile

2. **Touch Interface**:
   - Test all buttons with touch
   - Verify swipe gestures work
   - Check form inputs work on mobile

3. **Performance on Mobile**:
   - Test page load times on 3G/4G
   - Verify functionality works offline (where applicable)
   - Check battery usage during testing

## Test Results Documentation

### Test Results Template

Create a comprehensive test report:

```markdown
# Production Smoke Test Results

**Date**: [Date of testing]
**Environment**: Production
**Tester**: [Name]

## Test Summary
- Total Tests: [Number]
- Passed: [Number]
- Failed: [Number]
- Success Rate: [Percentage]%

## Test Results

### Application Health
- [ ] Site loads correctly
- [ ] SSL certificate valid
- [ ] Health endpoints responding
- [ ] Database connectivity confirmed

### User Management
- [ ] Registration flow working
- [ ] Authentication working
- [ ] Profile management working
- [ ] Session management working

### Payment Processing
- [ ] Pricing page accessible
- [ ] Razorpay checkout loading
- [ ] Payment completion successful
- [ ] Database records created

### Webhook Processing
- [ ] Webhook endpoint accessible
- [ ] Webhook processing working
- [ ] User tier updates working
- [ ] Error handling working

## Issues Found

[Document any issues found and their resolution]

## Recommendations

[Provide recommendations for improvement]

## Sign-off

**Tester**: [Signature]
**Date**: [Date]
**Status**: [Approved/Needs Review/Failed]
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Payment Fails with "Invalid Amount"
**Solution**: Check Razorpay plan configuration and ensure minimum amount is met.

#### Issue 2: Webhook Not Processing
**Solution**: Verify webhook URL is accessible and signature verification is working.

#### Issue 3: User Tier Not Updating
**Solution**: Check webhook processing logs and database triggers are working.

#### Issue 4: Site Not Loading
**Solution**: Check Vercel deployment logs and environment variables.

#### Issue 5: SSL Certificate Issues
**Solution**: Verify domain configuration and SSL certificate provisioning.

## Go/No-Go Decision Criteria

### Go Decision (Deploy to Production)
- ✅ All critical tests passing (>95% success rate)
- ✅ Payment processing working end-to-end
- ✅ No critical security issues found
- ✅ Performance benchmarks met
- ✅ Error handling working correctly
- ✅ Monitoring and alerting configured

### No-Go Decision (Stop Deployment)
- ❌ Payment processing failures
- ❌ Security vulnerabilities found
- ❌ Database issues detected
- ❌ Critical performance problems
- ❌ Webhook processing not working
- ❌ User data corruption risk

## Post-Testing Actions

### If Tests Pass
1. **Document Results**: Complete test report with all findings
2. **Monitor Systems**: Set up enhanced monitoring for first 24 hours
3. **Team Notification**: Notify all stakeholders of successful deployment
4. **User Communication**: Prepare user announcement if applicable

### If Tests Fail
1. **Identify Issues**: Document all failing tests and root causes
2. **Create Fix Plan**: Develop action plan to resolve issues
3. **Implement Fixes**: Apply necessary fixes
4. **Retest**: Run smoke tests again after fixes
5. **Document Changes**: Update documentation with all changes made

---

**Important**: Complete all testing steps before declaring production deployment successful. Any issues found must be resolved before proceeding with user announcement.