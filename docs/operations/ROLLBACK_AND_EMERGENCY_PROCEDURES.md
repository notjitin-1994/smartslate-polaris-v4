# Rollback and Emergency Procedures Guide

## Overview

This document provides comprehensive rollback procedures and emergency response plans for the SmartSlate Polaris v3 production deployment with Razorpay payment integration.

## Emergency Contact Information

### Primary Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|-------------|
| **Production Lead** | [Production Lead Name] | +91-XXXXXXXXXX | 24/7 |
| **DevOps Engineer** | [DevOps Name] | +91-XXXXXXXXXX | 24/7 |
| **Backend Developer** | [Backend Dev Name] | +91-XXXXXXXXXX | 24/7 |
| **Frontend Developer** | [Frontend Dev Name] | +91-XXXXXXXXXX | 24/7 |
| **Database Admin** | [DBA Name] | +91-XXXXXXXXXX | 24/7 |

### External Service Contacts

| Service | Contact | Purpose |
|---------|---------|---------|
| **Vercel Support** | support@vercel.com | Deployment issues, platform outages |
| **Supabase Support** | support@supabase.io | Database issues, connectivity problems |
| **Razorpay Support** | support@razorpay.com | Payment processing issues |
| **Domain Registrar** | [Domain Provider] | DNS issues, SSL certificate problems |

### Internal Communication Channels

| Channel | Purpose | Access |
|---------|---------|--------|
| **Slack #incidents** | Real-time incident coordination | All team members |
| **Email alerts** | Critical notifications | All stakeholders |
| **Phone tree** | Emergency escalation | Management team |

## Incident Classification

### Severity Levels

| Severity | Definition | Response Time | Escalation |
|----------|------------|---------------|------------|
| **Critical** | System unavailable, data loss, payment processing down | 15 minutes | Immediate executive notification |
| **High** | Significant performance impact, payment failures >10% | 1 hour | Department head notification |
| **Medium** | Minor performance issues, intermittent failures | 4 hours | Team lead notification |
| **Low** | Performance monitoring alerts, resource warnings | 24 hours | Documentation and monitoring |

### Incident Types

#### Payment System Incidents
- Payment processing failures
- Webhook delivery issues
- Razorpay API problems
- Subscription management failures

#### Infrastructure Incidents
- Application deployment failures
- Database connectivity issues
- CDN/static asset problems
- SSL certificate issues

#### Security Incidents
- Unauthorized access attempts
- Data exposure risks
- API key compromise
- DDoS attacks

## Rollback Procedures

### Quick Rollback (Code Only)

**When to Use**: Application deployment issues, non-critical bugs

**Procedure**:
```bash
# 1. Identify the problematic commit
git log --oneline -10

# 2. Revert the problematic commit
git revert <problematic-commit-hash>

# 3. Push the revert to trigger automatic rollback
git push origin main

# 4. Monitor Vercel deployment
# - Check Vercel dashboard for deployment status
# - Verify application health endpoints
# - Monitor error rates

# 5. Run smoke tests
npm run smoke:tests:prod
```

**Expected Time**: 5-15 minutes

### Full Rollback (Code + Database)

**When to Use**: Database migration issues, data corruption, critical functionality failures

**Procedure**:
```bash
# 1. Immediate application rollback
git revert HEAD~1
git push origin main

# 2. Database rollback preparation
# - Identify the database backup to restore
# - Prepare rollback script
# - Schedule maintenance window if needed

# 3. Database rollback execution
psql "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" < backup-file.sql

# 4. Verification
npm run db:verify:prod
npm run smoke:tests:prod
```

**Expected Time**: 30-60 minutes

### Emergency Service Shutdown

**When to Use**: Data breach, critical security vulnerability, system compromise

**Procedure**:
```bash
# 1. Vercel Deployment Pause
# - Go to Vercel dashboard
# - Pause automatic deployments
# - Scale down functions to 0

# 2. Disable Payment Processing
# - Set NEXT_PUBLIC_ENABLE_PAYMENTS=false in Vercel
# - Deploy this configuration change immediately
# - Notify Razorpay to disable webhooks if needed

# 3. Database Access Restriction
# - Disable application database access
# - Enable read-only mode if possible
# - Restrict to admin access only

# 4. Communication
# - Activate incident response team
# - Notify all stakeholders
# - Update status page
```

