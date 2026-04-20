# Tier System Backend Implementation

## Overview

SmartSlate Polaris v3 implements a comprehensive tier-based subscription system that manages user access, usage limits, and feature availability. The system uses a combination of database schema, server-side middleware, and client-side components to enforce subscription rules and track usage across multiple dimensions.

## Architecture

### Core Components

- **Database Schema**: PostgreSQL tables with RLS policies for data isolation
- **Server Functions**: Atomic operations for usage tracking and limit enforcement
- **Middleware**: Composable authentication and authorization layers
- **Client Integration**: React hooks and UI components for tier-aware features

### Tier Hierarchy

```typescript
// Tier levels from lowest to highest
export const TIER_HIERARCHY = {
  EXPLORER: 0,      // Free tier
  NAVIGATOR: 1,     // Basic paid tier
  VOYAGER: 2,       // Mid-tier individual
  CREW: 3,          // Small teams
  FLEET: 4,         // Medium teams
  ARMADA: 5,        // Large teams
  ENTERPRISE: 6,    // Unlimited access
  DEVELOPER: 7      // Admin role
} as const;
```

## Database Schema

### User Profiles Table

**Location**: `supabase/migrations/0026_add_subscription_and_roles.sql`

```sql
CREATE TABLE user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,

  -- Subscription and Role Management
  subscription_tier TEXT NOT NULL DEFAULT 'explorer',
  user_role TEXT NOT NULL DEFAULT 'explorer',

  -- Usage Tracking
  blueprint_creation_count INTEGER NOT NULL DEFAULT 0,
  blueprint_saving_count INTEGER NOT NULL DEFAULT 0,
  questionnaire_completion_count INTEGER NOT NULL DEFAULT 0,

  -- Usage Limits
  blueprint_creation_limit INTEGER DEFAULT 2,
  blueprint_saving_limit INTEGER DEFAULT 2,
  questionnaire_completion_limit INTEGER DEFAULT 5,

  -- Metadata
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  profile_image_url TEXT,
  phone TEXT,
  company_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Flexible metadata
  usage_metadata JSONB DEFAULT '{}',
  subscription_metadata JSONB DEFAULT '{}',

  CONSTRAINT valid_subscription_tier
    CHECK (subscription_tier IN ('explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer'))
);
```

### Subscriptions Table

```sql
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Razorpay Integration
  razorpay_subscription_id TEXT,
  razorpay_plan_id TEXT,
  razorpay_customer_id TEXT,

  -- Subscription Details
  tier TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',

  -- Billing Information
  plan_type TEXT NOT NULL, -- 'monthly', 'yearly', 'lifetime'
  billing_period_start TIMESTAMP WITH TIME ZONE,
  billing_period_end TIMESTAMP WITH TIME ZONE,

  -- Payment Status
  payment_status TEXT DEFAULT 'due',
  last_payment_at TIMESTAMP WITH TIME ZONE,
  next_payment_at TIMESTAMP WITH TIME ZONE,

  -- Metadata
  subscription_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT valid_tier CHECK (tier IN ('navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise'))
);
```

## Tier Definitions and Limits

### Explorer (Free Tier)

```typescript
const EXPLORER_LIMITS = {
  blueprint_creation: { count: 0, limit: 2, reset: 'monthly' },
  blueprint_saving: { count: 0, limit: 2, reset: 'monthly' },
  questionnaire_completion: { count: 0, limit: 5, reset: 'monthly' },
  features: ['basic_questionnaire', 'ai_questions', 'blueprint_generation'],
  export_formats: ['markdown'],
  support: 'community'
};
```

### Navigator (Basic Paid Tier)

```typescript
const NAVIGATOR_LIMITS = {
  blueprint_creation: { count: 0, limit: 10, reset: 'monthly' },
  blueprint_saving: { count: 0, limit: 10, reset: 'monthly' },
  questionnaire_completion: { count: 0, limit: 25, reset: 'monthly' },
  features: [
    'basic_questionnaire', 'ai_questions', 'blueprint_generation',
    'advanced_customization', 'priority_generation'
  ],
  export_formats: ['markdown', 'pdf', 'docx'],
  support: 'email'
};
```

