# Operational Procedures Guide

**Generated**: October 30, 2025
**Version**: 1.0
**Scope**: SmartSlate Polaris v3 Platform Operations & Maintenance

## Executive Summary

This guide provides comprehensive operational procedures for the SmartSlate Polaris v3 platform, including monitoring dashboards, incident response protocols, maintenance procedures, and day-to-day operational guidelines. These procedures ensure platform reliability, performance, and security while providing clear instructions for the operations team.

## Operational Dashboard Access

### Primary Monitoring Dashboard

**URL**: `/admin/monitoring`
**Access Required**: Developer role or higher
**Authentication**: Required via Supabase Auth

#### Dashboard Sections

1. **System Health Overview**
   - Overall system status (Healthy/Degraded/Unhealthy)
   - Service availability metrics
   - Active health check status
   - Recent system events

2. **Performance Metrics**
   - Real-time Core Web Vitals
   - API response times and error rates
   - Database performance metrics
   - Resource utilization charts

3. **Security & Alerting**
   - Active security alerts
   - Error classification and trends
   - Rate limiting status
   - Authentication events

4. **User Activity**
   - Active user sessions
   - Blueprint generation metrics
   - Subscription status overview
   - Feature usage analytics

### API Monitoring Endpoint

**Endpoint**: `GET /api/monitoring/status`
**Usage**: External monitoring tools and automation
**Authentication**: API key or internal network access

```bash
# Example usage
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://polaris.example.com/api/monitoring/status?include=system,health,performance,alerts"

# Prometheus metrics format
curl -H "Authorization: Bearer YOUR_API_KEY" \
     "https://polaris.example.com/api/monitoring/status?format=prometheus"
```

## Incident Response Procedures

### Incident Classification

| Severity | Definition | Response Time | Escalation |
|----------|------------|---------------|------------|
| Critical | System unavailable, data loss, security breach | 15 minutes | Immediate executive notification |
| High | Significant performance degradation, feature outage | 1 hour | Department head notification |
| Medium | Minor performance issues, intermittent errors | 4 hours | Team lead notification |
| Low | Performance monitoring alerts, resource warnings | 24 hours | Documentation and monitoring |

### Incident Response Workflow

#### Phase 1: Detection & Assessment (0-15 minutes)

1. **Initial Detection**
   - Automated monitoring alerts
   - User reports via support channels
   - Manual dashboard review
   - External monitoring tool notifications

2. **Immediate Assessment**
   ```bash
   # Check system status
   curl "https://polaris.example.com/api/monitoring/status"

   # Check recent errors
   grep -i "error\|critical" /var/log/polaris/app.log | tail -20

   # Check system resources
   top -bn1 | head -5
   df -h
   free -m
   ```

3. **Severity Determination**
   - Assess user impact
   - Determine affected systems
   - Evaluate business impact
   - Classify incident severity

4. **Initial Communication**
   - Activate incident response team
   - Send initial notification to stakeholders
   - Document incident in tracking system
   - Establish communication channels

#### Phase 2: Investigation & Mitigation (15 minutes - 2 hours)

1. **Root Cause Analysis**
   ```bash
   # Check application logs
   tail -f /var/log/polaris/app.log | grep -E "(ERROR|CRITICAL)"

   # Check database status
   psql $DATABASE_URL -c "SELECT count(*) FROM blueprint_generator WHERE created_at > NOW() - INTERVAL '1 hour';"

   # Check external service status
   curl -I "https://api.anthropic.com/v1/messages"
   curl -I "https://[PROJECT-REF].supabase.co/rest/v1/"
   ```

2. **System Health Checks**
   - Verify database connectivity
   - Check API endpoint responses
   - Validate external service connections
   - Review system resource utilization

3. **Mitigation Actions**
   - Implement temporary fixes
   - Restart affected services if needed
   - Scale resources if necessary
   - Apply emergency patches

4. **Communication Updates**
   - Provide status updates to stakeholders
   - Update incident tracking system
   - Document actions taken
   - Estimate resolution timeline

#### Phase 3: Resolution & Recovery (2-4 hours)

1. **Permanent Fixes**
   - Deploy code fixes if applicable
   - Update configuration settings
   - Implement infrastructure changes
   - Test resolution effectiveness

2. **Verification**
   ```bash
   # Test critical functionality
   curl -X POST "https://polaris.example.com/api/questionnaire/save" \
        -H "Content-Type: application/json" \
        -d '{"staticAnswers": {"test": "data"}}'

   # Verify database operations
   psql $DATABASE_URL -c "SELECT COUNT(*) FROM blueprint_generator WHERE status = 'draft';"

   # Check performance metrics
   curl "https://polaris.example.com/api/monitoring/status?include=performance"
   ```

