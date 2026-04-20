#!/usr/bin/env node
/**
 * System Status Monitor
 *
 * Usage: node scripts/monitor-system-status.js
 *
 * Polls the system status API and alerts on issues.
 * Can be run as a cron job or monitoring service.
 */

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const STATUS_URL = process.env.STATUS_URL || 'http://localhost:3000/api/admin/system-status';
const CHECK_INTERVAL = parseInt(process.env.CHECK_INTERVAL_MS || '60000', 10); // 1 minute

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  const timestamp = new Date().toISOString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

/**
* Fetches the system status from STATUS_URL and logs a human-readable summary, warnings and critical alerts for individual services.
* @example
* checkSystemStatus()
* Promise<void>
* @returns {Promise<void>} Resolves when the status check and logging are complete.
**/
async function checkSystemStatus() {
  try {
    const response = await fetch(STATUS_URL, {
      headers: {
        Cookie: process.env.ADMIN_COOKIE || '', // Set this for authenticated checks
      },
    });

    if (!response.ok) {
      log(`❌ Status API returned ${response.status}`, 'red');
      return;
    }

    const data = await response.json();

    // Check overall status
    const { services, summary } = data;

    // Log summary
    log(`📊 System Status: ${summary.overallStatus}`, 'cyan');
    log(`   ✅ Operational: ${summary.operational}`, 'green');
    if (summary.degraded > 0) {
      log(`   ⚠️  Degraded: ${summary.degraded}`, 'yellow');
    }
    if (summary.partialOutage > 0) {
      log(`   🟠 Partial Outage: ${summary.partialOutage}`, 'yellow');
    }
    if (summary.majorOutage > 0) {
      log(`   🔴 Major Outage: ${summary.majorOutage}`, 'red');
    }

    // Alert on critical issues
    if (summary.majorOutage > 0) {
      const failedServices = services
        .filter((s) => s.status === 'Major Outage')
        .map((s) => s.name)
        .join(', ');

      log(`🚨 CRITICAL ALERT: ${failedServices} DOWN!`, 'red');

      // Here you could send email, Slack notification, PagerDuty alert, etc.
      // sendAlert(ADMIN_EMAIL, `Critical: ${failedServices} down`);
    }

    // Warn on degraded performance
    if (summary.degraded > 0 || summary.partialOutage > 0) {
      const degradedServices = services
        .filter((s) => s.status === 'Degraded Performance' || s.status === 'Partial Outage')
        .map((s) => `${s.name} (${s.details})`)
        .join(', ');

      log(`⚠️  WARNING: ${degradedServices}`, 'yellow');
    }

    // Log individual service details
    services.forEach((service) => {
      const statusIcon =
        service.status === 'Operational'
          ? '✅'
          : service.status === 'Degraded Performance'
            ? '⚠️'
            : service.status === 'Partial Outage'
              ? '🟠'
              : '🔴';

      const color =
        service.status === 'Operational'
          ? 'green'
          : service.status === 'Degraded Performance'
            ? 'yellow'
            : 'red';

      log(`   ${statusIcon} ${service.name}: ${service.status} (${service.responseTime}ms)`, color);
      if (service.details && service.status !== 'Operational') {
        log(`      Details: ${service.details}`, color);
      }
    });

    console.log(''); // Blank line for readability
  } catch (error) {
    log(`❌ Monitor Error: ${error.message}`, 'red');
  }
}

// Run initial check
log('🚀 System Status Monitor Started', 'cyan');
log(`   Checking every ${CHECK_INTERVAL / 1000}s`, 'cyan');
log(`   Target: ${STATUS_URL}`, 'cyan');
console.log('');

checkSystemStatus();

// Set up interval
setInterval(checkSystemStatus, CHECK_INTERVAL);

// Handle shutdown gracefully
process.on('SIGINT', () => {
  log('👋 Monitor Stopped', 'cyan');
  process.exit(0);
});