### Voyager (Premium Individual)

```typescript
const VOYAGER_LIMITS = {
  blueprint_creation: { count: 0, limit: 25, reset: 'monthly' },
  blueprint_saving: { count: 0, limit: 25, reset: 'monthly' },
  questionnaire_completion: { count: 0, limit: 100, reset: 'monthly' },
  features: [
    'basic_questionnaire', 'ai_questions', 'blueprint_generation',
    'advanced_customization', 'priority_generation', 'api_access',
    'custom_templates', 'analytics'
  ],
  export_formats: ['markdown', 'pdf', 'docx', 'html'],
  support: 'priority_email'
};
```

### Crew (Small Teams)

```typescript
const CREW_LIMITS = {
  blueprint_creation: { count: 0, limit: 100, reset: 'monthly' },
  blueprint_saving: { count: 0, limit: 100, reset: 'monthly' },
  questionnaire_completion: { count: 0, limit: 500, reset: 'monthly' },
  features: [
    'basic_questionnaire', 'ai_questions', 'blueprint_generation',
    'advanced_customization', 'priority_generation', 'api_access',
    'custom_templates', 'analytics', 'team_collaboration',
    'shared_blueprints', 'team_dashboard'
  ],
  export_formats: ['markdown', 'pdf', 'docx', 'html', 'json'],
  support: 'team_support'
};
```

## Database Functions

### Usage Tracking Functions

**Location**: `supabase/migrations/0026_add_subscription_and_roles.sql`

```sql
-- Increment blueprint creation count
CREATE OR REPLACE FUNCTION increment_blueprint_creation_count(user_id UUID)
RETURNS TABLE(current_count INTEGER, limit INTEGER, exceeded BOOLEAN) AS $$
DECLARE
  current_limit INTEGER;
  new_count INTEGER;
BEGIN
  -- Get current limit
  SELECT blueprint_creation_limit INTO current_limit
  FROM user_profiles
  WHERE id = user_id;

  -- Increment count atomically
  UPDATE user_profiles
  SET blueprint_creation_count = blueprint_creation_count + 1,
      updated_at = NOW()
  WHERE id = user_id
  RETURNING blueprint_creation_count INTO new_count;

  RETURN QUERY SELECT
    new_count,
    current_limit,
    (new_count > current_limit) as exceeded;
END;
$$ LANGUAGE plpgsql;

-- Increment blueprint saving count
CREATE OR REPLACE FUNCTION increment_blueprint_saving_count(user_id UUID)
RETURNS TABLE(current_count INTEGER, limit INTEGER, exceeded BOOLEAN) AS $$
DECLARE
  current_limit INTEGER;
  new_count INTEGER;
BEGIN
  SELECT blueprint_saving_limit INTO current_limit
  FROM user_profiles
  WHERE id = user_id;

  UPDATE user_profiles
  SET blueprint_saving_count = blueprint_saving_count + 1,
      updated_at = NOW()
  WHERE id = user_id
  RETURNING blueprint_saving_count INTO new_count;

  RETURN QUERY SELECT
    new_count,
    current_limit,
    (new_count > current_limit) as exceeded;
END;
$$ LANGUAGE plpgsql;

-- Increment questionnaire completion count
CREATE OR REPLACE FUNCTION increment_questionnaire_completion_count(user_id UUID)
RETURNS TABLE(current_count INTEGER, limit INTEGER, exceeded BOOLEAN) AS $$
DECLARE
  current_limit INTEGER;
  new_count INTEGER;
BEGIN
  SELECT questionnaire_completion_limit INTO current_limit
  FROM user_profiles
  WHERE id = user_id;

  UPDATE user_profiles
  SET questionnaire_completion_count = questionnaire_completion_count + 1,
      updated_at = NOW()
  WHERE id = user_id
  RETURNING questionnaire_completion_count INTO new_count;

  RETURN QUERY SELECT
    new_count,
    current_limit,
    (new_count > current_limit) as exceeded;
END;
$$ LANGUAGE plpgsql;
```

