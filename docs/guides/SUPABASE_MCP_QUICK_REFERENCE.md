# Supabase MCP Quick Reference

A cheat sheet for common Supabase MCP operations in Cursor.

## 🗄️ Database Schema

### View Tables
```
List all tables in my database
Show me the database schema
What tables exist in the public schema?
```

### Inspect Table Structure
```
Describe the user_profiles table
Show me all columns in the blueprints table
What's the structure of the dynamic_answers table?
```

### View Indexes
```
Show me all indexes on the user_profiles table
What indexes exist in the database?
List indexes for the blueprints table
```

### View Constraints
```
Show me all foreign keys in the blueprints table
What constraints exist on user_profiles?
List all primary keys in the database
```

## 📊 Data Queries

### Basic Queries
```
Show me the first 10 users
Count how many blueprints exist
Get the most recent 5 blueprints
```

### Filtered Queries
```
Find all users with subscription_tier 'voyager'
Show me blueprints where status is 'completed'
Get users who signed up in the last 7 days
```

### Aggregations
```
Count blueprints by status
Show average generation time by blueprint type
Group users by subscription_tier with counts
```

### Joins
```
Show blueprints with their user information
Get dynamic answers with blueprint details
List users with their blueprint counts
```

## ✏️ Schema Modifications

### Add Columns
```
Add a 'last_login_at' timestamp column to user_profiles
Add 'metadata' JSONB column to blueprints
Add 'is_deleted' boolean column with default false
```

### Modify Columns
```
Change user_profiles.bio to allow longer text
Make blueprints.title required (NOT NULL)
Rename column 'user_id' to 'owner_id' in blueprints
```

### Remove Columns
```
Drop the temporary_data column from blueprints
Remove unused_field from user_profiles
```

### Create Tables
```
Create a table called 'audit_logs' with columns:
  - id (uuid, primary key)
  - user_id (uuid, foreign key to user_profiles)
  - action (text)
  - timestamp (timestamp with time zone)
```

## 🔐 Row Level Security (RLS)

### View Policies
```
Show me all RLS policies on the blueprints table
What security policies exist for user_profiles?
List all RLS policies in the database
```

### Create Policies
```
Create a policy on blueprints so users can only read their own blueprints
Add a policy allowing users to insert their own user_profiles
Create an admin policy on audit_logs for full access
```

### Test Policies
```
Test if a user can read another user's blueprint
Verify RLS is working on user_profiles
Check if the blueprints policies allow proper access
```

## 🔧 Database Functions

### View Functions
```
List all database functions
Show me the definition of the update_updated_at function
What triggers exist in the database?
```

### Create Functions
```
Create a function to update the updated_at timestamp automatically
Add a function to calculate blueprint completion percentage
Create a trigger to log all changes to user_profiles
```

## 📈 Performance

### Query Performance
```
Analyze the performance of selecting blueprints
Show me slow queries in the database
What indexes would improve user_profiles queries?
```

### Optimization
```
Suggest indexes for the blueprints table
Optimize queries for user dashboard loading
Analyze query plan for fetching blueprints with answers
```

## 🗃️ Data Operations

### Insert Data
```
Insert a test user with email 'test@example.com'
Add a sample blueprint for user 'user-id-123'
Create 5 test records in user_profiles
```

### Update Data
```
Update user 'user-id-123' to set subscription_tier to 'voyager'
Change blueprint 'bp-id-456' status to 'completed'
Set all pending blueprints to 'in_progress'
```

### Delete Data
```
Delete test user with email 'test@example.com'
Remove all blueprints with status 'error'
Clear dynamic_answers for blueprint 'bp-id-789'
```

## 📊 Analytics & Monitoring

### Usage Statistics
```
How many users signed up today?
Show blueprint generation stats for the last week
Count active users in the last 30 days
```

### Database Metrics
```
What's the size of the blueprints table?
Show database connection statistics
How much storage is being used?
```

### Error Tracking
```
Show recent database errors
List failed queries in the last hour
What's causing the most errors?
```

## 🚀 Migrations

### Create Migrations
```
Generate a migration to add subscription features
Create a migration script for the new audit_logs table
Write a migration to add RLS policies to all tables
```

### Apply Migrations
```
Apply pending migrations
Rollback the last migration
Show migration history
```

## 🔄 Backups & Recovery

### Backups
```
When was the last backup taken?
How do I restore from backup?
What's the backup retention policy?
```

### Point-in-Time Recovery
```
Can I restore to yesterday at 3pm?
What's the oldest point I can recover to?
Show available restore points
```

## 🛠️ Utilities

### Generate Sample Data
```
Generate 100 test users with realistic data
Create sample blueprints for testing
Add fake dynamic_answers for development
```

### Data Validation
```
Check for orphaned blueprints without users
Find duplicates in user_profiles by email
Validate all foreign key relationships
```

### Export Data
```
Export all users to CSV
Generate a JSON dump of blueprints
Create a backup of user_profiles table
```

## 🎯 Common Workflows

### User Management
```
1. "Show me user 'email@example.com' details"
2. "What blueprints does this user have?"
3. "Update their subscription_tier to 'navigator'"
4. "Log this change in audit_logs"
```

### Blueprint Debugging
```
1. "Show me blueprint 'bp-id-123' with all related data"
2. "What's the status and when was it last updated?"
3. "Show the dynamic_answers for this blueprint"
4. "Check if any errors are logged for this blueprint"
```

### Performance Investigation
```
1. "What queries are running slow?"
2. "Analyze the query plan for blueprint listing"
3. "What indexes are missing?"
4. "Suggest optimizations for user dashboard queries"
```

### Security Audit
```
1. "Show all RLS policies across all tables"
2. "Test if users can access other users' data"
3. "List all database roles and their permissions"
4. "Verify that service role bypasses RLS correctly"
```

## 💡 Pro Tips

### Be Specific
❌ "Show me data"
✅ "Show me the 10 most recent blueprints with status 'completed'"

### Use Table Names
❌ "Get user info"
✅ "Select from user_profiles where id = 'xyz'"

### Specify Columns
❌ "Show blueprint data"
✅ "Show id, title, status, created_at from blueprints"

### Include Filters
❌ "Count blueprints"
✅ "Count blueprints where created_at > '2025-01-01'"

### Request Explanations
```
Explain how the blueprints table relates to dynamic_answers
Show me the query plan for this operation
Why is this query slow?
```

## 🚨 Safety Reminders

### Always Review Before Executing
- **Schema changes** (add/drop columns, tables)
- **Data deletions** (DROP, DELETE, TRUNCATE)
- **RLS policy changes** (security implications)
- **Permission changes** (role modifications)

### Use Read-Only Mode
Add `--read-only` flag to MCP args for safer exploration:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--read-only"
]
```

### Backup Before Major Changes
```
Create a backup before proceeding
Export this table before modifications
Save current RLS policies before changes
```

## 📚 Additional Resources

- **Full Setup Guide**: `/docs/guides/SUPABASE_MCP_SETUP.md`
- **MCP Configuration**: `/docs/guides/MCP_CONFIGURATION_GUIDE.md`
- **Supabase Docs**: https://supabase.com/docs
- **SQL Reference**: https://supabase.com/docs/guides/database

---

**Last Updated**: October 15, 2025
**Compatible with**: `@supabase/mcp-server-supabase@latest`

