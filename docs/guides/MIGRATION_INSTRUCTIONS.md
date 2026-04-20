# Blueprint Migration Instructions

## Overview
This migration transfers all blueprints from `not.jitin@gmail.com` to `jitin@smartslate.io`.

## What Gets Migrated
- ✅ All non-deleted blueprints
- ✅ Blueprint metadata (title, status, dates, etc.)
- ✅ Static questionnaire data
- ✅ Dynamic questions
- ✅ Dynamic answers
- ✅ Generated blueprint JSON/Markdown
- ✅ Usage counters updated automatically

## What Stays the Same
- ❌ Original creation timestamps (preserved)
- ❌ Blueprint IDs (preserved)
- ❌ Sharing links (will still work, now owned by new user)

## Migration Options

### Option 1: Automatic Migration (Recommended)
**File**: `migrate_blueprints_jitin.sql`

**How to use**:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe/sql)
2. Create a new query
3. Copy entire contents of `migrate_blueprints_jitin.sql`
4. Click **Run**
5. Check the output for success messages

**Features**:
- ✅ Runs all steps automatically
- ✅ Includes verification
- ✅ Updates counters
- ✅ Shows detailed progress logs
- ⚠️ All-or-nothing operation

---

### Option 2: Step-by-Step Migration (More Control)
**File**: `migrate_blueprints_simple.sql`

**How to use**:
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/oyjslszrygcajdpwgxbe/sql)
2. Run each section one at a time
3. Review results before proceeding to next step
4. Verify at each stage

**Features**:
- ✅ Full control at each step
- ✅ Can pause and verify
- ✅ Easier to understand what's happening
- ⚠️ More manual work required

**Steps**:
1. **Find User IDs** - Identify source and target users
2. **Count Blueprints** - See how many will migrate
3. **Preview Blueprints** - See exact blueprints that will move
4. **Execute Migration** - Actually move the blueprints
5. **Update Target Counters** - Fix usage tracking for recipient
6. **Reset Source Counters** - Zero out sender's counts
7. **Verify** - Confirm migration succeeded
8. **View Results** - See all migrated blueprints

---

## Pre-Migration Checklist

Before running either script:

- [ ] Both user accounts exist in the database
- [ ] You have admin access to Supabase SQL Editor
- [ ] You've backed up the database (optional but recommended)
- [ ] You understand this action **cannot be easily reversed**

---

## Post-Migration Verification

After migration, verify:

1. **Source User** (`not.jitin@gmail.com`):
   - ✅ Blueprint count = 0
   - ✅ Usage counters reset to 0
   - ✅ No active blueprints in UI

2. **Target User** (`jitin@smartslate.io`):
   - ✅ All blueprints visible
   - ✅ Usage counters updated correctly
   - ✅ Can access all migrated blueprints in UI

3. **Blueprint Integrity**:
   - ✅ All data intact (title, content, status)
   - ✅ Creation dates preserved
   - ✅ Share links still work (if any)

---

## What to Do If Something Goes Wrong

If migration fails or produces unexpected results:

1. **Don't Panic** - Data isn't deleted, just reassigned
2. **Check the logs** - Error messages will indicate the issue
3. **Manual rollback** (if needed):
   ```sql
   -- Reverse the migration
   UPDATE blueprint_generator
   SET
     user_id = (SELECT id FROM auth.users WHERE email = 'not.jitin@gmail.com'),
     updated_at = NOW()
   WHERE user_id = (SELECT id FROM auth.users WHERE email = 'jitin@smartslate.io')
     AND updated_at >= '<timestamp_of_migration>';
   ```

4. **Contact support** - If you need help

---

## Technical Details

### Database Changes Made

1. **blueprint_generator table**:
   - Updates `user_id` column for all matching records
   - Sets `updated_at` to current timestamp

2. **user_profiles table**:
   - Updates `blueprint_creation_count` for target user
   - Updates `blueprint_saving_count` for target user
   - Resets both counters to 0 for source user

### Performance Notes

- Migration is instant for small datasets (< 100 blueprints)
- Each blueprint takes ~1ms to update
- Total time: typically < 1 second

### Row Level Security (RLS)

- Admin client bypasses RLS restrictions
- Normal users won't see migration in progress
- No downtime required

---

## FAQ

**Q: Will the source user lose access to blueprints?**
A: Yes, after migration, `not.jitin@gmail.com` will have 0 blueprints. This is intentional.

**Q: Can I migrate specific blueprints instead of all?**
A: Yes, modify the WHERE clause in Step 4 of the simple migration to filter by ID or date.

**Q: Will shared links break?**
A: No, share tokens are independent of user ownership. Links continue working.

**Q: What if both users have blueprints?**
A: Target user keeps their existing blueprints + receives all from source user.

**Q: Can I undo this?**
A: Yes, but you'll need the exact timestamp of when migration ran. Better to test in development first.

---

## Support

If you encounter issues:
- Check Supabase logs for detailed error messages
- Verify user emails are correct
- Ensure both accounts exist
- Contact the development team with error logs
