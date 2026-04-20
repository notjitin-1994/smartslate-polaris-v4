# Next.js App Layout Structure Analysis

## Overview
This document provides a comprehensive analysis of the layout structure for user-facing pages in the Polaris v3 Next.js application, including how the sidebar affects content positioning and centering.

---

## 1. Layout Hierarchy

### 1.1 Root Layout (`frontend/app/layout.tsx`)
- **Scope**: Wraps entire application
- **Contains**:
  - ThemeProvider (dark theme default)
  - AuthProvider
  - RazorpayProvider
  - GlobalErrorBoundary
- **No sidebar offset at this level** - sidebar is handled in child layouts
- **Meta tags**: Mobile optimization, viewport, apple web app config

### 1.2 Auth Group Layout (`frontend/app/(auth)/layout.tsx`)
- **Scope**: All authenticated pages under `(auth)/` route group
- **Wraps children with**:
  - AuthProvider
  - QueryProvider (TanStack Query)
  - **GlobalLayout** (the main layout component)
- **Layout pattern**: This is where the sidebar and content offset are introduced

### 1.3 Page Layouts
Individual pages don't explicitly define layouts; they rely on the parent `(auth)/layout.tsx` which wraps everything in `GlobalLayout`.

---

## 2. GlobalLayout Component (`frontend/components/layout/GlobalLayout.tsx`)

### 2.1 Structure
```
GlobalLayout (main layout wrapper)
├── OfflineIndicator
└── Main Container (flex, min-h-screen, w-full, flex-col)
    ├── Sidebar (conditionally rendered)
    └── Main Content Wrapper
        ├── Main element (flex-1)
        │   └── {children} (page content)
        └── Mobile Menu Overlay (md:hidden)
```

### 2.2 Key Features

#### Sidebar Visibility
- **Hidden on**: `/login` and `/signup` pages
- **Shown on**: All other authenticated pages (dashboard, settings, pricing when accessed from auth area, etc.)

#### Sidebar Offset Pattern
The sidebar uses a **fixed positioning** model with conditional margin offsets on the main content wrapper:

```tsx
<div
  className={
    hideSidebar
      ? 'flex min-h-screen flex-col'
      : 'ml-16 flex min-h-screen flex-col md:ml-72 lg:ml-80'
  }
>
```

**Breakdown**:
- **Mobile (default)**: `ml-16` (64px) - collapsed sidebar width
- **Tablet (md)**: `ml-72` (288px) - expanded sidebar width
- **Desktop (lg)**: `ml-80` (320px) - fully expanded sidebar width
- **No sidebar**: No margin offset

### 2.3 Sidebar Component (`frontend/components/layout/Sidebar.tsx`)

#### Fixed Positioning
```tsx
<aside
  className={`fixed top-0 left-0 hidden h-screen flex-col md:flex ${
    sidebarCollapsed ? 'md:w-16 lg:w-16' : 'md:w-72 lg:w-80'
  } ...`}
/>
```

#### Width Values
- **Collapsed state**: `md:w-16 lg:w-16` (64px)
- **Expanded state**: `md:w-72 lg:w-80` (288px / 320px)
- **Responsive**: Hidden on mobile (md:flex), only shown on md+ breakpoints

#### Z-index
- Sidebar: `z-[9999]`
- Mobile menu overlay: `z-50`
- Ensures sidebar stays on top

### 2.4 Mobile Menu
- Slides in from the right on mobile (md:hidden)
- Full-height overlay with backdrop blur
- Dismissible by clicking backdrop or close button
- Uses Framer Motion for spring animation

---

## 3. Content Centering Strategy

### 3.1 Centering Approach
Each page uses a consistent centering pattern:

```tsx
<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
  {/* Content centered with max-width constraint */}
</div>
```

**Breakdown**:
- `mx-auto`: Centers the container horizontally
- `max-w-7xl`: Maximum width of 80rem (1280px)
- `px-4 sm:px-6 lg:px-8`: Responsive padding (16px → 24px → 32px)
- `py-6 sm:py-6 lg:px-8`: Vertical padding

### 3.2 Content Width Progression
1. **Mobile**: 100% width - padding (16px left/right) = 100vw - 32px
2. **Tablet**: 100% width - padding (24px left/right) + sidebar offset (288px) = 100vw - 48px - 288px margin
3. **Desktop**: 1280px max-width + 32px padding per side = 1344px total

### 3.3 Sidebar Impact on Content Centering
The sidebar offset (`ml-16`, `md:ml-72`, `lg:ml-80`) pushes the entire content area to the right:

```
WITHOUT SIDEBAR:
[Padding | Content (centered, max 1280px) | Padding]
^ Full viewport width

WITH SIDEBAR:
[Sidebar 64px/288px/320px] [Padding | Content (centered, max 1280px) | Padding]
^ Sidebar pushes content, content still centers within remaining space
```

