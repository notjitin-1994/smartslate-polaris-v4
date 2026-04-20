# MCP Setup and Troubleshooting Guide

## Overview

This guide covers the setup, configuration, and troubleshooting of Model Context Protocol (MCP) servers for Claude Desktop in the SmartSlate Polaris v3 project.

## What is MCP?

MCP (Model Context Protocol) allows Claude Desktop to connect to external tools and services, extending its capabilities beyond the base model. In this project, we use MCP for:

- **File system operations** - Read, write, and manage project files
- **Git operations** - Version control, commits, branches
- **Task management** - TaskMaster AI for project management
- **Database operations** - Supabase integration
- **Memory management** - Persistent context across sessions
- **Web scraping** - Puppeteer for automated browser tasks
- **GitHub integration** - Repository management
- **Context storage** - Upstash Context7 for long-term memory

## Current Configuration

### Project-specific MCP servers (`.claude.json`):

1. **task-master-ai** - Project task management and PRD-driven development
2. **git** - Git operations via @cyanheads/git-mcp-server
3. **filesystem** - File system access to the project directory
4. **github** - GitHub API integration
5. **memory** - In-memory storage for session persistence
6. **puppeteer** - Web automation and scraping
7. **sequential-thinking** - Enhanced reasoning capabilities
8. **context7** - Long-term context storage
9. **supabase** - Database operations and management
10. **fetch** - HTTP requests and API calls

### Additional MCP servers (`.mcp.json`):

1. **vercel** - Vercel deployment integration (HTTP-based)
2. **razorpay** - Payment processing integration

## Installation and Setup

### 1. Prerequisites

```bash
# Node.js (v18 or higher)
node --version

# npm
npm --version

# Claude Desktop (installed)
# Download from: https://claude.ai/download
```

### 2. Automatic Setup

Run the provided setup script:

```bash
# Diagnose current state
./scripts/mcp-diagnostics.sh

# Fix common issues
./scripts/mcp-fix.sh
```

### 3. Manual Setup

#### Step 1: Create Configuration

Create or update `~/.claude.json`:

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/project"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@cyanheads/git-mcp-server"
      ]
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    }
  }
}
```

#### Step 2: Set Environment Variables

Create `~/.claude-env`:

```bash
# Required for task-master-ai
export ANTHROPIC_API_KEY="your_anthropic_key"

# Required for GitHub integration
export GITHUB_PERSONAL_ACCESS_TOKEN="your_github_token"

# Required for Supabase
export SUPABASE_URL="your_supabase_url"
export SUPABASE_ANON_KEY="your_supabase_anon_key"
export SUPABASE_SERVICE_ROLE_KEY="your_supabase_service_key"

# Required for Context7
export CONTEXT7_API_KEY="your_context7_key"
```

#### Step 3: Install MCP Servers

```bash
# Core MCP servers
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-memory
npm install -g @modelcontextprotocol/server-puppeteer