**Expected Time**: 5-10 minutes

## Database Rollback Procedures

### Backup-Based Rollback

**Prerequisites**:
- Recent database backup available
- Backup integrity verified
- Rollback script tested in staging

**Procedure**:
```bash
# 1. Create pre-rollback backup
pg_dump "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" > emergency-backup-$(date +%Y%m%d_%H%M%S).sql

# 2. Identify target backup
ls -la /backups/polaris/ | grep "$(date +%Y%m%d)"

# 3. Perform rollback
psql "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" < /backups/polaris/target-backup.sql

# 4. Verify rollback
npm run db:verify:prod

# 5. Update application if needed
# - Revert any application code that depends on rolled-back schema
# - Deploy reverted application
```

### Migration-Specific Rollback

**For Razorpay Migration Rollback**:
```sql
-- 1. Drop Razorpay tables (CASCADE to handle dependencies)
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS razorpay_webhook_events CASCADE;

-- 2. Drop associated functions
DROP FUNCTION IF EXISTS get_active_subscription CASCADE;
DROP FUNCTION IF EXISTS cancel_subscription CASCADE;
DROP FUNCTION IF EXISTS sync_subscription_to_user_profile CASCADE;
DROP FUNCTION IF EXISTS calculate_user_blueprint_stats CASCADE;
DROP FUNCTION IF EXISTS increment_blueprint_creation_count CASCADE;

-- 3. Drop triggers
DROP TRIGGER IF EXISTS trigger_sync_subscription_to_user_profile ON subscriptions;
DROP TRIGGER IF EXISTS trigger_update_subscriptions_updated_at ON subscriptions;

-- 4. Revert user_profiles changes
ALTER TABLE user_profiles DROP COLUMN IF EXISTS subscription_tier;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS subscription_id;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS blueprint_creation_count;
ALTER TABLE user_profiles DROP COLUMN IF EXISTS blueprint_saving_count;

-- 5. Remove updated_at trigger if it was added
DROP TRIGGER IF EXISTS trigger_update_user_profiles_updated_at ON user_profiles;
DROP FUNCTION IF EXISTS update_user_profiles_updated_at;
```

## Payment System Emergency Procedures

### Razorpay Service Outage

**Symptoms**:
- Payment processing failures
- Checkout modal not loading
- Webhook delivery failures

**Immediate Actions**:
```bash
# 1. Check Razorpay status
curl -I https://api.razorpay.com/v1/payments

# 2. Verify webhook endpoint health
curl -X GET https://your-domain.com/api/webhooks/razorpay

# 3. Check recent payment attempts
SELECT * FROM payments
WHERE created_at > NOW() - INTERVAL '1 hour'
AND status != 'captured'
ORDER BY created_at DESC;

# 4. Enable maintenance mode if needed
# - Update status page
# - Display maintenance notice
# - Queue failed payments for retry
```

**Communication**:
- Notify users of payment processing issues
- Update status page with ETA
- Provide alternative payment methods if available

### Payment Processing Failures

**Symptoms**:
- High payment failure rate (>5%)
- Specific payment method failures
- User reports of payment issues

**Investigation Steps**:
```sql
-- 1. Check recent payment failures
SELECT
    status,
    COUNT(*) as count,
    error_message,
    created_at
FROM payments
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status, error_message, created_at
ORDER BY count DESC;

-- 2. Check webhook processing
SELECT
    event_type,
    processing_status,
    error_message,
    COUNT(*) as count
FROM razorpay_webhook_events
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY event_type, processing_status, error_message
ORDER BY count DESC;

-- 3. Check Razorpay plan configuration
# Use Razorpay Dashboard to verify plan status
```

**Resolution Actions**:
- Fix configuration issues if identified
- Retry failed webhook events
- Refund failed payments if necessary
- Update affected user subscriptions

## Webhook Emergency Procedures

### Webhook Processing Failures

**Symptoms**:
- User subscriptions not updating
- Payment confirmation delays
- High webhook error rates