3. **Service Restoration**
   - Monitor system performance
   - Verify all services are operational
   - Confirm user functionality is restored
   - Validate no data loss or corruption

4. **Final Communication**
   - Announce incident resolution
   - Provide post-incident summary
   - Share lessons learned
   - Update documentation

#### Phase 4: Post-Incident Review (24-48 hours)

1. **Incident Analysis**
   - Document root cause analysis
   - Review timeline and response effectiveness
   - Identify areas for improvement
   - Update incident response procedures

2. **Preventive Measures**
   - Implement monitoring improvements
   - Add or modify alerting rules
   - Update operational procedures
   - Schedule additional training if needed

3. **Knowledge Management**
   - Update incident knowledge base
   - Create runbooks for common issues
   - Share findings with development team
   - Review with management team

## Scheduled Maintenance Procedures

### Daily Maintenance Tasks

#### Morning Checklist (9:00 AM UTC)

1. **System Health Review**
   ```bash
   # Check dashboard for active alerts
   # Verify system status indicators
   # Review overnight error logs
   # Check automated backup completion
   ```

2. **Performance Metrics Review**
   - Review Core Web Vitals trends
   - Check API response times
   - Analyze error rates
   - Monitor resource utilization

3. **Security Review**
   - Review security event logs
   - Check for unusual authentication patterns
   - Verify rate limiting effectiveness
   - Review access logs for anomalies

4. **User Activity Review**
   - Check active user sessions
   - Review blueprint generation metrics
   - Monitor subscription status changes
   - Analyze feature usage patterns

#### Evening Checklist (6:00 PM UTC)

1. **Daily Performance Summary**
   - Generate daily performance report
   - Document any issues or anomalies
   - Review completed maintenance tasks
   - Plan next day's priorities

2. **Backup Verification**
   ```bash
   # Verify backup completion
   ls -la /backups/polaris/$(date +%Y%m%d)*

   # Check backup integrity
   pg_verifybackup /backups/polaris/$(date +%Y%m%d)_backup

   # Test restore capability (monthly)
   # pg_restore --clean --if-exists -d test_db /backups/polaris/$(date +%Y%m%d)_backup
   ```

3. **Log Rotation & Cleanup**
   ```bash
   # Rotate application logs
   logrotate /etc/logrotate.d/polaris

   # Clean up old logs (keep 30 days)
   find /var/log/polaris -name "*.log" -mtime +30 -delete

   # Clean up old monitoring data
   psql $DATABASE_URL -c "DELETE FROM monitoring_events WHERE timestamp < NOW() - INTERVAL '90 days';"
   ```

### Weekly Maintenance Tasks

#### Sunday Maintenance Window (2:00 AM - 4:00 AM UTC)

1. **System Updates**
   ```bash
   # Check for security updates
   apt list --upgradable

   # Apply system patches (after testing)
   apt update && apt upgrade -y

   # Update Node.js dependencies
   cd /opt/polaris/frontend
   npm audit fix
   npm update
   ```

2. **Database Maintenance**
   ```sql
   -- Analyze database tables for query optimization
   ANALYZE blueprint_generator;
   ANALYZE user_profiles;
   ANALYZE razorpay_subscriptions;

   -- Check table sizes and growth
   SELECT schemaname,tablename,attname,n_distinct,correlation FROM pg_stats;

   -- Rebuild indexes if necessary (monthly)
   REINDEX DATABASE polaris;
   ```

3. **Performance Optimization**
   ```bash
   # Clear application caches
   redis-cli FLUSHDB

   # Optimize database queries (review slow query log)
   psql $DATABASE_URL -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

   # Update application configuration if needed
   # Restart services with minimal downtime
   systemctl restart polaris-app
   ```

4. **Security Maintenance**
   ```bash
   # Review SSL certificate expiration
   openssl x509 -in /etc/ssl/certs/polaris.crt -noout -dates

   # Check for security vulnerabilities
   npm audit --audit-level high

   # Review access logs for suspicious patterns
   grep -i "attack\|intrusion\|malicious" /var/log/nginx/access.log | tail -20
   ```

### Monthly Maintenance Tasks

#### First Weekend of Month

1. **Capacity Planning Review**
   - Analyze resource utilization trends
   - Review storage capacity needs
   - Evaluate bandwidth usage patterns
   - Plan infrastructure scaling

2. **Performance Baseline Updates**
   ```bash
   # Generate performance baseline report
   curl "https://polaris.example.com/api/monitoring/status?include=performance&timeRange=30d" > /reports/performance_baseline_$(date +%Y%m).json

   # Update performance thresholds based on data
   # Review and adjust alerting rules
   ```

