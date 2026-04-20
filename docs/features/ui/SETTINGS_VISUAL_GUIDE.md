# Settings Page Visual Guide

## Tab Layout Preview

```
┌─────────────────────────────────────────────────────────────┐
│  Settings                                                   │
│  Manage your account and preferences                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  [Profile] [Account] [Advanced]  <-- Tabs                  │
│   ●                                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  Tab Content Area (Active Tab Only)                        │
│                                                              │
│  [GlassCard Content]                                        │
│  [GlassCard Content]                                        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Tab 1: Profile

```
┌───────────────────────────────────────────────────┐
│ 👤 Profile Information                           │
│                                                   │
│  ┌───┐                                           │
│  │   │  John Doe                                 │
│  │ 👤 │  john@example.com                        │
│  └───┘  [Edit] [Upload Photo]                   │
│                                                   │
│  First Name: [John_____________]                 │
│  Last Name:  [Doe______________]                 │
│                                                   │
│  Email: [john@example.com______] (read-only)    │
│                                                   │
│  [💾 Save Changes]                               │
└───────────────────────────────────────────────────┘
```

## Tab 2: Account

```
┌───────────────────────────────────────────────────┐
│ 💳 Subscription & Usage                          │
│                                                   │
│  Current Plan: [Free Tier]  [⬆ Upgrade Plan]    │
│                                                   │
│  ⚡ Created:  3 / 10           30%               │
│  [████░░░░░░]                                     │
│                                                   │
│  👥 Saved:    2 / 10           20%               │
│  [███░░░░░░░]                                     │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│ 🔐 Security                                       │
│                                                   │
│  🔑 Password: ******** [Change]                  │
│  📱 2FA: Enabled [Manage]                        │
│                                                   │
│  [View Active Sessions]                          │
└───────────────────────────────────────────────────┘
```

## Tab 3: Advanced

```
┌───────────────────────────────────────────────────┐
│ 📥 Data & Privacy                                │
│                                                   │
│  Export Your Data                                │
│  Download profile, blueprints, and activity     │
│                                                   │
│  [📄 Export as JSON] [📋 Export as CSV]         │
└───────────────────────────────────────────────────┘

┌───────────────────────────────────────────────────┐
│ ⚠️ Danger Zone                                   │
│                                                   │
│  🗑️ Delete Account                               │
│  Permanently delete all data                     │
│  30-day grace period applies                     │
│                                                   │
│  [Delete Account]                                │
└───────────────────────────────────────────────────┘
```

## Mobile Layout (< 640px)

```
┌─────────────────────┐
│  Settings           │
│  Manage account     │
└─────────────────────┘

┌─────────────────────┐
│ [👤] [💳] [🔒]      │  <-- Scrollable
│   ●                 │
└─────────────────────┘

┌─────────────────────┐
│                     │
│  Stacked Cards      │
│  (Full Width)       │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  Card 1       │  │
│  │               │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │               │  │
│  │  Card 2       │  │
│  │               │  │
│  └───────────────┘  │
│                     │
└─────────────────────┘
```

## Interaction Flows

### Password Change Flow

```
Initial State:
┌────────────────────────────────┐
│ 🔑 Password: ******** [Change] │
└────────────────────────────────┘

↓ Click "Change"

Expanded State:
┌────────────────────────────────────────────┐
│ 🔑 Password: ******** [Cancel]             │
│                                             │
│ ┌─────────────────────────────────────────┐│
│ │ Current Password: [●●●●●●●●] [👁]      ││
│ │ New Password:     [●●●●●●●●] [👁]      ││
│ │ Confirm Password: [●●●●●●●●]           ││
│ │                                         ││
│ │ [🔑 Update Password]                   ││
│ └─────────────────────────────────────────┘│
└────────────────────────────────────────────┘
```

### Account Deletion Flow

```
Step 1: Initial Button
┌─────────────────────────┐
│ [🗑️ Delete My Account] │
└─────────────────────────┘

↓ Click

