# Admin User Management System - Completion Implementation Plan

**Version:** 1.0
**Date:** January 2025
**Status:** Ready for Implementation
**Estimated Duration:** 8-10 days
**Complexity:** High

---

## Executive Summary

This document provides a comprehensive, industry-standard implementation plan to complete the SmartSlate Polaris v3 admin user management system. The plan addresses **7 missing/incomplete features** identified through systematic code review, bringing the system from **85% to 100% completion**.

### Current State
- ✅ Core user listing, filtering, sorting, pagination
- ✅ User details modal, edit modal, bulk actions
- ✅ Basic API routes (GET, PATCH, DELETE, POST)
- ✅ CSV/JSON export functionality
- ⚠️ Missing: Toast notifications, add user page, activity logging table, advanced filters, Excel/PDF export, individual user pages, usage analytics

### Target State
- 🎯 Complete toast notification system (Sonner)
- 🎯 Functional "Add User" page with Supabase Admin API
- 🎯 Persistent activity logging with dedicated database table
- 🎯 Advanced date and usage range filters
- 🎯 Excel and PDF export capabilities
- 🎯 Individual user activity and blueprints pages
- 🎯 Real-time usage analytics dashboard with charts

---

## Technical Stack & Dependencies

### New Dependencies to Install

```json
{
  "dependencies": {
    "sonner": "^1.5.0",              // Toast notifications
    "exceljs": "^4.4.0",             // Excel export
    "jspdf": "^2.5.2",               // PDF generation
    "jspdf-autotable": "^3.8.3",     // PDF tables
    "recharts": "^2.15.0",           // Charts and graphs
    "date-fns": "^3.3.1"             // Date manipulation
  },
  "devDependencies": {
    "@types/jspdf": "^2.0.0"
  }
}
```

### Existing Technologies (No Changes)
- Next.js 15 (App Router)
- TypeScript 5.7 (strict mode)
- Supabase (PostgreSQL + Auth)
- Tailwind CSS v4
- Radix UI (via shadcn/ui)
- React Hook Form + Zod
- Vitest (testing)

---

## Architecture Overview

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin User Management                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   UI Layer   │  │  API Layer   │  │  Data Layer  │      │
│  │              │  │              │  │              │      │
│  │  • Pages     │  │  • Routes    │  │  • Supabase  │      │
│  │  • Modals    │──│  • Actions   │──│  • RLS       │      │
│  │  • Forms     │  │  • Middleware│  │  • Triggers  │      │
│  │  • Toasts    │  │  • Logging   │  │  • Indexes   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────────────────────────────────────────┐       │
│  │           Cross-Cutting Concerns                  │       │
│  │  • Authentication (Supabase Auth)                 │       │
│  │  • Authorization (RLS + Middleware)              │       │
│  │  • Activity Logging (Centralized)                │       │
│  │  • Error Handling (Toast + API)                  │       │
│  │  • Performance (Caching + Indexes)               │       │
│  └──────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow Architecture

```
User Action → Client Component → API Route → Supabase → Database
                    ↓                  ↓           ↓
              Toast Notification  Activity Log  RLS Check
```

---

## Phase 1: Foundation Layer (Days 1-2)

**Priority:** CRITICAL
**Dependencies:** None
**Estimated Duration:** 2 days

### Overview
Establish the foundation for user feedback and notification system. All subsequent features depend on this.

### 1.1 Install Sonner Toast System

**File:** `frontend/package.json`

```bash
npm install sonner
```

**Rationale:** Sonner is the industry standard for React toast notifications in 2025, with built-in support for Next.js App Router, React Server Components, and shadcn/ui integration.

### 1.2 Create Toast Provider

**File:** `frontend/app/layout.tsx`

```tsx
import { Toaster } from 'sonner'

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          expand={true}
          richColors
          closeButton
          duration={4000}
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#fff',
            },
          }}
        />
      </body>
    </html>
  )
}
```

**Key Features:**
- Matches glassmorphism design system
- Dark theme consistent with app
- 4-second duration (UX best practice)
- Rich colors for success/error/info states

### 1.3 Create Toast Utility Functions

**File:** `frontend/lib/utils/toast.ts`

```typescript
import { toast as sonnerToast } from 'sonner'

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    })
  },

  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 6000, // Longer for errors
    })
  },

  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    })
  },

  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 5000,
    })
  },

  promise: <T,>(
    promise: Promise<T>,
    {
      loading,
      success,
      error,
    }: {
      loading: string
      success: string | ((data: T) => string)
      error: string | ((error: Error) => string)
    }
  ) => {
    return sonnerToast.promise(promise, {
      loading,
      success,
      error,
    })
  },
}

export default toast
```

**Usage Pattern:**
```typescript
// Success
toast.success('User updated', 'Changes saved successfully')

// Error
toast.error('Update failed', error.message)

// Async operations
toast.promise(
  updateUser(data),
  {
    loading: 'Updating user...',
    success: 'User updated successfully',
    error: 'Failed to update user'
  }
)
```

### 1.4 Update Existing API Routes

**Files to Modify:**
- `frontend/components/features/admin/users/UserEditModal.tsx:110-127`
- `frontend/components/features/admin/users/UserManagementTable.tsx:231-251`
- `frontend/components/features/admin/users/BulkActionsBar.tsx:52-84`

**Example Update (UserEditModal):**

```typescript
import toast from '@/lib/utils/toast'

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!validateForm()) {
    return
  }

  setSaving(true)
  setError(null)

  try {
    const response = await fetch(`/api/admin/users/${user.user_id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Failed to update user')
    }

    toast.success('User updated', 'Changes saved successfully')
    onSuccess()
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update user'
    toast.error('Update failed', errorMessage)
    setError(errorMessage)
  } finally {
    setSaving(false)
  }
}
```

### Testing Criteria (Phase 1)
- [ ] Toast appears on user edit success
- [ ] Toast appears on user delete success
- [ ] Toast appears on bulk actions success
- [ ] Error toasts show proper messages
- [ ] Toast position and styling match design system
- [ ] Toast auto-dismisses after appropriate duration
- [ ] Multiple toasts stack properly

---

## Phase 2: Critical Infrastructure & Features (Days 3-4)

**Priority:** CRITICAL
**Dependencies:** Phase 1 (Toast system)
**Estimated Duration:** 2 days

### Overview
Implement the most critical missing features: activity logging infrastructure and user creation capability.

### 2.1 Create Activity Logs Database Table

**File:** `supabase/migrations/0027_activity_logs.sql`

```sql
-- Create activity_logs table for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- User being acted upon
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Admin performing the action
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action_type TEXT NOT NULL CHECK (action_type IN (
    'user_created',
    'user_updated',
    'user_deleted',
    'user_role_changed',
    'user_tier_changed',
    'user_login',
    'user_logout',
    'blueprint_created',
    'blueprint_deleted',
    'password_reset',
    'email_changed',
    'bulk_action'
  )),

  -- Resource information
  resource_type TEXT,
  resource_id TEXT,

  -- Additional context
  metadata JSONB DEFAULT '{}',

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource_type, resource_id);