**Diagnosis**:
```bash
# 1. Check webhook endpoint accessibility
curl -X POST https://your-domain.com/api/webhooks/razorpay \
  -H "Content-Type: application/json" \
  -H "X-Razorpay-Signature: test" \
  -d '{"event": {"payment": {"entity": {"id": "test"}}}}'

# 2. Check webhook secret configuration
echo $RAZORPAY_WEBHOOK_SECRET

# 3. Verify recent webhook events
SELECT * FROM razorpay_webhook_events
WHERE created_at > NOW() - INTERVAL '1 hour'
AND processing_status = 'failed'
ORDER BY created_at DESC;
```

**Resolution**:
```bash
# 1. Update webhook secret if needed
# - Update in Vercel environment variables
# - Update in Razorpay dashboard
# - Redeploy application

# 2. Retry failed webhook events
# - Use manual retry script
# - Process events in chronological order
# - Monitor for duplicate processing

# 3. Fix data inconsistencies
# - Manually update user subscriptions
# - Sync payment records with Razorpay
# - Verify data integrity
```

### Manual Webhook Processing

**For Critical Webhook Failures**:
```typescript
// Manual webhook processing script
import crypto from 'crypto';

async function processManually(eventId: string) {
  // 1. Get event from Razorpay
  const event = await razorpay.events.retrieve(eventId);

  // 2. Verify signature
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(JSON.stringify(event))
    .digest('hex');

  // 3. Process based on event type
  switch (event.event) {
    case 'payment.captured':
      await handlePaymentCaptured(event);
      break;
    case 'subscription.activated':
      await handleSubscriptionActivated(event);
      break;
    // ... other event types
  }
}
```

## Infrastructure Emergency Procedures

### Vercel Deployment Issues

**Symptoms**:
- Build failures
- Deployment not updating
- Function errors
- High response times

**Resolution Steps**:
```bash
# 1. Check Vercel dashboard for build logs
# - Look for specific error messages
# - Check environment variable configuration
# - Verify build dependencies

# 2. Local build test
cd frontend
npm ci
npm run build
npm run start

# 3. Environment variable verification
npm run validate:production

# 4. Force redeploy if needed
git commit --allow-empty -m "trigger: Force redeploy"
git push origin main
```

### Database Connectivity Issues

**Symptoms**:
- Database connection timeouts
- High database error rates
- Data retrieval failures

**Resolution**:
```bash
# 1. Check database connection
psql "postgresql://postgres:$SUPABASE_DB_PASSWORD@db.$SUPABASE_PROJECT_REF.supabase.co:5432/postgres" -c "SELECT 1;"

# 2. Check connection pool status
SELECT * FROM pg_stat_activity WHERE state = 'active';

# 3. Monitor database performance
SELECT
    query,
    calls,
    total_time,
    mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

# 4. Restart application if needed
# - Redeploy application to reset connections
# - Monitor connection pool recovery
```

## Security Incident Response

### Data Breach Response

**Immediate Actions** (within 15 minutes):
```bash
# 1. Contain the breach
# - Change all API keys immediately
# - Disable compromised accounts
# - Enable additional monitoring

# 2. Assess scope
# - Review access logs
# - Identify affected data
# - Check for unauthorized changes

# 3. Secure systems
# - Force password resets
# - Revoke all sessions
# - Enable additional authentication
```

**Investigation Steps**:
```bash
# 1. Check access logs
grep "suspicious" /var/log/nginx/access.log | tail -100

# 2. Review API usage patterns
SELECT user_id, COUNT(*) as requests
FROM request_logs
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY user_id
ORDER BY requests DESC;

# 3. Verify data integrity
SELECT COUNT(*) FROM user_profiles;
SELECT COUNT(*) FROM subscriptions;
SELECT COUNT(*) FROM payments;
```

### API Key Compromise

**Response Actions**:
```bash
# 1. Immediately rotate compromised keys
# - Generate new Razorpay API keys
# - Update all environment variables
# - Redeploy application with new keys

# 2. Update webhook configuration
# - Generate new webhook secret
# - Update Razorpay dashboard
# - Update application configuration

# 3. Audit recent usage
# - Check for unauthorized transactions
# - Review webhook processing logs
# - Verify user subscription changes
```

## Communication Procedures

### Internal Communication

**Alert Escalation Flow**:
```
Level 1: On-call engineer (15 min response)
    ↓
Level 2: Team lead (1 hour if unresolved)
    ↓
Level 3: Engineering manager (4 hours if unresolved)
    ↓
Level 4: CTO/VP Engineering (immediate for critical)
```

