# Vercel Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying the SmartSlate Polaris v3 application to Vercel production with Razorpay payment integration.

## Prerequisites

- Vercel account with appropriate permissions
- GitHub repository connected to Vercel
- Production environment variables configured
- Database migrations applied to production
- SSL certificate active on production domain

## Step 1: Pre-Deployment Preparation

### 1.1 Code Repository Review

Ensure your main branch is ready for production:

```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Check current status
git status

# Verify no uncommitted changes
git diff --exit-code
```

### 1.2 Create Production Branch

```bash
# Create production deployment branch
git checkout -b production/deploy-razorpay-integration

# Verify you have the latest Razorpay integration changes
git log --oneline -10

# Check all required files are present
ls -la scripts/deploy-database-migrations.sh
ls -la docs/PRODUCTION_DEPLOYMENT_CONFIG.md
ls -la frontend/.env.production.template
```

### 1.3 Final Build Test

```bash
# From frontend directory
cd frontend

# Install dependencies
npm ci

# Run production build test
npm run build

# Run production environment validation
NODE_ENV=production npm run validate:production

# Run TypeScript checks
npm run typecheck

# Run linting
npm run lint
```

### 1.4 Update Version Information

Update application version for production deployment:

```bash
# Update package.json version if needed
npm version patch  # or minor/major for breaking changes

# Commit version update
git add package.json package-lock.json
git commit -m "chore: Bump version for production deployment"
```

## Step 2: Vercel Configuration

### 2.1 Verify Vercel Project Settings

Go to **Vercel Dashboard → Your Project → Settings** and verify:

#### General Settings
- ✅ **Project Name**: `smartslate-polaris-v3` (or your preferred name)
- ✅ **Framework Preset**: Next.js
- ✅ **Build Command**: `npm run build`
- ✅ **Output Directory**: `.next`
- ✅ **Install Command**: `npm ci`
- ✅ **Root Directory**: `frontend`

#### Domains Configuration
- ✅ **Production Domain**: `your-domain.com` (e.g., `polaris.smartslate.ai`)
- ✅ **SSL Certificate**: Active and valid
- ✅ **Redirects**: `www.your-domain.com` → `your-domain.com`

#### Environment Variables
Verify all production environment variables are configured:

| Variable | Value | Environment | Status |
|----------|-------|-------------|--------|
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | `rzp_live_XXXXXXXXXXXXX` | Production | ✅ Required |
| `RAZORPAY_KEY_SECRET` | `your_live_secret` | Production | ✅ Required |
| `RAZORPAY_WEBHOOK_SECRET` | `whsec_your_secret` | Production | ✅ Required |
| `NEXT_PUBLIC_ENABLE_PAYMENTS` | `true` | Production | ✅ Required |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://your-project.supabase.co` | Production | ✅ Required |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `your_anon_key` | Production | ✅ Required |
| `SUPABASE_SERVICE_ROLE_KEY` | `your_service_key` | Production | ✅ Required |
| `ANTHROPIC_API_KEY` | `sk-ant-XXXXXXXXXXXXX` | Production | ✅ Required |
| `NEXT_PUBLIC_APP_URL` | `https://your-domain.com` | Production | ✅ Required |
| `NODE_ENV` | `production` | Production | ✅ Required |

### 2.2 Build Optimization Settings

Configure build settings for optimal performance:

```javascript
// vercel.json (in project root)
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm ci",
  "framework": "nextjs",
  "functions": {
    "frontend/app/api/**/*.ts": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "no-store, must-revalidate"
        }
      ]
    }
  ],
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/frontend/api/$1"
    }
  ]
}
```

## Step 3: Production Deployment Process

### 3.1 Create Production Deployment Commit

