# Final Limit Modal Implementation

## Summary

The limit checking and upgrade modal are now **only on the landing page** (Quick Actions card), not on the static questionnaire page. This provides a clean separation:

- **Landing page**: Shows modal when user clicks "Create New Starmap" if at limit
- **Static questionnaire page**: Freely accessible without any client-side checks

## Implementation Details

### 1. Landing Page - QuickActionsCardWithLimits
**File**: `frontend/components/dashboard/QuickActionsCardWithLimits.tsx`

**Behavior**:
- Checks blueprint creation limit using `useBlueprintLimits()` hook
- Only the "Create New Starmap" button has `requiresLimitCheck: true`
- When clicked:
  - If `loading` → does nothing (waits for data)
  - If `isAtCreationLimit` → shows `UpgradePromptModal`
  - If under limit → navigates to `/static-wizard`
- Other buttons (Browse Templates, My Starmaps, Settings) bypass limit check and use direct Links

**Key Features**:
- Button appears grayed out when at limit
- Button text changes to "Limit reached - Upgrade required"
- Tooltip shows upgrade message on hover
- Modal stays on landing page (user doesn't navigate away)

**Code Structure**:
```typescript
const handleActionClick = (action) => {
  if (loading) return; // Wait for data

  if (action.requiresLimitCheck && isAtCreationLimit) {
    setShowUpgradePrompt(true); // Show modal
    return;
  }

  router.push(action.href); // Navigate if under limit
};
```

### 2. Static Questionnaire Page
**File**: `frontend/app/(auth)/static-wizard/page.tsx`

**Behavior**:
- **NO limit checking**
- **NO redirects**
- **NO modal**
- Freely accessible to all users

**Rationale**:
- Simpler user experience
- No loading state issues
- No redirect loops
- Limit enforcement happens on landing page before user navigates

### 3. Modal Component
**File**: `frontend/components/modals/UpgradePromptModal.tsx`

**Features**:
- "Upgrade Now" button → navigates to `/pricing`
- "Cancel" button → closes modal, stays on landing page
- Displays user's current usage and limits
- Clean, accessible UI

## User Flow

### Scenario 1: User Under Limit
1. User on landing page
2. Clicks "Create New Starmap"
3. **Directly navigates** to `/static-wizard`
4. Completes questionnaire

### Scenario 2: User At Limit
1. User on landing page
2. Button appears grayed out with text "Limit reached - Upgrade required"
3. Clicks "Create New Starmap"
4. **Modal appears** on landing page
5. Options:
   - Click "Upgrade Now" → navigates to `/pricing`
   - Click "Cancel" → modal closes, stays on landing page
6. User **never navigates to static questionnaire**

### Scenario 3: Direct URL Access to Static Questionnaire
1. User types `/static-wizard` in browser
2. Page loads normally **without any checks**
3. User can complete questionnaire
4. Backend API routes should enforce limits server-side when saving

## Testing the Modal

### Option 1: SQL Script (Recommended)
Run the following SQL in Supabase SQL Editor to set yourself at limit:

```sql
-- Set yourself at creation limit
UPDATE user_profiles
SET
  blueprint_creation_count = blueprint_creation_limit,
  current_month_creation_count = blueprint_creation_limit,
  updated_at = now()
WHERE user_id = auth.uid();

-- Verify
SELECT * FROM check_blueprint_creation_limits(auth.uid());
```

### Option 2: Natural Testing
Create blueprints until you reach your limit (e.g., 5 for Explorer tier), then the modal will show.

### Expected Behavior When At Limit
1. **Landing page Quick Actions**:
   - "Create New Starmap" button is grayed out (50% opacity)
   - Text reads "Limit reached - Upgrade required"
   - Hover shows tooltip
   - Clicking shows modal

2. **Modal appears with**:
   - Your current usage count
   - Your tier limit
   - "Upgrade Now" and "Cancel" buttons
   - Professional, clean design

3. **After clicking "Cancel"**:
   - Modal closes
   - You remain on landing page
   - No navigation occurred

## Server-Side Enforcement (Recommended)

While this implementation provides client-side UX, server-side enforcement is still recommended for security:

**API Routes to Protect**:
1. `POST /api/questionnaire/save` - Check limit before creating blueprint
2. `POST /api/generate-dynamic-questions` - Check limit before generating questions
3. `POST /api/blueprints/generate` - Check limit before generating blueprint

**Example Middleware Pattern**:
```typescript
// In API route
const supabase = await createClient();
const { data: limits } = await supabase
  .rpc('check_blueprint_creation_limits', { user_id });

if (!limits.can_create) {
  return NextResponse.json(
    {
      error: 'Blueprint creation limit reached',
      upgradeUrl: '/pricing'
    },
    { status: 403 }
  );
}

// Proceed with operation...
```

## Technical Notes

### Loading State Handling
The `loading` check prevents race conditions:
```typescript
if (loading) {
  return; // Don't check limit while data is loading
}
```

This prevents:
- Clicking before data loads
- Redirect loops
- False positive limit checks

### Conditional Rendering Pattern
```typescript
{action.requiresLimitCheck ? (
  <div onClick={() => handleActionClick(action)}>{content}</div>
) : (
  <Link href={action.href}>{content}</Link>
)}
```

Only "Create New Starmap" uses click handler. Other actions use direct Links for better performance.

### TypeScript Type Safety
```typescript
const handleActionClick = (action: (typeof quickActions)[0]) => {
  // Fully typed, prevents runtime errors
};
```

## Files Modified

### QuickActionsCardWithLimits.tsx
- **Added**: Imports for router, auth, limits hook, modal, cn utility
- **Added**: State for `showUpgradePrompt`
- **Added**: `handleActionClick`, `handleUpgradeClick`, `handleUpgradeCancel` handlers
- **Added**: Conditional rendering based on `isAtCreationLimit`
- **Added**: `UpgradePromptModal` component
- **Modified**: "Create New Starmap" action to include `requiresLimitCheck: true`

### static-wizard/page.tsx
- **Removed**: `useBlueprintLimits` import
- **Removed**: `UpgradePromptModal` import
- **Removed**: Limit checking useEffect
- **Removed**: Modal state and handlers
- **Removed**: Modal component JSX
- **Result**: Clean, simple page with no limit enforcement

## Verification Checklist

- [x] TypeScript compiles without errors
- [x] Quick Actions card imports all necessary dependencies
- [x] `requiresLimitCheck` only on "Create New Starmap" button
- [x] Modal shows only when `isAtCreationLimit === true`
- [x] Modal stays on landing page (no navigation)
- [x] Cancel button closes modal
- [x] Upgrade button navigates to `/pricing`
- [x] Other buttons bypass limit check
- [x] Static questionnaire page has no limit checking
- [x] No redirect loops
- [x] No loading state issues

## Comparison to Previous Attempts

### ❌ Previous Implementation Issues
1. Static questionnaire had redirect logic → caused loops
2. Short-circuit evaluation bug prevented handler from running
3. Loading state caused false positives
4. Complex logic spread across multiple files

### ✅ Current Implementation Benefits
1. All limit logic contained in landing page component
2. Static questionnaire is clean and simple
3. Loading check prevents race conditions
4. Clear separation of concerns
5. No redirect loops possible
6. Modal appears exactly where it should (landing page)

## Next Steps

If you want to test the modal:
1. Run `scripts/set_user_at_limit.sql` in Supabase SQL Editor
2. Navigate to landing page
3. Click "Create New Starmap"
4. Modal should appear!

To reset your usage:
```sql
UPDATE user_profiles
SET
  blueprint_creation_count = 0,
  current_month_creation_count = 0,
  updated_at = now()
WHERE user_id = auth.uid();
```
