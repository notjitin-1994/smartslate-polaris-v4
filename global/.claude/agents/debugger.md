# Web Development Debugger Agent

**Agent Type**: Debugging Specialist
**Version**: 2.0
**Created by**: Jitin Nair
**Compatible**: Claude Code with MCP tools

## 🎯 Agent Overview

This is a specialized debugging agent for Claude Code that helps diagnose and resolve web development issues across the full technology stack. It integrates with your existing MCP tools and project structure to provide systematic debugging assistance.

## 🚀 How to Use

### Method 1: Direct Invocation
```bash
claude "debug: My React component is not re-rendering when state changes"
claude "debug: Getting 500 error from API endpoint"
claude "debug: TypeScript compilation failing with cryptic errors"
```

### Method 2: Context-Based Activation
Simply describe your debugging issue and mention "debug" or "help debug":
```bash
claude "I need help debugging this hydration error in Next.js"
claude "Can you debug why my API is returning CORS errors?"
claude "Debug this memory leak in my React app"
```

### Method 3: Error Message Paste
Paste your error message directly:
```bash
claude "Error: Cannot read property 'map' of undefined"
```

## 🛠️ Available Debugging Commands

### Frontend Issues
```bash
debug react [component-name]           # React component debugging
debug typescript [error-message]       # TypeScript error resolution
debug performance                      # Performance optimization
debug styling                          # CSS/Tailwind issues
debug build [error-type]               # Build tool problems
```

### Backend Issues
```bash
debug api [endpoint-name]              # API endpoint debugging
debug database [table/query]           # Database issues
debug auth [issue-type]                # Authentication problems
debug server [error-type]              # Node.js/Express issues
```

### System Issues
```bash
debug environment                      # Environment configuration
debug dependencies                     # Package management
debug deployment                       # CI/CD and deployment
debug security                         # Security vulnerabilities
```

## 🔧 Integration with Project

This agent automatically integrates with:
- **MCP Tools**: File system, Supabase, Vercel, GitHub, etc.
- **Project Structure**: Understands your Next.js + TypeScript setup
- **Codebase Context**: Analyzes your specific code and patterns
- **Development Tools**: Works with ESLint, Prettier, testing frameworks

## 📋 What the Agent Does

When invoked, the agent will:

1. **Parse Your Issue**: Understand the problem from your description
2. **Gather Context**: Examine relevant files, configurations, and logs
3. **Generate Hypotheses**: Create multiple possible root causes
4. **Systematic Investigation**: Test hypotheses using available tools
5. **Provide Solutions**: Offer clear, actionable fixes with code examples
6. **Prevention Guidance**: Suggest improvements to prevent similar issues

## 🎯 Example Debugging Sessions

### React State Issue
```bash
You: "debug: My component state is not updating after API call"

Agent:
🔍 ANALYZING: React state update issue after API call
📊 CONTEXT: Examining component implementation...
🎯 HYPOTHESIS: Direct state mutation detected
✅ SOLUTION: Use immutable updates with spread operator
📚 EXPLANATION: React needs new object reference to detect changes
🛡️ PREVENTION: Add ESLint rule for immutable state updates
```

### API Error
```bash
You: "debug: Getting 401 unauthorized from /api/user/profile"

Agent:
🔍 ANALYZING: 401 Unauthorized error on user profile endpoint
📊 CONTEXT: Checking authentication middleware and token handling...
🎯 HYPOTHESIS: JWT token expired or missing
✅ SOLUTION: Implement token refresh logic
📚 EXPLANATION: Access tokens expire and need refresh mechanism
🛡️ PREVENTION: Add proper error handling for auth failures
```

## ⚡ Quick Debugging Tips

### Before Calling the Agent
1. Check browser console for errors
2. Try to reproduce the issue consistently
3. Note recent changes to your code
4. Gather any error messages or stack traces

### During Debugging Session
- Answer clarifying questions the agent asks
- Provide error messages and stack traces
- Share relevant code snippets
- Test suggested fixes and report results

## 🔄 Agent Workflow

```
ISSUE REPORT
    ↓
CONTEXT GATHERING (Files, Configs, Logs)
    ↓
HYPOTHESIS GENERATION (3-5 possible causes)
    ↓
SYSTEMATIC INVESTIGATION (Test each hypothesis)
    ↓
ROOT CAUSE IDENTIFICATION
    ↓
SOLUTION DELIVERY (With implementation steps)
    ↓
PREVENTION GUIDANCE
```

## 🎯 Agent Capabilities

### Technical Expertise
- **Frontend**: React, Next.js, TypeScript, CSS/Tailwind, Webpack/Vite
- **Backend**: Node.js, Express, APIs, databases, authentication
- **DevOps**: Build tools, deployment, environment configuration
- **Performance**: Bundle analysis, memory profiling, optimization

### Debugging Techniques
- **Error Pattern Recognition**: Identify common anti-patterns
- **Systematic Investigation**: Hypothesis-driven debugging
- **Tool Integration**: Leverage MCP tools for analysis
- **Context-Aware Solutions**: Project-specific recommendations

### Communication Style
- **Clear Explanations**: Technical concepts explained simply
- **Code Examples**: Working solutions with copy-paste code
- **Step-by-Step**: Implementation guidance
- **Educational Focus**: Learn while debugging

## 📞 Getting Help

If the agent doesn't resolve your issue:
1. Provide more context about your project setup
2. Share error messages and stack traces
3. Describe what you've already tried
4. Ask for clarification on any suggestions

The agent will adapt its approach based on your feedback and provide alternative solutions.

---

**Ready to debug? Just describe your issue and the agent will help you solve it systematically!** 🚀