```bash
# Create production deployment commit
git add .
git commit -m "feat: Production deployment - Razorpay payment integration

🚀 Production Ready Features:
- Razorpay live mode integration with ₹1 pricing
- Complete payment flow with webhooks and subscriptions
- Production environment validation and monitoring
- Security hardening and performance optimization
- Comprehensive error handling and rollback procedures

📋 Production Checklist Complete:
- ✅ Live API keys configured (rzp_live_)
- ✅ Production webhooks set up and verified
- ✅ Database migrations applied to production
- ✅ Environment variables validated
- ✅ Security audit completed
- ✅ Performance benchmarks met
- ✅ Monitoring and alerting configured
- ✅ Rollback procedures documented

🎯 Ready for Go-Live with:
- Real payment processing (starting at ₹1)
- Automatic user tier upgrades
- Webhook-driven subscription management
- Production-grade error handling and logging

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

### 3.2 Merge to Main Branch

```bash
# Switch to main branch
git checkout main

# Merge production branch
git merge production/deploy-razorpay-integration

# Push to trigger Vercel deployment
git push origin main
```

### 3.3 Monitor Vercel Deployment

Vercel will automatically deploy when code is pushed to main branch. Monitor:

#### Vercel Dashboard
1. Go to **Vercel Dashboard → Your Project**
2. Watch the **Deployments** tab
3. Look for the new deployment with your commit message

#### Expected Deployment Stages
1. **Git Import** (1-2 minutes)
2. **Build Setup** (1-2 minutes)
3. **Building** (3-5 minutes)
4. **Deploying** (1-2 minutes)

#### Build Logs Monitoring
Monitor for any warnings or errors:

```bash
# Expected successful build logs
✓ Installing dependencies
✓ Running build command
✓ Build completed
✓ Deployment successful

# Warnings to investigate
⚠️ Large bundle size detected
⚠️ Unused dependencies found
⚠️ Memory usage during build

# Errors to fix immediately
❌ Build failed
❌ TypeScript errors
❌ ESLint errors blocking build
❌ Environment variable errors
```

## Step 4: Post-Deployment Verification

### 4.1 Basic Health Checks

After deployment completes, run these verification commands:

```bash
# Application health check
curl -X GET https://your-domain.com/api/health
# Expected: {"success": true, "status": "healthy", ...}

# Webhook health check
curl -X GET https://your-domain.com/api/webhooks/razorpay
# Expected: {"success": true, "message": "Webhook service is healthy", ...}

# Pricing page accessibility
curl -I https://your-domain.com/pricing
# Expected: HTTP/2 200

# API environment verification
curl -X GET https://your-domain.com/api/user/usage
# Expected: {"usage": {...}, "tier": "explorer", ...}
```

### 4.2 Frontend Verification

1. **Load Production Site**:
   - Open `https://your-domain.com` in browser
   - Verify site loads without errors
   - Check browser console for any errors

2. **Check Navigation**:
   - Navigate to `/pricing` page
   - Verify pricing displays correctly
   - Check "Upgrade Now" buttons are visible

3. **Verify Payment Integration**:
   - Click "Upgrade Now" on any plan
   - Confirm Razorpay checkout modal loads
   - Check that live Razorpay key is being used (dev tools network tab)

### 4.3 Environment Variable Verification

```bash
# Test that production environment variables are loaded
curl -X POST https://your-domain.com/api/health \
  -H "Content-Type: application/json" \
  -d '{"test": "production-env-check"}'

# Check response includes production configuration
```

### 4.4 Database Connection Verification

```bash
# Test database connectivity through API
curl -X POST https://your-domain.com/api/user/usage \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Verify successful database response
```

## Step 5: Production Smoke Testing

### 5.1 Create Test Account

```bash
# Register new test user
curl -X POST https://your-domain.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-production@example.com",
    "password": "TestPassword123!",
    "name": "Production Test User"
  }'

# Record user credentials for payment testing
```

### 5.2 Test Payment Flow

1. **Navigate to Production Site**:
   ```
   https://your-domain.com/pricing
   ```

2. **Select Test Plan**:
   - Choose "Explorer" plan (₹1,599/month) for minimum test payment
   - Click "Upgrade Now"

