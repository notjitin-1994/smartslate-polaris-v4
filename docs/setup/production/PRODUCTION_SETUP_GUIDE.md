# Production Environment Setup Guide

## Overview

This guide provides step-by-step instructions for configuring the SmartSlate Polaris v3 production environment with Razorpay payment integration and webhook configuration.

## Prerequisites

- Access to Razorpay Dashboard (https://dashboard.razorpay.com/)
- Production domain name and SSL certificate
- Vercel account (or preferred hosting platform)
- Supabase production project

## Step 1: Razorpay Live Mode Setup

### 1.1 Obtain Live API Credentials

1. Log in to Razorpay Dashboard (https://dashboard.razorpay.com/)
2. Navigate to **Settings → API Keys**
3. Click **Generate Key** for **Live Mode**
4. Copy both the **Key ID** and **Key Secret**
5. Store them securely (you won't be able to see the secret again)

### 1.2 Configure Live Webhook

1. In Razorpay Dashboard, navigate to **Settings → Webhooks**
2. Click **Add Webhook**
3. Configure webhook details:
   - **Webhook URL**: `https://your-production-domain.com/api/webhooks/razorpay`
   - **Secret**: Auto-generated (copy and save securely)
   - **Active**: Yes
4. Select required events:
   - **Payment Events**: `payment.authorized`, `payment.captured`, `payment.failed`
   - **Subscription Events**: `subscription.activated`, `subscription.charged`, `subscription.completed`, `subscription.cancelled`
   - **Order Events**: `order.paid`
5. Click **Create Webhook**
6. Test webhook delivery with sample events

### 1.3 Verify Webhook Endpoint

Test that your webhook endpoint is accessible:

```bash
# Test health check endpoint
curl -X GET https://your-production-domain.com/api/webhooks/razorpay

# Expected response: {"success": true, "message": "Webhook service is healthy", ...}
```

## Step 2: Environment Variables Configuration

### 2.1 Update Production Environment Variables

Update your production environment variables with live credentials:

```bash
# Razorpay Live Mode Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID_HERE
RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET_HERE
RAZORPAY_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Enable Payments
NEXT_PUBLIC_ENABLE_PAYMENTS=true

# Production Domain
NEXT_PUBLIC_APP_URL=https://your-production-domain.com

# Environment
NODE_ENV=production
```

### 2.2 Vercel Environment Variables Setup

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_XXXXXXXXXXXXX` | Production |
| `RAZORPAY_KEY_SECRET` | `your_live_secret_here` | Production |
| `RAZORPAY_WEBHOOK_SECRET` | `whsec_your_webhook_secret` | Production |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` | Production |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production |
| `ANTHROPIC_API_KEY` | `sk-ant-XXXXXXXXXXXXX` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_anon_key_here` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_key_here` | Production |

## Step 3: Database Configuration

### 3.1 Verify Database Migrations

Ensure all migrations are applied to production:

```bash
# From project root
npm run db:status
npm run db:push  # If migrations are pending
```

### 3.2 Check Database Tables

Verify the following tables exist and have correct structure:

- `user_profiles` (subscription management)
- `blueprint_generator` (blueprint data)
- `razorpay_subscriptions` (subscription records)
- `razorpay_payments` (payment records)
- `razorpay_webhook_events` (webhook logging)

### 3.3 RLS Policies

Confirm Row Level Security policies are active:

```sql
-- Verify RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('user_profiles', 'blueprint_generator', 'razorpay_subscriptions');
```

## Step 4: Plan Configuration Verification

### 4.1 Verify Live Plans

Ensure live plans are created with correct pricing:

```bash
npm run list-razorpay-plans
```

Expected pricing:
- Explorer: ₹1,599/month
- Navigator: ₹3,299/month
- Voyager: ₹6,699/month
- Crew: ₹1,999/month (per seat)
- Fleet: ₹5,399/month (per seat)
- Armada: ₹10,899/month (per seat)

### 4.2 Test Plan IDs

Verify plan IDs are correctly configured:

```bash
npx tsx -e "
import { getPlanId, validatePlanConfiguration } from './lib/config/razorpayPlans.ts';
console.log('Plan validation:', validatePlanConfiguration('monthly'));
console.log('Explorer plan ID:', getPlanId('explorer', 'monthly'));
console.log('Navigator plan ID:', getPlanId('navigator', 'monthly'));
"
```

## Step 5: Application Deployment

### 5.1 Deploy to Production

```bash
# Deploy to Vercel
git checkout main
git merge feature/razorpay-integration  # Or your feature branch
git push origin main
```

### 5.2 Post-Deployment Verification

1. **Application Health Check**:
   ```bash
   curl -X GET https://your-domain.com/api/health
   ```

2. **Webhook Health Check**:
   ```bash
   curl -X GET https://your-domain.com/api/webhooks/razorpay
   ```

3. **Pricing Page Accessibility**:
   - Visit `https://your-domain.com/pricing`
   - Verify plans display with correct pricing
   - Check "Upgrade" buttons are visible

## Step 6: End-to-End Testing

### 6.1 Test Payment Flow

1. **Create Test Account**:
   - Register new user account
   - Verify user profile is created in database

2. **Test Subscription Upgrade**:
   - Navigate to pricing page
   - Select "Navigator" plan
   - Click "Upgrade Now"
   - Complete payment using test card details

3. **Test Card Details** (use Razorpay test cards):
   - Card Number: `4111 1111 1111 1111`
   - Expiry: Any future date
   - CVV: Any 3 digits
   - Name: Any name
   - Email: Test email

4. **Verify Post-Payment**:
   - User tier should be updated to "navigator"
   - Subscription record should be created in database
   - Webhook event should be logged
   - Blueprint creation limits should be updated

### 6.2 Webhook Testing

Test webhook processing:

1. **Manual Webhook Trigger**:
   - Use Razorpay Dashboard → Webhooks → Test Webhook
   - Send test events for different scenarios
   - Verify webhook processing logs

2. **Check Webhook Logs**:
   ```sql
   SELECT * FROM razorpay_webhook_events
   ORDER BY created_at DESC
   LIMIT 10;
   ```

## Step 7: Monitoring and Alerting

### 7.1 Application Monitoring

Monitor key metrics:

1. **Payment Success Rate**: Target >95%
2. **Webhook Processing Time**: Target <1 second
3. **API Response Time**: Target <500ms (P95)
4. **Error Rate**: Target <1%

### 7.2 Set Up Alerts

Configure alerts for:

1. **Payment Failures**: Alert if success rate drops below 90%
2. **Webhook Failures**: Alert if webhook processing fails
3. **High Error Rates**: Alert if API error rate exceeds 5%
4. **Database Issues**: Alert on connection failures

### 7.3 Log Monitoring

Monitor application logs:

```bash
# Check Vercel function logs
# Go to Vercel Dashboard → Functions → Logs

# Check webhook processing logs
# Look for patterns: "webhook_received", "processing_completed", "processing_failed"
```

## Step 8: Security Verification

### 8.1 Security Checklist

✅ **API Key Security**:
- [ ] Live keys only in production environment
- [ ] Test keys only in development environment
- [ ] Keys rotated regularly
- [ ] No keys committed to version control

✅ **Webhook Security**:
- [ ] Webhook endpoint uses HTTPS
- [ ] Webhook signature verification enabled
- [ ] Webhook secret kept secure
- [ ] Rate limiting enabled on webhook endpoint

✅ **Database Security**:
- [ ] RLS policies enabled on all tables
- [ ] Service role key not exposed to client
- [ ] Database connections encrypted
- [ ] Regular database backups

### 8.2 Test Security

Test security measures:

1. **Test Webhook Signature Verification**:
   ```bash
   # Try to send webhook without signature (should fail)
   curl -X POST https://your-domain.com/api/webhooks/razorpay \
     -H "Content-Type: application/json" \
     -d '{"test": "data"}'
   # Expected: 401 Unauthorized
   ```

2. **Test Rate Limiting**:
   ```bash
   # Send multiple rapid requests (should be rate limited)
   for i in {1..110}; do
     curl -X GET https://your-domain.com/api/webhooks/razorpay &
   done
   # Expected: 429 Too Many Requests after limit
   ```

## Step 9: Performance Optimization

### 9.1 Database Optimization

1. **Index Verification**:
   ```sql
   -- Check indexes on critical tables
   SELECT indexname, tablename
   FROM pg_indexes
   WHERE schemaname = 'public'
   AND tablename IN ('razorpay_subscriptions', 'razorpay_payments', 'user_profiles');
   ```

2. **Query Performance**:
   ```sql
   -- Test query performance
   EXPLAIN ANALYZE
   SELECT * FROM user_profiles
   WHERE user_id = 'test_user_id';
   ```

### 9.2 Application Performance

1. **Bundle Size Optimization**:
   ```bash
   # Check bundle size
   npm run build
   # Review bundle analyzer output
   ```

2. **API Response Time**:
   ```bash
   # Test API performance
   curl -w "@curl-format.txt" -X GET https://your-domain.com/api/user/usage
   ```

## Step 10: Backup and Recovery

### 10.1 Database Backups

Ensure regular database backups:

1. **Supabase Automated Backups**: Verify enabled in dashboard
2. **Manual Backup**: Before major changes
3. **Backup Verification**: Test restore procedure

### 10.2 Configuration Backups

Backup critical configurations:

1. **Environment Variables**: Store securely in password manager
2. **Razorpay Settings**: Document webhook and API configurations
3. **Application Configuration**: Version controlled in git

## Step 11: Documentation

### 11.1 Update Documentation

Update project documentation:

1. **README.md**: Add payment setup instructions
2. **API Documentation**: Document webhook endpoints
3. **Deployment Guide**: Include production deployment steps

### 11.2 Team Training

Train team members on:

1. **Payment Flow**: How subscription system works
2. **Monitoring**: How to check system health
3. **Troubleshooting**: Common issues and solutions
4. **Security**: How to handle sensitive data

## Step 12: Go-Live Checklist

### Pre-Launch Checklist

✅ **Configuration**:
- [ ] Live API keys configured
- [ ] Webhook endpoint accessible
- [ ] Environment variables set
- [ ] Database migrations applied

✅ **Testing**:
- [ ] Payment flow tested end-to-end
- [ ] Webhook processing verified
- [ ] Error handling tested
- [ ] Security measures verified

✅ **Monitoring**:
- [ ] Alerting configured
- [ ] Log monitoring set up
- [ ] Performance benchmarks established
- [ ] Health checks operational

✅ **Documentation**:
- [ ] Setup guides updated
- [ ] Troubleshooting docs created
- [ ] Team training completed
- [ ] Runbook prepared

### Launch Day Tasks

1. **Final Backup**: Create complete database backup
2. **Deploy Changes**: Push to production
3. **Monitor Systems**: Watch for issues in first hour
4. **Test Transactions**: Complete real test payments
5. **Verify Webhooks**: Confirm webhook processing
6. **User Communication**: Notify users of new payment features

### Post-Launch Monitoring

Monitor for 24-48 hours after launch:

1. **Transaction Success Rate**: Should be >95%
2. **Webhook Processing**: Should be <1 second average
3. **Error Rates**: Should be <1%
4. **User Feedback**: Monitor support channels
5. **System Performance**: API response times <500ms

## Troubleshooting

### Common Issues

1. **Webhook Not Processing**:
   - Check webhook secret matches Razorpay dashboard
   - Verify webhook URL is accessible
   - Check SSL certificate validity
   - Review webhook processing logs

2. **Payment Failures**:
   - Verify plan IDs are correct
   - Check API key permissions
   - Review payment error codes
   - Test with different payment methods

3. **User Tier Not Updating**:
   - Check webhook processing logs
   - Verify database RLS policies
   - Review subscription handler code
   - Test webhook event processing manually

### Getting Help

1. **Logs**: Check Vercel function logs and database logs
2. **Documentation**: Refer to Razorpay API documentation
3. **Support**: Contact Razorpay support for API issues
4. **Team**: Use established escalation procedures

## Maintenance

### Regular Tasks

1. **Weekly**: Review payment success rates and error logs
2. **Monthly**: Check API key rotation schedule
3. **Quarterly**: Review pricing and plan configurations
4. **Annually**: Complete security audit and compliance review

### Security Maintenance

1. **Key Rotation**: Rotate API keys quarterly
2. **Password Updates**: Update webhook secrets regularly
3. **Access Review**: Review team access permissions
4. **Security Audit**: Complete annual security assessment