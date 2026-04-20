# System Status Monitoring Guide

## 🎯 Quick Reference: How to Know If There Are Issues

### Visual Indicators (In Browser)

Visit `http://localhost:3000/admin` and scroll to **System Status** section:

| Visual Indicator | Meaning | Action Required |
|------------------|---------|-----------------|
| 🟢 All green dots | ✅ Everything operational | None - all good! |
| 🟡 Yellow dot | ⚠️ Performance degraded | Monitor, may need optimization |
| 🟠 Orange dot | ⚠️ Partial outage | Investigate soon |
| 🔴 Red dot | 🚨 Service down | **Immediate action required** |

---

## 1. Browser-Based Monitoring

### A. Visual Dashboard (Easiest)

**Location:** `/admin` page → Bottom section "System Status"

**What You See:**

```
System Status                              Last updated: 3:45:23 PM

┌──────────────────────────────────────────────────────────┐
│ Overall Status: All Systems Operational                  │
│ 5 Operational  │  0 Degraded  │  0 Partial  │  0 Outage│
└──────────────────────────────────────────────────────────┘

🟢 API Services          0ms            Operational
   Uptime: 2h, Memory: 916.46MB

🟢 Database              245ms          Operational
   Connected, Response: 245ms

🟢 AI Services           1823ms         Operational
   Response time: 1823ms

🟢 Storage               156ms          Operational
   3 buckets, Response time: 156ms

🟢 Payment Gateway       892ms          Operational
   Response time: 892ms
```

**Auto-Refresh:** Updates every 30 seconds automatically

---

### B. Browser Console (DevTools)

**How to Access:**
1. Press `F12` (or `Cmd+Option+I` on Mac)
2. Click "Console" tab
3. Look for errors

**Normal State:**
```
(No errors - silent)
```

**Problem State:**
```javascript
❌ Failed to fetch system status: 403
❌ Error: Unauthorized - Admin access required
```

---

### C. Network Tab (Advanced)

**How to Access:**
1. Press `F12`
2. Click "Network" tab
3. Filter by: `system-status`
4. Look at Status column

**What to Look For:**

| Status | Meaning | Issue |
|--------|---------|-------|
| `200 OK` | ✅ Normal | None |
| `403 Forbidden` | ❌ Auth failed | Check user role |
| `500 Error` | ❌ Server crash | Check backend |
| `Failed` | ❌ Network down | Check connectivity |

---

## 2. Server-Side Monitoring

### A. Development Logs (Terminal)

**Where:** Terminal where you run `npm run dev`

**What to Look For:**

#### ✅ Healthy State:
```bash
[System Status] Running health checks...
[System Status] Health checks completed: {
  api: 'Operational',
  database: 'Operational',
  ai: 'Operational',
  storage: 'Operational',
  payment: 'Operational'
}
```

#### ❌ Problem State:
```bash
[System Status] Running health checks...
[System Status] Database health check error: {
  message: 'Connection timeout',
  details: 'Could not reach database server',
  hint: 'Check network connectivity',
  code: 'ETIMEDOUT'
}
[System Status] Health checks completed: {
  api: 'Operational',
  database: 'Major Outage',  ← 🚨 PROBLEM HERE
  ai: 'Operational',
  storage: 'Operational',
  payment: 'Operational'
}
```

---

### B. Production Logs (Vercel/Hosting Platform)

**Vercel:**
1. Go to Vercel Dashboard
2. Select your project
3. Click "Logs" tab
4. Search for: `[System Status]`

**Other Platforms:**
- Check your platform's logging dashboard
- Look for `[System Status]` prefix
- Monitor for errors with status `'Major Outage'`

---

## 3. Automated Monitoring Script

### Quick Start

```bash
# Run the monitor
node scripts/monitor-system-status.js

# Or with custom settings
CHECK_INTERVAL_MS=30000 node scripts/monitor-system-status.js
```

### Example Output

