#!/bin/bash

# =============================================================================
# 24-Hour Post-Launch Monitoring Script
# =============================================================================
# Comprehensive monitoring script for SmartSlate Polaris v3 production
# deployment with Razorpay payment integration.
#
# Usage: ./24hour-monitoring.sh [duration_hours]
#   duration_hours: Number of hours to monitor (default: 24)
#
# Features:
# - Real-time system health monitoring
# - Payment processing verification
# - Performance metrics collection
# - Automated alerting on issues
# - Comprehensive logging and reporting
# =============================================================================

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
LOG_DIR="$PROJECT_ROOT/monitoring-logs"
ALERT_LOG="$LOG_DIR/alerts.log"
METRICS_LOG="$LOG_DIR/metrics.log"
HEALTH_LOG="$LOG_DIR/health.log"
PAYMENT_LOG="$LOG_DIR/payment.log"
USER_LOG="$LOG_DIR/user.log"

# Default monitoring duration
DURATION_HOURS=${1:-24}
MONITORING_INTERVAL=300  # 5 minutes
CRITICAL_ALERT_INTERVAL=900  # 15 minutes

# Production configuration
PRODUCTION_URL="https://polaris.smartslate.ai"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"
ALERT_EMAIL="${ALERT_EMAIL:-alerts@smartslate.ai}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
MONITORING_START_TIME=$(date +%s)
MONITORING_END_TIME=$((MONITORING_START_TIME + (DURATION_HOURS * 3600)))
LAST_CRITICAL_ALERT=0
ISSUES_DETECTED=0
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Logging functions
log() {
    local level=$1
    local message=$2
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    echo -e "${NC}[${timestamp}] ${level} ${message}"

    # Also log to appropriate log file
    case $level in
        "INFO") echo "[$timestamp] INFO: $message" >> "$LOG_FILE" ;;
        "WARN") echo "[$timestamp] WARN: $message" >> "$ALERT_LOG" ;;
        "ERROR") echo "[$timestamp] ERROR: $message" >> "$ALERT_LOG" ;;
        "METRICS") echo "[$timestamp] METRICS: $message" >> "$METRICS_LOG" ;;
        "HEALTH") echo "[$timestamp] HEALTH: $message" >> "$HEALTH_LOG" ;;
        "PAYMENT") echo "[$timestamp] PAYMENT: $message" >> "$PAYMENT_LOG" ;;
        "USER") echo "[$timestamp] USER: $message" >> "$USER_LOG" ;;
    esac
}

info() {
    log "INFO" "$1"
}

warn() {
    log "WARN" "${YELLOW}$1${NC}"
    ((ISSUES_DETECTED++))
}

error() {
    log "ERROR" "${RED}$1${NC}"
    ((ISSUES_DETECTED++))
}

success() {
    log "SUCCESS" "${GREEN}$1${NC}"
}

metrics() {
    log "METRICS" "${CYAN}$1${NC}"
}

health() {
    log "HEALTH" "${PURPLE}$1${NC}"
}

payment() {
    log "PAYMENT" "${BLUE}$1${NC}"
}

user() {
    log "USER" "${GREEN}$1${NC}"
}

# Alert functions
send_alert() {
    local severity=$1
    local message=$2
    local current_time=$(date +%s)

    # Check if we should send a critical alert (rate limiting)
    if [[ "$severity" == "CRITICAL" ]]; then
        if ((current_time - LAST_CRITICAL_ALERT < CRITICAL_ALERT_INTERVAL)); then
            return
        fi
        LAST_CRITICAL_ALERT=$current_time
    fi

    # Send Slack notification if webhook is configured
    if [[ -n "$SLACK_WEBHOOK_URL" ]]; then
        local color=$([ "$severity" == "CRITICAL" ] && echo "#ff0000" || echo "#ff8c00")
        local emoji=$([ "$severity" == "CRITICAL" ] && echo "🚨" || echo "⚠️")

        curl -X POST "$SLACK_WEBHOOK_URL" \
            -H 'Content-Type: application/json' \
            -d "{
                \"text\": \"$emoji ${severity}: $message\",
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"fields\": [
                        {
                            \"title\": \"System\",
                            \"value\": \"SmartSlate Polaris v3\",
                            \"short\": true
                        },
                        {
                            \"title\": \"Environment\",
                            \"value\": \"Production\",
                            \"short\": true
                        },
                        {
                            \"title\": \"Timestamp\",
                            \"value\": \"$(date)\",
                            \"short\": true
                        },
                        {
                            \"title\": \"Issues Detected\",
                            \"value\": \"$ISSUES_DETECTED\",
                            \"short\": true
                        }
                    ]
                }]
            }" > /dev/null 2>&1 || warn "Failed to send Slack notification"
    fi

    # Log alert
    warn "$severity: $message"
}