---

## 4. User-Facing Pages Structure

### 4.1 Dashboard (`(auth)/dashboard/page.tsx`)
```
GlobalLayout
└── Dashboard Content
    ├── Hero Section (Welcome Message)
    │   └── max-w-7xl container
    ├── Dashboard Content Grid
    │   ├── EnhancedUsageStatsCard
    │   ├── QuickActionsCardWithLimits
    │   └── RecentBlueprintsCard
    └── All wrapped with mx-auto max-w-7xl
```

**Features**:
- Large welcome heading (7xl-10xl text)
- Two-column layout (md:grid-cols-2) on medium+ screens
- Full-width recent blueprints card
- No custom sidebar needed

### 4.2 Settings (`(auth)/settings/page.tsx`)
```
GlobalLayout
└── Settings Content
    ├── Header with Back Navigation
    ├── ProfileSection
    ├── SubscriptionSection
    ├── UsageDetailPanel
    ├── PreferencesSettings
    ├── NotificationsSettings
    └── SecuritySettings
    └── All wrapped with mx-auto max-w-7xl
```

**Features**:
- Standard settings layout
- Uses sidebar to show active section
- Custom sidebar content: `SettingsSidebarContent`

### 4.3 Profile (`(auth)/profile/page.tsx`)
```
GlobalLayout
└── Profile Content
    ├── Header with Back Navigation
    ├── ProfileSection
    ├── AccountInfoSection
    └── ActivitySection
    └── All wrapped with mx-auto max-w-7xl
```

**Features**:
- Profile information display
- Account details and activity history
- Similar structure to settings page

### 4.4 Pricing (`pricing/page.tsx`)
```
Root Layout (NOT using GlobalLayout)
└── Pricing Content
    ├── CurrencyProvider
    ├── RazorpayProvider
    ├── ToastProvider
    ├── Hero Section
    ├── Individual Plans Grid
    ├── Team Plans Grid
    ├── Features Grid
    └── Footer
    └── All wrapped with mx-auto max-w-7xl
```

**Important**: Pricing page does NOT use the `(auth)` layout group, so it:
- Does NOT render the sidebar
- Does NOT have sidebar offsets
- Is accessible to unauthenticated users
- Has its own full-width styling

### 4.5 Landing (`landing/page.tsx`)
```
Root Layout (NOT using GlobalLayout)
└── Landing Content
    ├── Hero Section
    ├── Features Section
    ├── CTA Buttons
    └── All wrapped with mx-auto max-w-7xl
```

**Important**: Same as pricing:
- No sidebar
- No sidebar offsets
- Accessible to all users

---

## 5. Sidebar State Management

### 5.1 Collapse State
- **Storage**: `localStorage` key `portal:sidebarCollapsed`
- **Values**: `'0'` (expanded) or `'1'` (collapsed)
- **Keyboard Shortcut**: Ctrl/Cmd + B to toggle
- **Hydration**: Loaded after component mounts to avoid hydration mismatch

### 5.2 Sidebar Content Switching
```tsx
// Three conditional modes:
if (isActiveBlueprintPage && blueprintData) {
  // Show BlueprintSidebarContent
  <BlueprintSidebarContent {...blueprintData} />
} else if (isSettingsPage) {
  // Show SettingsSidebarContent
  <SettingsSidebarContent />
} else {
  // Show default navigation
  <nav>Quick Access + Product Links</nav>
}
```

---

## 6. Responsive Breakpoints

### 6.1 Tailwind Breakpoints Used
- **sm**: 640px (small mobile tablets)
- **md**: 768px (tablets) - Sidebar shows here
- **lg**: 1024px (desktops) - Sidebar width changes to lg:w-80

### 6.2 Sidebar Visibility
- **Mobile (< md)**: Hidden (md:flex)
- **Tablet+ (>= md)**: Visible

### 6.3 Content Offset Breakpoints
```
Hide sidebar → No offset
md (768px) → ml-72 (288px)
lg (1024px) → ml-80 (320px)
```

---

## 7. Special Layout Cases

### 7.1 Blueprint Pages
When viewing/editing a blueprint (`(auth)/blueprint/[id]/page.tsx`):
- Sidebar shows `BlueprintSidebarContent`
- Contains blueprint-specific tools and navigation
- Main content area still has sidebar offset

### 7.2 Login/Signup Pages
- Sidebar is completely hidden
- Content uses full viewport width
- No sidebar offset applied
- Uses `hideSidebar` logic: `pathname === '/login' || pathname === '/signup'`

