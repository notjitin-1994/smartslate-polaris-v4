# Implementation & Migration Guides

This directory contains step-by-step guides for implementing features, running migrations, and setting up various systems in Polaris v3.

## Migration Guides

### Database Migrations
- `DATABASE_MIGRATION_GUIDE.md` - Comprehensive database migration procedures
- `MIGRATION_*.md` - Specific migration guides
- `RUN_MIGRATION_GUIDE.md` - How to run migrations safely

### Data Backfill
- `BACKFILL_*.md` - Data backfill procedures and instructions
- `HISTORICAL_COUNTER_BACKFILL_INSTRUCTIONS.md` - Counter backfill guide
- `database-cleanup-summary.md` - Database cleanup procedures

## Setup Guides

### MCP (Model Context Protocol) Integration
- `MCP_CONFIGURATION_GUIDE.md` - MCP server configuration
- `MCP_QUICK_REFERENCE.md` - Quick reference for MCP commands
- `SUPABASE_MCP_*.md` - Supabase MCP integration guides

### Database Setup
- `CLAUDE_ROUTER_GUIDE.md` - Claude router configuration

## Best Practices

When running migrations:
1. **Always backup first** - Create database backup before migrations
2. **Test locally** - Run migrations on local/staging environment first
3. **Review changes** - Understand what the migration will do
4. **Monitor rollback** - Know how to rollback if issues occur
5. **Check dependencies** - Ensure related services are compatible

## Related Documentation

- [Setup Documentation](../setup/) - Initial project setup and configuration
- [Operations](../operations/) - Deployment and monitoring procedures
- [Development](../development/) - Development best practices
- [Troubleshooting](../troubleshooting/) - Common issues and fixes

## Quick Links

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Migration Guide](https://nextjs.org/docs/app/building-your-application/upgrading)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