# Health check functions
check_application_health() {
    local endpoint="$PRODUCTION_URL/api/health"
    local response_code
    local response_time

    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")
    response_time=$(curl -o /dev/null -s -w "%{time_total}" "$endpoint")

    ((TOTAL_CHECKS++))

    if [[ $response_code -eq 200 ]]; then
        if (( $(echo "$response_time < 1.0" | bc -l) )); then
            success "Application health check: OK (${response_time}s)"
            ((PASSED_CHECKS++))
            metrics "API Response Time: ${response_time}s"
        else
            warn "Application health check: SLOW (${response_time}s)"
        fi
    else
        error "Application health check: FAILED (HTTP $response_code)"
        send_alert "CRITICAL" "Application health check failed with HTTP $response_code"
    fi
}

check_webhook_health() {
    local endpoint="$PRODUCTION_URL/api/webhooks/razorpay"
    local response_code

    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint")

    ((TOTAL_CHECKS++))

    if [[ $response_code -eq 200 ]]; then
        success "Webhook health check: OK"
        ((PASSED_CHECKS++))
    else
        error "Webhook health check: FAILED (HTTP $response_code)"
        send_alert "CRITICAL" "Webhook health check failed with HTTP $response_code"
    fi
}

check_ssl_certificate() {
    local domain=$(echo "$PRODUCTION_URL" | sed 's|https://||')
    local cert_info

    cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)

    ((TOTAL_CHECKS++))

    if [[ -n "$cert_info" ]]; then
        local not_after=$(echo "$cert_info" | grep "notAfter=" | cut -d'=' -f2)
        local expiry_days=$(( ($(date -d "$not_after" +%s) - $(date +%s)) / 86400 ))

        if [[ $expiry_days -gt 7 ]]; then
            success "SSL certificate: Valid (expires in $expiry_days days)"
            ((PASSED_CHECKS++))
        else
            warn "SSL certificate: EXPIRING SOON (expires in $expiry_days days)"
            send_alert "HIGH" "SSL certificate expires in $expiry_days days"
        fi
    else
        error "SSL certificate: FAILED to retrieve certificate info"
        send_alert "CRITICAL" "SSL certificate check failed"
    fi
}

check_database_connectivity() {
    local endpoint="$PRODUCTION_URL/api/monitoring/database"
    local response_code
    local response_body

    response_body=$(curl -s "$endpoint")
    response_code=$?

    ((TOTAL_CHECKS++))

    if [[ $response_code -eq 0 && "$response_body" == *"healthy"* ]]; then
        success "Database connectivity: OK"
        ((PASSED_CHECKS++))
    else
        error "Database connectivity: FAILED"
        send_alert "CRITICAL" "Database connectivity check failed"
    fi
}

# Performance monitoring functions
check_api_performance() {
    local endpoints=(
        "/api/health"
        "/api/user/usage"
        "/api/questionnaire/save"
        "/api/pricing/plans"
    )

    for endpoint in "${endpoints[@]}"; do
        local full_url="$PRODUCTION_URL$endpoint"
        local response_time

        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$full_url")

        if [[ -n "$response_time" ]]; then
            if (( $(echo "$response_time < 2.0" | bc -l) )); then
                metrics "API Performance - $endpoint: ${response_time}s"
            else
                warn "API Performance - $endpoint: SLOW (${response_time}s)"
            fi
        fi
    done
}

check_page_load_times() {
    local pages=(
        "/"
        "/pricing"
        "/auth/login"
        "/dashboard"
    )

    for page in "${pages[@]}"; do
        local full_url="$PRODUCTION_URL$page"
        local response_time

        response_time=$(curl -o /dev/null -s -w "%{time_total}" "$full_url")

        if [[ -n "$response_time" ]]; then
            if (( $(echo "$response_time < 3.0" | bc -l) )); then
                metrics "Page Load Time - $page: ${response_time}s"
            else
                warn "Page Load Time - $page: SLOW (${response_time}s)"
            fi
        fi
    done
}