3. **Complete Payment**:
   - Use REAL payment method (credit/debit card, UPI, etc.)
   - Minimum amount: ₹1 (configured for testing)
   - Complete OTP verification if required

4. **Verify Payment Success**:
   - Check for success message
   - Verify user is redirected to success page
   - Confirm user tier updated in database

### 5.3 Webhook Verification

1. **Check Razorpay Dashboard**:
   - Go to Razorpay Dashboard → Payments
   - Verify payment appears as "Captured"
   - Check webhook delivery status

2. **Verify Database Records**:
   ```sql
   -- Check subscription record
   SELECT * FROM subscriptions WHERE user_id = 'test-user-id';

   -- Check payment record
   SELECT * FROM payments WHERE user_id = 'test-user-id';

   -- Check webhook events
   SELECT * FROM razorpay_webhook_events ORDER BY created_at DESC LIMIT 5;
   ```

3. **Check User Profile Update**:
   ```sql
   -- Verify user profile updated
   SELECT * FROM user_profiles WHERE user_id = 'test-user-id';
   ```

## Step 6: Production Monitoring Setup

### 6.1 Vercel Analytics

Configure Vercel Analytics for production monitoring:

1. **Enable Analytics**:
   - Go to Vercel Dashboard → Analytics
   - Enable Web Vitals collection
   - Configure custom events

2. **Set Up Dashboards**:
   - Performance metrics dashboard
   - Error tracking dashboard
   - User behavior analytics

### 6.2 Custom Monitoring

Set up application-specific monitoring:

```javascript
// lib/monitoring/production-monitoring.ts
export const productionMonitoring = {
  // Payment success rate monitoring
  trackPaymentSuccess: (paymentData) => {
    // Send to monitoring service
  },

  // Webhook processing monitoring
  trackWebhookProcessing: (webhookData) => {
    // Send to monitoring service
  },

  // Error tracking
  trackError: (error, context) => {
    // Send to monitoring service
  }
};
```

### 6.3 Alert Configuration

Set up alerts for critical metrics:

1. **Payment Success Rate**:
   - Alert if < 95% success rate over 1 hour
   - Critical alert if < 90% success rate

2. **Webhook Processing**:
   - Alert if webhook processing fails > 5 times
   - Critical alert if webhook processing time > 5 seconds

3. **API Response Times**:
   - Warning if P95 > 1 second
   - Critical if P95 > 2 seconds

4. **Error Rates**:
   - Warning if error rate > 2%
   - Critical if error rate > 5%

## Step 7: Performance Optimization

### 7.1 Bundle Analysis

```bash
# Analyze bundle size
cd frontend
npm run analyze:bundle

# Review bundle analyzer output
# Look for:
# - Large chunks (>100KB)
# - Unused dependencies
# - Optimization opportunities
```

### 7.2 CDN Configuration

Verify Vercel Edge Network configuration:

1. **Static Asset Caching**:
   - Images, CSS, JS files cached at edge
   - Long cache headers for static assets
   - Cache invalidation on deployment

2. **API Response Caching**:
   - Cache GET endpoints where appropriate
   - Implement cache invalidation strategies
   - Monitor cache hit rates

### 7.3 Database Optimization

```bash
# Monitor database performance
npm run db:verify:prod

# Check slow queries
# Add indexes if needed
# Monitor connection pooling
```

## Step 8: Security Verification

### 8.1 HTTPS Configuration

```bash
# Verify SSL certificate
curl -I https://your-domain.com

# Check for proper headers
curl -I https://your-domain.com/api/health
```

Expected security headers:
```
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: DENY
x-xss-protection: 1; mode=block
```

### 8.2 API Security

```bash
# Test rate limiting
for i in {1..110}; do
  curl -X GET https://your-domain.com/api/health &
done
# Expected: 429 Too Many Requests after limit

# Test webhook security
curl -X POST https://your-domain.com/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
# Expected: 401 Unauthorized (missing signature)
```

### 8.3 Environment Variable Security

