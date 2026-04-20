# Claude Code Debugger Agent - Deployment Guide

## 🚀 Making the Agent Available in Your Project

You're correct that the agent needs to be properly deployed to be usable across projects. Here's how to make it work:

### ✅ What I've Created

1. **Enhanced Agent Architecture** (`global/debugger-v2.md`) - Advanced debugging methodology
2. **Interactive Workflows** (`global/debugger-workflows.md`) - Step-by-step debugging processes
3. **Functional Agent Definition** (`global/.claude/agents/debugger.md`) - Actual Claude Code agent
4. **Comprehensive Documentation** (`global/README.md`, `global/debugger-examples.md`) - Usage guides

### 🎯 How to Use the Agent Right Now

**Option 1: Direct Reference (Immediate)**
```bash
claude "I need debugging help. Can you act as the web debugger agent and help me solve this React state issue?"
```

**Option 2: Copy Agent to Project Root**
```bash
# Copy the agent to your project's .claude directory
cp global/.claude/agents/debugger.md .claude/agents/
```

**Option 3: Global Installation (Advanced)**
```bash
# Add to your global Claude Code configuration
mkdir -p ~/.claude/agents/
cp global/.claude/agents/debugger.md ~/.claude/agents/
```

## 🔧 Agent Integration Strategies

### Method 1: Slash Command (Recommended)
Create a slash command that invokes the debugger:

Create `frontend/.claude/commands/debug.md`:
```markdown
---
name: debug
description: Debug web development issues using the specialized debugger agent
---

# Debug Command

Invoke the web development debugger agent to help diagnose and resolve technical issues.

## Usage
- `/debug My React component is not re-rendering`
- `/debug Getting 500 error from API endpoint`
- `/debug TypeScript compilation errors`
- `/debug Performance issues in my Next.js app`

The debugger agent will systematically analyze your issue, examine relevant code, and provide comprehensive solutions.
```

### Method 2: MCP Server Integration
Create a dedicated MCP server for debugging capabilities.

### Method 3: Project-Specific Agent
Copy the agent to each project where you need debugging help.

## 🎯 Current Availability

**In This Project**:
- ✅ Agent files are created in `/global/` directory
- ✅ Ready to use with direct invocation
- ⚠️ Need slash command setup for easier access

**In Other Projects**:
- ❌ Not automatically available (needs manual copying)
- ❌ Needs global installation or project-specific setup

## 🚀 Recommended Next Steps

### For Immediate Use (This Project)
1. Test the agent with: `claude "debug: [your issue]"`
2. Create slash command for easier access
3. Customize agent for your specific tech stack

### For Global Use
1. Copy agent files to `~/.claude/agents/`
2. Set up global slash commands
3. Configure MCP tool integration

### For Team Distribution
1. Share agent files with team members
2. Document installation process
3. Create team-specific debugging patterns

## 📋 Agent Capabilities Summary

The debugger agent can help with:
- **React/Next.js Issues**: Component problems, state management, hydration errors
- **TypeScript Errors**: Type checking, compilation issues, configuration
- **API Debugging**: Endpoint failures, authentication, CORS issues
- **Performance**: Bundle analysis, memory leaks, optimization
- **Database Issues**: Supabase, queries, migrations, RLS policies
- **Build Problems**: Webpack, Vite, deployment failures
- **Security**: Vulnerabilities, authentication gaps

## 🎯 Example Usage

```bash
# In your project directory
claude "debug: I'm getting a hydration error in Next.js"

# Agent response:
🔍 ANALYZING: Next.js hydration error
📊 GATHERING CONTEXT: Examining your components...
🎯 HYPOTHESIS: Client-only code in server component
✅ SOLUTION: Move browser APIs to useEffect or client component
📚 EXPLANATION: SSR can't execute browser-specific code
🛡️ PREVENTION: Use proper Next.js patterns for client-side features
```

The agent is now ready to help you debug any web development issues systematically! 🚀