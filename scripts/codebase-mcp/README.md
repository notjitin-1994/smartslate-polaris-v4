# Polaris Context MCP Server

Model Context Protocol (MCP) server that provides comprehensive codebase context for SmartSlate Polaris v3 to Large Language Models.

## Features

### Resources
- **Documentation**: CLAUDE.md, PRDs, Cursor rules
- **Codebase Structure**: File tree, components list, API routes
- **Database**: Schema, tables, RLS policies
- **Tech Stack**: Framework and library information

### Tools
- **search-files**: Find files matching glob patterns
- **search-content**: Search file contents for terms/patterns
- **get-file**: Retrieve specific file contents
- **get-component**: Get React component details
- **get-api-route**: Get API route implementation

## Installation

```bash
cd scripts/codebase-mcp
npm install
npm run build
```

## Usage

### With Claude Code

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "polaris-context": {
      "command": "node",
      "args": ["scripts/codebase-mcp/build/index.js"],
      "env": {
        "PROJECT_ROOT": "/path/to/polaris-v3"
      }
    }
  }
}
```

Or use tsx for development (no build needed):

```json
{
  "mcpServers": {
    "polaris-context": {
      "command": "npx",
      "args": ["-y", "tsx", "scripts/codebase-mcp/src/index.ts"],
      "env": {
        "PROJECT_ROOT": "/path/to/polaris-v3"
      }
    }
  }
}
```

### Standalone

```bash
npm run dev  # Development mode
npm start    # Production mode
```

## Resource URIs

- `polaris://docs/claude-md` - Main development guide
- `polaris://docs/overview` - Project overview
- `polaris://docs/prds` - List all PRDs
- `polaris://docs/prd/{name}` - Specific PRD
- `polaris://docs/cursor-rules` - List Cursor rules
- `polaris://docs/cursor-rule/{name}` - Specific rule
- `polaris://structure/tree` - Directory tree
- `polaris://structure/components` - Components list
- `polaris://structure/api-routes` - API routes
- `polaris://tech-stack` - Technology stack
- `polaris://database/schema` - Database schema
- `polaris://database/tables` - Table list
- `polaris://database/rls-policies` - RLS policies
- `polaris://database/key-tables` - Key tables info

## Architecture

```
src/
├── index.ts              # Entry point
├── server.ts             # MCP server setup
├── resources/            # Resource handlers
│   ├── documentation.ts  # Docs resources
│   ├── codebase.ts       # Structure resources
│   └── database.ts       # DB resources
├── tools/                # Tool implementations
│   ├── search.ts         # Search tools
│   └── file-operations.ts # File tools
└── utils/                # Helper functions
    ├── project-root.ts   # Root detection
    └── file-reader.ts    # File utilities
```

## Security

- Read-only operations (no modifications)
- Path validation (project root only)
- File caching (1-minute TTL)
- Ignores sensitive files (.env, credentials)

## Development

```bash
npm run dev        # Run with tsx
npm run build      # Build TypeScript
npm run typecheck  # Type checking only
```

## License

MIT
