# Production Monitoring Setup Guide

## Overview

This guide covers the comprehensive production monitoring setup for SmartSlate Polaris v3, including alerting, performance monitoring, webhook tracking, and system health monitoring.

## Architecture

The production monitoring system consists of multiple layers:

1. **Alerting System** - Real-time alerts for critical issues
2. **Performance Monitoring** - System performance and API response times
3. **Webhook Logging** - Detailed payment webhook processing logs
4. **Vercel Integration** - Native Vercel monitoring tools
5. **Dashboard** - Real-time monitoring dashboard

## Environment Variables

### Required Environment Variables

Add these to your Vercel production environment:

```bash
# Alert Configuration
PROD_ALERT_EMAIL=admin@smartslate.com,ops@smartslate.com
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
EXTERNAL_MONITORING_WEBHOOK_URL=https://your-monitoring-service.com/webhook
EXTERNAL_MONITORING_TOKEN=your-external-monitoring-token

# Vercel Integrations
VERCEL_ANALYTICS_ID=your-vercel-analytics-id
VERCEL_LOG_LEVEL=info

# Optional Enhanced Monitoring
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
LOGDNA_API_KEY=your-logdna-api-key
```

### Configuration Details

#### `PROD_ALERT_EMAIL`
- **Purpose**: Email recipients for critical alerts
- **Format**: Comma-separated email addresses
- **Example**: `admin@smartslate.com,ops@smartslate.com,devops@smartslate.com`

#### `SLACK_WEBHOOK_URL`
- **Purpose**: Slack channel for real-time notifications
- **Setup**: Create Slack app and webhook at https://api.slack.com/apps
- **Channel**: Recommended to use `#production-alerts`

#### `EXTERNAL_MONITORING_WEBHOOK_URL`
- **Purpose**: External monitoring service integration
- **Format**: HTTPS endpoint for receiving alert notifications
- **Authentication**: Use `EXTERNAL_MONITORING_TOKEN` for bearer auth

## Monitoring Components

### 1. Production Alert Rules

The system includes these production alert rules:

#### Payment Monitoring
- **Critical Payment Failure Rate** - Triggers when >5% payments fail in 5 minutes
- **Webhook Processing Failure** - Triggers on 3 consecutive webhook failures
- **Razorpay Signature Verification Failure** - Triggers on any signature verification failure
- **Payment API Response Time Degradation** - Triggers when API response time >3 seconds
- **Subscription Processing Delay** - Triggers when subscription processing >30 seconds

#### System Health
- **Database Connection Issues** - Triggers on database connection errors
- **High Error Rate in AI Services** - Triggers when AI service error rate >10%
- **Rate Limit Abuse Detection** - Triggers on frequent rate limit violations
- **Memory Usage High** - Triggers when memory usage >80%
- **Service Unhealthy** - Triggers when any critical health check fails

### 2. Vercel Integration Features

#### Analytics Tracking
- Payment events (initiated, completed, failed)
- Subscription creation events
- Performance metrics by route
- User interaction tracking

#### Speed Insights
- Core Web Vitals monitoring (LCP, FID, CLS)
- Route-specific performance tracking
- Automatic performance degradation alerts

#### Logs Integration
- Structured logging with JSON format
- Automatic error pattern detection
- Log aggregation and filtering

### 3. Webhook Logging

Comprehensive logging for Razorpay webhook processing:

- **Security Events** - Signature verification, authentication
- **Processing Events** - Event processing start/completion
- **Performance Metrics** - Processing times, retry counts
- **Business Events** - Payment completions, subscription changes
- **Error Tracking** - Detailed error information with context

### 4. Monitoring Dashboard

Real-time dashboard with:
- System health overview
- Payment processing metrics
- Recent alerts and events
- Performance metrics visualization
- Configuration status

## Setup Instructions

### 1. Configure Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add all required environment variables listed above
3. Ensure all variables are marked for production environment
4. Redeploy the application to apply changes

### 2. Initialize Production Monitoring

After deploying with the environment variables:

```bash
# Test the monitoring setup
curl -X POST https://your-domain.com/api/monitoring/production-setup \
  -H "Content-Type: application/json" \
  -d '{"action": "initialize", "testMode": false}'
```

### 3. Verify Configuration

Check the monitoring status:

```bash
# Get current status
curl -X POST https://your-domain.com/api/monitoring/production-setup \
  -H "Content-Type: application/json" \
  -d '{"action": "status"}'
```

### 4. Test Alerting

Test the alerting system:

```bash
# Run comprehensive test
curl -X POST https://your-domain.com/api/monitoring/production-setup \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

## Monitoring Dashboard Access

### Admin Dashboard
Access the production monitoring dashboard at:
`https://your-domain.com/admin/monitoring`

### API Endpoints
- **Status**: `/api/monitoring/status`
- **Production Setup**: `/api/monitoring/production-setup`
- **Health Check**: `/api/monitoring/health`

## Alert Notification Channels

### Email Alerts
- **Trigger**: Critical and error-level alerts
- **Recipients**: Configured via `PROD_ALERT_EMAIL`
- **Content**: Alert details, severity, and recommended actions

