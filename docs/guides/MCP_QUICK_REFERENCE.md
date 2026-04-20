# MCP Quick Reference Card

## Essential Commands

### Diagnostics
```bash
./scripts/mcp-diagnostics.sh    # Check MCP status
./scripts/mcp-fix.sh            # Fix common issues
```

### Configuration Location
- Global: `~/.claude.json`
- Project: `./.claude.json`
- Alternative: `./.mcp.json`

### Common MCP Servers
```bash
# File system
npx -y @modelcontextprotocol/server-filesystem /path/to/project

# Git operations
npx -y @cyanheads/git-mcp-server

# GitHub integration
npx -y @modelcontextprotocol/server-github

# Memory storage
npx -y @modelcontextprotocol/server-memory

# Web automation
npx -y @modelcontextprotocol/server-puppeteer

# Task management
npx -y task-master-ai
```

### Environment Variables
```bash
export ANTHROPIC_API_KEY="sk-ant-..."
export GITHUB_PERSONAL_ACCESS_TOKEN="ghp_..."
export SUPABASE_URL="https://....supabase.co"
export CONTEXT7_API_KEY="ctx7sk-..."
```

### Troubleshooting
```bash
# Check processes
ps aux | grep -E "(mcp|npx)" | grep -v grep

# Validate JSON
jq . ~/.claude.json

# Test server
npx -y @package/name --help

# Restart Claude
pkill claude  # Linux
# or use menu options on macOS/Windows
```

### Quick Test Commands in Claude
- "What MCP tools are available?"
- "Read the package.json file"
- "Show git status"
- "Create a memory entry"
- "List GitHub repositories"

### Configuration Template
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "."]
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@cyanheads/git-mcp-server"]
    }
  }
}
```

### Common Issues
- **Tools not showing**: Restart Claude Desktop
- **Permission denied**: Check file permissions
- **Server not found**: Run `./scripts/mcp-fix.sh`
- **API errors**: Verify environment variables

### File Locations
- Scripts: `./scripts/`
- Documentation: `./docs/MCP_SETUP_GUIDE.md`
- Logs: Claude Desktop → Help → Show Logs