# Third-party servers
npm install -g @cyanheads/git-mcp-server
npm install -g @upstash/context7-mcp
npm install -g task-master-ai
```

#### Step 4: Restart Claude Desktop

- **macOS**: Cmd+Q or right-click → Quit
- **Windows**: Right-click system tray icon → Exit
- **Linux**: `pkill claude` or close window

## Common Issues and Solutions

### 1. MCP Tools Not Showing

**Symptoms**: Claude doesn't show MCP tools in new chats

**Solutions**:
1. Restart Claude Desktop completely
2. Check configuration syntax: `jq . ~/.claude.json`
3. Verify server paths are correct
4. Check Claude Desktop logs (Help → Show Logs)

### 2. Server Connection Errors

**Symptoms**: "Failed to connect to server" errors

**Solutions**:
1. Check if server is installed: `npx -y @package/name`
2. Verify network connectivity
3. Check firewall settings
4. Ensure all required environment variables are set

### 3. Permission Errors

**Symptoms**: "Permission denied" errors

**Solutions**:
1. **macOS**: System Preferences → Security & Privacy → Full Disk Access
2. **Linux**: `chmod -R 755 /path/to/project`
3. Check file ownership: `ls -la /path/to/project`

### 4. Configuration Conflicts

**Symptoms**: Some tools work, others don't

**Solutions**:
1. Check for duplicate server names
2. Ensure only one configuration file exists
3. Validate JSON syntax
4. Check for conflicting command paths

### 5. Environment Variable Issues

**Symptoms**: Authentication failures, API errors

**Solutions**:
1. Verify variables are set: `env | grep -E "(API_KEY|TOKEN)"`
2. Check for typos in variable names
3. Ensure variables are exported in the right shell
4. Test API keys manually

## Best Practices

### 1. Security

- Never commit API keys to version control
- Use environment variables for sensitive data
- Rotate keys regularly
- Use scoped tokens with minimal permissions

### 2. Performance

- Limit the number of active MCP servers
- Use local servers when possible
- Cache frequently accessed data
- Monitor resource usage

### 3. Maintenance

- Regularly update MCP servers
- Clean up unused servers
- Monitor logs for errors
- Backup configurations

## Testing MCP Setup

### 1. Basic Test

In a new Claude chat:

```
List all available MCP tools and their functions
```

### 2. File System Test

```
Read the package.json file in the current directory
```

### 3. Git Test

```
Show the git status of the current repository
```

### 4. Memory Test

```
Store "test_key" with value "test_value" in memory
```

## Troubleshooting Commands

```bash
# Check running MCP processes
ps aux | grep -E "(mcp|npx.*@)" | grep -v grep

# Test server availability
npx -y @modelcontextprotocol/server-filesystem --help

# Validate JSON configuration
jq . ~/.claude.json

# Check environment variables
env | grep -E "(API_KEY|TOKEN|SUPABASE|CONTEXT7)"

# Check network connectivity
curl -I https://api.github.com

# Test GitHub token
curl -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user
```

## Project-Specific Configurations

### TaskMaster AI

Used for PRD-driven development and task management:

```json
"task-master-ai": {
  "command": "npx",
  "args": ["-y", "task-master-ai"],
  "env": {
    "ANTHROPIC_API_KEY": "your_key",
    "PERPLEXITY_API_KEY": "your_key",
    "OPENAI_API_KEY": "your_key"
  }
}
```

### Supabase Integration

For database operations:

```json
"supabase": {
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase"],
  "env": {
    "SUPABASE_URL": "https://your-project.supabase.co",
    "SUPABASE_ANON_KEY": "your_anon_key",
    "SUPABASE_SERVICE_ROLE_KEY": "your_service_key"
  }
}
```

### File System Access

Project-specific file access:

```json
"filesystem": {
  "command": "npx",
  "args": [
    "-y",
    "@modelcontextprotocol/server-filesystem",
    "/home/jitin-m-nair/Desktop/polaris-v3"
  ]
}
```

## Getting Help

1. **Check logs**: Claude Desktop → Help → Show Logs
2. **Run diagnostics**: `./scripts/mcp-diagnostics.sh`
3. **Apply fixes**: `./scripts/mcp-fix.sh`
4. **Check documentation**: [MCP Documentation](https://modelcontextprotocol.io/)
5. **Community support**: GitHub issues for specific MCP servers

## Version Compatibility

- **Claude Desktop**: Latest version recommended
- **Node.js**: v18+ required
- **npm**: v8+ recommended
- **MCP servers**: Use latest versions

## Frequently Asked Questions

**Q: Why do MCP tools disappear after Claude updates?**
A: Claude updates sometimes reset configurations. Re-run the fix script and restart Claude.

**Q: Can I use different MCP servers for different projects?**
A: Yes, use project-specific `.claude.json` files with different filesystem paths.

**Q: How do I debug a failing MCP server?**
A: Check the Claude Desktop logs, run the server manually, and verify all dependencies.

**Q: Can I run MCP servers without npx?**
A: Yes, install globally with `npm install -g` and use the binary directly.

**Q: How do I secure my API keys?**
A: Use environment variables, never commit them to git, and rotate them regularly.