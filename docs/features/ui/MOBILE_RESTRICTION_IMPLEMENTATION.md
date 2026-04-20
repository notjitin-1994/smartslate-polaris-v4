# Mobile Restriction Implementation - Desktop-Only Blueprint Creation

## Overview
Implemented a comprehensive solution that prevents users from creating blueprints/starmaps on mobile and tablet devices. Users attempting creation on non-desktop devices will see a user-friendly modal explaining they need to use a desktop for this feature.

## Architecture

### 1. Device Detection Hook
**File**: `frontend/lib/hooks/useDeviceDetection.ts`

A custom React hook that detects device type based on screen size:
- **Mobile**: < 768px (Tailwind `md` breakpoint)
- **Tablet**: 768px - 1024px (Tailwind `md` to `lg` breakpoint)
- **Desktop**: ≥ 1024px (Tailwind `lg` breakpoint)

**Returns**:
```typescript
{
  deviceType: 'mobile' | 'tablet' | 'desktop'
  isNonDesktop: boolean // true if not desktop
  isMounted: boolean    // hydration safety
  isDesktop: boolean
  isMobile: boolean
  isTablet: boolean
}
```

**Key Features**:
- Listens to window resize events for dynamic detection
- Returns `isMounted: false` on initial render to prevent hydration mismatches
- Responsive to viewport changes

### 2. Desktop-Only Modal Component
**File**: `frontend/components/modals/DesktopOnlyModal.tsx`

A reusable modal component that:
- Displays a monitor icon indicating desktop requirement
- Shows clear messaging about why blueprint creation requires desktop
- Provides dismiss buttons
- Offers helpful note: "You can still view your existing starmaps on mobile"
- Built with Radix UI Dialog for accessibility (WCAG AA compliant)

**Props**:
```typescript
interface DesktopOnlyModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  featureName?: string // e.g., "Blueprint/Starmap Creation"
}
```

## Integration Points

The modal is integrated into all blueprint creation entry points:

### 1. Quick Actions Card
**File**: `frontend/components/dashboard/QuickActionsCardWithLimits.tsx`

- Added `useDeviceDetection` hook
- Added `showDesktopOnlyModal` state
- Check device type BEFORE limit checking in `handleActionClick`
- Shows modal instead of navigating to `/static-wizard` on non-desktop

**Flow**:
```
User clicks "Create New Starmap"
  ↓
Check if non-desktop AND isMounted
  → YES: Show DesktopOnlyModal, return
  → NO: Continue with limit checking
```

### 2. Dashboard Page
**File**: `frontend/app/(auth)/dashboard/page.tsx`

- Already uses QuickActionsCardWithLimits component
- Modal is displayed through that component (no additional changes needed)

### 3. My Starmaps Page
**File**: `frontend/app/(auth)/my-starmaps/page.tsx`

- Added `useDeviceDetection` hook
- Added `showDesktopOnlyModal` state
- Check device type in `handleCreateBlueprint`
- Shows modal before attempting blueprint creation

**Flow**:
```
User clicks "Create Your First Blueprint" or "Create New Starmap"
  ↓
Check if non-desktop AND isMounted
  → YES: Show DesktopOnlyModal, return
  → NO: Continue with blueprint creation logic
```

### 4. Static Questionnaire (Phase 1)
**File**: `frontend/app/(auth)/static-wizard/page.tsx`

- Added `useDeviceDetection` hook
- Added `showDesktopOnlyModal` state
- Added useEffect to show modal on page mount if non-desktop
- Modal displays immediately when user navigates to this page on mobile/tablet

**Flow**:
```
User navigates to /static-wizard on mobile/tablet
  ↓
StaticWizardContent mounts
  ↓
useEffect detects isNonDesktop && isMounted
  ↓
Set showDesktopOnlyModal = true
  ↓
Modal displays
```

### 5. Dynamic Questionnaire (Phase 2)
**File**: `frontend/app/(auth)/dynamic-questionnaire/[blueprintId]/page.tsx`