# Payment monitoring functions
check_payment_system_health() {
    local endpoint="$PRODUCTION_URL/api/monitoring/payment-health"
    local response_body

    response_body=$(curl -s "$endpoint")

    ((TOTAL_CHECKS++))

    if [[ -n "$response_body" ]]; then
        # Try to parse JSON response (simple check)
        if [[ "$response_body" == *"healthy"* ]]; then
            success "Payment system health: OK"
            ((PASSED_CHECKS++))
        elif [[ "$response_body" == *"degraded"* ]]; then
            warn "Payment system health: DEGRADED"
            send_alert "HIGH" "Payment system health is degraded"
        else
            error "Payment system health: FAILED"
            send_alert "CRITICAL" "Payment system health check failed"
        fi

        payment "Payment health status: $response_body"
    else
        warn "Payment system health: Unable to check"
    fi
}

check_razorpay_service_status() {
    local razorpay_api="https://api.razorpay.com/v1/payments"
    local response_code

    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$razorpay_api")

    if [[ $response_code -eq 401 ]]; then
        success "Razorpay API: Responding (authentication required as expected)"
    elif [[ $response_code -ge 200 && $response_code -lt 300 ]]; then
        success "Razorpay API: Responding"
    else
        warn "Razorpay API: Unexpected response (HTTP $response_code)"
        send_alert "HIGH" "Razorpay API returning unexpected response: HTTP $response_code"
    fi
}

# User activity monitoring
check_user_registration() {
    local endpoint="$PRODUCTION_URL/api/monitoring/user-activity"
    local response_body

    response_body=$(curl -s "$endpoint")

    if [[ -n "$response_body" ]]; then
        user "User activity data received"
        # Log basic metrics if available
        if [[ "$response_body" == *"registrations"* ]]; then
            user "Registration data available"
        fi
    fi
}

# System resource monitoring
check_system_resources() {
    # Check disk space
    local disk_usage
    disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')

    if [[ $disk_usage -lt 85 ]]; then
        metrics "Disk usage: ${disk_usage}%"
    elif [[ $disk_usage -lt 95 ]]; then
        warn "Disk usage: ${disk_usage}% (warning threshold)"
    else
        error "Disk usage: ${disk_usage}% (critical)"
        send_alert "CRITICAL" "Disk usage is ${disk_usage}%"
    fi

    # Check memory usage (basic check)
    local mem_usage
    mem_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')

    if [[ $mem_usage -lt 80 ]]; then
        metrics "Memory usage: ${mem_usage}%"
    elif [[ $mem_usage -lt 90 ]]; then
        warn "Memory usage: ${mem_usage}% (warning threshold)"
    else
        error "Memory usage: ${mem_usage}% (critical)"
        send_alert "CRITICAL" "Memory usage is ${mem_usage}%"
    fi
}

# Generate monitoring report
generate_report() {
    local current_time=$(date +%s)
    local elapsed_minutes=$(( (current_time - MONITORING_START_TIME) / 60 ))
    local remaining_minutes=$(( (MONITORING_END_TIME - current_time) / 60 ))

    echo " "
    echo "📊 MONITORING REPORT"
    echo "===================="
    echo "Time Elapsed: ${elapsed_minutes} minutes"
    echo "Time Remaining: ${remaining_minutes} minutes"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed Checks: $PASSED_CHECKS"
    echo "Issues Detected: $ISSUES_DETECTED"
    echo "Success Rate: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%"
    echo " "

    # Write detailed report to file
    local report_file="$LOG_DIR/monitoring-report-$(date +%Y%m%d_%H%M%S).md"
    cat > "$report_file" << EOF
# 24-Hour Monitoring Report

**Generated**: $(date)
**System**: SmartSlate Polaris v3 Production
**Monitoring Duration**: ${elapsed_minutes} minutes (of ${DURATION_HOURS} hours total)

## Summary
- **Total Checks**: $TOTAL_CHECKS
- **Passed Checks**: $PASSED_CHECKS
- **Issues Detected**: $ISSUES_DETECTED
- **Success Rate**: $(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))%

## System Health Status
$(cat "$HEALTH_LOG" | tail -20)

## Performance Metrics
$(cat "$METRICS_LOG" | tail -20)

## Payment System Status
$(cat "$PAYMENT_LOG" | tail -20)

## User Activity
$(cat "$USER_LOG" | tail -20)

## Alerts and Issues
$(cat "$ALERT_LOG" | tail -20)