```bash
[2025-11-09T15:45:23.123Z] 🚀 System Status Monitor Started
[2025-11-09T15:45:23.124Z]    Checking every 60s
[2025-11-09T15:45:23.125Z]    Target: http://localhost:3000/api/admin/system-status

[2025-11-09T15:45:24.456Z] 📊 System Status: All Systems Operational
[2025-11-09T15:45:24.457Z]    ✅ Operational: 5
[2025-11-09T15:45:24.458Z]    ✅ API Services: Operational (0ms)
[2025-11-09T15:45:24.459Z]    ✅ Database: Operational (245ms)
[2025-11-09T15:45:24.460Z]    ✅ AI Services: Operational (1823ms)
[2025-11-09T15:45:24.461Z]    ✅ Storage: Operational (156ms)
[2025-11-09T15:45:24.462Z]    ✅ Payment Gateway: Operational (892ms)
```

### When Issues Occur

```bash
[2025-11-09T15:46:25.123Z] 📊 System Status: Critical Issues Detected
[2025-11-09T15:46:25.124Z]    ✅ Operational: 4
[2025-11-09T15:46:25.125Z]    🔴 Major Outage: 1
[2025-11-09T15:46:25.126Z] 🚨 CRITICAL ALERT: Database DOWN!
[2025-11-09T15:46:25.127Z]    ✅ API Services: Operational (0ms)
[2025-11-09T15:46:25.128Z]    🔴 Database: Major Outage (timeout)
[2025-11-09T15:46:25.129Z]       Details: Connection failed: ETIMEDOUT
```

---

## 4. Common Issues & How to Detect

### Issue 1: Database Connection Lost

**Visual:**
```
🔴 Database              timeout         Major Outage
   Connection failed: ETIMEDOUT
```

**Logs:**
```
[System Status] Database health check error: {
  message: 'Connection timeout',
  code: 'ETIMEDOUT'
}
```

**Cause:**
- Supabase down
- Network issue
- Invalid credentials

**Fix:**
- Check Supabase status page
- Verify `.env.local` credentials
- Test network connectivity

---

### Issue 2: AI Service Rate Limited

**Visual:**
```
🟡 AI Services           892ms           Degraded Performance
   Rate limited - high API usage
```

**Logs:**
```
[System Status] AI health check returned 429
```

**Cause:**
- Too many API requests
- Exceeded Anthropic rate limits

**Fix:**
- Wait for rate limit to reset
- Upgrade Anthropic plan
- Implement request queuing

---

### Issue 3: High Memory Usage

**Visual:**
```
🟡 API Services          0ms             Degraded Performance
   High memory usage: 1421.56MB (92.5% of 1536MB limit)
```

**Logs:**
```
[System Status] API memory utilization: 92.5%
```

**Cause:**
- Memory leak
- Too many concurrent requests
- Large data processing

**Fix:**
- Restart server
- Optimize memory-intensive operations
- Increase server resources

---

### Issue 4: Storage Service Slow

**Visual:**
```
🟡 Storage               4234ms          Degraded Performance
   Slow response: 4234ms
```

**Cause:**
- Network latency
- Supabase Storage overloaded
- Large file operations

**Fix:**
- Check Supabase status
- Optimize file operations
- Use CDN for static assets

---

### Issue 5: Payment Gateway Down

**Visual:**
```
🔴 Payment Gateway       timeout         Major Outage
   Request timeout (>5s)
```

**Logs:**
```
[System Status] Payment health check timeout
```

**Cause:**
- Razorpay API down
- Invalid credentials
- Network issue

**Fix:**
- Check Razorpay status page
- Verify API keys in `.env.local`
- Test with `curl https://api.razorpay.com/v1/plans`

---

## 5. Response Time Benchmarks

### Normal Response Times

| Service | Excellent | Good | Acceptable | Slow (Warning) |
|---------|-----------|------|------------|----------------|
| API Services | <10ms | <50ms | <100ms | >100ms |
| Database | <200ms | <500ms | <1000ms | >3000ms |
| AI Services | <2000ms | <3000ms | <5000ms | >5000ms |
| Storage | <200ms | <500ms | <1000ms | >3000ms |
| Payment Gateway | <500ms | <1000ms | <2000ms | >3000ms |