Step 2: Confirmation Form
┌──────────────────────────────────────────────┐
│ ⚠️ Are you absolutely sure?                 │
│                                               │
│ Type DELETE to confirm:                      │
│ [________________]                           │
│                                               │
│ [🗑️ Confirm Deletion] [✖ Cancel]            │
└──────────────────────────────────────────────┘

↓ Type "DELETE" + Click Confirm

Step 3: Loading State
┌──────────────────────────────────────────────┐
│ [⏳ Deleting...]                             │
└──────────────────────────────────────────────┘

↓ Complete

Step 4: Redirect to Homepage
```

### Theme Selection

```
Before:
[○ Light] [● Dark] [○ System]
   ↑         ↑          ↑
 Inactive  Active   Inactive

After Click on Light:
[● Light] [○ Dark] [○ System]
   ↑         ↑          ↑
 Active  Inactive  Inactive

Visual Feedback:
- Active: Primary color (#a7dadb), white text
- Inactive: Gray color, secondary text
- Hover: Light primary background
- Pulse indicator on active
```

## Color Coding

```
Component Colors:
├── Primary Actions: #a7dadb (cyan-teal)
├── Secondary Actions: #4f46e5 (indigo)
├── Danger Actions: #ef4444 (red)
├── Success States: #10b981 (green)
├── Warning States: #f59e0b (amber)
├── Info States: #3b82f6 (blue)
└── Neutral: Grayscale variants

Usage Bars:
├── Created: Blue (#3b82f6) → Cyan (#06b6d4)
└── Saved: Purple (#a855f7) → Indigo (#6366f1)
```

## Accessibility Features

```
Keyboard Navigation:
Tab ────────→ Next interactive element
Shift+Tab ──→ Previous interactive element
Arrow Keys ─→ Switch between tabs
Enter/Space → Activate button/toggle
Escape ─────→ Close modal/dropdown

Focus Indicators:
┌─────────────────────────┐
│ [Button with focus]     │
│  └─ 2px ring (#a7dadb) │
└─────────────────────────┘

Screen Reader:
- ARIA labels on all interactive elements
- Role attributes (switch, tab, tabpanel)
- Live regions for dynamic content
- Descriptive button text
```

## Animation Timings

```
Tab Switch:
├── Fade out: 200ms
└── Fade in: 300ms

Card Entrance:
├── Opacity: 0 → 1 (300ms)
└── Y position: 20px → 0 (300ms)

Button Hover:
├── Background: 200ms
└── Scale: 200ms

Toggle Switch:
├── Thumb position: 300ms
└── Background color: 300ms

Progress Bar:
└── Width change: 500ms ease-out
```

## Responsive Breakpoints

```
Mobile:
320px ─────────→ 639px
- Icon-only tabs
- Single column layout
- Full-width cards
- Stacked form fields

Tablet:
640px ─────────→ 1023px
- Icon + text tabs
- Two-column layout (where appropriate)
- Side-by-side form fields
- Comfortable spacing

Desktop:
1024px ────────→ ∞
- Full layout
- Maximum 5xl container (80rem)
- Generous spacing
- Multi-column grids
```

## State Management

```
Component State:
├── Active tab (URL hash + localStorage)
├── Form values (local state)
├── Loading states (per action)
├── Error states (toast notifications)
└── Success states (toast + UI update)

Profile Data Flow:
useUserProfile() ──→ Fetch from Supabase
       ↓
   Profile data
       ↓
   Component state
       ↓
   Render UI
       ↓
   User updates
       ↓
   Save to Supabase
       ↓
   Update local state
       ↓
   Toast notification
```

## Performance Optimizations

```
Lazy Loading:
- Only active tab content rendered
- Images lazy load
- Dynamic imports (if needed)

Debouncing:
- Form auto-save: 500ms
- Search inputs: 300ms

Caching:
- Profile data: useUserProfile hook
- Tab preference: localStorage
- API responses: SWR/React Query

Bundle Splitting:
- Each tab is a separate component
- Can be code-split if needed
- Shared components deduplicated
```

---

**Visual Guide Version**: 1.0
**Last Updated**: 2025-11-09
**Created for**: SmartSlate Polaris v3