-- Composite index for common queries
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

-- RLS Policies (Admin-only access)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only developers/admins can read activity logs
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'admin')
    )
  );

-- Only system can insert activity logs (via service role)
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');

-- Nobody can update or delete activity logs (immutable audit trail)
-- (No UPDATE or DELETE policies)

-- Add comment
COMMENT ON TABLE activity_logs IS 'Audit trail for user and admin actions';
COMMENT ON COLUMN activity_logs.metadata IS 'JSONB field for additional context (e.g., changed fields, previous values)';
```

**Rollback Migration:**

**File:** `supabase/migrations/0027_activity_logs_rollback.sql`

```sql
-- Rollback: Drop activity_logs table
DROP TABLE IF EXISTS activity_logs CASCADE;
```

### 2.2 Create Activity Logging Middleware

**File:** `frontend/lib/middleware/activityLogger.ts`

```typescript
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

export type ActivityAction =
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_role_changed'
  | 'user_tier_changed'
  | 'user_login'
  | 'user_logout'
  | 'blueprint_created'
  | 'blueprint_deleted'
  | 'password_reset'
  | 'email_changed'
  | 'bulk_action'

interface LogActivityParams {
  userId: string
  actorId: string
  actionType: ActivityAction
  resourceType?: string
  resourceId?: string
  metadata?: Record<string, unknown>
}

export async function logActivity({
  userId,
  actorId,
  actionType,
  resourceType,
  resourceId,
  metadata = {},
}: LogActivityParams): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient()
    const headersList = await headers()

    // Extract request metadata
    const ipAddress = headersList.get('x-forwarded-for') ||
                     headersList.get('x-real-ip') ||
                     'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const { error } = await supabase.from('activity_logs').insert({
      user_id: userId,
      actor_id: actorId,
      action_type: actionType,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
      ip_address: ipAddress,
      user_agent: userAgent,
    })

    if (error) {
      console.error('[ActivityLogger] Failed to log activity:', error)
      // Don't throw - logging failures shouldn't break the main operation
    }
  } catch (error) {
    console.error('[ActivityLogger] Exception while logging activity:', error)
    // Silently fail - logging is non-critical
  }
}

// Helper function for bulk logging
export async function logBulkActivity({
  userIds,
  actorId,
  actionType,
  metadata = {},
}: {
  userIds: string[]
  actorId: string
  actionType: ActivityAction
  metadata?: Record<string, unknown>
}): Promise<void> {
  try {
    const supabase = getSupabaseAdminClient()
    const headersList = await headers()

    const ipAddress = headersList.get('x-forwarded-for') || 'unknown'
    const userAgent = headersList.get('user-agent') || 'unknown'

    const logs = userIds.map((userId) => ({
      user_id: userId,
      actor_id: actorId,
      action_type: actionType,
      metadata: { ...metadata, bulk_operation: true, total_users: userIds.length },
      ip_address: ipAddress,
      user_agent: userAgent,
    }))

    const { error } = await supabase.from('activity_logs').insert(logs)

    if (error) {
      console.error('[ActivityLogger] Failed to log bulk activity:', error)
    }
  } catch (error) {
    console.error('[ActivityLogger] Exception while logging bulk activity:', error)
  }
}
```

### 2.3 Update Existing API Routes with Activity Logging

**File:** `frontend/app/api/admin/users/[userId]/route.ts`

Add activity logging to PATCH and DELETE handlers:

```typescript
import { logActivity } from '@/lib/middleware/activityLogger'
import { requireAdmin } from '@/lib/auth/adminAuth'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params
    const adminUser = await requireAdmin() // Returns admin user object
    const body = await request.json()

    // ... existing validation code ...

    const { data, error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) {
      console.error('Update user error:', error)
      return NextResponse.json(
        { error: 'Failed to update user', details: error.message },
        { status: 500 }
      )
    }

    // Log activity
    const actionType = body.user_role !== undefined ? 'user_role_changed' :
                      body.subscription_tier !== undefined ? 'user_tier_changed' :
                      'user_updated'

    await logActivity({
      userId,
      actorId: adminUser.id,
      actionType,
      resourceType: 'user_profile',
      resourceId: userId,
      metadata: {
        updated_fields: Object.keys(updates),
        changes: updates,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User updated successfully',
      user: data,
    })
  } catch (error) {
    // ... error handling ...
  }
}
```

### 2.4 Create Add User Page

**File:** `frontend/app/admin/users/new/page.tsx`

```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { UserPlus, ArrowLeft, Mail, User, Lock, Shield, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/GlassCard'
import toast from '@/lib/utils/toast'

// Validation schema
const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  user_role: z.enum(['user', 'developer', 'admin']),
  subscription_tier: z.string(),
  send_email: z.boolean().default(true),
  email_confirm: z.boolean().default(false),
})

type CreateUserForm = z.infer<typeof createUserSchema>

const USER_ROLES = [
  { value: 'user', label: 'User', description: 'Standard user access', icon: User },
  { value: 'developer', label: 'Developer', description: 'Development and admin access', icon: Shield },
  { value: 'admin', label: 'Admin', description: 'Full administrative access', icon: Crown },
]

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free', description: '2 generations, 2 saved' },
  { value: 'explorer', label: 'Explorer', description: '5 generations, 5 saved' },
  { value: 'navigator', label: 'Navigator', description: '25 generations, 25 saved' },
  { value: 'voyager', label: 'Voyager', description: '50 generations, 50 saved' },
  { value: 'crew_member', label: 'Crew Member', description: '10 generations, 10 saved' },
  { value: 'fleet_member', label: 'Fleet Member', description: '30 generations, 30 saved' },
  { value: 'armada_member', label: 'Armada Member', description: '60 generations, 60 saved' },
]

