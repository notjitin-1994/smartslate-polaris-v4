# Admin Dashboard Health Check Fix

## Problem Identified

The admin dashboard was making **88 Claude API requests over 80 minutes**, consuming tokens unnecessarily for health checks.

### Root Cause

**File**: `frontend/app/admin/page.tsx:460`
```typescript
const interval = setInterval(fetchSystemStatus, 30000); // Every 30 seconds
```

This called `/api/admin/system-status` which ran `checkAIHealth()` making a **real Claude API call**:

```typescript
// OLD: Consumed tokens for every health check
const response = await fetch('https://api.anthropic.com/v1/messages', {
  method: 'POST',
  body: JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 10,
    messages: [{ role: 'user', content: 'Hi' }],
  }),
});
```

### Cost Impact (Before Fix)

- **Polling frequency**: 2 requests/minute (every 30 seconds)
- **Tokens per check**: ~18-20 tokens (10 output + 8-10 input)
- **Cost per check**: ~$0.0001
- **Projected monthly cost** (if admin dashboard open 24/7): **~$8.64/month**
- **Your logs**: 88 requests in 80 minutes = admin dashboard was open for ~40-44 minutes

## Solution Implemented

### Changed to Lightweight Ping Endpoint

Switched from `/v1/messages` (generates responses, consumes tokens) to `/v1/models` (lists models, **zero token consumption**).

### Files Modified

1. **`frontend/app/api/admin/system-status/route.ts`** (lines 156-185)
2. **`frontend/app/api/admin/system-status/[component]/route.ts`** (lines 235-282)

### Changes Made

```typescript
// NEW: Zero token consumption
const response = await fetch('https://api.anthropic.com/v1/models', {
  method: 'GET',
  headers: {
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  },
  signal: AbortSignal.timeout(10000),
});
```

**What it checks**:
- ✅ API key validity
- ✅ Network connectivity to Anthropic
- ✅ Authentication status
- ✅ Response time

**What it doesn't check**:
- ❌ Actual generation capability (but this is fine for health monitoring)

### Cost Impact (After Fix)

- **Tokens consumed**: **0 tokens** per health check
- **Cost per check**: **$0.00**
- **Projected monthly cost**: **$0.00** for health checks
- **Savings**: **100% reduction** in health check token costs

## Testing

To verify the fix is working:

1. **Open admin dashboard**: Navigate to `/admin`
2. **Check browser network tab**: Look for requests to `/api/admin/system-status`
3. **Verify Anthropic API logs**: Should see `/v1/models` requests (or no new requests)
4. **Confirm status display**: "AI Services" should show "Operational" if API key is valid

## Future Improvements (Optional)

If further optimization is needed:

1. **Increase polling interval**: Change from 30s to 60s or 120s
2. **Conditional polling**: Only poll when admin tab is visible (Page Visibility API)
3. **Manual refresh**: Remove auto-polling entirely, add "Refresh" button
4. **Cache results**: Cache health status for 5 minutes server-side

## Summary

**Problem**: Admin dashboard was consuming Claude API tokens for health checks
**Cause**: Using `/v1/messages` endpoint which generates responses
**Solution**: Switched to `/v1/models` endpoint which only checks authentication
**Result**: **Zero token consumption** for health monitoring

---

**Date Fixed**: 2025-11-10
**Fixed By**: Claude Code
**Impact**: Eliminated unnecessary API costs from admin health monitoring