### Limit Checking Functions

```sql
-- Check if user can create blueprint
CREATE OR REPLACE FUNCTION can_create_blueprint(user_id UUID)
RETURNS TABLE(can_create BOOLEAN, current_count INTEGER, limit INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT
    (up.blueprint_creation_count < up.blueprint_creation_limit) as can_create,
    up.blueprint_creation_count,
    up.blueprint_creation_limit
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Check if user can save blueprint
CREATE OR REPLACE FUNCTION can_save_blueprint(user_id UUID)
RETURNS TABLE(can_save BOOLEAN, current_count INTEGER, limit INTEGER) AS $$
BEGIN
  RETURN QUERY SELECT
    (up.blueprint_saving_count < up.blueprint_saving_limit) as can_save,
    up.blueprint_saving_count,
    up.blueprint_saving_limit
  FROM user_profiles up
  WHERE up.id = user_id;
END;
$$ LANGUAGE plpgsql;

-- Get comprehensive usage stats
CREATE OR REPLACE FUNCTION get_user_usage_stats(user_id UUID)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'blueprint_creation', jsonb_build_object(
      'count', blueprint_creation_count,
      'limit', blueprint_creation_limit,
      'remaining', blueprint_creation_limit - blueprint_creation_count
    ),
    'blueprint_saving', jsonb_build_object(
      'count', blueprint_saving_count,
      'limit', blueprint_saving_limit,
      'remaining', blueprint_saving_limit - blueprint_saving_count
    ),
    'questionnaire_completion', jsonb_build_object(
      'count', questionnaire_completion_count,
      'limit', questionnaire_completion_limit,
      'remaining', questionnaire_completion_limit - questionnaire_completion_count
    ),
    'subscription', jsonb_build_object(
      'tier', subscription_tier,
      'role', user_role
    )
  ) INTO stats
  FROM user_profiles
  WHERE id = user_id;

  RETURN stats;
END;
$$ LANGUAGE plpgsql;
```

### Role Management Functions

```sql
-- Update user subscription tier
CREATE OR REPLACE FUNCTION update_subscription_tier(
  user_id UUID,
  new_tier TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET subscription_tier = new_tier,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Update user role
CREATE OR REPLACE FUNCTION update_user_role(
  user_id UUID,
  new_role TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE user_profiles
  SET user_role = new_role,
      updated_at = NOW()
  WHERE id = user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## API Implementation

### Middleware Architecture

**Location**: `frontend/lib/middleware/`

#### Authentication Middleware

```typescript
// frontend/lib/middleware/auth.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function requireAuth(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  return { user };
}
```

#### Role Middleware

```typescript
// frontend/lib/middleware/role.ts
import { TIER_HIERARCHY } from '@/constants/tiers';
import { createClient } from '@/lib/supabase/server';

export async function requireRole(
  request: Request,
  minTier: keyof typeof TIER_HIERARCHY = 'EXPLORER'
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { data: profile, error: profileError } = await supabase
    .from('user_profiles')
    .select('subscription_tier, user_role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json(
      { error: 'User profile not found', code: 'PROFILE_NOT_FOUND' },
      { status: 404 }
    );
  }

  const userTierLevel = TIER_HIERARCHY[profile.subscription_tier.toUpperCase() as keyof typeof TIER_HIERARCHY];
  const requiredTierLevel = TIER_HIERARCHY[minTier];

  if (userTierLevel < requiredTierLevel) {
    return NextResponse.json(
      {
        error: 'Insufficient tier level',
        code: 'INSUFFICIENT_TIER',
        currentTier: profile.subscription_tier,
        requiredTier: minTier
      },
      { status: 403 }
    );
  }

  return { user, profile };
}
```

#### Usage Limit Middleware

```typescript
// frontend/lib/middleware/usage.ts
import { createClient } from '@/lib/supabase/server';

