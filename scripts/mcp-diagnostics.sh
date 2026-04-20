#!/bin/bash

# MCP Diagnostics and Repair Script
# Version: 1.0
# Author: Claude Code Assistant

echo "====================================="
echo "MCP Diagnostics and Repair Tool"
echo "====================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    case $status in
        "OK")
            echo -e "${GREEN}✓${NC} $message"
            ;;
        "WARN")
            echo -e "${YELLOW}⚠${NC} $message"
            ;;
        "ERROR")
            echo -e "${RED}✗${NC} $message"
            ;;
        "INFO")
            echo -e "${BLUE}ℹ${NC} $message"
            ;;
    esac
}

# 1. Check Claude Desktop Installation
echo "1. Checking Claude Desktop Installation..."
if command -v claude-desktop &> /dev/null; then
    print_status "OK" "Claude Desktop found at $(which claude-desktop)"
else
    print_status "WARN" "Claude Desktop not in PATH"
fi

# 2. Check Configuration Files
echo ""
echo "2. Checking Configuration Files..."

config_locations=(
    "$HOME/.config/Claude/claude_desktop_config.json"
    "$HOME/.claude/claude_desktop_config.json"
    "$HOME/.claude.json"
    "./.claude.json"
    "./.mcp.json"
)

for config in "${config_locations[@]}"; do
    if [[ -f "$config" ]]; then
        print_status "OK" "Found config: $config"

        # Check if it has MCP servers
        if grep -q "mcpServers" "$config" 2>/dev/null; then
            server_count=$(jq '.mcpServers | keys | length' "$config" 2>/dev/null || echo "unknown")
            print_status "OK" "  Has $server_count MCP servers configured"
        else
            print_status "WARN" "  No mcpServers section found"
        fi
    else
        print_status "INFO" "No config at: $config"
    fi
done

# 3. Check Running MCP Processes
echo ""
echo "3. Checking Running MCP Processes..."
mcp_processes=$(ps aux | grep -E "(mcp|context7|git-mcp|filesystem)" | grep -v grep | wc -l)
if [[ $mcp_processes -gt 0 ]]; then
    print_status "OK" "Found $mcp_processes MCP-related processes running"

    # List unique MCP servers
    echo "  Running servers:"
    ps aux | grep -E "(npx.*@|mcp)" | grep -v grep | awk '{print $12 " " $13 " " $14}' | sort | uniq | head -10 | while read line; do
        echo "    - $line"
    done
else
    print_status "WARN" "No MCP processes found running"
fi

# 4. Check Common MCP Servers
echo ""
echo "4. Checking Common MCP Server Installation..."

servers=(
    "@modelcontextprotocol/server-filesystem"
    "@modelcontextprotocol/server-git"
    "@modelcontextprotocol/server-github"
    "@modelcontextprotocol/server-memory"
    "@modelcontextprotocol/server-postgres"
    "@modelcontextprotocol/server-puppeteer"
    "@upstash/context7-mcp"
    "@cyanheads/git-mcp-server"
    "task-master-ai"
)

for server in "${servers[@]}"; do
    if npx -y "$server" --help &> /dev/null; then
        print_status "OK" "$server - Available"
    else
        print_status "WARN" "$server - Not available or failed to load"
    fi
done

# 5. Check Environment Variables
echo ""
echo "5. Checking Environment Variables..."

env_vars=(
    "ANTHROPIC_API_KEY"
    "GITHUB_PERSONAL_ACCESS_TOKEN"
    "SUPABASE_URL"
    "CONTEXT7_API_KEY"
    "OPENAI_API_KEY"
)

for var in "${env_vars[@]}"; do
    if [[ -n "${!var}" ]]; then
        print_status "OK" "$var is set"
    else
        print_status "INFO" "$var is not set"
    fi
done

# 6. Network Connectivity Check
echo ""
echo "6. Checking Network Connectivity..."

# Check npm registry
if curl -s https://registry.npmjs.org/ > /dev/null; then
    print_status "OK" "npm registry accessible"
else
    print_status "ERROR" "Cannot reach npm registry"
fi

# Check GitHub API (if token exists)
if [[ -n "$GITHUB_PERSONAL_ACCESS_TOKEN" ]]; then
    if curl -s -H "Authorization: token $GITHUB_PERSONAL_ACCESS_TOKEN" https://api.github.com/user > /dev/null; then
        print_status "OK" "GitHub API accessible"
    else
        print_status "WARN" "GitHub API not accessible with current token"
    fi
fi

# 7. Generate Configuration Template
echo ""
echo "7. Generating Configuration Template..."

cat << 'EOF'
=============================================
Sample MCP Configuration Template
=============================================

Save this as ~/.claude.json or ./.claude.json:

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
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "your_token_here"
      }
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ]
    }
  }
}

Replace:
- /path/to/your/project with your actual project path
- your_token_here with your actual GitHub token
EOF

# 8. Troubleshooting Steps
echo ""
echo "8. Troubleshooting Steps..."

cat << 'EOF'
Common Issues and Solutions:

1. MCP tools not showing in Claude:
   - Restart Claude Desktop completely
   - Check configuration file syntax (use jq to validate)
   - Ensure Claude Desktop has permission to access directories

2. Server fails to start:
   - Check if the package is installed: npx -y @package/name
   - Verify all required environment variables are set
   - Check network connectivity

3. Permission errors:
   - On macOS: Grant Claude Desktop Full Disk Access in System Preferences
   - On Linux: Ensure Claude has read permissions for directories
   - Check file permissions: ls -la /path/to/directory

4. Configuration not loading:
   - Validate JSON syntax: jq . ~/.claude.json
   - Check for duplicate server names
   - Ensure correct file location (~/.claude.json or ./.claude.json)

5. Servers running but not connected:
   - Check Claude Desktop logs for errors
   - Try restarting individual MCP servers
   - Verify no conflicting configurations
EOF

echo ""
echo "====================================="
echo "Diagnostics Complete"
echo "====================================="