**Status Update Frequency**:
- **Critical**: Every 15 minutes
- **High**: Every 30 minutes
- **Medium**: Every 2 hours
- **Low**: Daily

### External Communication

**User Notification Templates**:

**Service Outage**:
```
Subject: SmartSlate Service Outage - Payment Processing Issues

Dear SmartSlate User,

We are currently experiencing technical difficulties with our payment processing system. Our team is actively working to resolve the issue.

Impact:
- Unable to process new subscription payments
- Existing subscriptions remain active
- Blueprint creation continues to work

ETA: We expect to restore service within [timeframe].

We apologize for the inconvenience and appreciate your patience.

Status Page: https://status.smartslate.ai
Support: support@smartslate.ai
```

**Maintenance Notification**:
```
Subject: Scheduled Maintenance - SmartSlate Platform

Dear SmartSlate User,

We will be performing scheduled maintenance on the SmartSlate platform.

Date: [Date]
Time: [Time] - [Time] (UTC)
Duration: [Duration]

Impact:
- Brief service interruptions expected
- Payment processing temporarily unavailable
- Some features may be unavailable

We recommend saving your work before the maintenance window.

Thank you for your understanding.
```

## Recovery Procedures

### Post-Incident Recovery

**After Critical Incident Resolution**:

1. **System Verification**:
   ```bash
   # Run full smoke test suite
   npm run smoke:tests:prod

   # Verify payment processing
   # - Process test payment
   # - Check webhook processing
   # - Verify user tier updates

   # Check data integrity
   npm run db:verify:prod
   ```

2. **Data Consistency Check**:
   ```sql
   -- Verify subscription data consistency
   SELECT s.*, up.subscription_tier as user_tier
   FROM subscriptions s
   JOIN user_profiles up ON s.user_id = up.user_id
   WHERE s.status = 'active'
   AND up.subscription_tier != s.subscription_tier;

   -- Check for orphaned payments
   SELECT p.*
   FROM payments p
   LEFT JOIN subscriptions s ON p.subscription_id = s.subscription_id
   WHERE p.status = 'captured'
   AND s.subscription_id IS NULL;
   ```

3. **Performance Verification**:
   - Monitor response times for 1 hour
   - Check error rates return to normal
   - Verify payment processing success rates

### Service Restoration Checklist

**Before declaring service restored**:
- [ ] All automated tests passing
- [ ] Manual payment processing test successful
- [ ] Webhook processing working correctly
- [ ] Database operations normal
- [ ] No error alerts active
- [ ] Performance metrics within normal range
- [ ] Security scan completed
- [ ] Backup systems verified

## Documentation and Learning

### Incident Reporting

**Incident Report Template**:
```markdown
# Incident Report

**Incident ID**: [Auto-generated]
**Date**: [Date of incident]
**Severity**: [Critical/High/Medium/Low]
**Duration**: [Start time] - [End time]

## Summary
[Brief description of the incident]

## Impact
[Description of user impact]

## Timeline
- [Time]: [Event]
- [Time]: [Detection]
- [Time]: [Response initiated]
- [Time]: [Resolution]
- [Time]: [Service restored]

## Root Cause Analysis
[Detailed analysis of what caused the incident]

## Resolution Steps
[Step-by-step description of how the incident was resolved]

## Impact Assessment
- Number of users affected: [Count]
- Revenue impact: [Amount]
- Data loss: [Yes/No]
- Security impact: [Yes/No]

## Lessons Learned
[What we learned and what we can improve]

## Preventive Measures
[Actions to prevent similar incidents]

## Follow-up Actions
[Items that need follow-up]
```

### Continuous Improvement

**Monthly Review Items**:
- Review all incident reports from past month
- Update response procedures based on lessons learned
- Test emergency contact information
- Verify rollback procedures still work
- Update documentation as needed

**Quarterly Review Items**:
- Full emergency response drill
- Update contact lists and communication channels
- Review and update incident classification criteria
- Test backup and restore procedures
- Security audit and penetration testing

---

**Last Updated**: October 30, 2025
**Next Review Date**: January 30, 2026
**Document Owner**: Production Engineering Team

**Emergency**: If you need to use these procedures, contact the Production Lead immediately at the phone number listed above.