3. **Security Audit Review**
   - Review access control changes
   - Audit user permissions and roles
   - Review security incident logs
   - Update security policies

4. **Documentation Updates**
   - Update operational procedures
   - Review and update runbooks
   - Document system changes
   - Update architecture diagrams

## Emergency Procedures

### System Outage Response

#### Complete System Unavailability

1. **Immediate Actions**
   ```bash
   # Check system status
   systemctl status polaris-app
   systemctl status nginx
   systemctl status postgresql

   # Restart services if needed
   systemctl restart polaris-app
   systemctl restart nginx

   # Check logs for errors
   journalctl -u polaris-app -f
   tail -f /var/log/nginx/error.log
   ```

2. **Database Issues**
   ```bash
   # Check database status
   pg_isready -h localhost -p 5432

   # Restart database if needed
   systemctl restart postgresql

   # Check database connections
   psql $DATABASE_URL -c "SELECT count(*) FROM pg_stat_activity;"

   # Kill long-running queries if necessary
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE state = 'active' AND query_start < now() - interval '5 minutes';
   ```

3. **External Service Issues**
   ```bash
   # Check Claude API status
   curl -H "Authorization: Bearer $ANTHROPIC_API_KEY" \
        "https://api.anthropic.com/v1/messages" \
        -X POST -d '{"model": "claude-3-haiku-20240307", "max_tokens": 10, "messages": [{"role": "user", "content": "test"}]}'

   # Check Supabase status
   curl -H "apikey: $SUPABASE_ANON_KEY" \
        "https://[PROJECT-REF].supabase.co/rest/v1/blueprint_generator?select=count"

   # Fallback configurations if external services are down
   # Update environment variables to use fallback services
   ```

### Performance Degradation Response

#### Slow Response Times

1. **Immediate Diagnostics**
   ```bash
   # Check system resources
   top -bn1 | head -10
   free -m
   df -h

   # Check application performance
   curl -w "@curl-format.txt" -o /dev/null -s "https://polaris.example.com/api/monitoring/status"

   # Database performance check
   psql $DATABASE_URL -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
   ```

2. **Performance Optimization**
   ```bash
   # Clear caches
   redis-cli FLUSHDB

   # Restart application services
   systemctl restart polaris-app

   # Scale resources if available (cloud environments)
   # Kubernetes: kubectl scale deployment polaris-app --replicas=4
   # Docker: docker-compose up -d --scale polaris-app=2
   ```

### Security Incident Response

#### Suspicious Activity Detection

1. **Immediate Security Assessment**
   ```bash
   # Check for failed authentication attempts
   grep "Failed login" /var/log/auth.log | tail -20

   # Review access logs for anomalies
   grep -E "(attack|intrusion|malicious)" /var/log/nginx/access.log | tail -20

   # Check database access patterns
   psql $DATABASE_URL -c "SELECT user_id, COUNT(*), MAX(created_at) FROM blueprint_generator GROUP BY user_id HAVING COUNT(*) > 100 ORDER BY COUNT(*) DESC;"
   ```

2. **Security Incident Containment**
   ```bash
   # Block suspicious IP addresses
   iptables -A INPUT -s [SUSPICIOUS_IP] -j DROP

   # Disable affected user accounts
   psql $DATABASE_URL -c "UPDATE auth.users SET email_confirmed = false WHERE email = 'suspicious@example.com';"

   # Enable additional monitoring
   # Increase log levels and monitoring frequency
   ```

## Automation & Tooling

### Monitoring Scripts

#### Daily Health Check Script

```bash
#!/bin/bash
# /opt/scripts/daily_health_check.sh

LOG_FILE="/var/log/polaris/health_check.log"
DATE=$(date +%Y-%m-%d_%H:%M:%S)

echo "[$DATE] Starting daily health check" >> $LOG_FILE

# Check API endpoint health
API_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://polaris.example.com/api/health")
if [ $API_HEALTH -eq 200 ]; then
    echo "[$DATE] API Health: OK" >> $LOG_FILE
else
    echo "[$DATE] API Health: FAILED (HTTP $API_HEALTH)" >> $LOG_FILE
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -d '{"text":"Polaris API health check failed with HTTP '$API_HEALTH'"}'
fi

# Check database connectivity
DB_HEALTH=$(pg_isready -h localhost -p 5432)
if [ $? -eq 0 ]; then
    echo "[$DATE] Database Health: OK" >> $LOG_FILE
else
    echo "[$DATE] Database Health: FAILED" >> $LOG_FILE
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -d '{"text":"Polaris database health check failed"}'
fi

# Check disk space
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -lt 85 ]; then
    echo "[$DATE] Disk Usage: OK ($DISK_USAGE%)" >> $LOG_FILE
else
    echo "[$DATE] Disk Usage: WARNING ($DISK_USAGE%)" >> $LOG_FILE
    # Send alert
    curl -X POST "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK" \
         -d '{"text":"Polaris disk usage is '$DISK_USAGE'%"}'
fi

echo "[$DATE] Daily health check completed" >> $LOG_FILE
```