```bash
# Verify no secrets in client bundle
curl -s https://your-domain.com/_next/static/chunks/*.js | grep -i "secret\|key" || echo "No secrets found in client bundle"
```

## Step 9: Documentation Updates

### 9.1 Update Project Documentation

Update these files with production information:

1. **README.md**:
   - Add production URL
   - Update setup instructions
   - Add payment information

2. **API Documentation**:
   - Update API endpoints documentation
   - Add authentication requirements
   - Document webhook endpoints

3. **Deployment Guide**:
   - Update with actual production URLs
   - Add lessons learned
   - Include troubleshooting steps

### 9.2 Create Runbook

Create operational runbook for production maintenance:

```markdown
# Production Runbook

## Daily Checks
- [ ] Monitor payment success rates
- [ ] Check webhook processing
- [ ] Review error logs

## Weekly Tasks
- [ ] Review performance metrics
- [ ] Check database growth
- [ ] Update monitoring thresholds

## Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization review
- [ ] Backup verification
```

## Step 10: Go-Live Decision

### 10.1 Final Checklist

✅ **Technical Readiness**:
- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificate active
- [ ] Build successful
- [ ] Health checks passing

✅ **Functional Readiness**:
- [ ] Payment flow tested end-to-end
- [ ] Webhook processing verified
- [ ] User tier updates working
- [ ] Error handling tested

✅ **Security Readiness**:
- [ ] HTTPS enforced
- [ ] Rate limiting active
- [ ] API security verified
- [ ] No secrets exposed

✅ **Monitoring Readiness**:
- [ ] Alerts configured
- [ ] Dashboards set up
- [ ] Log monitoring active
- [ ] Performance tracking enabled

### 10.2 Go-Live Announcement

When all checklist items are complete:

1. **Internal Announcement**:
   - Notify team of successful deployment
   - Share monitoring dashboard access
   - Provide emergency contact information

2. **External Announcement** (if applicable):
   - Update status page
   - Notify users of new payment features
   - Provide support contact information

3. **Post-Launch Monitoring**:
   - Monitor systems continuously for 24 hours
   - Check payment processing every hour
   - Respond to any alerts immediately

## Troubleshooting Guide

### Common Deployment Issues

#### Issue 1: Build Failures
**Problem**: Vercel build fails
**Solutions**:
```bash
# Check local build
cd frontend && npm run build

# Fix TypeScript errors
npm run typecheck

# Fix ESLint errors
npm run lint

# Check environment variables
npm run validate:production
```

#### Issue 2: Runtime Errors
**Problem**: Application loads but shows errors
**Solutions**:
- Check Vercel function logs
- Verify environment variables
- Test database connectivity
- Check API endpoints individually

#### Issue 3: Payment Issues
**Problem**: Payments not processing
**Solutions**:
- Verify Razorpay API keys
- Check webhook configuration
- Test webhook endpoint accessibility
- Review payment error logs

#### Issue 4: Performance Issues
**Problem**: Slow response times
**Solutions**:
- Check Vercel Analytics
- Analyze bundle size
- Optimize database queries
- Review CDN configuration

### Emergency Procedures

#### Critical Failure Response

1. **Immediate Actions**:
   - Identify affected systems
   - Check Vercel status page
   - Review recent deployments
   - Check error logs

2. **Communication**:
   - Notify stakeholders
   - Update status page
   - Provide ETA for resolution

3. **Resolution**:
   - Implement fix
   - Deploy hotfix if needed
   - Monitor for recurrence
   - Document incident

#### Rollback Procedures

If critical issues require rollback:

```bash
# Rollback to previous deployment
git revert HEAD
git push origin main

# Or rollback to specific commit
git checkout <previous-commit-hash>
git push origin main --force
```

---

**Production Deployment Completed Successfully! 🎉**

The SmartSlate Polaris v3 application is now deployed to production with Razorpay payment integration. Monitor systems closely and follow the operational procedures for ongoing maintenance.