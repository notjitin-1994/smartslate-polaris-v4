# Static Wizard ReferenceError Fix

## Error
```
ReferenceError: setShowUpgradePrompt is not defined
at saveQuestionnaire (app/(auth)/static-wizard/page.tsx:695:11)
```

## Root Cause

The `saveQuestionnaire` function in the static-wizard page had a reference to `setShowUpgradePrompt(true)` at line 695, but we had removed the state declaration and modal from this page.

## Fix Applied

**File**: `frontend/app/(auth)/static-wizard/page.tsx`

**Line 695**: Removed `setShowUpgradePrompt(true);`

### Before:
```typescript
// Handle 429 (limit exceeded) with upgrade modal
if (response.status === 429 && errorData?.limitExceeded) {
  setSaveError(errorData.error || 'Blueprint creation limit reached');
  setShowUpgradePrompt(true); // ❌ This caused the error
  return null;
}
```

### After:
```typescript
// Handle 429 (limit exceeded)
if (response.status === 429 && errorData?.limitExceeded) {
  setSaveError(errorData.error || 'Blueprint creation limit reached');
  return null; // Return null to stop the flow gracefully
}
```

## Behavior After Fix

When the API returns a 429 (limit exceeded) response while saving the questionnaire:

1. ✅ Error is set via `setSaveError()` - user sees error message
2. ✅ Function returns `null` to stop the flow gracefully
3. ✅ No modal appears (as intended - limit check is on landing page only)
4. ✅ No ReferenceError thrown

## Note on API-Level Limit Enforcement

This error handling catches 429 responses from the API. This is server-side enforcement, which is good for security. The behavior now is:

- **Landing page**: Client-side check shows modal before navigation
- **Static questionnaire**: If user somehow bypasses client check, API will reject with 429
- **Error display**: User sees error message but no modal (they shouldn't be on this page if at limit)

This provides defense-in-depth: client-side UX + server-side security.

## Verification

- ✅ No TypeScript compilation errors
- ✅ No references to `showUpgradePrompt` or `setShowUpgradePrompt` remain in static-wizard page
- ✅ Error handling still works (sets error message)
- ✅ Function gracefully stops execution when limit is exceeded
