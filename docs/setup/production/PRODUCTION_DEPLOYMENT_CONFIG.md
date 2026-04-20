# Production Deployment Configuration Guide

## Overview

This document provides the exact configuration steps for deploying SmartSlate Polaris v3 to production with Razorpay payment integration.

## Prerequisites

- Access to Razorpay Dashboard (Live Mode)
- Vercel account with production deployment permissions
- Supabase production project access
- Production domain name (e.g., https://polaris.smartslate.ai)

## Step 1: Razorpay Live Mode Configuration

### 1.1 Obtain Live API Credentials

1. Log in to Razorpay Dashboard (https://dashboard.razorpay.com/)
2. Switch to **Live Mode** (toggle in top-right)
3. Navigate to **Settings → API Keys**
4. Click **Generate Key** if no live key exists
5. Copy and securely store:
   - **Key ID**: `rzp_live_XXXXXXXXXXXXX`
   - **Key Secret**: `Live key secret (store immediately)`

### 1.2 Configure Production Webhook

1. In Razorpay Dashboard, navigate to **Settings → Webhooks**
2. Click **Add Webhook**
3. Configure:
   - **Webhook URL**: `https://YOUR_DOMAIN.com/api/webhooks/razorpay`
   - **Secret**: Auto-generated (copy and store securely)
   - **Active**: Yes
4. Select required events:
   - `payment.authorized`
   - `payment.captured`
   - `payment.failed`
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.completed`
   - `subscription.cancelled`
   - `order.paid`
5. Click **Create Webhook**

### 1.3 Verify Live Plans

Ensure live plans exist with correct pricing:

```bash
cd frontend
npm run list-razorpay-plans -- --live
```

Expected live pricing:
- **Explorer**: ₹1,599/month
- **Navigator**: ₹3,299/month
- **Voyager**: ₹6,699/month
- **Crew**: ₹1,999/month per seat
- **Fleet**: ₹5,399/month per seat
- **Armada**: ₹10,899/month per seat

## Step 2: Vercel Production Environment Variables

### 2.1 Update Production Environment Variables

Go to **Vercel Dashboard → Your Project → Settings → Environment Variables** and add/update these variables for **Production** environment:

#### Required Razorpay Configuration (Live Mode)

| Name | Value | Environment | Notes |
|------|-------|-------------|--------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_XXXXXXXXXXXXX` | Production | Replace with your live key ID |
| `RAZORPAY_KEY_SECRET` | `your_live_secret_here` | Production | Replace with your live key secret |
| `RAZORPAY_WEBHOOK_SECRET` | `whsec_your_webhook_secret` | Production | Replace with webhook secret from Razorpay |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` | Production | Enable payment features |

#### Required Supabase Configuration

| Name | Value | Environment | Notes |
|------|-------|-------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production | Your production Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_anon_key_here` | Production | Production anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_key_here` | Production | Production service role key (server-side only) |

#### Required AI Configuration

| Name | Value | Environment | Notes |
|------|-------|-------------|--------|
| `ANTHROPIC_API_KEY` | `sk-ant-XXXXXXXXXXXXX` | Production | Live Claude API key |

#### Application Configuration

| Name | Value | Environment | Notes |
|------|-------|-------------|--------|
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production | Your production domain |
| `NODE_ENV` | `production` | Production | Set to production mode |

### 2.2 Remove Test Configuration

Ensure NO test environment variables remain in production:

❌ **Remove these from Production:**
- `rzp_test_` prefixed keys
- Test webhook secrets
- Development URLs (localhost:3000)

### 2.3 Environment Variable Validation

After setting up, validate configuration:

```bash
# Test production build (will fail if required variables missing)
npm run build

# Test environment variable validation
npm run env:validate
```

## Step 3: Production Domain Configuration

### 3.1 Domain Setup

1. Go to **Vercel Dashboard → Your Project → Settings → Domains**
2. Add your production domain (e.g., `polaris.smartslate.ai`)
3. Configure DNS records as instructed by Vercel
4. Wait for SSL certificate provisioning (usually 1-24 hours)

### 3.2 Update Razorpay Webhook URL

Once SSL is active, update the webhook URL in Razorpay:
- Webhook URL: `https://polaris.smartslate.ai/api/webhooks/razorpay`

## Step 4: Pre-Deployment Checklist

### 4.1 Security Verification

✅ **API Key Security Check**:
- [ ] No `rzp_test_` keys in production environment
- [ ] No service role keys exposed to client (`NEXT_PUBLIC_` prefix)
- [ ] Webhook secret properly configured
- [ ] All secrets marked as "sensitive" in Vercel

✅ **Domain Verification**:
- [ ] SSL certificate active
- [ ] HTTPS redirects working
- [ ] Webhook endpoint accessible

### 4.2 Application Verification

✅ **Build Verification**:
- [ ] Production build succeeds
- [ ] No TypeScript errors
- [ ] No ESLint warnings
- [ ] Bundle size optimized

✅ **Database Verification**:
- [ ] Production Supabase connected
- [ ] All migrations applied
- [ ] RLS policies active
- [ ] Connection limits appropriate

## Step 5: Deployment Process

### 5.1 Create Production Branch

```bash
git checkout -b production/razorpay-go-live
git add .
git commit -m "feat: Production deployment - Razorpay live configuration

- Configure live Razorpay API keys and webhooks
- Update production environment variables
- Enable payment features in production
- Complete security and performance optimizations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 5.2 Merge to Main Branch

```bash
git checkout main
git merge production/razorpay-go-live
git push origin main
```

### 5.3 Monitor Deployment

Vercel will automatically deploy when code is pushed to main branch. Monitor:

1. **Vercel Dashboard**: Watch build progress
2. **Build Logs**: Check for any errors or warnings
3. **Function Logs**: Verify API routes deploy correctly

## Step 6: Post-Deployment Verification

### 6.1 Health Checks

After deployment completes, run these checks:

```bash
# Application health check
curl -X GET https://polaris.smartslate.ai/api/health

# Expected: {"success": true, "status": "healthy", ...}

# Webhook health check
curl -X GET https://polaris.smartslate.ai/api/webhooks/razorpay

# Expected: {"success": true, "message": "Webhook service is healthy", ...}

# Pricing page accessibility
curl -I https://polaris.smartslate.ai/pricing

# Expected: HTTP/2 200
```

### 6.2 Environment Variable Verification

```bash
# Check that live keys are being used (inspect network requests)
# Look for rzp_live_ keys in network tab when loading pricing page
```

### 6.3 Plan Configuration Verification

Visit `https://polaris.smartslate.ai/pricing` and verify:
- Plans display with correct pricing (₹1,599, ₹3,299, etc.)
- "Upgrade Now" buttons are visible
- Razorpay checkout modal loads when clicked
- Live Razorpay key is used (check browser dev tools network tab)

## Step 7: Production Testing

### 7.1 End-to-End Payment Test

1. **Create Test Account**:
   - Go to `https://polaris.smartslate.ai/auth/register`
   - Register new user account
   - Verify email confirmation

2. **Test Payment Flow**:
   - Navigate to `/pricing`
   - Select "Navigator" plan (₹3,299/month)
   - Click "Upgrade Now"
   - Complete payment using REAL payment method (minimum ₹1)
   - Verify successful payment confirmation

3. **Verify Post-Payment**:
   - Check user tier updated to "Navigator Member"
   - Verify blueprint creation limits increased
   - Check subscription record in database
   - Confirm webhook processed successfully

### 7.2 Webhook Testing

Use Razorpay Dashboard to test webhooks:

1. Go to **Settings → Webhooks → Your Webhook**
2. Click **Test Webhook**
3. Send test `payment.captured` event
4. Verify webhook processes correctly
5. Check webhook logs in application database

## Step 8: Monitoring Configuration

### 8.1 Set Up Monitoring

Configure these monitoring alerts in Vercel:

1. **Function Error Rate**: Alert if >5%
2. **Response Time**: Alert if P95 >1s
3. **Function Invocations**: Monitor for unusual spikes

### 8.2 Log Monitoring

Set up log monitoring for these patterns:
- `webhook_processing_failed`
- `payment_verification_error`
- `subscription_creation_failed`
- `rate_limit_exceeded`

## Step 9: Rollback Planning

### 9.1 Emergency Rollback

If critical issues detected:

1. **Disable Payments**:
   - Set `NEXT_PUBLIC_ENABLE_PAYMENTS=false` in Vercel
   - Redeploy with existing build

2. **Full Rollback**:
   ```bash
   git revert HEAD
   git push origin main
   ```

3. **Database Rollback**:
   ```bash
   # Use Supabase dashboard to rollback migrations if needed
   # Contact support for emergency rollback
   ```

### 9.2 Emergency Contacts

- **Razorpay Support**: https://razorpay.com/support
- **Vercel Support**: https://vercel.com/support
- **Internal Team**: [Create escalation list]

## Step 10: Go-Live Decision

### 10.1 Final Checklist

✅ **Configuration Complete**:
- [ ] All environment variables configured
- [ ] SSL certificate active
- [ ] Webhook endpoint accessible
- [ ] Build successful

✅ **Testing Complete**:
- [ ] Payment flow tested
- [ ] Webhook processing verified
- [ ] Error handling tested
- [ ] Performance benchmarks met

✅ **Monitoring Ready**:
- [ ] Alerts configured
- [ ] Log monitoring active
- [ ] Dashboard accessible
- [ ] Emergency contacts notified

### 10.2 Go-Live Decision

If all checklist items are complete:
1. **Deploy**: Merge to main branch
2. **Monitor**: Watch systems for 1 hour post-deployment
3. **Test**: Complete real payment test
4. **Launch**: Announce go-live to users

## Post-Launch Monitoring

### First 24 Hours

Monitor these metrics:
- **Payment Success Rate**: Target >95%
- **Webhook Processing**: Target <1s average
- **API Response Times**: Target <500ms P95
- **Error Rates**: Target <1%
- **User Registration**: Monitor conversion rates

### Ongoing Maintenance

- **Daily**: Review error logs and payment metrics
- **Weekly**: Monitor subscription revenue and churn
- **Monthly**: Review API usage and costs
- **Quarterly**: Security audit and performance review

---

**IMPORTANT**: This document contains sensitive production configuration details. Store securely and limit access to authorized team members only.