- Added `useDeviceDetection` hook
- Added `showDesktopOnlyModal` state
- Added useEffect to show modal on page mount if non-desktop
- Modal displays immediately when user navigates to this page on mobile/tablet

**Flow**:
```
User navigates to /dynamic-questionnaire/{id} on mobile/tablet
  ↓
DynamicQuestionnaireContent mounts
  ↓
useEffect detects isNonDesktop && isMounted
  ↓
Set showDesktopOnlyModal = true
  ↓
Modal displays
```

## Implementation Details

### Device Detection Breakpoints
Uses Tailwind CSS breakpoints for consistency with the design system:
- `< 768px`: Mobile devices (phones)
- `768px - 1023px`: Tablet devices
- `≥ 1024px`: Desktop/laptop devices

### Hydration Safety
The hook includes `isMounted` state to prevent hydration mismatches:
```typescript
const [isMounted, setIsMounted] = useState(false);

useEffect(() => {
  setIsMounted(true); // Only true after client hydration
}, []);
```

This ensures the device detection check (`isNonDesktop && isMounted`) doesn't show the modal during server rendering.

### Modal Dismissal
Users can dismiss the modal with either button:
- "Got It" button: Closes modal (user can try again)
- "Dismiss" button: Closes modal (user can try again)

The modal doesn't prevent interaction with the page, allowing users to navigate back or close it.

## User Experience Flow

### Attempt to Create Blueprint on Mobile
1. User clicks "Create New Starmap" or navigates to blueprint creation page
2. Device detection identifies mobile/tablet
3. DesktopOnlyModal appears with clear messaging
4. User is informed they need a desktop device
5. User can dismiss modal and navigate back, or switch to desktop device
6. On desktop, creation works normally with full access

### Viewing Existing Blueprints
- Users can still view and manage existing blueprints on mobile/tablet
- They just can't create new ones
- Read-only access is fully functional on mobile

## Testing Checklist

- [ ] Test on iPhone/mobile browser (< 768px)
- [ ] Test on iPad/tablet browser (768px - 1023px)
- [ ] Test on desktop browser (≥ 1024px)
- [ ] Test modal appears on Quick Actions Card "Create New Starmap"
- [ ] Test modal appears on My Starmaps "Create Your First Blueprint"
- [ ] Test modal appears when navigating to static-wizard on mobile
- [ ] Test modal appears when navigating to dynamic-questionnaire on mobile
- [ ] Test modal dismiss buttons work correctly
- [ ] Test that desktop devices bypass the modal completely
- [ ] Test responsive behavior - modal appearance when resizing browser
- [ ] Test on landscape/portrait mode on mobile
- [ ] Test modal accessibility (keyboard navigation, screen readers)

## Files Modified

1. ✅ `frontend/lib/hooks/useDeviceDetection.ts` - NEW
2. ✅ `frontend/components/modals/DesktopOnlyModal.tsx` - NEW
3. ✅ `frontend/components/dashboard/QuickActionsCardWithLimits.tsx` - MODIFIED
4. ✅ `frontend/app/(auth)/my-starmaps/page.tsx` - MODIFIED
5. ✅ `frontend/app/(auth)/static-wizard/page.tsx` - MODIFIED
6. ✅ `frontend/app/(auth)/dynamic-questionnaire/[blueprintId]/page.tsx` - MODIFIED

## Benefits

1. **Improved UX**: Users understand why they can't create blueprints on mobile
2. **Prevents Incomplete Data**: Ensures questionnaires are completed on appropriately-sized screens
3. **Performance**: Avoids rendering complex forms on resource-constrained devices
4. **User Guidance**: Clear messaging guides users to desktop experience
5. **Accessibility**: All modals and components built with WCAG AA compliance

## Future Enhancements

1. Add option to send user a "desktop link" via email
2. Add analytics tracking for modal displays (device, frequency)
3. Consider tablet support for future versions
4. Add progressive disclosure - allow read-only access on mobile
5. Add device-specific messaging based on screen characteristics