export default function AddUserPage() {
  const router = useRouter()
  const [creating, setCreating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<CreateUserForm>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      user_role: 'user',
      subscription_tier: 'free',
      send_email: true,
      email_confirm: false,
    },
  })

  const onSubmit = async (data: CreateUserForm) => {
    setCreating(true)

    try {
      const response = await fetch('/api/admin/users/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create user')
      }

      toast.success('User created', `${data.email} has been added successfully`)
      router.push('/admin/users')
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user'
      toast.error('Creation failed', errorMessage)
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4 text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>

          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <UserPlus className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white">
                Add New User
              </h1>
              <p className="mt-2 text-lg text-white/70">
                Create a new user account with custom role and tier
              </p>
            </div>
          </div>
        </motion.div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            <GlassCard>
              <div className="space-y-6">
                {/* Email */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    <Mail className="mr-2 inline h-4 w-4" />
                    Email Address *
                  </label>
                  <input
                    type="email"
                    {...register('email')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    placeholder="user@example.com"
                  />
                  {errors.email && (
                    <p className="mt-2 text-xs text-red-400">{errors.email.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    <Lock className="mr-2 inline h-4 w-4" />
                    Password *
                  </label>
                  <input
                    type="password"
                    {...register('password')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    placeholder="Minimum 8 characters"
                  />
                  {errors.password && (
                    <p className="mt-2 text-xs text-red-400">{errors.password.message}</p>
                  )}
                  <p className="mt-2 text-xs text-white/40">
                    Must contain uppercase, lowercase, and number
                  </p>
                </div>

                {/* Full Name */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    <User className="mr-2 inline h-4 w-4" />
                    Full Name *
                  </label>
                  <input
                    type="text"
                    {...register('full_name')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    placeholder="John Doe"
                  />
                  {errors.full_name && (
                    <p className="mt-2 text-xs text-red-400">{errors.full_name.message}</p>
                  )}
                </div>

                {/* Role Selection */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">
                    User Role *
                  </label>
                  <div className="grid gap-3 md:grid-cols-3">
                    {USER_ROLES.map((role) => {
                      const Icon = role.icon
                      return (
                        <label
                          key={role.value}
                          className={`cursor-pointer rounded-lg border p-4 transition-all ${
                            watch('user_role') === role.value
                              ? 'border-cyan-500 bg-cyan-500/10'
                              : 'border-white/10 bg-white/5 hover:bg-white/10'
                          }`}
                        >
                          <input
                            type="radio"
                            {...register('user_role')}
                            value={role.value}
                            className="sr-only"
                          />
                          <div className="flex items-start space-x-3">
                            <Icon className="h-5 w-5 text-cyan-400" />
                            <div>
                              <p className="font-medium text-white">{role.label}</p>
                              <p className="mt-1 text-xs text-white/60">{role.description}</p>
                            </div>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Tier Selection */}
                <div>
                  <label className="mb-3 block text-sm font-medium text-white/70">
                    Subscription Tier *
                  </label>
                  <select
                    {...register('subscription_tier')}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                  >
                    {SUBSCRIPTION_TIERS.map((tier) => (
                      <option key={tier.value} value={tier.value}>
                        {tier.label} - {tier.description}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Email Options */}
                <div className="space-y-3 rounded-lg border border-white/10 bg-white/5 p-4">
                  <label className="flex cursor-pointer items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('send_email')}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Send welcome email</p>
                      <p className="text-xs text-white/60">
                        User will receive email with login credentials
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-center space-x-3">
                    <input
                      type="checkbox"
                      {...register('email_confirm')}
                      className="h-4 w-4 rounded border-white/20 bg-white/10 text-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
                    />
                    <div>
                      <p className="text-sm font-medium text-white">Auto-confirm email</p>
                      <p className="text-xs text-white/60">
                        Skip email verification (user can login immediately)
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </GlassCard>

            {/* Actions */}
            <div className="mt-6 flex items-center justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={creating}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                Cancel
              </Button>

              <Button
                type="submit"
                disabled={creating}
                className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
              >
                {creating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Creating User...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Create User
                  </>
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}
```

### 2.5 Create User Creation API Route

**File:** `frontend/app/api/admin/users/create/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/adminAuth'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'
import { logActivity } from '@/lib/middleware/activityLogger'
import { z } from 'zod'

// Validation schema
const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
  user_role: z.enum(['user', 'developer', 'admin']),
  subscription_tier: z.string(),
  send_email: z.boolean().default(true),
  email_confirm: z.boolean().default(false),
})

/**
 * Admin API: Create a new user
 * POST /api/admin/users/create
 *
 * SECURITY: Uses service_role key - server-side only
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin access
    const adminUser = await requireAdmin()

    const body = await request.json()

    // Validate request body
    const validatedData = createUserSchema.parse(body)

    const supabase = getSupabaseAdminClient()

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: validatedData.email,
      password: validatedData.password,
      email_confirm: validatedData.email_confirm,
      user_metadata: {
        full_name: validatedData.full_name,
      },
    })

    if (authError) {
      console.error('Auth user creation error:', authError)
      return NextResponse.json(
        {
          error: 'Failed to create user account',
          details: authError.message
        },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'User creation returned no data' },
        { status: 500 }
      )
    }

    // Get tier limits
    const tierLimits: Record<string, { creation: number; saving: number }> = {
      free: { creation: 2, saving: 2 },
      explorer: { creation: 5, saving: 5 },
      navigator: { creation: 25, saving: 25 },
      voyager: { creation: 50, saving: 50 },
      crew_member: { creation: 10, saving: 10 },
      fleet_member: { creation: 30, saving: 30 },
      armada_member: { creation: 60, saving: 60 },
    }

    const limits = tierLimits[validatedData.subscription_tier] || tierLimits.free

    // Create user profile
    const { error: profileError } = await supabase.from('user_profiles').insert({
      user_id: authData.user.id,
      email: validatedData.email,
      full_name: validatedData.full_name,
      user_role: validatedData.user_role,
      subscription_tier: validatedData.subscription_tier,
      blueprint_creation_limit: limits.creation,
      blueprint_saving_limit: limits.saving,
      blueprint_creation_count: 0,
      blueprint_saving_count: 0,
    })

    if (profileError) {
      console.error('Profile creation error:', profileError)

      // Cleanup: Delete auth user if profile creation fails
      await supabase.auth.admin.deleteUser(authData.user.id)

      return NextResponse.json(
        {
          error: 'Failed to create user profile',
          details: profileError.message
        },
        { status: 500 }
      )
    }

    // Send welcome email if requested
    if (validatedData.send_email && !validatedData.email_confirm) {
      // Send verification email
      const { error: emailError } = await supabase.auth.admin.inviteUserByEmail(
        validatedData.email
      )

      if (emailError) {
        console.error('Email invitation error:', emailError)
        // Don't fail the request, just log the error
      }
    }

    // Log activity
    await logActivity({
      userId: authData.user.id,
      actorId: adminUser.id,
      actionType: 'user_created',
      resourceType: 'user',
      resourceId: authData.user.id,
      metadata: {
        email: validatedData.email,
        role: validatedData.user_role,
        tier: validatedData.subscription_tier,
        email_confirmed: validatedData.email_confirm,
        welcome_email_sent: validatedData.send_email,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'User created successfully',
      user: {
        id: authData.user.id,
        email: validatedData.email,
        full_name: validatedData.full_name,
        role: validatedData.user_role,
        tier: validatedData.subscription_tier,
      },
    })
  } catch (error) {
    console.error('Create user API error:', error)

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: error instanceof Error && error.message.includes('Unauthorized') ? 403 : 500 }
    )
  }
}
```

### Testing Criteria (Phase 2)
- [ ] Activity logs table created successfully
- [ ] RLS policies enforce admin-only access
- [ ] Indexes created for performance
- [ ] Activity logging middleware works without errors
- [ ] User creation page renders correctly
- [ ] Form validation works (email, password, name)
- [ ] User created successfully via API
- [ ] Auth user and profile created atomically
- [ ] Rollback works if profile creation fails
- [ ] Activity logged for user creation
- [ ] Toast notifications appear on success/error
- [ ] Welcome email sent when requested
- [ ] Email auto-confirmed when selected
- [ ] Redirect to users list after creation

---

## Phase 3: Enhancements (Days 5-6)

**Priority:** HIGH
**Dependencies:** Phases 1 & 2
**Estimated Duration:** 2 days

### Overview
Add advanced filtering capabilities and additional export formats (Excel and PDF).

### 3.1 Install Export Dependencies

```bash
npm install exceljs jspdf jspdf-autotable date-fns
npm install --save-dev @types/jspdf
```

### 3.2 Create Date Range Filter Component

**File:** `frontend/components/admin/users/DateRangeFilter.tsx`

```tsx
'use client'

import { useState } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface DateRangeFilterProps {
  value: DateRange | undefined
  onChange: (range: DateRange | undefined) => void
  placeholder?: string
}

export function DateRangeFilter({ value, onChange, placeholder }: DateRangeFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            'w-full justify-start border-white/10 bg-white/5 text-left font-normal text-white hover:bg-white/10',
            !value && 'text-white/60'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value?.from ? (
            value.to ? (
              <>
                {format(value.from, 'LLL dd, y')} - {format(value.to, 'LLL dd, y')}
              </>
            ) : (
              format(value.from, 'LLL dd, y')
            )
          ) : (
            <span>{placeholder || 'Pick a date range'}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto border-white/10 bg-[#020C1B] p-0" align="start">
        <Calendar
          initialFocus
          mode="range"
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          numberOfMonths={2}
          className="text-white"
        />
        <div className="border-t border-white/10 p-3">
          <Button
            variant="ghost"
            onClick={() => onChange(undefined)}
            className="w-full text-white/60 hover:text-white"
          >
            Clear
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
```

### 3.3 Update AdvancedFilters Component

**File:** `frontend/components/features/admin/users/AdvancedFilters.tsx`

Add date range and usage range filters (updating lines 195-199):

```tsx
import { DateRangeFilter } from '@/components/admin/users/DateRangeFilter'
import { DateRange } from 'react-day-picker'

// ... existing code ...

{/* Advanced Filters - Replace placeholder */}
<div className="border-t border-white/5 pt-4">
  <div className="grid gap-4 md:grid-cols-2">
    {/* Date Range Filter */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/70">Join Date Range</label>
      <DateRangeFilter
        value={filters.dateRange ? {
          from: new Date(filters.dateRange.start),
          to: new Date(filters.dateRange.end),
        } : undefined}
        onChange={(range: DateRange | undefined) => {
          onFiltersChange({
            ...filters,
            dateRange: range ? {
              start: range.from!.toISOString(),
              end: range.to!.toISOString(),
            } : null,
          })
        }}
        placeholder="Filter by join date"
      />
    </div>

    {/* Usage Range Filter */}
    <div className="space-y-2">
      <label className="text-xs font-medium text-white/70">Usage Range (%)</label>
      <div className="flex items-center space-x-2">
        <input
          type="number"
          min="0"
          max="100"
          value={filters.usageRange?.min || ''}
          onChange={(e) => {
            const min = parseInt(e.target.value) || 0
            onFiltersChange({
              ...filters,
              usageRange: {
                min,
                max: filters.usageRange?.max || 100,
              },
            })
          }}
          placeholder="Min"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
        />
        <span className="text-white/40">-</span>
        <input
          type="number"
          min="0"
          max="100"
          value={filters.usageRange?.max || ''}
          onChange={(e) => {
            const max = parseInt(e.target.value) || 100
            onFiltersChange({
              ...filters,
              usageRange: {
                min: filters.usageRange?.min || 0,
                max,
              },
            })
          }}
          placeholder="Max"
          className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
        />
      </div>
      <p className="text-xs text-white/40">
        Filter by blueprint creation usage percentage
      </p>
    </div>
  </div>
</div>
```

### 3.4 Update API Route for Advanced Filters

**File:** `frontend/app/api/admin/users/route.ts`

Add date range and usage range filtering (after line 160):

```typescript
// Apply date range filter
if (filters.dateRange) {
  const startDate = new Date(filters.dateRange.start)
  const endDate = new Date(filters.dateRange.end)
  filteredUsers = filteredUsers.filter((u) => {
    const createdAt = new Date(u.created_at)
    return createdAt >= startDate && createdAt <= endDate
  })
}

// Apply usage range filter
if (filters.usageRange) {
  filteredUsers = filteredUsers.filter((u) => {
    const usagePercent = u.blueprint_creation_limit > 0
      ? (u.blueprint_creation_count / u.blueprint_creation_limit) * 100
      : 0
    return usagePercent >= filters.usageRange!.min &&
           usagePercent <= filters.usageRange!.max
  })
}
```

### 3.5 Implement Excel Export

**File:** `frontend/app/api/admin/users/export/route.ts`

Replace lines 91-98 with full Excel implementation:

```typescript
import ExcelJS from 'exceljs'

case 'excel': {
  const workbook = new ExcelJS.Workbook()
  const worksheet = workbook.addWorksheet('Users')

  // Define columns with styles
  worksheet.columns = [
    { header: 'User ID', key: 'user_id', width: 36 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Full Name', key: 'full_name', width: 25 },
    { header: 'Role', key: 'user_role', width: 15 },
    { header: 'Tier', key: 'subscription_tier', width: 20 },
    { header: 'Blueprints Created', key: 'blueprint_creation_count', width: 18 },
    { header: 'Creation Limit', key: 'blueprint_creation_limit', width: 15 },
    { header: 'Blueprints Saved', key: 'blueprint_saving_count', width: 18 },
    { header: 'Saving Limit', key: 'blueprint_saving_limit', width: 15 },
    { header: 'Join Date', key: 'created_at', width: 20 },
    { header: 'Last Sign In', key: 'last_sign_in_at', width: 20 },
  ]

  // Style header row
  worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } }
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0891B2' }, // Cyan-600
  }
  worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

  // Add data rows
  filteredUsers.forEach((user, index) => {
    const row = worksheet.addRow({
      user_id: user.user_id,
      email: user.email,
      full_name: user.full_name || 'N/A',
      user_role: user.user_role,
      subscription_tier: user.subscription_tier,
      blueprint_creation_count: user.blueprint_creation_count,
      blueprint_creation_limit: user.blueprint_creation_limit,
      blueprint_saving_count: user.blueprint_saving_count,
      blueprint_saving_limit: user.blueprint_saving_limit,
      created_at: new Date(user.created_at).toLocaleDateString(),
      last_sign_in_at: user.last_sign_in_at
        ? new Date(user.last_sign_in_at).toLocaleDateString()
        : 'Never',
    })

    // Alternate row colors
    if (index % 2 === 0) {
      row.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFF9FAFB' }, // Gray-50
      }
    }
  })

  // Add filters
  worksheet.autoFilter = {
    from: 'A1',
    to: `K${worksheet.rowCount}`,
  }

  // Generate buffer
  const buffer = await workbook.xlsx.writeBuffer()

  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="users-export-${Date.now()}.xlsx"`,
    },
  })
}
```

### 3.6 Implement PDF Export

Add after Excel case in `frontend/app/api/admin/users/export/route.ts`:

```typescript
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

case 'pdf': {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  })

  // Add title
  doc.setFontSize(18)
  doc.text('User Management Report', 14, 15)

  // Add metadata
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22)
  doc.text(`Total Users: ${filteredUsers.length}`, 14, 27)

  // Define columns
  const columns = fields.length > 0 ?
    fields.map(field => ({
      header: field.replace(/_/g, ' ').toUpperCase(),
      dataKey: field
    })) :
    [
      { header: 'EMAIL', dataKey: 'email' },
      { header: 'FULL NAME', dataKey: 'full_name' },
      { header: 'ROLE', dataKey: 'user_role' },
      { header: 'TIER', dataKey: 'subscription_tier' },
      { header: 'CREATED', dataKey: 'blueprint_creation_count' },
      { header: 'LIMIT', dataKey: 'blueprint_creation_limit' },
      { header: 'JOIN DATE', dataKey: 'created_at' },
    ]

  // Prepare data
  const rows = filteredUsers.map(user => ({
    ...user,
    full_name: user.full_name || 'N/A',
    created_at: new Date(user.created_at).toLocaleDateString(),
    last_sign_in_at: user.last_sign_in_at
      ? new Date(user.last_sign_in_at).toLocaleDateString()
      : 'Never',
  }))

  // Add table
  autoTable(doc, {
    columns,
    body: rows,
    startY: 32,
    headStyles: {
      fillColor: [8, 145, 178], // Cyan-600
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251], // Gray-50
    },
    styles: {
      fontSize: 8,
      cellPadding: 2,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
    },
  })

  // Generate PDF buffer
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="users-export-${Date.now()}.pdf"`,
    },
  })
}
```

### Testing Criteria (Phase 3)
- [ ] Date range filter UI renders correctly
- [ ] Date picker allows selecting date ranges
- [ ] Usage range filter validates min/max values
- [ ] Filters apply correctly to user list
- [ ] API route handles date range queries
- [ ] API route handles usage range queries
- [ ] Excel export generates valid .xlsx files
- [ ] Excel file has proper formatting and styles
- [ ] PDF export generates valid .pdf files
- [ ] PDF includes all selected fields
- [ ] PDF has proper table formatting
- [ ] Export respects active filters
- [ ] Large datasets export without errors

---

## Phase 4: Complex Features (Days 7-8)

**Priority:** MEDIUM
**Dependencies:** All previous phases
**Estimated Duration:** 2 days

### Overview
Build individual user detail pages and comprehensive analytics dashboard.

### 4.1 Create User Activity Detail Page

**File:** `frontend/app/admin/users/[userId]/activity/page.tsx`

```tsx
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, Activity as ActivityIcon, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface ActivityLog {
  id: string
  action_type: string
  resource_type: string | null
  resource_id: string | null
  metadata: Record<string, unknown>
  ip_address: string | null
  user_agent: string | null
  created_at: string
  actor: {
    id: string
    email: string
    full_name: string | null
  } | null
}

interface PageProps {
  params: Promise<{ userId: string }>
}

export default function UserActivityPage({ params }: PageProps) {
  const router = useRouter()
  const { userId } = use(params)

  const [activities, setActivities] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')

  useEffect(() => {
    fetchActivities()
  }, [userId])

  const fetchActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}/activity-logs`)
      const data = await response.json()

      if (data.activities) {
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Failed to fetch activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredActivities = filter === 'all'
    ? activities
    : activities.filter(a => a.action_type === filter)

  const actionTypes = ['all', ...new Set(activities.map(a => a.action_type))]

  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            className="mb-4 text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                <ActivityIcon className="h-8 w-8 text-cyan-400" />
              </div>
              <div>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white">
                  Activity Timeline
                </h1>
                <p className="mt-2 text-lg text-white/70">
                  Comprehensive audit trail for this user
                </p>
              </div>
            </div>

            {/* Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-white/60" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              >
                {actionTypes.map(type => (
                  <option key={type} value={type}>
                    {type === 'all' ? 'All Activities' : type.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </motion.div>

        {/* Activity Timeline */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <GlassCard>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              </div>
            ) : filteredActivities.length > 0 ? (
              <div className="relative space-y-4">
                {/* Timeline Line */}
                <div className="absolute top-0 bottom-0 left-[19px] w-px bg-white/10" />

                {filteredActivities.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative flex items-start space-x-4 pl-12"
                  >
                    <div className="absolute left-0 flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
                      <ActivityIcon className="h-5 w-5 text-cyan-400" />
                    </div>

                    <div className="flex-1 rounded-lg border border-white/10 bg-white/5 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-white">
                            {activity.action_type.replace(/_/g, ' ')}
                          </p>
                          {activity.actor && (
                            <p className="mt-1 text-sm text-white/60">
                              by {activity.actor.full_name || activity.actor.email}
                            </p>
                          )}
                          {Object.keys(activity.metadata).length > 0 && (
                            <details className="mt-2">
                              <summary className="cursor-pointer text-xs text-cyan-400">
                                View details
                              </summary>
                              <pre className="mt-2 overflow-x-auto rounded bg-black/20 p-2 text-xs text-white/80">
                                {JSON.stringify(activity.metadata, null, 2)}
                              </pre>
                            </details>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-white/40">
                            {new Date(activity.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </p>
                          {activity.ip_address && (
                            <p className="mt-1 text-xs text-white/30">
                              IP: {activity.ip_address}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12">
                <ActivityIcon className="h-12 w-12 text-white/20" />
                <p className="mt-4 text-sm text-white/60">No activity recorded yet</p>
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
```

### 4.2 Create Activity Logs API Route

**File:** `frontend/app/api/admin/users/[userId]/activity-logs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/adminAuth'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()

    const { userId } = await params
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const supabase = getSupabaseAdminClient()

    // Get activity logs with actor information
    const { data: activities, error } = await supabase
      .from('activity_logs')
      .select(`
        *,
        actor:actor_id (
          id:user_id,
          email,
          full_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Failed to fetch activity logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch activity logs', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      activities,
      total: activities?.length || 0,
    })
  } catch (error) {
    console.error('Activity logs API error:', error)
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
```

### 4.3 Create User Blueprints Page

**File:** `frontend/app/admin/users/[userId]/blueprints/page.tsx`

```tsx
'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ArrowLeft, FileText, Download, Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/ui/GlassCard'
import { Badge } from '@/components/ui/badge'

interface Blueprint {
  id: string
  created_at: string
  updated_at: string
  status: 'draft' | 'generating' | 'completed' | 'error'
  blueprint_json: Record<string, unknown> | null
}

interface PageProps {
  params: Promise<{ userId: string }>
}

export default function UserBlueprintsPage({ params }: PageProps) {
  const router = useRouter()
  const { userId } = use(params)

  const [blueprints, setBlueprints] = useState<Blueprint[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchBlueprints()
  }, [userId])

  const fetchBlueprints = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}/blueprints`)
      const data = await response.json()

      if (data.blueprints) {
        setBlueprints(data.blueprints)
      }
    } catch (error) {
      console.error('Failed to fetch blueprints:', error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-500/20 text-gray-400',
      generating: 'bg-yellow-500/20 text-yellow-400',
      completed: 'bg-green-500/20 text-green-400',
      error: 'bg-red-500/20 text-red-400',
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            className="mb-4 text-white/60 hover:text-white"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Users
          </Button>

          <div className="flex items-center space-x-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
              <FileText className="h-8 w-8 text-cyan-400" />
            </div>
            <div>
              <h1 className="font-heading text-4xl font-bold tracking-tight text-white">
                User Blueprints
              </h1>
              <p className="mt-2 text-lg text-white/70">
                All blueprints created by this user
              </p>
            </div>
          </div>
        </motion.div>

        {/* Blueprints Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {loading ? (
            <GlassCard className="p-12">
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <p className="text-white/60">Loading blueprints...</p>
              </div>
            </GlassCard>
          ) : blueprints.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {blueprints.map((blueprint, index) => (
                <motion.div
                  key={blueprint.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="hover:border-cyan-500/50 transition-all">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <Badge className={getStatusColor(blueprint.status)}>
                          {blueprint.status}
                        </Badge>
                        <p className="mt-3 text-sm text-white/60">
                          Created: {new Date(blueprint.created_at).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-white/40">
                          ID: {blueprint.id.slice(0, 8)}...
                        </p>
                      </div>
                      <FileText className="h-6 w-6 text-cyan-400/60" />
                    </div>

                    <div className="mt-4 flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="small"
                        onClick={() => router.push(`/blueprints/${blueprint.id}`)}
                        className="flex-1 border-white/10 bg-white/5 text-white hover:bg-white/10"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                      {blueprint.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="small"
                          onClick={() => {/* Download logic */}}
                          className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </GlassCard>
                </motion.div>
              ))}
            </div>
          ) : (
            <GlassCard>
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-white/20" />
                <p className="mt-4 text-sm text-white/60">No blueprints created yet</p>
              </div>
            </GlassCard>
          )}
        </motion.div>
      </div>
    </div>
  )
}
```

### 4.4 Create User Blueprints API Route

**File:** `frontend/app/api/admin/users/[userId]/blueprints/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/auth/adminAuth'
import { getSupabaseAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    await requireAdmin()

    const { userId } = await params

    const supabase = getSupabaseAdminClient()

    const { data: blueprints, error } = await supabase
      .from('blueprint_generator')
      .select('id, created_at, updated_at, status, blueprint_json')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch blueprints:', error)
      return NextResponse.json(
        { error: 'Failed to fetch blueprints', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      blueprints,
      total: blueprints?.length || 0,
    })
  } catch (error) {
    console.error('Blueprints API error:', error)
    return NextResponse.json(
      { error: 'Unauthorized or internal error' },
      { status: 403 }
    )
  }
}
```

### 4.5 Implement Session Tracking (Optional - Time Permitting)

**File:** `frontend/lib/middleware/sessionTracking.ts`

```typescript
// Session tracking implementation
// Store session data in activity_logs or separate sessions table
// Track: session start, session end, page views, actions per session
// Calculate: avg session duration, total sessions, last active

// This is a simplified version - full implementation would require:
// 1. Session table in database
// 2. Client-side session tracking
// 3. Beacon API for session end detection
// 4. Aggregation queries for analytics
```

### 4.6 Install Chart Library

```bash
npm install recharts
```

### 4.7 Create Analytics Dashboard (Enhanced UserDetailsModal)

Update `frontend/components/features/admin/users/UserDetailsModal.tsx` lines 448-494:

```tsx
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

// In Usage Analytics Tab (replace placeholder at line 490-492):
<TabsContent value="usage" className="space-y-4">
  <GlassCard>
    <h3 className="mb-4 text-lg font-semibold text-white">Usage Analytics</h3>

    {/* Stats Cards */}
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Total Sessions</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {user.usage_metadata?.total_sessions || 0}
            </p>
          </div>
          <Activity className="h-8 w-8 text-cyan-400/60" />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Avg. Session</p>
            <p className="mt-1 text-2xl font-bold text-white">
              {user.usage_metadata?.avg_session_duration
                ? `${Math.round(user.usage_metadata.avg_session_duration)}m`
                : '0m'}
            </p>
          </div>
          <Clock className="h-8 w-8 text-purple-400/60" />
        </div>
      </div>

      <div className="rounded-lg border border-white/10 bg-white/5 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-white/60">Usage Rate</p>
            <p className="mt-1 text-2xl font-bold text-white">{usagePercent}%</p>
          </div>
          <BarChart3 className="h-8 w-8 text-green-400/60" />
        </div>
      </div>
    </div>

    {/* Usage Chart */}
    <div className="mt-6 h-64 rounded-lg border border-white/10 bg-white/5 p-4">
      <h4 className="mb-4 text-sm font-semibold text-white">Usage Breakdown</h4>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={[
              { name: 'Used', value: user.blueprint_creation_count },
              {
                name: 'Remaining',
                value: user.blueprint_creation_limit - user.blueprint_creation_count
              },
            ]}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            <Cell fill="#06b6d4" />
            <Cell fill="rgba(255, 255, 255, 0.1)" />
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  </GlassCard>
</TabsContent>
```

### Testing Criteria (Phase 4)
- [ ] User activity page renders correctly
- [ ] Activity timeline displays chronologically
- [ ] Activity filter works properly
- [ ] Activity logs API returns correct data
- [ ] User blueprints page renders correctly
- [ ] Blueprints grid displays all user blueprints
- [ ] Blueprint status badges show correct colors
- [ ] Blueprints API returns correct data
- [ ] Charts render without errors
- [ ] Usage analytics display correct metrics
- [ ] Session tracking captures data (if implemented)
- [ ] All pages are responsive and accessible

---

## Testing & Quality Assurance Strategy

### Integration Testing

**File:** `frontend/__tests__/integration/admin-users.test.ts`

```typescript
import { describe, it, expect, beforeEach } from 'vitest'
import { createClient } from '@supabase/supabase-js'

describe('Admin User Management API', () => {
  let supabase: ReturnType<typeof createClient>

  beforeEach(() => {
    // Setup test database
  })

  describe('POST /api/admin/users/create', () => {
    it('creates user with valid data', async () => {
      // Test implementation
    })

    it('rejects invalid email', async () => {
      // Test implementation
    })

    it('logs activity on user creation', async () => {
      // Test implementation
    })
  })

  describe('GET /api/admin/users/[userId]/activity-logs', () => {
    it('returns user activity logs', async () => {
      // Test implementation
    })

    it('enforces admin-only access', async () => {
      // Test implementation
    })
  })

  describe('GET /api/admin/users/export', () => {
    it('exports users as CSV', async () => {
      // Test implementation
    })

    it('exports users as Excel', async () => {
      // Test implementation
    })

    it('exports users as PDF', async () => {
      // Test implementation
    })
  })
})
```

### E2E Testing

**File:** `frontend/__tests__/e2e/admin-user-creation.spec.ts`

```typescript
import { test, expect } from '@playwright/test'

test.describe('Admin User Creation Flow', () => {
  test('admin can create new user', async ({ page }) => {
    // Navigate to admin users
    await page.goto('/admin/users')

    // Click "Add User" button
    await page.click('text=Add User')

    // Fill out form
    await page.fill('input[name="email"]', 'newuser@example.com')
    await page.fill('input[name="password"]', 'SecurePass123!')
    await page.fill('input[name="full_name"]', 'New User')

    // Select role
    await page.click('input[value="user"]')

    // Submit form
    await page.click('button[type="submit"]')

    // Verify success toast
    await expect(page.locator('text=User created')).toBeVisible()

    // Verify redirect to users list
    await expect(page).toHaveURL('/admin/users')
  })
})
```

### Accessibility Audit

Run Lighthouse CI or axe-core:

```bash
npm install --save-dev @axe-core/cli

# Audit key pages
npx axe https://localhost:3000/admin/users
npx axe https://localhost:3000/admin/users/new
```

### Performance Testing

```bash
# Test with large dataset (10,000+ users)
# Measure:
# - Initial page load time
# - Filter application speed
# - Export generation time
# - Database query performance
```

---

## Security Considerations

### Critical Security Requirements

1. **Service Role Key Protection**
   - ✅ Never expose in client-side code
   - ✅ Only use in API routes/server actions
   - ✅ Store in environment variables (not NEXT_PUBLIC_*)

2. **Row Level Security (RLS)**
   - ✅ All tables have RLS enabled
   - ✅ Admin-only policies for sensitive operations
   - ✅ User isolation for regular users

3. **Input Validation**
   - ✅ Zod schemas for all user inputs
   - ✅ Server-side validation (never trust client)
   - ✅ SQL injection prevention (use parameterized queries)

4. **Activity Logging**
   - ✅ Immutable audit trail (no updates/deletes)
   - ✅ Track actor, action, timestamp, IP, user agent
   - ✅ GDPR compliance (retention policies)

5. **Authentication & Authorization**
   - ✅ Middleware enforces admin access
   - ✅ Token validation on every request
   - ✅ Role-based access control (RBAC)

---

## Performance Optimization Strategy

### Database Optimization

1. **Indexes** (Critical)
   ```sql
   -- Activity logs
   CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);

   -- User profiles
   CREATE INDEX idx_user_profiles_role_tier ON user_profiles(user_role, subscription_tier);
   ```

2. **Query Optimization**
   - Use `select()` to fetch only required fields
   - Implement cursor-based pagination for large datasets
   - Use database functions for complex aggregations

3. **Caching Strategy**
   - Cache user list for 60 seconds (revalidate on mutations)
   - Cache activity logs for 5 minutes
   - Use Vercel's Data Cache for static exports

### Frontend Optimization

1. **Code Splitting**
   - Lazy load modals and charts
   - Dynamic imports for heavy components

2. **Image Optimization**
   - Use Next.js Image component for avatars
   - Implement progressive loading

3. **Bundle Size**
   - Tree-shake unused Recharts components
   - Use production builds for dependencies

---

## Deployment Checklist

### Pre-Deployment

- [ ] Run all tests (`npm run test`)
- [ ] Run type checking (`npm run typecheck`)
- [ ] Run linting (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Database migrations tested locally
- [ ] Environment variables configured
- [ ] Service role key secured

### Database Migration

```bash
# From project root
cd supabase
npx supabase db push

# Verify migration
npx supabase db status
```

### Production Deployment

1. **Push code to repository**
   ```bash
   git add .
   git commit -m "feat: Complete admin user management system"
   git push origin main
   ```

2. **Apply database migrations**
   - Run migrations on production Supabase project
   - Verify RLS policies are active

3. **Deploy to Vercel**
   - Automatic deployment on push to main
   - Verify environment variables in Vercel dashboard

4. **Post-Deployment Verification**
   - [ ] Users list loads correctly
   - [ ] Add user page functional
   - [ ] Activity logging working
   - [ ] Exports generate successfully
   - [ ] Toast notifications appear
   - [ ] No console errors
   - [ ] Lighthouse score > 90

---

## Rollback Plan

### If Issues Occur

1. **Code Rollback**
   ```bash
   git revert <commit-hash>
   git push origin main
   ```

2. **Database Rollback**
   ```bash
   # Run rollback migration
   psql <connection-string> -f supabase/migrations/0027_activity_logs_rollback.sql
   ```

3. **Hotfix Procedure**
   - Create hotfix branch
   - Fix critical issue
   - Fast-track testing
   - Deploy immediately

---

## Monitoring & Maintenance

### Key Metrics to Monitor

1. **Performance**
   - Page load times (< 2s)
   - API response times (< 500ms)
   - Database query times (< 100ms)

2. **Errors**
   - API error rate (< 1%)
   - Client-side errors (< 0.1%)
   - Failed exports

3. **Usage**
   - Daily active admin users
   - User creation rate
   - Export requests
   - Activity log growth rate

### Maintenance Tasks

**Weekly:**
- Review activity logs for anomalies
- Check database table sizes
- Monitor API performance

**Monthly:**
- Archive old activity logs (> 90 days)
- Review and optimize slow queries
- Update dependencies

---

## Success Criteria

### Definition of Done

✅ All 30 todo items completed
✅ All tests passing (integration + E2E)
✅ Accessibility score WCAG AA compliant
✅ Lighthouse performance score > 90
✅ Code review approved
✅ Documentation updated
✅ Successfully deployed to production
✅ Post-deployment smoke tests passed

---

## Appendix A: API Specification

### POST /api/admin/users/create

**Request:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "full_name": "John Doe",
  "user_role": "user",
  "subscription_tier": "free",
  "send_email": true,
  "email_confirm": false
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "User created successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "role": "user",
    "tier": "free"
  }
}
```

**Errors:**
- 400: Validation failed
- 403: Unauthorized (not admin)
- 500: Server error

### GET /api/admin/users/[userId]/activity-logs

**Query Parameters:**
- `limit` (default: 100)
- `offset` (default: 0)

**Response (200):**
```json
{
  "activities": [
    {
      "id": "uuid",
      "action_type": "user_created",
      "resource_type": "user",
      "resource_id": "uuid",
      "metadata": {},
      "ip_address": "192.168.1.1",
      "user_agent": "Mozilla/5.0...",
      "created_at": "2025-01-01T00:00:00Z",
      "actor": {
        "id": "uuid",
        "email": "admin@example.com",
        "full_name": "Admin User"
      }
    }
  ],
  "total": 1
}
```

### GET /api/admin/users/export

**Query Parameters:**
- `format`: csv | excel | pdf | json
- `fields`: comma-separated field names
- `sortBy`: field name
- `sortOrder`: asc | desc
- `search`: search query
- `role`: filter by role
- `tier`: filter by tier
- `status`: filter by status

**Response:**
- Binary file download with appropriate Content-Type header

---

## Appendix B: Database Schema

### activity_logs Table

```sql
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_actor_id ON activity_logs(actor_id);
CREATE INDEX idx_activity_logs_action_type ON activity_logs(action_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_user_created ON activity_logs(user_id, created_at DESC);
```

### RLS Policies

```sql
-- Read access for admins only
CREATE POLICY "Admins can view all activity logs"
  ON activity_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE user_profiles.user_id = auth.uid()
      AND user_profiles.user_role IN ('developer', 'admin')
    )
  );

-- Insert access for service role only
CREATE POLICY "Service role can insert activity logs"
  ON activity_logs
  FOR INSERT
  WITH CHECK (auth.jwt()->>'role' = 'service_role');
```

---

## Conclusion

This implementation plan provides a comprehensive, industry-standard roadmap to complete the admin user management system. By following this structured approach with clear phases, dependencies, and testing criteria, you will deliver a world-class, production-ready feature set that enhances the SmartSlate Polaris v3 platform.

**Key Success Factors:**
- Phased approach minimizes risk
- Clear dependencies prevent blocking
- Comprehensive testing ensures quality
- Security-first implementation
- Performance optimization from the start
- Detailed documentation for maintainability

**Estimated Timeline:** 8-10 days
**Risk Level:** Low (well-defined scope, proven technologies)
**ROI:** High (critical missing features, improved UX, compliance-ready)

---

**Document Version:** 1.0
**Last Updated:** January 2025
**Author:** Claude Code
**Status:** Ready for Implementation
