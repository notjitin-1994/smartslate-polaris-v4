# Landing Page Limit Protection Fix

## Issue
User reported: "Clicking on 'Create new starmap' on the landing page still takes me to the static questionnaire without checking if I can generate more starmaps. I want a pop up as soon as the user clicks the button letting them know that they need to upgrade and once user has dismissed or cancelled the pop up, user remains on the same page as they were, without being diverted to the static questionnaire. In other words, static questionnaire page must only be accessible to users who are not at their limit and can generate and save starmaps."

## Root Cause
The landing page (`app/page.tsx`) was using the old `QuickActionsCard` component instead of the enhanced `QuickActionsCardWithLimits` component. The old component simply used `<Link>` tags that navigated directly to `/static-wizard` without any limit checking.

Additionally, there was no protection at the `/static-wizard` route level to prevent direct URL access when users are at their limit.

## Solution Implemented

### 1. Updated Landing Page to Use Enhanced Component
**File**: `frontend/app/page.tsx`

**Before**:
```typescript
import { QuickActionsCard } from '@/components/dashboard/QuickActionsCard';

// ... later in JSX:
<QuickActionsCard />
```

**After**:
```typescript
import { QuickActionsCardWithLimits } from '@/components/dashboard/QuickActionsCardWithLimits';

// ... later in JSX:
<QuickActionsCardWithLimits />
```

This single change brings the full limit checking functionality to the landing page.

### 2. Added Route-Level Protection to Static Wizard
**File**: `frontend/app/(auth)/static-wizard/page.tsx`

Added a `useEffect` hook that runs on mount to check if the user is at their limit:

```typescript
// Check limit on mount - redirect if at limit and not editing existing blueprint
useEffect(() => {
  // Get the blueprint ID from URL params
  const existingBlueprintId = searchParams.get('bid');

  // If user is at limit and NOT editing an existing blueprint, redirect back
  if (isAtCreationLimit && !existingBlueprintId) {
    console.log('User at creation limit, redirecting to dashboard');
    router.replace('/'); // Use replace to prevent back button loop
    // Note: The dashboard's QuickActionsCardWithLimits will show the modal
  }
}, [isAtCreationLimit, searchParams, router]);
```

**Key Points**:
- Only redirects if user is at limit AND not editing an existing blueprint (no `bid` param)
- Uses `router.replace()` instead of `router.push()` to prevent back button loop
- Allows users to continue editing existing blueprints even if at limit (read-only access)

### 3. Enhanced Cancel Handler
Updated the `handleUpgradeCancel` function to redirect users back to the dashboard after dismissing the modal:

```typescript
const handleUpgradeCancel = () => {
  setShowUpgradePrompt(false);
  // After canceling, redirect back to dashboard
  router.push('/');
};
```

## How It Works Now

### Scenario 1: User Clicks "Create New Starmap" from Landing Page (At Limit)

1. **User clicks button** in Quick Actions
2. **QuickActionsCardWithLimits checks limit**:
   ```typescript
   if (isAtCreationLimit) {
     setShowUpgradePrompt(true);
     return; // Prevents navigation
   }
   ```
3. **Upgrade modal appears immediately**
4. **User has two options**:
   - Click "Upgrade Now" → navigates to `/pricing`
   - Click "Cancel" → modal closes, stays on landing page
5. **No navigation to static-wizard**

### Scenario 2: User Tries to Access /static-wizard Directly via URL (At Limit)

1. **User types** `/static-wizard` in address bar or uses bookmarked link
2. **Page loads** and `useEffect` runs
3. **Limit check executes**:
   ```typescript
   if (isAtCreationLimit && !existingBlueprintId) {
     router.replace('/');
   }
   ```