### 7.3 Admin Pages (`admin/` directory)
- NOT under `(auth)` layout group
- Do not use GlobalLayout
- May have custom layouts
- Have special `admin` badge in sidebar for developer role

### 7.4 Public Pages
- Landing, pricing, share pages
- Not under `(auth)` layout
- No sidebar
- Full-width content
- Accessible without authentication

---

## 8. Current Centering Implementation Summary

### 8.1 Max-Width Container
All authenticated pages use:
```tsx
<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
```

### 8.2 Sidebar Offset Impact
The sidebar offset is applied at the GlobalLayout level, which:
1. Pushes the entire main content area to the right
2. Does NOT affect the `mx-auto` centering within pages
3. Creates a "side-by-side" layout: Sidebar | Content Area

### 8.3 Effective Content Width
```
Total Available Width = Viewport Width - Sidebar Width

Example on Desktop (1920px viewport, lg breakpoint):
- Sidebar: 320px (lg:w-80)
- Available for content: 1920 - 320 = 1600px
- Content max-width: 1280px (max-w-7xl)
- Content is centered within 1600px available space

Centering calculation:
- Available: 1600px
- Content: 1280px
- Left margin: (1600 - 1280) / 2 = 160px
- Padding left: 32px (lg:px-8)
- Effective left offset: 320 + 160 + 32 = 512px
```

---

## 9. File Structure Reference

```
frontend/
├── app/
│   ├── layout.tsx (root)
│   ├── (auth)/
│   │   ├── layout.tsx (wraps with GlobalLayout)
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── profile/
│   │   │   └── page.tsx
│   │   ├── blueprint/[id]/
│   │   ├── login/
│   │   └── signup/
│   ├── pricing/
│   │   └── page.tsx (NOT under auth)
│   ├── landing/
│   │   └── page.tsx (NOT under auth)
│   └── admin/
│       └── page.tsx (custom layout)
└── components/
    └── layout/
        ├── GlobalLayout.tsx (main layout wrapper)
        ├── Sidebar.tsx (fixed sidebar)
        ├── BlueprintSidebarContent.tsx
        ├── SettingsSidebarContent.tsx
        ├── Header.tsx
        ├── Brand.tsx
        ├── UserAvatar.tsx
        └── ... (other layout components)
```

---

## 10. Key Design Decisions

### 10.1 Why Fixed Sidebar?
- Provides persistent navigation while scrolling
- Allows quick access to main functions
- Space-efficient on desktop
- Collapsible for mobile/tablet spaces

### 10.2 Why Margin-Based Offset?
- Simple to implement
- Works with responsive breakpoints
- Maintains content centering
- Easy to adjust sidebar widths

### 10.3 Why Max-Width Container?
- Prevents content from being too wide
- Improves readability on ultra-wide screens
- Standard modern web design pattern
- Consistent across all pages

### 10.4 Why Hide Sidebar on Login/Signup?
- Cleaner authentication flow
- Focuses user attention on auth forms
- Reduces cognitive load during signup
- Standard UX pattern

---

## 11. Implementation Checklist for New Pages

When creating new user-facing pages in the `(auth)` directory:

1. **Layout Inheritance**
   - ✓ Pages automatically get `GlobalLayout` wrapper
   - ✓ Sidebar is shown automatically
   - ✓ Sidebar offset applied automatically

2. **Content Structure**
   - ✓ Use `mx-auto max-w-7xl px-4 sm:px-6 lg:px-8` wrapper
   - ✓ Center content with this container
   - ✓ Never hardcode pixel widths for centering

3. **Responsive Design**
   - ✓ Test on md (768px) - sidebar appears
   - ✓ Test on lg (1024px) - sidebar width changes
   - ✓ Test on mobile < 768px - sidebar hidden

4. **Sidebar Integration**
   - ✓ If page needs custom sidebar, implement `*SidebarContent.tsx`
   - ✓ Hook into sidebar context: `useBlueprintSidebar()`
   - ✓ Update sidebar path detection in `Sidebar.tsx`

5. **Special Cases**
   - ✓ Public pages: Place outside `(auth)` directory
   - ✓ Pages needing no sidebar: Add to `hideSidebar` condition
   - ✓ Admin pages: Keep in `admin/` directory

---

## Summary

The Polaris layout system uses a **GlobalLayout wrapper** with a **fixed sidebar** that applies **responsive margin offsets** to the main content area. Content is centered using **max-width containers** (`mx-auto max-w-7xl`) within the offset space. This creates a responsive, accessible layout that works across mobile, tablet, and desktop screens while maintaining consistent content centering and visual hierarchy.

The sidebar can be toggled (collapsed/expanded), and its width adjusts at different breakpoints. Authenticated pages under `(auth)/` automatically use this layout, while public pages outside this directory don't have sidebars or offsets.
