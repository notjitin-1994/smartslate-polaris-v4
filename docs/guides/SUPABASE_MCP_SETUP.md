# Supabase MCP Server Setup Guide

## Overview

The official Supabase MCP (Model Context Protocol) server enables AI assistants like Cursor to interact with your Supabase projects using natural language commands. This guide walks you through the complete setup process.

## Prerequisites

- Active Supabase project at https://app.supabase.com
- Cursor IDE with MCP support
- Node.js 18+ installed

## Installation Steps

### 1. Gather Supabase Credentials

You'll need several keys and identifiers from your Supabase project:

#### A. Project URL and API Keys
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the following:
   - **Project URL** (e.g., `https://oyjslszrygcajdpwgxbe.supabase.co`)
   - **anon/public key** (safe for client-side)
   - **service_role key** (NEVER expose to client)

#### B. Project Reference ID
- Extract from your project URL
- Example: If URL is `https://oyjslszrygcajdpwgxbe.supabase.co`
- Project ref is: `oyjslszrygcajdpwgxbe`

#### C. Database Password
1. Navigate to **Settings** → **Database**
2. Find your database password
3. If you don't have it, you may need to reset it

#### D. Access Token (Required for MCP)
1. Go to https://app.supabase.com/account/tokens
2. Click **"Generate new token"**
3. Provide a descriptive name: `"MCP Server - Cursor"`
4. Set appropriate permissions:
   - **Read/Write** for full functionality
   - **Read-only** for safer operations (recommended for production)
5. Copy the token immediately (you can't view it again)

#### E. AWS Region (Optional but Recommended)
- Find your project's region in **Settings** → **General**
- Common regions:
  - `us-east-1` (North America)
  - `us-west-1` (North America)
  - `eu-west-1` (Europe)
  - `ap-southeast-1` (Asia Pacific)

### 2. Update MCP Configuration

The Supabase MCP server is already configured in `.cursor/mcp.json`. You need to replace placeholder values:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest"
      ],
      "env": {
        "SUPABASE_URL": "https://oyjslszrygcajdpwgxbe.supabase.co",
        "SUPABASE_ANON_KEY": "YOUR_SUPABASE_ANON_KEY_HERE",
        "SUPABASE_SERVICE_ROLE_KEY": "YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE",
        "SUPABASE_ACCESS_TOKEN": "YOUR_SUPABASE_ACCESS_TOKEN_HERE",
        "SUPABASE_PROJECT_REF": "oyjslszrygcajdpwgxbe",
        "SUPABASE_DB_PASSWORD": "PUjFE0uYrwqorZ8M"
      }
    }
  }
}
```

**Replace the following**:
- `YOUR_SUPABASE_ANON_KEY_HERE` → Your anon/public key
- `YOUR_SUPABASE_SERVICE_ROLE_KEY_HERE` → Your service role key
- `YOUR_SUPABASE_ACCESS_TOKEN_HERE` → Your generated access token

**Note**: The URL, project ref, and DB password are already filled in from your existing PostgreSQL connection.

### 3. Optional: Set AWS Region

If you're experiencing "Tenant or user not found" errors, add the region:

```json
"env": {
  "SUPABASE_URL": "https://oyjslszrygcajdpwgxbe.supabase.co",
  "SUPABASE_ANON_KEY": "...",
  "SUPABASE_SERVICE_ROLE_KEY": "...",
  "SUPABASE_ACCESS_TOKEN": "...",
  "SUPABASE_PROJECT_REF": "oyjslszrygcajdpwgxbe",
  "SUPABASE_DB_PASSWORD": "...",
  "SUPABASE_REGION": "us-east-1"
}
```

### 4. Restart Cursor

After updating the configuration:
1. Save the `.cursor/mcp.json` file
2. Completely close Cursor
3. Restart Cursor
4. The MCP server will initialize on startup

### 5. Verify Installation

Test the MCP server by asking Cursor:

```
Can you list all tables in my Supabase database?
```

or

```
Show me the schema for the user_profiles table
```

If configured correctly, Cursor will interact with your Supabase project and return results.

## Available MCP Capabilities

Once configured, the Supabase MCP server provides these capabilities:

### Database Operations
- **List tables**: View all tables in your database
- **View schema**: Inspect table structure, columns, and types
- **Query data**: Run SQL queries using natural language
- **Create tables**: Generate new tables with AI assistance
- **Modify schema**: Add/remove columns, change types
- **Manage indexes**: Create and optimize database indexes

### Security & RLS
- **View RLS policies**: Inspect Row Level Security rules
- **Create policies**: Generate RLS policies with AI help
- **Test security**: Verify access controls
- **Manage roles**: Configure database roles and permissions

### Project Management
- **View project settings**: Check configuration
- **Monitor metrics**: Database size, connections, performance
- **View logs**: Access project logs and errors
- **Manage functions**: Create and edit database functions
- **Configure triggers**: Set up database triggers

### Data Operations
- **Insert data**: Add records using natural language
- **Update records**: Modify existing data
- **Delete records**: Remove data safely
- **Bulk operations**: Handle multiple records efficiently

## Security Best Practices

### 1. Read-Only Mode (Recommended)
For safer operations, generate an access token with **read-only** permissions:
- Prevents accidental data modification
- Safer for exploratory queries
- Still allows viewing schemas and data

To enable read-only mode, add to the MCP args:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--read-only"
]
```

