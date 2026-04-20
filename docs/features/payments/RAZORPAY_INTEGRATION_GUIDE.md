# Razorpay Integration Guide for SmartSlate Polaris v3

**Document Version**: 1.0
**Date**: October 28, 2025
**Author**: Integration Planning Analysis
**Status**: Pre-Integration Assessment

---

## Executive Summary

This document provides a comprehensive guide for integrating Razorpay payment gateway into SmartSlate Polaris v3. The application has a **complete subscription infrastructure** in place but currently lacks payment processing capabilities. This guide outlines prerequisites, implementation strategy, and step-by-step integration plan specifically tailored for Razorpay.

### Current Status
- ✅ **Subscription System**: Fully implemented with 7 tiers
- ✅ **Database Schema**: Complete with usage tracking and rollover
- ✅ **Usage Limits**: Atomic increment functions ready
- ✅ **Admin APIs**: Tier management endpoints exist
- ❌ **Payment Processing**: Not implemented (THIS IS WHAT WE'RE ADDING)

---

## Table of Contents

1. [Current System Analysis](#1-current-system-analysis)
2. [Razorpay Integration Overview](#2-razorpay-integration-overview)
3. [Prerequisites](#3-prerequisites)
4. [Architecture Design](#4-architecture-design)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [Database Changes Required](#6-database-changes-required)
7. [API Routes to Build](#7-api-routes-to-build)
8. [Frontend Components](#8-frontend-components)
9. [Webhook Implementation](#9-webhook-implementation)
10. [Security Considerations](#10-security-considerations)
11. [Testing Strategy](#11-testing-strategy)
12. [Go-Live Checklist](#12-go-live-checklist)

---

## 1. Current System Analysis

### 1.1 Existing Subscription Infrastructure

**7 Subscription Tiers** (source: `frontend/lib/utils/tierDisplay.ts`)

| Tier | Monthly Limit | Use Case | Rollover | Status |
|------|---------------|----------|----------|---------|
| **Free** | 2 blueprints/month (lifetime) | Trial users | 12 months | ✅ Implemented |
| **Explorer** | 5 blueprints/month | Individual users | 12 months | ✅ Implemented |
| **Navigator** | 25 blueprints/month | Professionals & creators | 12 months | ✅ Implemented |
| **Voyager** | 50 blueprints/month | Power users & consultants | 12 months | ✅ Implemented |
| **Crew** | 10 blueprints/seat/month | Small teams | 12 months | ✅ Implemented |
| **Fleet** | 30 blueprints/seat/month | Medium teams | 12 months | ✅ Implemented |
| **Armada** | 60 blueprints/seat/month | Large teams & departments | 12 months | ✅ Implemented |

**Note**: Enterprise tier was removed in October 2025 migration.

### 1.2 Role System

- **User** (default): Subject to tier limits
- **Developer**: Unlimited access for dev/testing
- **Admin**: Full administrative privileges

### 1.3 Database Schema

**Core Table**: `user_profiles`

**Subscription Fields**:
```sql
-- Current tier and role
subscription_tier          TEXT      -- free/explorer/navigator/voyager/crew/fleet/armada
user_role                  TEXT      -- user/developer/admin

-- Usage tracking (cumulative)
blueprint_creation_count   INTEGER
blueprint_saving_count     INTEGER
blueprint_creation_limit   INTEGER
blueprint_saving_limit     INTEGER

-- Monthly rollover tracking (paid tiers only)
current_month_creation_count  INTEGER
current_month_saving_count    INTEGER
billing_cycle_start_date      TIMESTAMPTZ
next_billing_cycle_date       TIMESTAMPTZ

-- Free tier upgrade carryover (12 months)
upgraded_from_free_tier       BOOLEAN
free_tier_carryover_expires_at TIMESTAMPTZ
free_tier_carryover_data      JSONB

-- Metadata
subscription_metadata      JSONB
blueprint_usage_metadata   JSONB
rollover_history          JSONB    -- Last 12 months
```

**Additional Tables**:
- `user_usage_history`: Historical usage by billing period
- `role_audit_log`: Immutable audit log

### 1.4 Existing API Routes

**Admin Routes**:
- `POST /api/admin/grant-access` - Grant developer/admin role
- `POST /api/admin/upgrade-tier` - Manual tier upgrade with carryover
- `DELETE /api/admin/grant-access` - Revoke admin access

**User Routes**:
- `GET /api/user/usage` - Current usage and limits

### 1.5 What's Missing

❌ **Payment processor integration**
❌ **Checkout flow**
❌ **Active pricing page** (deleted from main app)
❌ **Webhook handlers** for payment events
❌ **Subscription activation** workflow
❌ **Invoice generation**
❌ **Payment method management**
❌ **Proration logic** for mid-cycle upgrades
❌ **Scheduled job deployment** (function exists but not running)

---

## 2. Razorpay Integration Overview

### 2.1 Why Razorpay?

**Advantages for Indian SaaS**:
- ✅ **Local Payment Methods**: UPI, cards, wallets, netbanking, EMI
- ✅ **INR First**: Built for Indian market, INR as native currency
- ✅ **Lower Fees**: ~2% for Indian cards vs. Stripe's 2.9%
- ✅ **Regulatory Compliance**: RBI-compliant, Indian entity
- ✅ **Subscription Support**: Native recurring billing
- ✅ **Easy KYC**: Faster merchant onboarding for Indian businesses
- ✅ **24/7 Support**: Indian timezone support

**Comparison with Stripe**:

| Feature | Razorpay | Stripe |
|---------|----------|--------|
| UPI Support | ✅ Native | ❌ Limited |
| Transaction Fee (India) | ~2% | ~2.9% + ₹3 |
| INR Settlements | ✅ Direct | Via Stripe India |
| KYC Timeline | 24-48 hours | 3-7 days |
| Local Support | ✅ Yes | Limited |
| Global Reach | India-focused | Global |

### 2.2 Razorpay Subscription Workflow

```
1. User selects plan on pricing page
   ↓
2. Frontend creates order via API route
   ↓
3. API route creates Razorpay Subscription
   ↓
4. Razorpay Checkout modal opens (authentication transaction)
   ↓
5. User completes payment (one-time authorization)
   ↓
6. Razorpay charges ₹0 or ₹1 for authentication
   ↓
7. Webhook: subscription.activated
   ↓
8. Backend updates user_profiles (tier upgrade, billing cycle setup)
   ↓
9. User redirected to dashboard with upgraded tier
   ↓
10. Razorpay auto-charges at billing cycle start (webhook: payment.captured)
```

### 2.3 Key Razorpay Concepts

**Plans**:
- Created once in Razorpay Dashboard or via API
- Define billing frequency (monthly/yearly)
- Set price per billing cycle
- Immutable once created

**Subscriptions**:
- Links a customer to a plan
- Requires authorization transaction
- Auto-charges at billing cycle start
- Can be paused, resumed, canceled

**Authentication Transaction**:
- Required before first charge
- Usually ₹0 or ₹1 to verify payment method
- Establishes recurring payment mandate

**Webhooks**:
- Real-time event notifications
- Signed with secret key for security
- Must respond with 200 OK within 60 seconds
- Retried for 24 hours on failure

---

## 3. Prerequisites

### 3.1 Razorpay Account Setup

**Step 1: Create Razorpay Account**
1. Visit https://razorpay.com/
2. Sign up as "Business"
3. Complete KYC (PAN, GST, bank details)
4. Wait for approval (24-48 hours)

**Step 2: Get API Credentials**
1. Dashboard → Settings → API Keys
2. Generate **Test Mode** keys first:
   - `key_id` (starts with `rzp_test_`)
   - `key_secret` (keep this secret!)
3. Later, generate **Live Mode** keys:
   - `key_id` (starts with `rzp_live_`)
   - `key_secret`

**Step 3: Enable Subscriptions**
1. Dashboard → Products → Subscriptions
2. Click "Activate"
3. Set up billing details

**Step 4: Configure Webhooks**
1. Dashboard → Settings → Webhooks
2. Add webhook URL: `https://yourdomain.com/api/webhooks/razorpay`
3. Select events (see section 9)
4. Save webhook secret

### 3.2 Environment Variables

Create these in `frontend/.env.local`:

```bash
# Razorpay Credentials (Test Mode)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX
RAZORPAY_KEY_SECRET=YYYYYYYYYYYYYYYY           # Server-side only, DO NOT expose to client

# Webhook Secret
RAZORPAY_WEBHOOK_SECRET=whsec_ZZZZZZZZZZZZZZ  # Server-side only

# App URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000      # For redirects
```

**Security Rules**:
- ✅ `NEXT_PUBLIC_*` variables are safe for client (key_id only)
- ❌ **NEVER** expose `RAZORPAY_KEY_SECRET` to client
- ❌ **NEVER** expose `RAZORPAY_WEBHOOK_SECRET` to client
- ✅ Always validate webhook signatures server-side

### 3.3 NPM Package Installation

```bash
cd frontend
npm install razorpay@^2.9.4
npm install @types/razorpay --save-dev
```

**Package Details**:
- `razorpay`: Official Node.js SDK
- Requires Node.js v14+ (you have v22.2, perfect)

### 3.4 TypeScript Types

Create `frontend/types/razorpay.d.ts`:

```typescript
declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayOrder {
  id: string;
  entity: string;
  amount: number;
  currency: string;
  receipt: string;
  status: string;
}

export interface RazorpaySubscription {
  id: string;
  entity: string;
  plan_id: string;
  customer_id: string;
  status: string;
  current_start: number;
  current_end: number;
  charge_at: number;
  start_at: number;
  end_at: number;
  auth_attempts: number;
  total_count: number;
  paid_count: number;
  remaining_count: number;
  short_url: string;
}

export interface RazorpayPlan {
  id: string;
  entity: string;
  interval: number;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  item: {
    id: string;
    name: string;
    description: string;
    amount: number;
    currency: string;
  };
}

export interface RazorpayWebhookEvent {
  entity: string;
  account_id: string;
  event: string;
  contains: string[];
  payload: {
    payment: {
      entity: any;
    };
    subscription: {
      entity: RazorpaySubscription;
    };
  };
  created_at: number;
}
```

---

## 4. Architecture Design

### 4.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                        │
│                                                                   │
│  ┌───────────────┐    ┌────────────────┐    ┌────────────────┐ │
│  │ Pricing Page  │───▶│ Checkout Flow  │───▶│   Dashboard    │ │
│  └───────────────┘    └────────────────┘    └────────────────┘ │
│         │                     │                      │           │
└─────────┼─────────────────────┼──────────────────────┼───────────┘
          │                     │                      │
          ▼                     ▼                      ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API Routes (Next.js)                         │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/subscriptions/                                     │   │
│  │  ├─ create-plan          (Admin: Create Razorpay plans) │   │
│  │  ├─ create-subscription  (User: Start subscription)     │   │
│  │  ├─ verify-payment       (User: Confirm payment)        │   │
│  │  ├─ cancel              (User: Cancel subscription)     │   │
│  │  └─ update-payment-method (User: Update card)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  /api/webhooks/razorpay (Razorpay → Server)            │   │
│  │  ├─ subscription.activated                              │   │
│  │  ├─ subscription.charged                                │   │
│  │  ├─ subscription.completed                              │   │
│  │  ├─ subscription.cancelled                              │   │
│  │  ├─ payment.authorized                                  │   │
│  │  ├─ payment.captured                                    │   │
│  │  └─ payment.failed                                      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────┬───────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL Database                    │
│                                                                   │
│  ┌─────────────────┐    ┌─────────────────────────────────┐    │
│  │ user_profiles   │    │  NEW: subscriptions table       │    │
│  ├─────────────────┤    ├─────────────────────────────────┤    │
│  │ user_id         │    │ subscription_id (PK)            │    │
│  │ subscription_tier│◀──│ user_id (FK)                    │    │
│  │ billing_cycle_* │    │ razorpay_subscription_id        │    │
│  │ usage_counts    │    │ razorpay_plan_id                │    │
│  │ limits          │    │ status                          │    │
│  └─────────────────┘    │ start_date, end_date            │    │
│                          │ next_billing_date               │    │
│                          │ payment_method                  │    │
│                          └─────────────────────────────────┘    │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │  NEW: payments table (transaction history)             │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ payment_id (PK)                                         │    │
│  │ subscription_id (FK)                                    │    │
│  │ razorpay_payment_id                                     │    │
│  │ amount, currency, status                                │    │
│  │ payment_date                                            │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Razorpay Platform                            │
│                                                                   │
│  ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌──────────────┐ │
│  │  Plans   │  │Subscript.│  │  Payments  │  │   Webhooks   │ │
│  └──────────┘  └──────────┘  └────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Data Flow

**Subscription Creation Flow**:
```
1. User clicks "Subscribe to Navigator" on pricing page
   ↓
2. Frontend calls POST /api/subscriptions/create-subscription
   Body: { planId: 'plan_navigator_monthly', userEmail: 'user@example.com' }
   ↓
3. API Route:
   a. Authenticate user (verify session)
   b. Check if user already has active subscription
   c. Create Razorpay Subscription via SDK:
      razorpay.subscriptions.create({
        plan_id: 'plan_navigator_monthly',
        customer_notify: 1,
        total_count: 12, // 12 months
        quantity: 1
      })
   d. Insert record in subscriptions table (status: 'created')
   e. Return subscription_id and short_url
   ↓
4. Frontend receives subscription_id
   ↓
5. Frontend loads Razorpay Checkout:
   const options = {
     key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
     subscription_id: subscriptionId,
     name: 'SmartSlate Polaris',
     description: 'Navigator Plan - Monthly',
     handler: function(response) {
       // Payment successful
       verifyPayment(response);
     }
   };
   const rzp = new Razorpay(options);
   rzp.open();
   ↓
6. User completes payment in Razorpay modal
   ↓
7. Razorpay calls handler with:
   {
     razorpay_payment_id: 'pay_xxxxx',
     razorpay_subscription_id: 'sub_xxxxx',
     razorpay_signature: 'abc123...'
   }
   ↓
8. Frontend calls POST /api/subscriptions/verify-payment
   Body: { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature }
   ↓
9. API Route:
   a. Verify signature using crypto:
      const text = razorpayPaymentId + '|' + razorpaySubscriptionId;
      const signature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(text)
        .digest('hex');
      if (signature !== razorpaySignature) throw error;
   b. Update subscriptions table (status: 'authenticated')
   c. Wait for webhook (subscription.activated) for final confirmation
   ↓
10. Webhook: subscription.activated arrives
    ↓
11. Webhook handler:
    a. Verify webhook signature
    b. Update user_profiles:
       - Set subscription_tier = 'navigator'
       - Set billing_cycle_start_date = NOW()
       - Set next_billing_cycle_date = NOW() + 1 month
       - Call handle_tier_upgrade() for carryover logic
    c. Update subscriptions table (status: 'active')
    d. Insert payment record in payments table
    ↓
12. User sees upgraded dashboard with Navigator limits
```

**Monthly Billing Flow**:
```
1. Razorpay auto-charges card on billing cycle date
   ↓
2. Webhook: payment.captured (or payment.failed)
   ↓
3. If payment.captured:
   a. Insert record in payments table
   b. Extend next_billing_cycle_date by 1 month
   c. Call reset_monthly_limits() to reset usage counters
   d. Send success email to user
   ↓
4. If payment.failed:
   a. Update subscription status to 'past_due'
   b. Trigger retry logic (Razorpay auto-retries)
   c. Send payment failure email
   d. After 3 failed attempts → webhook: subscription.halted
   e. Downgrade user_profiles.subscription_tier to 'free'
```

---

## 5. Implementation Roadmap

### Phase 1: Setup & Configuration (Day 1-2)

**Tasks**:
1. ✅ Create Razorpay business account
2. ✅ Complete KYC verification
3. ✅ Generate test API keys
4. ✅ Add environment variables
5. ✅ Install razorpay npm package
6. ✅ Create TypeScript types

**Deliverables**:
- [ ] Razorpay account activated
- [ ] API keys stored in `.env.local`
- [ ] TypeScript types defined

### Phase 2: Database Schema Updates (Day 2-3)

**Tasks**:
1. Create `subscriptions` table migration
2. Create `payments` table migration
3. Add RLS policies
4. Create helper functions for subscription management
5. Test migrations locally

**Deliverables**:
- [ ] Migration: `supabase/migrations/0030_razorpay_subscriptions.sql`
- [ ] Migration: `supabase/migrations/0031_razorpay_payments.sql`
- [ ] All tests passing

### Phase 3: Plan Creation & Management (Day 3-4)

**Tasks**:
1. Create Razorpay plans via Dashboard or API
2. Build admin API route: `POST /api/subscriptions/create-plan`
3. Store plan IDs in configuration
4. Build plan listing API: `GET /api/subscriptions/plans`

**Deliverables**:
- [ ] 7 plans created in Razorpay (1 per tier)
- [ ] Plan IDs documented in config
- [ ] Admin route tested

### Phase 4: Subscription Creation API (Day 4-5)

**Tasks**:
1. Build `POST /api/subscriptions/create-subscription`
2. Implement Razorpay SDK initialization
3. Add error handling and logging
4. Write unit tests
5. Test with Razorpay test cards

**Deliverables**:
- [ ] API route functional
- [ ] Error handling complete
- [ ] Tests passing

### Phase 5: Payment Verification (Day 5-6)

**Tasks**:
1. Build `POST /api/subscriptions/verify-payment`
2. Implement signature verification
3. Update subscriptions table
4. Write integration tests

**Deliverables**:
- [ ] Verification route working
- [ ] Signature validation tested
- [ ] Database updates confirmed

### Phase 6: Webhook Implementation (Day 6-8)

**Tasks**:
1. Build `POST /api/webhooks/razorpay`
2. Implement webhook signature verification
3. Handle all subscription events
4. Add idempotency checks
5. Write webhook tests (use Razorpay webhook simulator)

**Deliverables**:
- [ ] Webhook route handling all events
- [ ] Idempotency implemented
- [ ] Tests passing

### Phase 7: Pricing Page & Checkout Flow (Day 8-10)

**Tasks**:
1. Restore pricing page (reference: `smartslate-final/src/app/pricing/page.tsx`)
2. Integrate with subscription APIs
3. Implement Razorpay Checkout modal
4. Add payment confirmation UI
5. Handle errors and edge cases

**Deliverables**:
- [ ] Pricing page live at `/pricing`
- [ ] Checkout flow complete
- [ ] Error handling robust

### Phase 8: Subscription Management UI (Day 10-12)

**Tasks**:
1. Build "My Subscription" page
2. Add cancel subscription flow
3. Add update payment method
4. Add invoice history
5. Show upcoming billing date

**Deliverables**:
- [ ] Subscription management page functional
- [ ] All CRUD operations working
- [ ] UI polished

### Phase 9: Testing & QA (Day 12-14)

**Tasks**:
1. End-to-end testing (all tiers)
2. Test payment failures and retries
3. Test webhook delivery
4. Test upgrade/downgrade scenarios
5. Test free tier carryover logic
6. Security audit

**Deliverables**:
- [ ] All test scenarios passing
- [ ] Security audit complete
- [ ] Documentation updated

### Phase 10: Production Deployment (Day 14-15)

**Tasks**:
1. Switch to live Razorpay keys
2. Configure production webhooks
3. Deploy to Vercel
4. Monitor first transactions
5. Set up alerts for failures

**Deliverables**:
- [ ] Live site accepting payments
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## 6. Database Changes Required

### 6.1 Migration: Create Subscriptions Table

**File**: `supabase/migrations/0030_razorpay_subscriptions.sql`

```sql
-- =====================================================
-- Migration: Razorpay Subscriptions Table
-- Description: Track active subscriptions linked to Razorpay
-- Author: Integration Team
-- Date: 2025-10-28
-- =====================================================

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  -- Primary key
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign key to user_profiles
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Razorpay identifiers
  razorpay_subscription_id TEXT UNIQUE NOT NULL,
  razorpay_plan_id TEXT NOT NULL,
  razorpay_customer_id TEXT,

  -- Subscription details
  status TEXT NOT NULL DEFAULT 'created',
  -- Possible statuses: created, authenticated, active, halted, cancelled, completed, expired

  -- Plan details (denormalized for historical record)
  plan_name TEXT NOT NULL,
  plan_amount INTEGER NOT NULL, -- Amount in paise (₹100 = 10000 paise)
  plan_currency TEXT NOT NULL DEFAULT 'INR',
  plan_period TEXT NOT NULL, -- 'monthly' or 'yearly'
  plan_interval INTEGER NOT NULL DEFAULT 1,

  -- Billing dates
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  current_start TIMESTAMPTZ,
  current_end TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ,
  charge_at TIMESTAMPTZ,

  -- Payment tracking
  total_count INTEGER NOT NULL, -- Total billing cycles (e.g., 12 for annual subscription)
  paid_count INTEGER NOT NULL DEFAULT 0,
  remaining_count INTEGER NOT NULL,

  -- Payment method
  payment_method JSONB, -- Stores card details (masked)

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Short URL from Razorpay
  short_url TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('created', 'authenticated', 'active', 'halted', 'cancelled', 'completed', 'expired', 'paused')),
  CONSTRAINT valid_period CHECK (plan_period IN ('monthly', 'yearly')),
  CONSTRAINT valid_amount CHECK (plan_amount > 0),
  CONSTRAINT one_active_subscription_per_user UNIQUE (user_id) WHERE status = 'active'
);

-- Create indexes
CREATE INDEX idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_razorpay_id ON public.subscriptions(razorpay_subscription_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_subscriptions_next_billing ON public.subscriptions(next_billing_date) WHERE status = 'active';

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at();

-- Row Level Security (RLS)
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own subscriptions
CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert subscriptions (via API)
CREATE POLICY "Service role can insert subscriptions"
  ON public.subscriptions
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

-- Only service role can update subscriptions (via webhooks)
CREATE POLICY "Service role can update subscriptions"
  ON public.subscriptions
  FOR UPDATE
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.subscriptions IS 'Active Razorpay subscriptions linked to users';
COMMENT ON COLUMN public.subscriptions.razorpay_subscription_id IS 'Unique Razorpay subscription ID (sub_xxxxx)';
COMMENT ON COLUMN public.subscriptions.status IS 'Subscription lifecycle status (maps to Razorpay statuses)';
COMMENT ON COLUMN public.subscriptions.plan_amount IS 'Amount in paise (₹100 = 10000 paise)';

-- =====================================================
-- Rollback
-- =====================================================
-- DROP TABLE IF EXISTS public.subscriptions CASCADE;
```

### 6.2 Migration: Create Payments Table

**File**: `supabase/migrations/0031_razorpay_payments.sql`

```sql
-- =====================================================
-- Migration: Razorpay Payments Table
-- Description: Transaction history for all payments
-- Author: Integration Team
-- Date: 2025-10-28
-- =====================================================

-- Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  -- Primary key
  payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Foreign keys
  subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Razorpay identifiers
  razorpay_payment_id TEXT UNIQUE NOT NULL,
  razorpay_order_id TEXT,
  razorpay_invoice_id TEXT,

  -- Payment details
  amount INTEGER NOT NULL, -- Amount in paise
  currency TEXT NOT NULL DEFAULT 'INR',
  status TEXT NOT NULL,
  -- Possible statuses: created, authorized, captured, refunded, failed

  -- Payment method details
  method TEXT, -- card, upi, netbanking, wallet, etc.
  card_network TEXT, -- Visa, Mastercard, RuPay, etc.
  card_last4 TEXT,
  bank TEXT,
  wallet TEXT,
  upi_id TEXT,

  -- Billing period reference (for subscription payments)
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ,

  -- Error details (if failed)
  error_code TEXT,
  error_description TEXT,
  error_source TEXT,
  error_step TEXT,
  error_reason TEXT,

  -- Refund details
  refund_status TEXT,
  refund_amount INTEGER,
  refunded_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('created', 'authorized', 'captured', 'refunded', 'failed', 'pending')),
  CONSTRAINT valid_amount CHECK (amount >= 0)
);

-- Create indexes
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_subscription_id ON public.payments(subscription_id);
CREATE INDEX idx_payments_razorpay_id ON public.payments(razorpay_payment_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_payments_date ON public.payments(payment_date DESC);

-- Create updated_at trigger
CREATE TRIGGER payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_subscriptions_updated_at(); -- Reuse existing function

-- Row Level Security (RLS)
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Users can view their own payments
CREATE POLICY "Users can view own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert/update payments (via webhooks)
CREATE POLICY "Service role can manage payments"
  ON public.payments
  FOR ALL
  USING (auth.role() = 'service_role');

-- Comments
COMMENT ON TABLE public.payments IS 'Complete transaction history for all Razorpay payments';
COMMENT ON COLUMN public.payments.amount IS 'Amount in paise (₹100 = 10000 paise)';
COMMENT ON COLUMN public.payments.status IS 'Payment status from Razorpay';

-- =====================================================
-- Helper Functions
-- =====================================================

-- Function: Get payment history for a user
CREATE OR REPLACE FUNCTION get_user_payment_history(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  payment_id UUID,
  amount INTEGER,
  currency TEXT,
  status TEXT,
  method TEXT,
  payment_date TIMESTAMPTZ,
  billing_period_start TIMESTAMPTZ,
  billing_period_end TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.payment_id,
    p.amount,
    p.currency,
    p.status,
    p.method,
    p.payment_date,
    p.billing_period_start,
    p.billing_period_end
  FROM public.payments p
  WHERE p.user_id = p_user_id
  ORDER BY p.payment_date DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Rollback
-- =====================================================
-- DROP FUNCTION IF EXISTS get_user_payment_history(UUID, INTEGER, INTEGER);
-- DROP TABLE IF EXISTS public.payments CASCADE;
```

### 6.3 Update User Profiles Table

**File**: `supabase/migrations/0032_add_razorpay_fields_to_user_profiles.sql`

```sql
-- =====================================================
-- Migration: Add Razorpay Fields to User Profiles
-- Description: Link user profiles to Razorpay subscriptions
-- Author: Integration Team
-- Date: 2025-10-28
-- =====================================================

-- Add Razorpay-specific fields to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS razorpay_customer_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS active_subscription_id UUID REFERENCES public.subscriptions(subscription_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT,
ADD COLUMN IF NOT EXISTS payment_method_brand TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_razorpay_customer
ON public.user_profiles(razorpay_customer_id);

CREATE INDEX IF NOT EXISTS idx_user_profiles_active_subscription
ON public.user_profiles(active_subscription_id);

-- Add constraint
ALTER TABLE public.user_profiles
ADD CONSTRAINT valid_subscription_status
CHECK (subscription_status IN ('none', 'active', 'past_due', 'cancelled', 'expired'));

-- Comments
COMMENT ON COLUMN public.user_profiles.razorpay_customer_id IS 'Razorpay customer ID (cust_xxxxx)';
COMMENT ON COLUMN public.user_profiles.active_subscription_id IS 'FK to currently active subscription';
COMMENT ON COLUMN public.user_profiles.subscription_status IS 'Overall subscription status';

-- =====================================================
-- Rollback
-- =====================================================
-- ALTER TABLE public.user_profiles
-- DROP COLUMN IF EXISTS razorpay_customer_id,
-- DROP COLUMN IF EXISTS active_subscription_id,
-- DROP COLUMN IF EXISTS subscription_status,
-- DROP COLUMN IF EXISTS payment_method_last4,
-- DROP COLUMN IF EXISTS payment_method_brand;
```

---

## 7. API Routes to Build

### 7.1 Create Subscription

**File**: `frontend/app/api/subscriptions/create-subscription/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logError, logInfo } from '@/lib/logging';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Validation schema
const CreateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  tier: z.enum(['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada']),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { planId, tier } = CreateSubscriptionSchema.parse(body);

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user already has active subscription
    const { data: existingSubscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (existingSubscription) {
      return NextResponse.json(
        { error: 'User already has an active subscription' },
        { status: 400 }
      );
    }

    // Get or create Razorpay customer
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('razorpay_customer_id')
      .eq('user_id', user.id)
      .single();

    let customerId = profile?.razorpay_customer_id;

    if (!customerId) {
      // Create Razorpay customer
      const customer = await razorpay.customers.create({
        name: user.user_metadata?.name || user.email?.split('@')[0],
        email: user.email!,
      });

      customerId = customer.id;

      // Save customer ID
      await supabase
        .from('user_profiles')
        .update({ razorpay_customer_id: customerId })
        .eq('user_id', user.id);
    }

    // Create Razorpay subscription
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: customerId,
      customer_notify: 1, // Send notifications to customer
      total_count: 12, // 12 billing cycles
      quantity: 1,
      notes: {
        user_id: user.id,
        tier: tier,
      },
    });

    // Insert subscription record in database
    const { data: subscriptionRecord, error: insertError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: user.id,
        razorpay_subscription_id: subscription.id,
        razorpay_plan_id: planId,
        razorpay_customer_id: customerId,
        status: 'created',
        plan_name: tier,
        plan_amount: subscription.plan_id, // Get from plan details
        plan_currency: 'INR',
        plan_period: 'monthly', // or 'yearly'
        plan_interval: 1,
        total_count: 12,
        remaining_count: 12,
        short_url: subscription.short_url,
      })
      .select()
      .single();

    if (insertError) {
      logError('subscription-insert-failed', insertError, { userId: user.id });
      throw insertError;
    }

    logInfo('subscription-created', {
      userId: user.id,
      subscriptionId: subscription.id,
      tier,
    });

    return NextResponse.json({
      success: true,
      subscriptionId: subscription.id,
      shortUrl: subscription.short_url,
    });
  } catch (error: any) {
    logError('create-subscription-failed', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create subscription', message: error.message },
      { status: 500 }
    );
  }
}
```

### 7.2 Verify Payment

**File**: `frontend/app/api/subscriptions/verify-payment/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logError, logInfo } from '@/lib/logging';

// Validation schema
const VerifyPaymentSchema = z.object({
  razorpayPaymentId: z.string().min(1),
  razorpaySubscriptionId: z.string().min(1),
  razorpaySignature: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { razorpayPaymentId, razorpaySubscriptionId, razorpaySignature } =
      VerifyPaymentSchema.parse(body);

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify signature
    const text = razorpayPaymentId + '|' + razorpaySubscriptionId;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(text)
      .digest('hex');

    if (expectedSignature !== razorpaySignature) {
      logError('signature-verification-failed', new Error('Invalid signature'), {
        userId: user.id,
        subscriptionId: razorpaySubscriptionId,
      });
      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Update subscription status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ status: 'authenticated' })
      .eq('razorpay_subscription_id', razorpaySubscriptionId)
      .eq('user_id', user.id);

    if (updateError) {
      logError('subscription-update-failed', updateError, { userId: user.id });
      throw updateError;
    }

    logInfo('payment-verified', {
      userId: user.id,
      paymentId: razorpayPaymentId,
      subscriptionId: razorpaySubscriptionId,
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
    });
  } catch (error: any) {
    logError('verify-payment-failed', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Payment verification failed', message: error.message },
      { status: 500 }
    );
  }
}
```

### 7.3 Cancel Subscription

**File**: `frontend/app/api/subscriptions/cancel/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { createClient } from '@/lib/supabase/server';
import { z } from 'zod';
import { logError, logInfo } from '@/lib/logging';

// Initialize Razorpay
const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

// Validation schema
const CancelSubscriptionSchema = z.object({
  cancelAtCycleEnd: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { cancelAtCycleEnd } = CancelSubscriptionSchema.parse(body);

    // Authenticate user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get active subscription
    const { data: subscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (fetchError || !subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      );
    }

    // Cancel subscription in Razorpay
    const cancelledSubscription = await razorpay.subscriptions.cancel(
      subscription.razorpay_subscription_id,
      cancelAtCycleEnd
    );

    // Update subscription in database
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: cancelAtCycleEnd ? 'cancelled' : 'cancelled',
        updated_at: new Date().toISOString(),
      })
      .eq('subscription_id', subscription.subscription_id);

    if (updateError) {
      logError('subscription-cancel-update-failed', updateError, {
        userId: user.id,
      });
      throw updateError;
    }

    // If immediate cancellation, downgrade to free tier
    if (!cancelAtCycleEnd) {
      await supabase
        .from('user_profiles')
        .update({
          subscription_tier: 'free',
          subscription_status: 'cancelled',
          active_subscription_id: null,
        })
        .eq('user_id', user.id);
    }

    logInfo('subscription-cancelled', {
      userId: user.id,
      subscriptionId: subscription.razorpay_subscription_id,
      cancelAtCycleEnd,
    });

    return NextResponse.json({
      success: true,
      message: cancelAtCycleEnd
        ? 'Subscription will be cancelled at the end of billing cycle'
        : 'Subscription cancelled immediately',
      cancelledAt: cancelledSubscription.ended_at,
    });
  } catch (error: any) {
    logError('cancel-subscription-failed', error);

    return NextResponse.json(
      { error: 'Failed to cancel subscription', message: error.message },
      { status: 500 }
    );
  }
}
```

---

## 8. Frontend Components

### 8.1 Checkout Button Component

**File**: `frontend/components/pricing/CheckoutButton.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  planId: string;
  tier: string;
  disabled?: boolean;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export function CheckoutButton({ planId, tier, disabled }: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCheckout = async () => {
    try {
      setLoading(true);

      // Create subscription
      const response = await fetch('/api/subscriptions/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, tier }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription');
      }

      // Load Razorpay checkout
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        subscription_id: data.subscriptionId,
        name: 'SmartSlate Polaris',
        description: `${tier} Plan - Monthly Subscription`,
        image: '/logo.png',
        handler: async function (response: any) {
          // Verify payment
          const verifyResponse = await fetch('/api/subscriptions/verify-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySubscriptionId: response.razorpay_subscription_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = await verifyResponse.json();

          if (verifyResponse.ok) {
            toast.success('Subscription activated successfully!');
            router.push('/dashboard');
          } else {
            toast.error(verifyData.error || 'Payment verification failed');
          }
        },
        prefill: {
          name: '',
          email: '',
          contact: '',
        },
        theme: {
          color: '#A7DADB',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

      rzp.on('payment.failed', function (response: any) {
        toast.error('Payment failed. Please try again.');
        console.error('Payment failed:', response.error);
      });
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast.error(error.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || loading}
      className="w-full"
    >
      {loading ? 'Processing...' : 'Subscribe Now'}
    </Button>
  );
}
```

### 8.2 Razorpay Script Loader

**File**: `frontend/components/providers/RazorpayProvider.tsx`

```typescript
'use client';

import { useEffect } from 'react';

export function RazorpayProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Load Razorpay checkout script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      const existingScript = document.querySelector(
        'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
      );
      if (existingScript) {
        document.body.removeChild(existingScript);
      }
    };
  }, []);

  return <>{children}</>;
}
```

**Update**: Add to `frontend/app/layout.tsx`:

```typescript
import { RazorpayProvider } from '@/components/providers/RazorpayProvider';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <RazorpayProvider>
          {children}
        </RazorpayProvider>
      </body>
    </html>
  );
}
```

---

## 9. Webhook Implementation

### 9.1 Webhook Handler

**File**: `frontend/app/api/webhooks/razorpay/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { logError, logInfo } from '@/lib/logging';

// Use service role client for webhook (bypasses RLS)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Verify webhook signature
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(payload)
    .digest('hex');
  return expectedSignature === signature;
}

export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify signature
    if (!verifyWebhookSignature(payload, signature)) {
      logError('webhook-signature-invalid', new Error('Invalid signature'));
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Parse event
    const event = JSON.parse(payload);
    const eventType = event.event;
    const eventId = event.payload?.payment?.entity?.id || event.payload?.subscription?.entity?.id;

    logInfo('webhook-received', { eventType, eventId });

    // Check idempotency (prevent duplicate processing)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('event_id')
      .eq('event_id', eventId)
      .eq('event_type', eventType)
      .single();

    if (existingEvent) {
      logInfo('webhook-duplicate-skipped', { eventType, eventId });
      return NextResponse.json({ success: true, message: 'Duplicate event' });
    }

    // Handle different event types
    switch (eventType) {
      case 'subscription.activated':
        await handleSubscriptionActivated(event);
        break;
      case 'subscription.charged':
        await handleSubscriptionCharged(event);
        break;
      case 'subscription.completed':
        await handleSubscriptionCompleted(event);
        break;
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(event);
        break;
      case 'subscription.halted':
        await handleSubscriptionHalted(event);
        break;
      case 'payment.authorized':
        await handlePaymentAuthorized(event);
        break;
      case 'payment.captured':
        await handlePaymentCaptured(event);
        break;
      case 'payment.failed':
        await handlePaymentFailed(event);
        break;
      default:
        logInfo('webhook-unhandled-event', { eventType });
    }

    // Record event processing
    await supabase.from('webhook_events').insert({
      event_id: eventId,
      event_type: eventType,
      payload: event,
      processed_at: new Date().toISOString(),
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    logError('webhook-processing-failed', error);
    return NextResponse.json(
      { error: 'Webhook processing failed', message: error.message },
      { status: 500 }
    );
  }
}

// Event Handlers

async function handleSubscriptionActivated(event: any) {
  const subscription = event.payload.subscription.entity;
  const razorpaySubscriptionId = subscription.id;

  // Get subscription from database
  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('razorpay_subscription_id', razorpaySubscriptionId)
    .single();

  if (!dbSubscription) {
    throw new Error(`Subscription not found: ${razorpaySubscriptionId}`);
  }

  // Update subscription status
  await supabase
    .from('subscriptions')
    .update({
      status: 'active',
      start_date: new Date(subscription.start_at * 1000).toISOString(),
      current_start: new Date(subscription.current_start * 1000).toISOString(),
      current_end: new Date(subscription.current_end * 1000).toISOString(),
      next_billing_date: new Date(subscription.charge_at * 1000).toISOString(),
    })
    .eq('razorpay_subscription_id', razorpaySubscriptionId);

  // Upgrade user tier
  const tierMap: Record<string, string> = {
    plan_explorer_monthly: 'explorer',
    plan_navigator_monthly: 'navigator',
    plan_voyager_monthly: 'voyager',
    plan_crew_monthly: 'crew',
    plan_fleet_monthly: 'fleet',
    plan_armada_monthly: 'armada',
  };

  const tier = tierMap[subscription.plan_id] || 'free';

  // Call tier upgrade function (handles carryover)
  await supabase.rpc('handle_tier_upgrade', {
    p_user_id: dbSubscription.user_id,
    p_new_tier: tier,
  });

  // Update user profile
  await supabase
    .from('user_profiles')
    .update({
      subscription_tier: tier,
      subscription_status: 'active',
      active_subscription_id: dbSubscription.subscription_id,
    })
    .eq('user_id', dbSubscription.user_id);

  logInfo('subscription-activated', {
    userId: dbSubscription.user_id,
    tier,
    subscriptionId: razorpaySubscriptionId,
  });
}

async function handleSubscriptionCharged(event: any) {
  const payment = event.payload.payment.entity;
  const subscription = event.payload.subscription.entity;

  // Insert payment record
  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('user_id, subscription_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (dbSubscription) {
    await supabase.from('payments').insert({
      user_id: dbSubscription.user_id,
      subscription_id: dbSubscription.subscription_id,
      razorpay_payment_id: payment.id,
      amount: payment.amount,
      currency: payment.currency,
      status: 'captured',
      method: payment.method,
      payment_date: new Date(payment.created_at * 1000).toISOString(),
    });

    // Reset monthly limits
    await supabase.rpc('reset_monthly_limits', {
      p_user_id: dbSubscription.user_id,
    });

    logInfo('subscription-charged', {
      userId: dbSubscription.user_id,
      amount: payment.amount,
      subscriptionId: subscription.id,
    });
  }
}

async function handleSubscriptionCompleted(event: any) {
  const subscription = event.payload.subscription.entity;

  await supabase
    .from('subscriptions')
    .update({ status: 'completed' })
    .eq('razorpay_subscription_id', subscription.id);

  logInfo('subscription-completed', { subscriptionId: subscription.id });
}

async function handleSubscriptionCancelled(event: any) {
  const subscription = event.payload.subscription.entity;

  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (dbSubscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'cancelled' })
      .eq('razorpay_subscription_id', subscription.id);

    // Downgrade to free tier
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'cancelled',
        active_subscription_id: null,
      })
      .eq('user_id', dbSubscription.user_id);

    logInfo('subscription-cancelled', {
      userId: dbSubscription.user_id,
      subscriptionId: subscription.id,
    });
  }
}

async function handleSubscriptionHalted(event: any) {
  const subscription = event.payload.subscription.entity;

  const { data: dbSubscription } = await supabase
    .from('subscriptions')
    .select('user_id')
    .eq('razorpay_subscription_id', subscription.id)
    .single();

  if (dbSubscription) {
    await supabase
      .from('subscriptions')
      .update({ status: 'halted' })
      .eq('razorpay_subscription_id', subscription.id);

    // Downgrade to free tier (payment failures exhausted)
    await supabase
      .from('user_profiles')
      .update({
        subscription_tier: 'free',
        subscription_status: 'past_due',
        active_subscription_id: null,
      })
      .eq('user_id', dbSubscription.user_id);

    logInfo('subscription-halted', {
      userId: dbSubscription.user_id,
      subscriptionId: subscription.id,
    });
  }
}

async function handlePaymentAuthorized(event: any) {
  // Handle authorization if needed
  logInfo('payment-authorized', { paymentId: event.payload.payment.entity.id });
}

async function handlePaymentCaptured(event: any) {
  // Already handled in subscription.charged
  logInfo('payment-captured', { paymentId: event.payload.payment.entity.id });
}

async function handlePaymentFailed(event: any) {
  const payment = event.payload.payment.entity;

  // Record failed payment
  logError('payment-failed', new Error('Payment failed'), {
    paymentId: payment.id,
    errorCode: payment.error_code,
    errorDescription: payment.error_description,
  });
}
```

### 9.2 Webhook Events Table

**File**: `supabase/migrations/0033_webhook_events.sql`

```sql
-- Create webhook_events table for idempotency
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_event UNIQUE (event_id, event_type)
);

CREATE INDEX idx_webhook_events_event_id ON public.webhook_events(event_id);
CREATE INDEX idx_webhook_events_event_type ON public.webhook_events(event_type);
CREATE INDEX idx_webhook_events_processed_at ON public.webhook_events(processed_at DESC);

COMMENT ON TABLE public.webhook_events IS 'Webhook event processing log for idempotency';
```

---

## 10. Security Considerations

### 10.1 Key Security Principles

**Never Expose Server Keys**:
```bash
# ✅ SAFE (client-side)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx

# ❌ DANGER (server-only)
RAZORPAY_KEY_SECRET=xxxxxxx
RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxxx
```

**Always Verify Signatures**:
- Payment verification: HMAC SHA256 signature
- Webhook verification: HMAC SHA256 signature
- Never trust client-provided data without verification

**Use Service Role Sparingly**:
- Webhooks need service role (bypass RLS)
- User-facing APIs should use authenticated client
- Audit all service role usage

### 10.2 RLS Policies Review

**Subscriptions Table**:
- ✅ Users can SELECT their own subscriptions
- ✅ Only service role can INSERT/UPDATE (via API/webhooks)
- ✅ No user-facing DELETE (admin only)

**Payments Table**:
- ✅ Users can SELECT their own payments
- ✅ Only service role can manage payments
- ✅ Immutable once created

### 10.3 Rate Limiting

**Add rate limiting to API routes**:

```typescript
// frontend/lib/rateLimit.ts
import { LRUCache } from 'lru-cache';

const rateLimit = new LRUCache({
  max: 500,
  ttl: 60000, // 1 minute
});

export function checkRateLimit(identifier: string): boolean {
  const count = (rateLimit.get(identifier) as number) || 0;
  if (count > 10) {
    return false;
  }
  rateLimit.set(identifier, count + 1);
  return true;
}
```

**Usage in API route**:
```typescript
const ip = request.headers.get('x-forwarded-for') || 'unknown';
if (!checkRateLimit(ip)) {
  return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
}
```

### 10.4 Input Validation

**Always use Zod schemas**:
- Validate all user inputs
- Sanitize strings
- Check enum values
- Verify IDs exist in database

### 10.5 Logging & Monitoring

**What to Log**:
- ✅ Subscription creations
- ✅ Payment verifications
- ✅ Webhook events
- ✅ Errors and failures
- ❌ **NEVER log**: API keys, signatures, full card numbers

**Setup Alerts**:
- Failed webhook deliveries
- Failed payments
- Signature verification failures
- Unusual subscription patterns

---

## 11. Testing Strategy

### 11.1 Test Cards

**Razorpay Test Cards** (Test Mode Only):

**Successful Payment**:
```
Card Number: 4111 1111 1111 1111
CVV: Any 3 digits
Expiry: Any future date
```

**Card Declined**:
```
Card Number: 4000 0000 0000 0002
CVV: Any 3 digits
Expiry: Any future date
```

**Insufficient Funds**:
```
Card Number: 4000 0000 0000 9995
CVV: Any 3 digits
Expiry: Any future date
```

### 11.2 Test UPI

**Test UPI ID**: `success@razorpay`

### 11.3 Test Scenarios

**Scenario 1: New Subscription**:
1. Create new user account
2. Navigate to pricing page
3. Select "Navigator" tier
4. Click "Subscribe Now"
5. Complete Razorpay checkout with test card
6. Verify subscription activated
7. Check user_profiles tier updated
8. Check dashboard shows Navigator limits
9. Verify webhook logged

**Scenario 2: Subscription Cancellation**:
1. User with active subscription
2. Navigate to subscription settings
3. Click "Cancel Subscription"
4. Choose "Cancel at end of cycle"
5. Verify subscription status = 'cancelled'
6. Verify user retains access until cycle end
7. After cycle end, verify downgrade to free

**Scenario 3: Payment Failure**:
1. User with active subscription
2. Simulate payment failure (use declined card)
3. Verify webhook: payment.failed
4. Verify subscription status = 'past_due'
5. Verify retry attempts (Razorpay auto-retries)
6. After 3 failures, verify subscription.halted
7. Verify user downgraded to free

**Scenario 4: Free Tier Carryover**:
1. Free tier user (used 0/2 blueprints)
2. Upgrade to Navigator
3. Verify handle_tier_upgrade() called
4. Check free_tier_carryover_data
5. Verify effective limits = 20 + 2 = 22
6. After 12 months, verify carryover expired

### 11.4 Integration Tests

**File**: `frontend/__tests__/integration/razorpay.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient } from '@supabase/supabase-js';

describe('Razorpay Integration', () => {
  let supabase: any;
  let testUserId: string;

  beforeAll(async () => {
    supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    // Create test user
  });

  afterAll(async () => {
    // Cleanup test data
  });

  it('should create subscription', async () => {
    // Test subscription creation
  });

  it('should verify payment signature', async () => {
    // Test signature verification
  });

  it('should handle webhook events', async () => {
    // Test webhook processing
  });

  it('should upgrade user tier', async () => {
    // Test tier upgrade with carryover
  });
});
```

### 11.5 Webhook Testing

**Use Razorpay Webhook Simulator**:
1. Dashboard → Webhooks → Test Webhook
2. Select event type (e.g., subscription.activated)
3. Provide test payload
4. Verify webhook URL responds with 200 OK
5. Check database updates

**Local Webhook Testing with ngrok**:
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok tunnel
ngrok http 3000

# Use ngrok URL in Razorpay webhook settings
# Example: https://abc123.ngrok.io/api/webhooks/razorpay
```

---

## 12. Go-Live Checklist

### Pre-Launch (Test Mode)

- [ ] **Environment Setup**
  - [ ] Razorpay account created and KYC approved
  - [ ] Test API keys configured
  - [ ] Webhook URL configured (test mode)
  - [ ] All environment variables set

- [ ] **Database**
  - [ ] All migrations applied to staging
  - [ ] RLS policies tested
  - [ ] Database functions tested
  - [ ] Backup created

- [ ] **API Routes**
  - [ ] Create subscription route working
  - [ ] Verify payment route working
  - [ ] Cancel subscription route working
  - [ ] All routes return proper errors

- [ ] **Webhooks**
  - [ ] Webhook handler deployed
  - [ ] Signature verification working
  - [ ] All event types handled
  - [ ] Idempotency tested
  - [ ] Webhook logs reviewed

- [ ] **Frontend**
  - [ ] Pricing page restored and functional
  - [ ] Checkout button working
  - [ ] Razorpay modal opens correctly
  - [ ] Payment success flow works
  - [ ] Payment failure handling works
  - [ ] Subscription management UI complete

- [ ] **Testing**
  - [ ] All test scenarios passed
  - [ ] Integration tests passing
  - [ ] Webhook simulator tested
  - [ ] Error handling verified
  - [ ] Edge cases covered

- [ ] **Security**
  - [ ] API keys not exposed to client
  - [ ] Signature verification in place
  - [ ] Rate limiting implemented
  - [ ] Input validation complete
  - [ ] Audit logging enabled

### Production Launch

- [ ] **Switch to Live Mode**
  - [ ] Generate live API keys
  - [ ] Update environment variables
  - [ ] Configure production webhook URL
  - [ ] Test with real card (₹1 test transaction)

- [ ] **Create Production Plans**
  - [ ] Create all 6 tier plans in Razorpay
  - [ ] Document plan IDs
  - [ ] Update plan configuration in app
  - [ ] Verify pricing correct

- [ ] **Deployment**
  - [ ] Deploy to Vercel production
  - [ ] Apply migrations to production database
  - [ ] Verify environment variables set
  - [ ] Check Vercel logs

- [ ] **Post-Launch Monitoring**
  - [ ] Monitor first 5 transactions
  - [ ] Check webhook delivery
  - [ ] Verify database updates
  - [ ] Check for errors in logs
  - [ ] Set up alerts for failures

- [ ] **Customer Communication**
  - [ ] Announcement email ready
  - [ ] FAQ page updated
  - [ ] Support team briefed
  - [ ] Cancellation policy documented

### Scheduled Tasks

- [ ] **Daily Limit Reset Job**
  - [ ] Deploy cron job to call `reset_all_monthly_limits()`
  - [ ] Schedule for 00:00 IST daily
  - [ ] Monitor execution logs

- [ ] **Monthly Reconciliation**
  - [ ] Compare Razorpay dashboard with database
  - [ ] Verify all payments recorded
  - [ ] Check for missed webhooks
  - [ ] Audit active subscriptions

---

## 13. Pricing Configuration

### 13.1 Create Plans in Razorpay

**Option 1: Via Dashboard**
1. Dashboard → Products → Subscriptions → Plans
2. Click "Create Plan"
3. Fill details:
   - **Plan Name**: "Explorer - Monthly"
   - **Billing Interval**: 1 month
   - **Amount**: ₹1900 (or your pricing)
   - **Currency**: INR
   - **Description**: "5 blueprint generations per month"
4. Save and note plan ID (e.g., `plan_explorer_monthly`)
5. Repeat for all tiers

**Option 2: Via API** (Recommended for consistency)

**File**: `frontend/scripts/createRazorpayPlans.ts`

```typescript
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const plans = [
  {
    tier: 'explorer',
    name: 'Explorer - Monthly',
    amount: 1900, // ₹19 in paise
    period: 'monthly',
    interval: 1,
    description: '5 blueprint generations per month',
  },
  {
    tier: 'navigator',
    name: 'Navigator - Monthly',
    amount: 3900, // ₹39
    period: 'monthly',
    interval: 1,
    description: '25 blueprint generations per month',
  },
  {
    tier: 'voyager',
    name: 'Voyager - Monthly',
    amount: 7900, // ₹79
    period: 'monthly',
    interval: 1,
    description: '50 blueprint generations per month',
  },
  {
    tier: 'crew',
    name: 'Crew - Monthly (per seat)',
    amount: 2400, // ₹24
    period: 'monthly',
    interval: 1,
    description: '10 blueprint generations per seat per month',
  },
  {
    tier: 'fleet',
    name: 'Fleet - Monthly (per seat)',
    amount: 6400, // ₹64
    period: 'monthly',
    interval: 1,
    description: '30 blueprint generations per seat per month',
  },
  {
    tier: 'armada',
    name: 'Armada - Monthly (per seat)',
    amount: 12900, // ₹129
    period: 'monthly',
    interval: 1,
    description: '60 blueprint generations per seat per month',
  },
];

async function createPlans() {
  console.log('Creating Razorpay plans...\n');

  for (const plan of plans) {
    try {
      const razorpayPlan = await razorpay.plans.create({
        period: plan.period as 'monthly' | 'yearly',
        interval: plan.interval,
        item: {
          name: plan.name,
          description: plan.description,
          amount: plan.amount,
          currency: 'INR',
        },
      });

      console.log(`✅ ${plan.tier.toUpperCase()}: ${plan.name}`);
      console.log(`   Plan ID: ${razorpayPlan.id}`);
      console.log(`   Amount: ₹${plan.amount / 100}`);
      console.log(`   Limit: ${plan.description}\n`);
    } catch (error: any) {
      console.error(`❌ Failed to create ${plan.name}:`, error.message);
    }
  }
}

createPlans();
```

**Run**:
```bash
cd frontend
npx tsx scripts/createRazorpayPlans.ts
```

### 13.2 Plan Configuration File

**File**: `frontend/lib/config/razorpayPlans.ts`

```typescript
export const RAZORPAY_PLANS = {
  explorer: {
    monthly: 'plan_XXXXXXXXX', // Replace with actual plan ID
    yearly: 'plan_YYYYYYYYY',
  },
  navigator: {
    monthly: 'plan_XXXXXXXXX',
    yearly: 'plan_YYYYYYYYY',
  },
  voyager: {
    monthly: 'plan_XXXXXXXXX',
    yearly: 'plan_YYYYYYYYY',
  },
  crew: {
    monthly: 'plan_XXXXXXXXX',
    yearly: 'plan_YYYYYYYYY',
  },
  fleet: {
    monthly: 'plan_XXXXXXXXX',
    yearly: 'plan_YYYYYYYYY',
  },
  armada: {
    monthly: 'plan_XXXXXXXXX',
    yearly: 'plan_YYYYYYYYY',
  },
} as const;

export function getPlanId(tier: string, billing: 'monthly' | 'yearly'): string {
  return RAZORPAY_PLANS[tier as keyof typeof RAZORPAY_PLANS]?.[billing] || '';
}
```

---

## 14. Support & Troubleshooting

### Common Issues

**Issue 1: Webhook not receiving events**
- Check webhook URL is public (not localhost)
- Verify webhook secret matches
- Check Vercel function timeout (increase if needed)
- Review Razorpay dashboard webhook logs

**Issue 2: Signature verification fails**
- Ensure using correct secret (webhook secret ≠ API secret)
- Check signature algorithm (HMAC SHA256)
- Verify payload is raw string (not parsed JSON)

**Issue 3: Subscription not upgrading tier**
- Check webhook received subscription.activated
- Verify handle_tier_upgrade() called
- Check RLS policies allow update
- Review database logs

**Issue 4: Razorpay modal not opening**
- Verify Razorpay script loaded
- Check browser console for errors
- Ensure key_id is correct
- Test in incognito mode (clear cache)

---

## 15. Next Steps After Integration

### Phase 1: Enhancements (Optional)
1. **Annual Billing**: Add yearly plans with discounts
2. **Seat Management**: Team features for crew/fleet/armada tiers
3. **Usage Notifications**: Warn users approaching limits
4. **Invoice Generation**: PDF invoices for payments
5. **Referral Program**: Discounts for referrals

### Phase 2: Analytics
1. **Revenue Dashboard**: Track MRR, churn, ARPU
2. **Cohort Analysis**: User retention by tier
3. **Conversion Funnel**: Pricing page → checkout → success
4. **A/B Testing**: Test pricing, copy, design

### Phase 3: Optimization
1. **Churn Reduction**: Detect at-risk users
2. **Upgrade Prompts**: Smart upgrade suggestions
3. **Reactivation Campaigns**: Win back cancelled users
4. **Proration Logic**: Mid-cycle upgrades/downgrades

---

## Conclusion

This guide provides a comprehensive roadmap for integrating Razorpay into SmartSlate Polaris v3. Your existing subscription infrastructure is **solid and production-ready**; you only need to add the payment processing layer.

**Estimated Timeline**: 10-15 days for complete integration and testing.

**Key Success Factors**:
1. Follow security best practices (signature verification, key management)
2. Test thoroughly with Razorpay test mode before going live
3. Monitor webhooks closely in first week of production
4. Have rollback plan ready

**Recommended Approach**:
- Start with **Phase 1-5** (setup, database, APIs)
- Deploy to **staging** and test end-to-end
- Switch to **live mode** only after all tests pass
- Monitor first 10-20 transactions closely

Good luck with your integration! 🚀

---

**Document Metadata**
- Last Updated: 2025-10-28
- Next Review: After Phase 5 completion
- Maintainer: Integration Team
- Related Docs:
  - `TIER_LIMITS_AND_ROLLOVER_SYSTEM.md`
  - `user-roles-and-subscriptions.txt` (PRD)
  - Razorpay Official Docs: https://razorpay.com/docs/