#### Automated Backup Script

```bash
#!/bin/bash
# /opt/scripts/backup_database.sh

BACKUP_DIR="/backups/polaris"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/polaris_backup_$DATE.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform database backup
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress backup
gzip $BACKUP_FILE

# Verify backup was created
if [ -f "${BACKUP_FILE}.gz" ]; then
    echo "Backup successful: ${BACKUP_FILE}.gz"
else
    echo "Backup failed!"
    exit 1
fi

# Clean up old backups (keep 30 days)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete

# Copy to remote storage (if configured)
# aws s3 cp ${BACKUP_FILE}.gz s3://polaris-backups/database/
```

### Cron Job Configuration

```bash
# /etc/crontab

# Daily health check at 9 AM UTC
0 9 * * * root /opt/scripts/daily_health_check.sh

# Daily database backup at 2 AM UTC
0 2 * * * postgres /opt/scripts/backup_database.sh

# Log rotation daily at 3 AM UTC
0 3 * * * root /usr/sbin/logrotate /etc/logrotate.d/polaris

# Weekly system maintenance on Sunday at 2 AM UTC
0 2 * * 0 root /opt/scripts/weekly_maintenance.sh

# Monthly performance report on 1st at 1 AM UTC
0 1 1 * * root /opt/scripts/monthly_performance_report.sh
```

## Communication Procedures

### Internal Communication

#### Incident Notification Templates

**Critical Incident (Immediate)**
```
🚨 CRITICAL INCIDENT - Polaris v3 Platform

Status: DOWN
Impact: System unavailable - users cannot access the platform
Started: [TIME]
Estimated Resolution: Unknown

Actions in Progress:
- [x] Incident response team activated
- [x] Investigating root cause
- [ ] Implementing fixes

Next Update: [TIME in 30 minutes]

Status Page: https://status.polaris.example.com
Incident Channel: #incidents-polaris
```

**High Severity Incident**
```
⚠️ HIGH SEVERITY INCIDENT - Polaris v3 Platform

Status: DEGRADED
Impact: [Specific impact description]
Started: [TIME]
Estimated Resolution: [TIME]

Current Status: [Brief status update]

Next Update: [TIME in 1 hour]

Dashboard: https://polaris.example.com/admin/monitoring
```

### External Communication

#### Status Page Updates

**Maintenance Notification (24 hours in advance)**
```
Scheduled Maintenance - Polaris v3 Platform

Date: [DATE]
Time: [TIME] - [TIME]
Duration: [DURATION]
Impact: [What users can expect]

During this window, users may experience:
- Brief periods of unavailability
- Slower response times
- Limited feature access

We apologize for any inconvenience.
```

**Service Outage Notification**
```
Service Outage - Polaris v3 Platform

Status: DOWN
Started: [TIME]
Impact: Users are unable to access the platform

Our team is actively working to resolve the issue.
We apologize for the inconvenience and appreciate your patience.

Updates will be posted here: https://status.polaris.example.com
```

## Team Responsibilities

### On-Call Rotation

**Primary On-Call Engineer**
- Respond to alerts within 15 minutes (critical), 1 hour (high)
- Lead incident response efforts
- Coordinate with development team
- Document incident resolution

**Secondary On-Call Engineer**
- Backup support for primary on-call
- Handle lower severity incidents
- Perform routine monitoring tasks
- Assist with maintenance procedures

### Handoff Procedures

**Daily Handoff (9:00 AM UTC)**
- Review overnight incidents and resolutions
- Discuss ongoing issues and their status
- Hand off active tickets and tasks
- Share any concerns about system performance

**Weekly Handoff (Monday 9:00 AM UTC)**
- Review weekly performance metrics
- Discuss maintenance completed and planned
- Review team capacity and workload
- Plan priorities for the coming week

## Conclusion

These operational procedures provide a comprehensive framework for managing the SmartSlate Polaris v3 platform effectively. Regular adherence to these procedures ensures high availability, optimal performance, and rapid incident response capabilities.

The procedures should be reviewed quarterly and updated based on system changes, team feedback, and lessons learned from operational experiences. Continuous improvement of operational processes is essential for maintaining platform reliability and user satisfaction.

---

*This operational procedures guide should be reviewed and updated quarterly to reflect system changes, team structure updates, and lessons learned from operational incidents.*