### 2. Project Scoping
Limit MCP access to specific projects:
```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--project-ref=oyjslszrygcajdpwgxbe"
]
```

### 3. Manual Approval
Configure Cursor to require manual approval for all MCP operations:
1. Open Cursor settings
2. Navigate to **MCP** settings
3. Enable **"Require manual approval for MCP operations"**

### 4. Never Commit Secrets
The `.cursor/mcp.json` file contains sensitive credentials. Ensure it's in `.gitignore`:
```bash
# Add to .gitignore if not already present
.cursor/mcp.json
```

### 5. Rotate Tokens Regularly
- Generate new access tokens every 90 days
- Immediately rotate if a token is exposed
- Delete old tokens from Supabase dashboard

### 6. Use Environment-Specific Tokens
- Development: Full access token
- Production: Read-only token
- Never use production tokens in development

## Troubleshooting

### Error: "Tenant or user not found"
**Cause**: Incorrect region or project ref

**Solution**:
1. Verify `SUPABASE_PROJECT_REF` matches your project URL
2. Add or correct `SUPABASE_REGION` in configuration
3. Restart Cursor

### Error: "Unauthorized" or "Invalid API key"
**Cause**: Missing or incorrect access token

**Solution**:
1. Generate a new access token at https://app.supabase.com/account/tokens
2. Update `SUPABASE_ACCESS_TOKEN` in `.cursor/mcp.json`
3. Ensure the token has appropriate permissions
4. Restart Cursor

### Error: "Connection timeout"
**Cause**: Network issues or incorrect URL

**Solution**:
1. Verify `SUPABASE_URL` is correct and accessible
2. Check your internet connection
3. Try disabling VPN if active
4. Verify Supabase is not experiencing outages

### MCP Server Not Loading
**Cause**: Configuration error or missing dependencies

**Solution**:
1. Check `.cursor/mcp.json` for JSON syntax errors
2. Ensure all required environment variables are set
3. View Cursor's MCP logs:
   - **Help** → **Toggle Developer Tools**
   - Check Console for MCP errors
4. Try running manually: `npx -y @supabase/mcp-server-supabase@latest`

### Slow Performance
**Cause**: Large database or complex queries

**Solution**:
1. Use specific table names in queries
2. Add appropriate indexes
3. Limit result sets with WHERE clauses
4. Consider using read-only mode for better performance

## Advanced Configuration

### Custom Model Selection
Use specific Supabase models for different operations:

```json
"args": [
  "-y",
  "@supabase/mcp-server-supabase@latest",
  "--model=gpt-4"
]
```

### Query Timeout
Set custom timeout for long-running queries:

```json
"env": {
  "SUPABASE_QUERY_TIMEOUT": "30000"
}
```

### Connection Pooling
Configure connection pool size for better performance:

```json
"env": {
  "SUPABASE_POOL_SIZE": "10"
}
```

### Logging Level
Enable detailed logging for debugging:

```json
"env": {
  "SUPABASE_LOG_LEVEL": "debug"
}
```

## Example Prompts

Once configured, try these example prompts in Cursor:

### Schema Exploration
```
Show me all tables in the database
Describe the structure of the user_profiles table
What indexes exist on the blueprints table?
```

### Data Queries
```
Show me the 10 most recent users
Count how many blueprints have status 'completed'
Find all users who signed up this month
```

### Schema Modifications
```
Add a column called 'last_login_at' to user_profiles (timestamp)
Create an index on user_profiles.subscription_tier
Add a foreign key from blueprints.user_id to user_profiles.id
```

### RLS Management
```
Show me all RLS policies on the blueprints table
Create a policy allowing users to read their own blueprints
Verify that users can't access other users' data
```

## Next Steps

1. ✅ Complete this setup guide
2. Test basic queries to verify functionality
3. Review security settings and adjust as needed
4. Explore advanced features like RLS policy generation
5. Integrate MCP capabilities into your development workflow

## Support Resources

- **Official Docs**: https://supabase.com/docs/guides/getting-started/mcp
- **MCP Spec**: https://modelcontextprotocol.io
- **Supabase Discord**: https://discord.supabase.com
- **GitHub Issues**: https://github.com/supabase-community/supabase-mcp

## Security Checklist

Before using in production:

- [ ] Access tokens are stored securely (not committed to git)
- [ ] Read-only mode enabled for non-critical operations
- [ ] Manual approval required for destructive operations
- [ ] Tokens rotate every 90 days
- [ ] Project scoping configured
- [ ] Logging enabled for audit trail
- [ ] Team members trained on security best practices
- [ ] Backup and recovery plan in place

---

**Last Updated**: October 15, 2025
**MCP Server Version**: `@supabase/mcp-server-supabase@latest`

