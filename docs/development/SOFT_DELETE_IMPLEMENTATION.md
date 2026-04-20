# Soft Delete Implementation for Blueprints

## Overview

Blueprints now use **soft deletes** to maintain accurate usage counts:

- **Creation Count (Generations)**: Cumulative for billing period, includes deleted blueprints
- **Saving Count**: Current saved blueprints, excludes deleted blueprints

## Database Schema

### New Column
```sql
blueprint_generator.deleted_at TIMESTAMPTZ DEFAULT NULL
```
- `NULL` = active blueprint
- `TIMESTAMPTZ` = soft-deleted at this time

### Updated Functions

#### `get_actual_blueprint_creation_count(user_id)`
Counts ALL blueprints (including soft-deleted):
```sql
SELECT COUNT(*) FROM blueprint_generator
WHERE user_id = $1;
```

#### `get_actual_blueprint_saving_count(user_id)`
Counts ONLY non-deleted blueprints with data:
```sql
SELECT COUNT(*) FROM blueprint_generator
WHERE user_id = $1
  AND blueprint_json IS NOT NULL
  AND deleted_at IS NULL;
```

## Usage

### Soft Delete a Blueprint
```typescript
// In your API route or service
const { data, error } = await supabase.rpc('soft_delete_blueprint', {
  p_blueprint_id: blueprintId,
  p_user_id: userId
});

// Returns true if deleted, false if not found or already deleted
```

### Restore a Soft-Deleted Blueprint
```typescript
const { data, error } = await supabase.rpc('restore_blueprint', {
  p_blueprint_id: blueprintId,
  p_user_id: userId
});

// Returns true if restored, false if not found or not deleted
```

### Cleanup Old Deleted Blueprints (Admin/Cron)
```typescript
// Permanently delete blueprints soft-deleted >30 days ago
const { data, error } = await supabase.rpc('cleanup_old_deleted_blueprints', {
  p_days_old: 30
});

// Returns count of permanently deleted blueprints
```

## Frontend Implementation Needed

### 1. Delete Blueprint API Route
Create `frontend/app/api/blueprints/[id]/delete/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const blueprintId = params.id;
    const userId = session.user.id;
    const supabase = await getSupabaseServerClient();

    // Soft delete the blueprint
    const { data, error } = await supabase.rpc('soft_delete_blueprint', {
      p_blueprint_id: blueprintId,
      p_user_id: userId
    });

    if (error) {
      throw error;
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Blueprint not found or already deleted' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Blueprint deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blueprint:', error);
    return NextResponse.json(
      { error: 'Failed to delete blueprint' },
      { status: 500 }
    );
  }
}
```

### 2. Update My Starmaps Page Delete Handler
In your blueprint list component:

```typescript
const handleDelete = async (blueprintId: string) => {
  try {
    const response = await fetch(`/api/blueprints/${blueprintId}/delete`, {
      method: 'DELETE',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to delete');
    }

    // Refresh the blueprint list
    await refreshBlueprints();

    // Refresh usage counts
    await refreshUsage();

    toast.success('Blueprint deleted successfully');
  } catch (error) {
    console.error('Delete error:', error);
    toast.error('Failed to delete blueprint');
  }
};
```

### 3. Filter Out Deleted Blueprints in Queries

When fetching blueprints for display:

```typescript
// In your blueprint list query
const { data: blueprints } = await supabase
  .from('blueprint_generator')
  .select('*')
  .eq('user_id', userId)
  .is('deleted_at', null)  // Only get non-deleted blueprints
  .order('created_at', { ascending: false });
```

## Behavior Examples

### Example 1: User Deletes a Blueprint

**Before delete:**
- Creation count: 5 (cumulative generations this month)
- Saving count: 5 (current saved blueprints)

**User deletes one blueprint:**
- Blueprint's `deleted_at` set to current timestamp
- Creation count: **5** (unchanged - still generated 5 this month)
- Saving count: **4** (now only 4 saved blueprints)

### Example 2: User Restores a Blueprint

**Blueprint was soft-deleted:**
- Creation count: 5
- Saving count: 4

**User restores the blueprint:**
- Blueprint's `deleted_at` set back to NULL
- Creation count: **5** (unchanged)
- Saving count: **5** (back to 5 saved)

### Example 3: Subscription Renewal

**At renewal:**
- Creation count: **resets to 0** (new billing period)
- Saving count: **counts all non-deleted blueprints** (regardless of when created)

## RLS Policies

The soft delete functions automatically check user ownership:
```sql
-- Users can only soft-delete their own blueprints
WHERE id = p_blueprint_id
  AND user_id = p_user_id
```

## Maintenance

### Periodic Cleanup Job
Set up a cron job to permanently delete old soft-deleted blueprints:

```typescript
// Run daily or weekly
const cleanupOldBlueprints = async () => {
  const supabase = getSupabaseServerClient();

  const { data, error } = await supabase.rpc('cleanup_old_deleted_blueprints', {
    p_days_old: 30  // Delete blueprints soft-deleted >30 days ago
  });

  console.log(`Cleaned up ${data} old blueprints`);
};
```

## Migration Applied

✅ **Migration**: `20251029030000_implement_soft_deletes.sql`
- Added `deleted_at` column
- Updated counting functions
- Created soft delete/restore functions
- Added cleanup function
- Created indexes for performance

## Testing

### Test Soft Delete
```sql
-- Soft delete a blueprint
SELECT soft_delete_blueprint(
  '6300b916-abed-482d-83d2-ca9218fc571c'::UUID,
  '074c2352-953e-47c6-a3bc-dd2d42f70322'::UUID
);

-- Verify counts
SELECT
  get_actual_blueprint_creation_count('074c2352...'::UUID) as creation,
  get_actual_blueprint_saving_count('074c2352...'::UUID) as saving;
-- Should show: creation = 5, saving = 4
```

### Test Restore
```sql
-- Restore the blueprint
SELECT restore_blueprint(
  '6300b916-abed-482d-83d2-ca9218fc571c'::UUID,
  '074c2352-953e-47c6-a3bc-dd2d42f70322'::UUID
);

-- Verify counts
-- Should show: creation = 5, saving = 5
```

## Summary

✅ **Soft deletes implemented**
✅ **Creation count includes deleted (cumulative)**
✅ **Saving count excludes deleted (current)**
✅ **Database functions updated**
✅ **Restore capability available**
✅ **Cleanup function for maintenance**

**Next Steps:**
1. Create DELETE API endpoint
2. Update frontend delete handlers
3. Add restore functionality to UI (optional)
4. Set up cleanup cron job