export async function checkUsageLimit(
  request: Request,
  action: 'create_blueprint' | 'save_blueprint' | 'complete_questionnaire'
) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  let canProceed = false;
  let usageStats = null;

  switch (action) {
    case 'create_blueprint':
      const { data: createData } = await supabase
        .rpc('can_create_blueprint', { user_id: user.id });

      if (createData && createData.length > 0) {
        canProceed = createData[0].can_create;
        usageStats = {
          current: createData[0].current_count,
          limit: createData[0].limit,
          remaining: createData[0].limit - createData[0].current_count
        };
      }
      break;

    case 'save_blueprint':
      const { data: saveData } = await supabase
        .rpc('can_save_blueprint', { user_id: user.id });

      if (saveData && saveData.length > 0) {
        canProceed = saveData[0].can_save;
        usageStats = {
          current: saveData[0].current_count,
          limit: saveData[0].limit,
          remaining: saveData[0].limit - saveData[0].current_count
        };
      }
      break;

    case 'complete_questionnaire':
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('questionnaire_completion_count, questionnaire_completion_limit')
        .eq('id', user.id)
        .single();

      if (profile) {
        canProceed = profile.questionnaire_completion_count < profile.questionnaire_completion_limit;
        usageStats = {
          current: profile.questionnaire_completion_count,
          limit: profile.questionnaire_completion_limit,
          remaining: profile.questionnaire_completion_limit - profile.questionnaire_completion_count
        };
      }
      break;
  }

  if (!canProceed) {
    return NextResponse.json(
      {
        error: 'Usage limit exceeded',
        code: 'USAGE_LIMIT_EXCEEDED',
        action,
        usage: usageStats,
        upgradeUrl: '/pricing'
      },
      { status: 429 }
    );
  }

  return { user, usage: usageStats };
}
```

### API Route Implementation

#### Usage Statistics Endpoint

```typescript
// frontend/app/api/user/usage/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      { error: 'Authentication required', code: 'UNAUTHORIZED' },
      { status: 401 }
    );
  }

  const { data: stats, error } = await supabase
    .rpc('get_user_usage_stats', { user_id: user.id });

  if (error) {
    return NextResponse.json(
      { error: 'Failed to fetch usage stats', code: 'USAGE_STATS_ERROR' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    data: stats
  });
}
```

#### Blueprint Creation with Limit Check

```typescript
// frontend/app/api/blueprints/create/route.ts
import { checkUsageLimit } from '@/lib/middleware/usage';
import { incrementBlueprintCreationCount } from '@/lib/services/usageService';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  // Check usage limits first
  const limitCheck = await checkUsageLimit(request, 'create_blueprint');
  if (limitCheck instanceof NextResponse) {
    return limitCheck; // Error response
  }

  try {
    const { user, usage } = limitCheck;
    const body = await request.json();

    // Create blueprint logic here...

    // Increment usage count
    const incrementResult = await incrementBlueprintCreationCount(user.id);

    return NextResponse.json({
      success: true,
      data: blueprintData,
      usage: {
        ...usage,
        updated: incrementResult
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create blueprint', code: 'CREATION_FAILED' },
      { status: 500 }
    );
  }
}
```

## Frontend Integration

### React Hooks

#### Use User Tier Hook

```typescript
// frontend/lib/hooks/useUserTier.ts
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { UserTier, UsageStats } from '@/types/tiers';

export function useUserTier() {
  const [tier, setTier] = useState<UserTier | null>(null);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserTier() {
      try {
        const supabase = createClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
          setError('User not authenticated');
          return;
        }

        const { data: profile } = await supabase
          .from('user_profiles')
          .select('subscription_tier, user_role')
          .eq('id', user.id)
          .single();

        if (profile) {
          setTier({
            tier: profile.subscription_tier,
            role: profile.user_role
          });
        }

        // Fetch usage stats
        const { data: stats } = await supabase
          .rpc('get_user_usage_stats', { user_id: user.id });

        if (stats) {
          setUsage(stats as UsageStats);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUserTier();
  }, []);

  return { tier, usage, loading, error };
}
```

#### Use Feature Access Hook

```typescript
// frontend/lib/hooks/useFeatureAccess.ts
import { useUserTier } from './useUserTier';
import { TIER_FEATURES } from '@/constants/tiers';

export function useFeatureAccess(feature: string) {
  const { tier, loading, error } = useUserTier();

  const hasAccess = tier && TIER_FEATURES[tier.tier]?.includes(feature);
  const canUpgrade = tier && !hasAccess;

  return {
    hasAccess: !!hasAccess,
    canUpgrade: !!canUpgrade,
    currentTier: tier?.tier || 'explorer',
    loading,
    error
  };
}
```

### UI Components

#### Feature Gate Component

```typescript
// frontend/components/tiers/FeatureGate.tsx
import { ReactNode } from 'react';
import { useFeatureAccess } from '@/lib/hooks/useFeatureAccess';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

interface FeatureGateProps {
  feature: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export function FeatureGate({ feature, children, fallback }: FeatureGateProps) {
  const { hasAccess, canUpgrade, currentTier, loading, error } = useFeatureAccess(feature);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (canUpgrade) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Upgrade Required</CardTitle>
          <CardDescription>
            This feature is not available in your current plan ({currentTier}).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Upgrade your plan to access this feature and more.
          </p>
          <Link href="/pricing">
            <Button className="w-full">View Plans</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return null;
}
```

#### Usage Display Component

```typescript
// frontend/components/tiers/UsageDisplay.tsx
import { useUserTier } from '@/lib/hooks/useUserTier';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function UsageDisplay() {
  const { usage, loading, error } = useUserTier();

  if (loading) return <div>Loading usage stats...</div>;
  if (error) return <div>Error loading usage</div>;
  if (!usage) return <div>No usage data available</div>;

  const usageItems = [
    {
      label: 'Blueprints Created',
      current: usage.blueprint_creation.count,
      limit: usage.blueprint_creation.limit,
      remaining: usage.blueprint_creation.remaining
    },
    {
      label: 'Blueprints Saved',
      current: usage.blueprint_saving.count,
      limit: usage.blueprint_saving.limit,
      remaining: usage.blueprint_saving.remaining
    },
    {
      label: 'Questionnaires Completed',
      current: usage.questionnaire_completion.count,
      limit: usage.questionnaire_completion.limit,
      remaining: usage.questionnaire_completion.remaining
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Usage Overview</CardTitle>
        <CardDescription>
          Your current usage for this billing period
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {usageItems.map((item) => (
          <div key={item.label} className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>{item.label}</span>
              <span>{item.current} / {item.limit}</span>
            </div>
            <Progress
              value={(item.current / item.limit) * 100}
              className="h-2"
            />
            <p className="text-xs text-muted-foreground">
              {item.remaining} remaining
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
```

## Business Logic

### Tier Validation

```typescript
// frontend/lib/utils/tierValidation.ts
import { TIER_HIERARCHY, TIER_LIMITS } from '@/constants/tiers';
import type { UserTier, UsageStats } from '@/types/tiers';

export function canAccessFeature(tier: string, feature: string): boolean {
  const tierLimits = TIER_LIMITS[tier as keyof typeof TIER_LIMITS];
  return tierLimits?.features.includes(feature) || false;
}

export function canPerformAction(
  tier: string,
  action: 'create_blueprint' | 'save_blueprint' | 'complete_questionnaire',
  currentUsage: number,
  limit: number
): boolean {
  return currentUsage < limit;
}

export function getTierUpgradePath(currentTier: string, requiredFeatures: string[]): string | null {
  const currentTierLevel = TIER_HIERARCHY[currentTier.toUpperCase() as keyof typeof TIER_HIERARCHY];

  // Find the lowest tier that has all required features
  for (const [tierName, tierLevel] of Object.entries(TIER_HIERARCHY)) {
    if (tierLevel > currentTierLevel) {
      const tierFeatures = TIER_LIMITS[tierName.toLowerCase() as keyof typeof TIER_LIMITS]?.features;
      if (tierFeatures && requiredFeatures.every(feature => tierFeatures.includes(feature))) {
        return tierName.toLowerCase();
      }
    }
  }

  return null;
}

export function calculateUsagePercentage(usage: UsageStats): number {
  const percentages = [
    (usage.blueprint_creation.count / usage.blueprint_creation.limit) * 100,
    (usage.blueprint_saving.count / usage.blueprint_saving.limit) * 100,
    (usage.questionnaire_completion.count / usage.questionnaire_completion.limit) * 100
  ];

  return Math.max(...percentages);
}
```

### Usage Tracking Service

```typescript
// frontend/lib/services/usageService.ts
import { createClient } from '@/lib/supabase/client';

export async function incrementUsage(
  userId: string,
  action: 'create_blueprint' | 'save_blueprint' | 'complete_questionnaire'
) {
  const supabase = createClient();

  let functionName = '';
  switch (action) {
    case 'create_blueprint':
      functionName = 'increment_blueprint_creation_count';
      break;
    case 'save_blueprint':
      functionName = 'increment_blueprint_saving_count';
      break;
    case 'complete_questionnaire':
      functionName = 'increment_questionnaire_completion_count';
      break;
  }

  const { data, error } = await supabase.rpc(functionName, { user_id: userId });

  if (error) {
    throw new Error(`Failed to increment usage: ${error.message}`);
  }

  return data;
}

export async function checkUsageLimit(
  userId: string,
  action: 'create_blueprint' | 'save_blueprint' | 'complete_questionnaire'
) {
  const supabase = createClient();

  let functionName = '';
  switch (action) {
    case 'create_blueprint':
      functionName = 'can_create_blueprint';
      break;
    case 'save_blueprint':
      functionName = 'can_save_blueprint';
      break;
  }

  if (functionName) {
    const { data, error } = await supabase.rpc(functionName, { user_id: userId });

    if (error) {
      throw new Error(`Failed to check usage limit: ${error.message}`);
    }

    return data?.[0] || null;
  }

  // For questionnaire completion, check directly
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('questionnaire_completion_count, questionnaire_completion_limit')
    .eq('id', userId)
    .single();

  return profile ? {
    can_complete_questionnaire: profile.questionnaire_completion_count < profile.questionnaire_completion_limit,
    current_count: profile.questionnaire_completion_count,
    limit: profile.questionnaire_completion_limit
  } : null;
}
```

## Security Considerations

### Row Level Security (RLS)

```sql
-- RLS Policies for user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- RLS Policies for subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
```

### Input Validation

```typescript
// frontend/lib/validation/tierValidation.ts
import { z } from 'zod';

export const updateTierSchema = z.object({
  tier: z.enum(['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise']),
  reason: z.string().optional()
});

export const updateRoleSchema = z.object({
  role: z.enum(['explorer', 'navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise', 'developer']),
  reason: z.string().optional()
});

export const subscriptionDataSchema = z.object({
  razorpay_subscription_id: z.string().optional(),
  razorpay_plan_id: z.string().optional(),
  tier: z.enum(['navigator', 'voyager', 'crew', 'fleet', 'armada', 'enterprise']),
  plan_type: z.enum(['monthly', 'yearly', 'lifetime']),
  billing_period_start: z.coerce.date().optional(),
  billing_period_end: z.coerce.date().optional()
});
```

### Rate Limiting

```typescript
// frontend/lib/middleware/rateLimit.ts
import { NextRequest, NextResponse } from 'next/server';

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(
  request: NextRequest,
  limit: number,
  windowMs: number
) {
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  const now = Date.now();

  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return null; // Allow request
  }

  if (record.count >= limit) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', code: 'RATE_LIMIT_EXCEEDED' },
      { status: 429 }
    );
  }

  record.count++;
  return null; // Allow request
}
```

## Testing

### Unit Tests

```typescript
// frontend/__tests__/unit/tierValidation.test.ts
import { canAccessFeature, canPerformAction } from '@/lib/utils/tierValidation';

describe('Tier Validation', () => {
  test('should allow explorer to access basic features', () => {
    expect(canAccessFeature('explorer', 'basic_questionnaire')).toBe(true);
    expect(canAccessFeature('explorer', 'team_collaboration')).toBe(false);
  });

  test('should allow voyager to access advanced features', () => {
    expect(canAccessFeature('voyager', 'advanced_customization')).toBe(true);
    expect(canAccessFeature('voyager', 'api_access')).toBe(true);
  });

  test('should check usage limits correctly', () => {
    expect(canPerformAction('explorer', 'create_blueprint', 1, 2)).toBe(true);
    expect(canPerformAction('explorer', 'create_blueprint', 2, 2)).toBe(false);
  });
});
```

### Integration Tests

```typescript
// frontend/__tests__/integration/usageTracking.test.ts
import { createClient } from '@/lib/supabase/server';
import { incrementUsage } from '@/lib/services/usageService';

describe('Usage Tracking Integration', () => {
  test('should increment blueprint creation count', async () => {
    const userId = 'test-user-id';
    const result = await incrementUsage(userId, 'create_blueprint');

    expect(result).toHaveProperty('current_count');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('exceeded');
  });

  test('should prevent creation when limit exceeded', async () => {
    // Set up user with max usage
    const userId = 'limit-test-user';

    const canCreate = await checkUsageLimit(userId, 'create_blueprint');
    expect(canCreate?.can_create).toBe(false);
  });
});
```

## Monitoring and Analytics

### Usage Metrics

```typescript
// frontend/lib/analytics/usageAnalytics.ts
import { createClient } from '@/lib/supabase/client';

export async function trackUsageEvent(
  userId: string,
  event: string,
  metadata: Record<string, any> = {}
) {
  const supabase = createClient();

  await supabase.from('analytics_events').insert({
    user_id: userId,
    event_type: 'usage',
    event_name: event,
    metadata: {
      tier: metadata.tier,
      action: metadata.action,
      limit_reached: metadata.limitReached,
      ...metadata
    },
    timestamp: new Date().toISOString()
  });
}

export async function getUsageAnalytics(timeRange: 'day' | 'week' | 'month') {
  const supabase = createClient();

  const { data } = await supabase
    .from('analytics_events')
    .select(`
      event_name,
      metadata,
      timestamp,
      user_profiles!inner(
        subscription_tier
      )
    `)
    .gte('timestamp', getTimeRangeStart(timeRange))
    .eq('event_type', 'usage');

  return data;
}
```

### Performance Monitoring

```typescript
// frontend/lib/monitoring/tierPerformance.ts
export class TierPerformanceMonitor {
  static trackMiddlewareExecution(
    middlewareName: string,
    executionTime: number,
    success: boolean
  ) {
    // Log to monitoring service
    console.log(`Middleware ${middlewareName}: ${executionTime}ms, success: ${success}`);
  }

  static trackDatabaseFunctionExecution(
    functionName: string,
    executionTime: number,
    success: boolean
  ) {
    // Log database performance
    console.log(`DB Function ${functionName}: ${executionTime}ms, success: ${success}`);
  }
}
```

## Conclusion

The tier system backend implementation provides a robust, scalable foundation for managing user subscriptions and usage limits. Key features include:

- **Atomic Operations**: Database functions ensure consistency
- **Comprehensive Middleware**: Reusable auth, role, and usage checking
- **Type Safety**: Full TypeScript integration with Zod validation
- **Security**: RLS policies and input validation
- **Monitoring**: Usage analytics and performance tracking
- **Testing**: Unit and integration test coverage

The system is designed to be easily extended with new tiers, features, and usage metrics while maintaining data integrity and security.