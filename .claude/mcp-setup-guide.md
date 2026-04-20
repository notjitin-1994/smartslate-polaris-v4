# Claude Code MCP Setup Guide

## Quick Start

MCPs are now available in Claude Code! No additional setup needed.

## Available MCPs

| # | MCP | Purpose | Status |
|---|-----|---------|--------|
| 1 | Task Master AI | Project management & task automation | ✅ Active |
| 2 | Filesystem | Read/write project files | ✅ Active |
| 3 | GitHub | Repository & PR management | ✅ Active |
| 4 | Sequential Thinking | Structured reasoning | ✅ Active |
| 5 | ESLint | Code linting & analysis | ✅ Active |
| 6 | PostgreSQL | Database queries | ✅ Active |
| 7 | Supabase | Database management | ✅ Active |
| 8 | Shadcn/UI | Component library | ✅ Active |
| 9 | Puppeteer | Browser automation | ✅ Active |
| 10 | DuckDuckGo | Web search | ✅ Active |
| 11 | Fetch | HTTP requests | ✅ Active |
| 12 | Memory | Persistent memory | ✅ Active |
| 13 | Context7 | Knowledge base access | ✅ Active |
| 14 | Git | Local git operations | ✅ Active |
| 15 | Deep Graph MCP | Code analysis | ✅ Active |

## Configuration Files

- **Claude Code**: `.claude.json` (workspace root)
- **Cursor**: `.cursor/mcp.json` (workspace root)

Both configurations are synced and contain identical MCP settings.

## Security

⚠️ **Important**: Both `.claude.json` and `.cursor/mcp.json` contain API keys and are protected by `.gitignore`. Never commit these files.

## Using MCPs in Claude Code

Simply start using them naturally:

```
"Find all TODO comments in the codebase"
"Show me the database schema"
"Create a task for implementing the new feature"
"Take a screenshot of the page"
"Search for REST API best practices"
```

## If MCPs Don't Work

1. Restart Claude Code
2. Verify `.claude.json` exists in workspace root
3. Check for error messages in Claude Code console
4. Verify API keys are valid (check expiration dates)

## Keeping Configurations Synchronized

When updating MCPs:
1. Edit `.cursor/mcp.json` in Cursor
2. Apply the same changes to `.claude.json`
3. Both tools will have identical MCP configurations

## Need Help?

Refer to: `CLAUDE_CODE_MCP_SETUP_COMPLETE.md` in the workspace root for detailed documentation.

---
Last Updated: December 2024
Status: ✅ Ready to Use