### What Triggers Warnings

```typescript
// Thresholds in code (system-status/route.ts)
responseTime > 3000ms  → Degraded Performance (Database, Storage)
responseTime > 5000ms  → Degraded Performance (AI Services)
memoryUtilization > 90% → Degraded Performance (API Services)
```

---

## 6. Setting Up Alerts

### Option A: Email Alerts (Node.js)

```javascript
// Add to scripts/monitor-system-status.js

const nodemailer = require('nodemailer');

async function sendAlert(to, subject, message) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.ALERT_EMAIL,
      pass: process.env.ALERT_EMAIL_PASSWORD,
    },
  });

  await transporter.sendMail({
    from: process.env.ALERT_EMAIL,
    to,
    subject: `🚨 ${subject}`,
    text: message,
  });
}

// Use it when majorOutage > 0:
if (summary.majorOutage > 0) {
  await sendAlert(
    ADMIN_EMAIL,
    'Critical: Services Down',
    `${failedServices} are experiencing major outages`
  );
}
```

---

### Option B: Slack Alerts

```javascript
async function sendSlackAlert(message) {
  await fetch(process.env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `🚨 System Alert: ${message}`,
    }),
  });
}
```

---

### Option C: PagerDuty Integration

```javascript
async function triggerPagerDuty(severity, description) {
  await fetch('https://events.pagerduty.com/v2/enqueue', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      routing_key: process.env.PAGERDUTY_ROUTING_KEY,
      event_action: 'trigger',
      payload: {
        summary: description,
        severity,
        source: 'SmartSlate System Status',
      },
    }),
  });
}
```

---

## 7. Production Monitoring Checklist

- [ ] Set up monitoring script as cron job
- [ ] Configure email/Slack alerts
- [ ] Monitor logs daily
- [ ] Set up uptime monitoring (e.g., UptimeRobot)
- [ ] Create incident response plan
- [ ] Document escalation procedures
- [ ] Test alert system monthly
- [ ] Review response time trends weekly

---

## 8. Troubleshooting Guide

### "System Status not loading"

**Symptoms:**
- Blank section or loading spinner forever
- No data shown

**Checks:**
1. Open browser console (F12) → Look for errors
2. Check Network tab → Status of `/api/admin/system-status` request
3. Verify you're logged in as admin/developer
4. Check server logs for crashes

---

### "All services showing Major Outage"

**Symptoms:**
- Everything red
- No connection

**Checks:**
1. Is the dev server running? (`npm run dev`)
2. Check `.env.local` file exists and has correct values
3. Test individual services manually
4. Check network connectivity

---

### "Status not auto-refreshing"

**Symptoms:**
- Timestamp stuck
- Data doesn't update

**Checks:**
1. Refresh the page manually
2. Check browser console for JavaScript errors
3. Verify polling interval is set (30s default)
4. Check if browser tab is in background (some browsers throttle)

---

## 9. Manual Health Check

Test each service independently:

### Database
```bash
curl -X POST https://oyjslszrygcajdpwgxbe.supabase.co/rest/v1/user_profiles \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### AI Service
```bash
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_ANTHROPIC_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":10,"messages":[{"role":"user","content":"Hi"}]}'
```

### Payment Gateway
```bash
curl https://api.razorpay.com/v1/plans?count=1 \
  -u "YOUR_KEY_ID:YOUR_KEY_SECRET"
```

---

## 10. Quick Commands

```bash
# Watch system status in terminal
node scripts/monitor-system-status.js

# Check logs for errors
npm run dev | grep -i "error\|outage\|failed"

# Test API endpoint directly
curl http://localhost:3000/api/admin/system-status

# Check memory usage
node -e "console.log(process.memoryUsage())"
```

---

## Support

For issues with monitoring:
1. Check this guide first
2. Review server logs
3. Test services individually
4. Check `.env.local` configuration
5. Verify network connectivity

**Emergency Contact:** See `INCIDENT_RESPONSE.md`