---
*Report generated by automated monitoring system*
EOF

    info "Detailed report saved: $report_file"
}

# Main monitoring loop
main_monitoring_loop() {
    info "🚀 Starting 24-Hour Post-Launch Monitoring"
    info "📅 Monitoring Period: $(date +%Y-%m-%d %H:%M:%S) - $(date -d "+${DURATION_HOURS} hours" +%Y-%m-%d\ %H:%M:%S)"
    info "🌐 Production URL: $PRODUCTION_URL"
    info "⏱️ Check Interval: ${MONITORING_INTERVAL} seconds"
    echo " "

    # Create log directory
    mkdir -p "$LOG_DIR"

    # Initial comprehensive check
    info "🔍 Running initial comprehensive health check..."
    check_application_health
    check_webhook_health
    check_ssl_certificate
    check_database_connectivity
    check_payment_system_health
    check_razorpay_service_status

    info "📊 Initial check completed. Starting continuous monitoring..."
    echo " "

    # Main monitoring loop
    while [[ $(date +%s) -lt $MONITORING_END_TIME ]]; do
        local current_time=$(date +%s)
        local elapsed_minutes=$(( (current_time - MONITORING_START_TIME) / 60 ))

        # Hourly comprehensive check
        if (( elapsed_minutes % 60 == 0 && elapsed_minutes > 0)); then
            info "📋 Hour ${elapsed_minutes//60}: Running comprehensive health check..."

            check_application_health
            check_webhook_health
            check_ssl_certificate
            check_database_connectivity
            check_payment_system_health
            check_razorpay_service_status
            check_system_resources

            generate_report

        # Regular 5-minute check
        else
            ((TOTAL_CHECKS++))

            # Basic health checks
            check_application_health
            check_webhook_health

            # Performance monitoring (every 15 minutes)
            if ((elapsed_minutes % 15 == 0)); then
                metrics "📈 Running performance monitoring..."
                check_api_performance
                check_page_load_times
            fi

            # Payment system monitoring (every 10 minutes)
            if ((elapsed_minutes % 10 == 0)); then
                payment "💳 Running payment system monitoring..."
                check_payment_system_health
                check_razorpay_service_status
            fi

            # User activity monitoring (every 30 minutes)
            if ((elapsed_minutes % 30 == 0)); then
                user "👥 Checking user activity..."
                check_user_registration
            fi
        fi

        # Calculate success rate
        local success_rate=0
        if [[ $TOTAL_CHECKS -gt 0 ]]; then
            success_rate=$(( PASSED_CHECKS * 100 / TOTAL_CHECKS ))
        fi

        # Show current status
        local status_icon="✅"
        if [[ $ISSUES_DETECTED -gt 0 ]]; then
            status_icon="⚠️"
        fi

        echo -e "\r${status_icon} [${elapsed_minutes}/${(DURATION_HOURS * 60)}min] Checks: $TOTAL_CHECKS | Passed: $PASSED_CHECKS | Issues: $ISSUES_DETECTED | Success: ${success_rate}%  "

        # Sleep until next check
        sleep $MONITORING_INTERVAL
    done

    echo " "
    info "🏁 Monitoring period completed"
    generate_report

    # Send final notification
    if [[ $ISSUES_DETECTED -eq 0 ]]; then
        send_alert "INFO" "24-Hour monitoring completed successfully with $TOTAL_CHECKS checks and $ISSUES_DETECTED issues"
    else
        send_alert "HIGH" "24-Hour monitoring completed with $ISSUES_DETECTED issues detected. Review monitoring reports for details."
    fi
}

# Signal handlers
cleanup() {
    echo " "
    info "🛑 Monitoring stopped by user signal"
    generate_report
    exit 0
}

trap cleanup SIGINT SIGTERM

# Main execution
main() {
    echo "🔍 SmartSlate Polaris v3 - 24-Hour Post-Launch Monitoring"
    echo "=================================================="
    echo "Production URL: $PRODUCTION_URL"
    echo "Monitoring Duration: ${DURATION_HOURS} hours"
    echo "Log Directory: $LOG_DIR"
    echo " "

    # Verify production URL is accessible
    if ! curl -s "$PRODUCTION_URL/api/health" > /dev/null; then
        error "Cannot connect to production URL: $PRODUCTION_URL"
        exit 1
    fi

    main_monitoring_loop
}

# Run main function
main "$@"