### Slack Notifications
- **Trigger**: All alert levels
- **Channel**: Configured via webhook
- **Format**: Rich Slack message with severity indicators

### External Monitoring
- **Trigger**: All alerts
- **Format**: JSON webhook payload
- **Authentication**: Bearer token via `EXTERNAL_MONITORING_TOKEN`

## Performance Monitoring

### Key Metrics

#### Payment Processing
- **Success Rate**: Target >95%
- **Response Time**: Target <2 seconds (P95)
- **Webhook Processing**: Target <1 second

#### System Health
- **Memory Usage**: Alert when >80%
- **Uptime**: Target >99%
- **API Response Time**: Target <500ms (P95)

#### Error Tracking
- **Error Rate**: Alert when >5%
- **Critical Errors**: Immediate alerting
- **Pattern Detection**: Automated alerting for known error patterns

### Custom Metrics

The system tracks these custom metrics:
- Payment success rate by tier
- Webhook processing times
- Subscription conversion rates
- AI service response times
- Database query performance

## Troubleshooting

### Common Issues

#### Alerts Not Triggering
1. Verify environment variables are correctly set
2. Check notification channel configurations
3. Review alert rule configurations
4. Test using the `/api/monitoring/production-setup` endpoint

#### Missing Environment Variables
1. Check Vercel environment variables configuration
2. Ensure variables are set for production environment
3. Redeploy after adding variables
4. Validate using the status endpoint

#### Dashboard Not Loading
1. Verify API endpoints are accessible
2. Check network connectivity to monitoring APIs
3. Review browser console for errors
4. Ensure proper authentication for admin access

#### Performance Issues
1. Check system health metrics
2. Review recent alerts for patterns
3. Monitor database performance
4. Check Vercel function logs

### Debug Mode

Enable debug logging by setting:
```bash
VERCEL_LOG_LEVEL=debug
```

### Log Analysis

Access structured logs via:
1. Vercel Dashboard → Functions → Logs
2. External log aggregation service (if configured)
3. API endpoint `/api/monitoring/status` with `include=logs`

## Maintenance

### Regular Tasks

#### Daily
- Review critical alerts
- Check system health metrics
- Monitor payment processing success rates

#### Weekly
- Review alert rule effectiveness
- Check notification channel configurations
- Analyze performance trends

#### Monthly
- Update alert thresholds if needed
- Review and rotate authentication tokens
- Audit notification channel recipients

### Alert Rule Maintenance

#### Adding New Rules
1. Edit `/frontend/lib/monitoring/productionConfig.ts`
2. Add rule to appropriate array (payment or system health)
3. Deploy changes
4. Test new rule using test endpoint

#### Modifying Rules
1. Update rule configuration in production config
2. Consider impact on alert frequency
3. Test changes in staging first
4. Deploy and verify

#### Disabling Rules
1. Set `enabled: false` in rule configuration
2. Document reason for disabling
3. Consider creating alternative rule if needed

## Security Considerations

### Sensitive Data
- Payment IDs are sanitized in logs (show only last 4 characters)
- User IDs are masked in non-production environments
- API keys and secrets never logged or exposed

### Access Control
- Monitoring dashboard requires admin authentication
- API endpoints have rate limiting
- Webhook authentication required for external integrations

### Audit Trail
- All alert triggers are logged
- Configuration changes are tracked
- Access to monitoring endpoints is logged

## Integration with External Services

### Sentry Integration
Optional Sentry integration for enhanced error tracking:

```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

### LogDNA Integration
Optional LogDNA integration for log aggregation:

```bash
LOGDNA_API_KEY=your-logdna-api-key
```

### Custom Webhooks
Configure custom webhooks for:
- PagerDuty integration
- Custom monitoring systems
- Incident management platforms

## Performance Impact

### Resource Usage
- Monitoring adds <5% overhead to API response times
- Memory usage increase: ~10-20MB
- Minimal impact on database performance

### Scaling Considerations
- Alert processing is rate-limited
- Log buffers automatically prune old entries
- Metrics collection is optimized for production scale

## Support and Escalation

### Contact Information
- **Technical Issues**: devops@smartslate.com
- **Configuration Help**: admin@smartslate.com
- **Emergency Contact**: [Update with actual contact]

### Escalation Procedures
1. **Level 1**: Check monitoring dashboard
2. **Level 2**: Review recent alerts and logs
3. **Level 3**: Contact technical support
4. **Emergency**: Use emergency contact procedures

---

## Quick Reference

### Essential Commands
```bash
# Check status
curl -X POST /api/monitoring/production-setup -d '{"action":"status"}'

# Initialize monitoring
curl -X POST /api/monitoring/production-setup -d '{"action":"initialize"}'

# Test monitoring
curl -X POST /api/monitoring/production-setup -d '{"action":"test"}'

# Health check
curl /api/monitoring/status
```

### Dashboard URLs
- **Production Dashboard**: `/admin/monitoring`
- **API Status**: `/api/monitoring/status`
- **Setup**: `/api/monitoring/production-setup`

### Alert Severity Levels
- **Critical**: Immediate action required
- **Error**: Investigation needed
- **Warning**: Monitor closely
- **Info**: Informational only

For technical support or questions about this monitoring setup, please refer to the contact information above or create an issue in the project repository.