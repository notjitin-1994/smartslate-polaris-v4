# Testing Comprehensive Logging

## Quick Test Steps

### 1. Check Server Logs on Startup

Start the server and look for these initialization messages:

```bash
cd frontend
npm run dev
```

Expected output:
```
🔍 Validating environment variables...
✅ Application startup validation complete
📝 Initializing comprehensive logging system...
[Logging] Starting database persistence worker...
[Logging] Database persistence worker started (flush every 10s)
[GlobalErrorHandlers] Initializing server-side error handlers...
✅ Logging system initialized successfully
```

### 2. Trigger API Calls

Visit these URLs or make API calls:

```bash
# Test blueprint generation (logs Claude API calls)
curl -X POST http://localhost:3001/api/blueprints/generate \
  -H "Content-Type: application/json" \
  -d '{"blueprintId": "test-id"}'

# Test any other API endpoint
curl http://localhost:3001/api/user/usage

# Test database query
curl http://localhost:3001/api/admin/users
```

### 3. Check Admin Logs Page

Navigate to: **http://localhost:3001/admin/logs**

You should see:
- ✅ API request logs (`api.request`)
- ✅ API response logs (`api.response`)
- ✅ Database query logs (`database.query.success`)
- ✅ Claude API logs (`claude.client.request`, `claude.client.success`)
- ✅ Error logs (if any errors occurred)

### 4. Filter Logs by Service

Use the filters on the admin page:

- **Service Filter**: Select "api" to see only API logs
- **Service Filter**: Select "database" to see only DB logs
- **Service Filter**: Select "claude-client" to see Claude API calls
- **Level Filter**: Select "error" to see only errors

### 5. Check Database Persistence

Wait 10 seconds for background flush, then check:

```sql
-- Connect to your Supabase database
SELECT COUNT(*) FROM system_logs;
-- Should show logs from the past 10 seconds

SELECT * FROM system_logs
ORDER BY timestamp DESC
LIMIT 10;
-- Should show recent logs
```

## Troubleshooting

### Issue: No logs appearing

**Check 1: Is the server running?**
```bash
curl http://localhost:3001/api/logs
# Should return logs (even if empty)
```

**Check 2: Is middleware logging?**
Add this to any API route temporarily:
```typescript
import { logger } from '@/lib/logging';
logger.info('test.event', 'Test log from API route', { test: true });
```

**Check 3: Is background worker running?**
```typescript
import { isLogPersistenceRunning } from '@/lib/logging/dbPersistence';
console.log(isLogPersistenceRunning()); // Should be true
```

**Check 4: Check server console**
Look for error messages in the terminal where you ran `npm run dev`

### Issue: Only seeing some logs, not all

**Checklist:**
- [  ] Middleware is logging API requests (check `/api/logs` access log)
- [  ] Claude client is being called (try generating a blueprint)
- [  ] Database is being queried (try loading admin users page)
- [  ] Background worker is flushing (wait 10-15 seconds)

**Debug mode:**
Set log level to debug to see everything:
```bash
# In .env.local
NEXT_PUBLIC_LOG_LEVEL=debug
```

### Issue: Logs not persisting to database

**Check migration:**
```bash
npm run db:status
# Should show migration 0036_system_logs applied
```

**Apply migration manually:**
```bash
npm run db:push
```

**Check Supabase connection:**
```bash
# Verify env vars are set
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
```

## What You Should See

### On Startup (Console)
```
✅ Application startup validation complete
📝 Initializing comprehensive logging system...
[Logging] Database persistence worker started
[GlobalErrorHandlers] Server-side handlers initialized
✅ Logging system initialized successfully
```

### On Admin Logs Page
```
Level    Service         Event                       Message
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
info     system          system.startup              SmartSlate Polaris server initialized
info     api             api.request                 GET /api/logs
info     database        database.query.success      SELECT from system_logs
info     api             api.response                GET /api/logs completed
info     claude-client   claude.client.request       Generating blueprint...
info     claude-client   claude.client.success       Blueprint generated successfully
```

### In Database (Supabase)
```sql
SELECT
  level,
  service,
  event,
  message,
  created_at
FROM system_logs
ORDER BY created_at DESC
LIMIT 5;

 level |   service    |          event          |           message
-------+--------------+-------------------------+-----------------------------
 info  | api          | api.response            | GET /api/blueprints completed
 info  | database     | database.query.success  | SELECT from blueprints
 info  | claude-client| claude.client.success   | Blueprint generated
 info  | api          | api.request             | POST /api/blueprints/generate
 info  | system       | system.startup          | Server initialized
```

## Success Criteria

✅ Server starts without errors
✅ Initialization messages appear in console
✅ API calls appear in logs within 1 second
✅ Database queries appear in logs immediately
✅ Logs persist to database within 10 seconds
✅ Admin logs page shows all logs
✅ Filters work correctly
✅ Export to CSV/JSON works
✅ Search functionality works

## Common Scenarios

### Scenario 1: Generate a Blueprint

1. Navigate to `/demo-dynamicv2`
2. Fill out questionnaire
3. Click "Generate Blueprint"
4. Check `/admin/logs`

**Expected logs:**
```
api.request           POST /api/blueprints/generate
claude.client.request Generating blueprint...
claude.client.success Blueprint generated (tokens: 1500)
database.save.success INSERT into blueprints (1 row)
api.response          POST /api/blueprints/generate (12.5s)
```

### Scenario 2: Load Admin Page

1. Navigate to `/admin/users`
2. Check `/admin/logs`

**Expected logs:**
```
api.request            GET /api/admin/users
database.query.success SELECT from user_profiles (25 rows)
api.response           GET /api/admin/users (145ms)
```

### Scenario 3: Cause an Error

1. Try to access a non-existent API route
2. Check `/admin/logs`

**Expected logs:**
```
api.request   GET /api/nonexistent
api.error     404 Not Found
api.response  GET /api/nonexistent (5ms)
```

## Performance Check

Monitor console for these metrics:

```
[LogPersistence] Flushing 45 logs to database...
[LogPersistence] Successfully flushed 45 logs.
```

Should happen every 10 seconds when there are logs to flush.

## Advanced Testing

### Load Test
```bash
# Send 100 API requests
for i in {1..100}; do
  curl -s http://localhost:3001/api/logs > /dev/null &
done
wait

# Check admin page - should see 100+ logs
```

### Stress Test Database Logging
```bash
# Trigger many database queries
for i in {1..50}; do
  curl -s http://localhost:3001/api/admin/users > /dev/null &
done
wait

# All queries should be logged
```

## Next Steps After Testing

1. ✅ Confirm all logs are visible
2. ✅ Set appropriate log level for production (`info` or `warn`)
3. ✅ Configure log retention (default: 30 days)
4. ✅ Set up monitoring alerts for high error rates
5. ✅ Grant admin access to team members

## Support

If logs still aren't appearing:

1. Check this file: `COMPREHENSIVE_LOGGING_SYSTEM.md`
2. Check backend docs: `frontend/app/api/logs/README.md`
3. Review console errors
4. Check Supabase logs in dashboard
5. Verify migration applied: `SELECT * FROM system_logs LIMIT 1;`