4. **User is redirected** back to landing page
5. **No modal shown** (because they didn't click the button)
6. **Clean user experience** - just a quick redirect

### Scenario 3: User Editing Existing Blueprint (At Limit)

1. **User navigates** to `/static-wizard?bid=abc123`
2. **Page loads** and `useEffect` runs
3. **Check detects existing blueprint**:
   ```typescript
   const existingBlueprintId = searchParams.get('bid'); // = 'abc123'
   if (isAtCreationLimit && !existingBlueprintId) {
     // Condition is FALSE because existingBlueprintId exists
   }
   ```
4. **No redirect** - user can continue editing
5. **Allows read-only/edit access** to existing work

### Scenario 4: User NOT at Limit

1. **User clicks** "Create New Starmap"
2. **Limit check passes**:
   ```typescript
   if (isAtCreationLimit) {
     // FALSE - user not at limit
   }
   router.push(action.href); // This line executes
   ```
3. **Navigates to** `/static-wizard`
4. **No modal shown** - clean, frictionless experience

## Multi-Layer Protection Summary

Now we have **5 layers** of protection:

### Layer 1: UI Button State ✅
- **Location**: `QuickActionsCardWithLimits.tsx`
- **What**: Button shows "Limit reached - Upgrade required" when disabled
- **When**: User at limit
- **Action**: Visual indicator only (button still clickable but triggers modal)

### Layer 2: Click Handler ✅
- **Location**: `QuickActionsCardWithLimits.handleActionClick()`
- **What**: Checks `isAtCreationLimit` before navigation
- **When**: Button clicked
- **Action**: Shows upgrade modal instead of navigating

### Layer 3: Route-Level Guard ✅ (NEW)
- **Location**: `static-wizard/page.tsx` useEffect
- **What**: Redirects if at limit and no existing blueprint
- **When**: Page component mounts
- **Action**: Redirects to `/` (landing page)

### Layer 4: Save Operation Check ✅
- **Location**: `static-wizard/page.tsx` saveQuestionnaire function
- **What**: Handles 429 error from API
- **When**: User tries to save
- **Action**: Shows upgrade modal

### Layer 5: Server-Side Enforcement ✅
- **Location**: `/api/questionnaire/save` route
- **What**: Database RPC function `check_blueprint_creation_limits()`
- **When**: API request received
- **Action**: Returns 429 error with `limitExceeded: true`

## Testing Verification

### Test 1: Landing Page Button (At Limit)
**Steps**:
1. Create free tier user (2 blueprint limit)
2. Create 2 blueprints
3. Go to landing page (`/`)
4. Click "Create New Starmap" in Quick Actions

**Expected Result**:
- ✅ Upgrade modal appears immediately
- ✅ Modal shows limit message
- ✅ "Upgrade Now" → navigates to `/pricing`
- ✅ "Cancel" → stays on landing page
- ✅ **No navigation to /static-wizard**

### Test 2: Direct URL Access (At Limit)
**Steps**:
1. Same user (at limit)
2. Type `/static-wizard` in address bar
3. Press Enter

**Expected Result**:
- ✅ Quick redirect to landing page (`/`)
- ✅ No modal shown
- ✅ No error messages
- ✅ Clean UX

### Test 3: Editing Existing Blueprint (At Limit)
**Steps**:
1. Same user (at limit)
2. Navigate to `/static-wizard?bid=existing-blueprint-id`

**Expected Result**:
- ✅ Page loads normally
- ✅ Can view and edit existing blueprint
- ✅ No redirect
- ✅ Allows read/edit access

### Test 4: Landing Page Button (NOT at Limit)
**Steps**:
1. User with 1/2 blueprints created
2. Go to landing page
3. Click "Create New Starmap"

**Expected Result**:
- ✅ Navigates to `/static-wizard`
- ✅ No modal shown
- ✅ Can create new blueprint

### Test 5: Back Button After Redirect
**Steps**:
1. At limit user tries `/static-wizard`
2. Gets redirected to `/`
3. Clicks browser back button

**Expected Result**:
- ✅ Goes to previous page (before /static-wizard)
- ✅ Does NOT go back to /static-wizard
- ✅ No infinite redirect loop

## Code Changes Summary

### Files Modified

1. **`frontend/app/page.tsx`**:
   - Line 7: Changed import from `QuickActionsCard` to `QuickActionsCardWithLimits`
   - Line 141: Changed component usage

2. **`frontend/app/(auth)/static-wizard/page.tsx`**:
   - Added useEffect hook (lines 380-391) for route-level protection
   - Updated `handleUpgradeCancel` (lines 398-402) to redirect after modal dismiss

### Files Already Protected (No Changes Needed)

1. **`frontend/components/dashboard/QuickActionsCardWithLimits.tsx`**:
   - Already has limit checking in `handleActionClick`
   - Previous fix applied

2. **`frontend/components/dashboard/RecentBlueprintsCard.tsx`**:
   - Already has limit checking in `handleCreateClick` (line 81-87)
   - "Create Your First Starmap" button properly disabled (line 127-135)

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER FLOW                                │
└─────────────────────────────────────────────────────────────────┘

Landing Page (/)
  │
  ├─ QuickActionsCardWithLimits
  │    │
  │    └─ handleActionClick()
  │         │
  │         ├─ isAtCreationLimit? NO ──> router.push('/static-wizard')
  │         │                               │
  │         │                               └──> Static Wizard Page
  │         │                                     │
  │         │                                     └─ useEffect checks limit
  │         │                                          │
  │         │                                          ├─ At limit? YES ──> router.replace('/')
  │         │                                          │
  │         │                                          └─ At limit? NO ──> Allow access
  │         │
  │         └─ isAtCreationLimit? YES ──> Show UpgradePromptModal
  │                                          │
  │                                          ├─ "Upgrade Now" ──> /pricing
  │                                          │
  │                                          └─ "Cancel" ──> Stay on landing page
  │
  └─ RecentBlueprintsCard (already protected)
       │
       └─ handleCreateClick() - same pattern
```

## Benefits

### 1. **Complete Protection**
- ✅ Landing page button protected
- ✅ Direct URL access protected
- ✅ Existing blueprint editing allowed
- ✅ Save operation protected

### 2. **Consistent UX**
- All entry points behave the same way
- Same modal appearance across the app
- Predictable user experience

### 3. **Graceful Degradation**
- If user somehow bypasses frontend, API still enforces limit
- No error states - clean redirects
- User never sees broken states

### 4. **Developer Experience**
- Single component (`QuickActionsCardWithLimits`) handles all logic
- Easy to understand and maintain
- Clear separation of concerns

### 5. **Security**
- Server-side enforcement via database functions
- Row-level security (RLS) policies
- Cannot bypass limits via API manipulation

## Related Documentation

- `docs/LIMIT_ENFORCEMENT_FIX.md` - Database migration and service layer
- `docs/STATIC_WIZARD_429_ERROR_HANDLING.md` - Save operation error handling
- `docs/QUICK_ACTIONS_LIMIT_ENHANCEMENT.md` - QuickActions component enhancement
- `docs/prds/user-roles-and-subscriptions.txt` - Overall subscription system

## Summary

✅ **Landing page now uses enhanced component** with limit checking
✅ **Static wizard protected** at route level against direct URL access
✅ **User stays on same page** when at limit - no unwanted navigation
✅ **Upgrade modal shows immediately** when button clicked at limit
✅ **Existing blueprints remain editable** even when at limit
✅ **Clean redirects** with no back button loops
✅ **5-layer protection** from UI to database

**Result**: Users can no longer access the static questionnaire when at their blueprint creation limit. The system provides clear, immediate feedback through upgrade modals and prevents all pathways to creating new blueprints while preserving access to existing work.
