# SmartSlate MCP Configuration Guide

This guide documents all Model Context Protocol (MCP) servers configured for the SmartSlate Polaris v3 project, with a focus on code quality, clean architecture, and world-class frontend/UX design.

## 📋 Table of Contents

1. [Core Development MCPs](#core-development-mcps)
2. [Code Quality & Clean Code MCPs](#code-quality--clean-code-mcps)
3. [Design & UX MCPs](#design--ux-mcps)
4. [Database & Backend MCPs](#database--backend-mcps)
5. [Collaboration & Workflow MCPs](#collaboration--workflow-mcps)
6. [Research & Knowledge MCPs](#research--knowledge-mcps)
7. [Setup Instructions](#setup-instructions)

---

## 🛠️ Core Development MCPs

### 1. **Filesystem MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-filesystem`

**Purpose:** Navigate and manage your monorepo structure efficiently.

**Key Features:**
- Read/write files across your project
- List directory contents
- Search for files by pattern
- Handle multiple workspace folders

**Use Cases for SmartSlate:**
- Navigate between `frontend/`, `supabase/`, `docs/`, and `scripts/`
- Locate duplicate components (you have cleanup scripts)
- Find configuration files across your monorepo
- Access PRD documents in `docs/prds/`
- Manage Taskmaster files in `.taskmaster/`

**Configuration:**
```json
{
  "filesystem": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      "/home/jitin-m-nair/Desktop/polaris-v3"
    ]
  }
}
```

---

### 2. **Git MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-git`

**Purpose:** Local git operations without API calls, perfect for version control automation.

**Key Features:**
- Fast git blame for debugging
- View commit history for specific files
- Check out branches for feature work
- Stage and commit changes programmatically
- Review uncommitted changes

**Use Cases for SmartSlate:**
- Quick git operations during development
- Automated commit workflows
- Branch management for feature work
- Code archaeology (who changed what and when)
- Pre-commit validation

**Configuration:**
```json
{
  "git": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-git",
      "/home/jitin-m-nair/Desktop/polaris-v3"
    ]
  }
}
```

---

### 3. **GitHub MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-github`

**Purpose:** Comprehensive GitHub repository management through AI.

**Key Features:**
- Manage issues and pull requests
- Automated code reviews
- Repository search across all files
- Code scanning alerts management
- Commit history analysis

**Use Cases for SmartSlate:**
- Automated PR reviews for dynamic questionnaire features
- Issue triage for blueprint generation bugs
- Search across your 322+ frontend component files
- Track changes to your 28 Supabase migrations
- Analyze commit patterns for subscription system

**Configuration:**
```json
{
  "github": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-github"],
    "env": {
      "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_..."
    }
  }
}
```

**Setup:**
1. Create GitHub Personal Access Token: https://github.com/settings/tokens
2. Required scopes: `repo`, `read:org`, `workflow`
3. Add token to your `.cursor/mcp.json` (already .gitignored)

---

## ✨ Code Quality & Clean Code MCPs

### 4. **Sequential Thinking MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-sequential-thinking`

**Purpose:** Enables AI to think through complex problems step-by-step before generating code.

**Key Features:**
- Extended reasoning chains for complex logic
- Multi-step problem decomposition
- Validation of solution approaches
- Architecture decision documentation

**Use Cases for SmartSlate:**
- Planning complex features (dynamic questionnaire flow)
- Architecting subscription role system
- Debugging multi-provider LLM fallback chains
- Designing database schema migrations
- Evaluating trade-offs in implementation approaches

**Benefits for Code Quality:**
- ✅ More thoughtful architecture decisions
- ✅ Fewer bugs from rushed implementations
- ✅ Better documentation of "why" decisions were made
- ✅ Cleaner separation of concerns
- ✅ More maintainable code structure

**Configuration:**
```json
{
  "sequential-thinking": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
  }
}
```

---

### 5. **Memory/Knowledge Graph MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-memory`

**Purpose:** Maintains context and knowledge across development sessions.

**Key Features:**
- Persistent memory of architecture decisions
- Track relationships between code modules
- Document known issues and workarounds
- Store project-specific patterns and conventions

**Use Cases for SmartSlate:**
- Remember dynamic questionnaire architecture decisions
- Track relationships between static/dynamic questions
- Document Claude API fallback behavior
- Store subscription tier mapping rules
- Remember test patterns for Vitest suite
- Keep context about component library structure

**Benefits for Code Quality:**
- ✅ Consistency across codebase
- ✅ Avoid repeating past mistakes
- ✅ Maintain institutional knowledge
- ✅ Faster onboarding for new features
- ✅ Document tribal knowledge

**Configuration:**
```json
{
  "memory": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

---

### 6. **Fetch MCP** ⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-fetch`

**Purpose:** Fetch and analyze web resources for API documentation and best practices.

**Key Features:**
- Fetch API documentation
- Download code examples
- Access GitHub raw files
- Retrieve changelogs and migration guides

**Use Cases for SmartSlate:**
- Fetch latest Next.js 15 documentation
- Get Supabase RLS policy examples
- Access Anthropic Claude API docs
- Download React 19 migration guides
- Retrieve Tailwind v4 best practices

**Benefits for Code Quality:**
- ✅ Always use latest API patterns
- ✅ Follow vendor-recommended approaches
- ✅ Stay updated with framework changes
- ✅ Learn from official examples
- ✅ Implement industry best practices

**Configuration:**
```json
{
  "fetch": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-fetch"]
  }
}
```

---

## 🎨 Design & UX MCPs

### 7. **Figma MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-figma`

**Purpose:** Direct integration with Figma for brand-compliant, pixel-perfect implementations.

**Key Features:**
- Extract design tokens (colors, typography, spacing)
- Generate code from Figma components
- Ensure design-code alignment
- Automated design spec extraction
- Component structure mapping

**Use Cases for SmartSlate:**
- Extract SmartSlate brand colors and typography
- Generate Tailwind classes from Figma designs
- Ensure blueprint visualizations match designs
- Implement dynamic question input types precisely
- Maintain consistent spacing and sizing

**Benefits for Design Quality:**
- ✅ **Brand Compliance:** Exact color/font matching
- ✅ **Pixel Perfect:** No more "close enough" implementations
- ✅ **Design System Alignment:** Components match spec
- ✅ **Faster Implementation:** Auto-generate CSS/classes
- ✅ **Designer-Developer Sync:** Single source of truth

**Configuration:**
```json
{
  "figma": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-figma"],
    "env": {
      "FIGMA_PERSONAL_ACCESS_TOKEN": "figd_..."
    }
  }
}
```

**Setup:**
1. Get Figma token: Settings → Account → Personal Access Tokens
2. Required scopes: `File content`, `Read-only`
3. Add to `.cursor/mcp.json`

**Example Usage:**
```
"Extract the color palette from our Figma design system"
"Generate Tailwind classes for the button component in Figma"
"Show me the spacing tokens from our design file"
```

---

### 8. **Storybook MCP** ⭐⭐⭐⭐⭐
**Package:** `@dannyhw/storybook-mcp-server`

**Purpose:** AI-assisted component development and documentation with Storybook.

**Key Features:**
- Access component stories programmatically
- Generate component variants
- Automated testing suggestions
- Component discovery and documentation
- Visual regression testing integration

**Use Cases for SmartSlate:**
- Document your 13 dynamic input types
- Create stories for blueprint visualization components
- Test responsive design across viewports
- Document SmartSlate design system
- Generate component usage examples
- Test accessibility compliance

**Benefits for Design Quality:**
- ✅ **Living Documentation:** Always-updated component library
- ✅ **Visual Testing:** Catch UI regressions early
- ✅ **Component Isolation:** Test in isolation
- ✅ **Design System Enforcement:** Consistent usage
- ✅ **Collaboration:** Designers see actual components

**Configuration:**
```json
{
  "storybook": {
    "command": "npx",
    "args": ["-y", "@dannyhw/storybook-mcp-server"],
    "env": {
      "STORYBOOK_URL": "http://localhost:6006"
    }
  }
}
```

**Setup:**
1. Install Storybook: `npx storybook@latest init`
2. Start Storybook: `npm run storybook`
3. MCP will connect to running instance

**Recommended Stories for SmartSlate:**
- **Dynamic Input Types:**
  - `RadioPills.stories.tsx`
  - `CheckboxCards.stories.tsx`
  - `EnhancedScale.stories.tsx`
  - `LabeledSlider.stories.tsx`
- **Blueprint Components:**
  - `BlueprintInfographic.stories.tsx`
  - `TimelineView.stories.tsx`
  - `ChartRenderer.stories.tsx`
- **Form Components:**
  - `StepWizard.stories.tsx`
  - `ProgressIndicator.stories.tsx`

---

### 9. **Everart MCP** ⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-everart`

**Purpose:** AI-powered design asset generation for mockups and illustrations.

**Key Features:**
- Generate custom illustrations
- Create placeholder images
- Design icon sets
- Mockup generation
- Brand-aligned visual assets

**Use Cases for SmartSlate:**
- Generate learning pathway illustrations
- Create placeholder images for blueprints
- Design custom icons for input types
- Generate marketing visuals
- Create onboarding illustrations
- Design email templates

**Benefits for Design Quality:**
- ✅ **Consistent Style:** Brand-aligned assets
- ✅ **Fast Iteration:** Quick visual concepts
- ✅ **Unique Assets:** No stock photo look
- ✅ **Scalable Design:** Vector-based outputs
- ✅ **Cost Effective:** No designer needed for mockups

**Configuration:**
```json
{
  "everart": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-everart"],
    "env": {
      "EVERART_API_KEY": "ea_..."
    }
  }
}
```

---

### 10. **Puppeteer/Browser Automation MCP** ⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-puppeteer`

**Purpose:** Automated browser testing and screenshot generation.

**Key Features:**
- Screenshot generation for components
- Visual regression testing
- Accessibility audits (Lighthouse)
- Multi-device testing
- PDF generation from web pages

**Use Cases for SmartSlate:**
- Screenshot blueprint visualizations for QA
- Test responsive design at different breakpoints
- Validate accessibility of dynamic question renderer
- Generate PDF exports programmatically
- Test complex user flows end-to-end
- Visual diff testing for UI changes

**Benefits for Design Quality:**
- ✅ **Visual Regression Prevention:** Catch UI breaks
- ✅ **Accessibility Validation:** WCAG compliance
- ✅ **Cross-Browser Testing:** Works everywhere
- ✅ **Performance Monitoring:** Track Core Web Vitals
- ✅ **Automated QA:** Reduce manual testing

**Configuration:**
```json
{
  "puppeteer": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
  }
}
```

**Example Usage:**
```
"Take screenshots of the dynamic questionnaire at all breakpoints"
"Run a Lighthouse audit on the blueprint page"
"Test the form wizard on mobile viewport"
```

---

## 🗄️ Database & Backend MCPs

### 11. **PostgreSQL MCP** ⭐⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-postgres`

**Purpose:** Direct PostgreSQL database access for complex queries and debugging.

**Key Features:**
- Execute SQL queries safely
- Inspect database schemas
- Analyze query performance
- Test RLS policies
- Debug JSONB structures

**Use Cases for SmartSlate:**
- Debug complex JSONB queries for dynamic questions
- Optimize indexes for blueprint generation
- Test RLS policies in isolation
- Analyze query performance for dashboards
- Validate your 28 migration files
- Query subscription data for testing

**Configuration:**
```json
{
  "postgresql": {
    "command": "npx",
    "args": [
      "-y",
      "@modelcontextprotocol/server-postgres",
      "postgresql://postgres:PASSWORD@db.xxx.supabase.co:5432/postgres"
    ]
  }
}
```

**⚠️ Security Note:** 
- Use read-only credentials where possible
- Never commit connection strings to git
- Rotate credentials regularly
- Use `.cursor/mcp.json` (already gitignored)

---

## 🤝 Collaboration & Workflow MCPs

### 12. **Slack MCP** ⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-slack`

**Purpose:** Team communication and automated notifications.

**Key Features:**
- Post notifications to channels
- Send direct messages
- Thread management
- File sharing
- Channel history access

**Use Cases for SmartSlate:**
- Alert when Claude API fails and falls back to Ollama
- Notify team of Vercel deployment status
- Share blueprint generation performance metrics
- Triage Supabase RLS policy violations
- Summarize daily Taskmaster task completions
- Post error alerts from production

**Configuration:**
```json
{
  "slack": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-slack"],
    "env": {
      "SLACK_BOT_TOKEN": "xoxb-...",
      "SLACK_TEAM_ID": "T..."
    }
  }
}
```

**Setup:**
1. Create Slack App: https://api.slack.com/apps
2. Add Bot Token Scopes: `chat:write`, `channels:read`, `files:write`
3. Install to workspace
4. Copy Bot User OAuth Token

---

### 13. **Task Master AI** ⭐⭐⭐⭐⭐
**Package:** `task-master-ai`

**Purpose:** Advanced project management and PRD-driven development.

**Key Features:**
- Parse PRDs into actionable tasks
- AI-powered task breakdown
- Dependency management
- Complexity analysis
- Research integration

**Use Cases for SmartSlate:**
- Manage dynamic questionnaire implementation
- Track subscription system development
- Break down complex features
- Maintain task dependencies
- Research best practices during implementation

**Configuration:**
```json
{
  "task-master-ai": {
    "command": "npx",
    "args": ["-y", "task-master-ai"],
    "env": {
      "ANTHROPIC_API_KEY": "sk-ant-...",
      "PERPLEXITY_API_KEY": "pplx-...",
      "OPENAI_API_KEY": "sk-proj-..."
    }
  }
}
```

---

## 🔍 Research & Knowledge MCPs

### 14. **Brave Search MCP** ⭐⭐⭐⭐
**Package:** `@modelcontextprotocol/server-brave-search`

**Purpose:** Real-time web search for latest documentation and best practices.

**Key Features:**
- Privacy-focused web search
- Recent documentation lookup
- Technical Q&A discovery
- Error message solutions
- API reference retrieval

**Use Cases for SmartSlate:**
- Research latest Next.js 15 patterns
- Find Supabase RLS best practices
- Look up Claude Sonnet 4 optimal prompts
- Debug Vercel deployment issues
- Check for security vulnerabilities
- Find React 19 migration guides

**Configuration:**
```json
{
  "brave-search": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-brave-search"],
    "env": {
      "BRAVE_API_KEY": "BSA..."
    }
  }
}
```

**Setup:**
1. Get API key: https://api.search.brave.com/app/keys
2. Free tier: 2,000 queries/month
3. Add to `.cursor/mcp.json`

---

## 📚 Setup Instructions

### Step 1: Secure Your API Keys

**Current Security Issue:** Your `.cursor/mcp.json` contains exposed API keys!

**Immediate Action Required:**
```bash
# 1. Rotate ALL exposed keys:
# - Anthropic API key
# - OpenAI API key  
# - Perplexity API key
# - GitHub token
# - PostgreSQL password

# 2. Verify gitignore
grep ".cursor/mcp.json" .gitignore

# 3. Remove from git history if committed
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .cursor/mcp.json' \
  --prune-empty --tag-name-filter cat -- --all
```

### Step 2: Configure Each MCP

1. **GitHub Token:**
   - Visit: https://github.com/settings/tokens
   - Scopes: `repo`, `read:org`, `workflow`

2. **Figma Token:**
   - Settings → Account → Personal Access Tokens
   - Scopes: File content (read-only)

3. **Slack Bot:**
   - Create app: https://api.slack.com/apps
   - Scopes: `chat:write`, `channels:read`, `files:write`

4. **Brave Search:**
   - Get key: https://api.search.brave.com/app/keys
   - Free tier available

5. **Supabase/PostgreSQL:**
   - Get from Supabase dashboard
   - Use read-only credentials when possible

### Step 3: Test MCPs

```bash
# Restart Cursor to load new MCPs

# Test in Cursor chat:
"List files in the frontend directory"        # Tests filesystem
"Search GitHub for issues labeled 'bug'"      # Tests github  
"What colors are defined in Figma?"           # Tests figma
"Show my database schema"                     # Tests postgresql
```

### Step 4: Storybook Setup (Optional but Recommended)

```bash
cd frontend

# Install Storybook
npx storybook@latest init

# Create first story
cat > components/demo-dynamicv2/RadioPills.stories.tsx << 'EOF'
import type { Meta, StoryObj } from '@storybook/react';
import { RadioPills } from './RadioPills';

const meta: Meta<typeof RadioPills> = {
  title: 'Dynamic Inputs/RadioPills',
  component: RadioPills,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof RadioPills>;

export const Default: Story = {
  args: {
    options: [
      { value: '1', label: 'Option 1' },
      { value: '2', label: 'Option 2' },
      { value: '3', label: 'Option 3' },
    ],
  },
};
EOF

# Start Storybook
npm run storybook
```

---

## 🎯 Recommended Workflow

### Daily Development Flow

1. **Start Day:**
   ```
   "What tasks are pending in Taskmaster?"
   "Show me recent commits related to [feature]"
   "Check for any production errors in Slack"
   ```

2. **During Feature Development:**
   ```
   "Use sequential-thinking to plan the [feature] architecture"
   "Remember this architecture decision: [decision + reasoning]"
   "Extract design tokens from the Figma file for [component]"
   "Generate Storybook story for [component]"
   ```

3. **Before Committing:**
   ```
   "Take screenshots of the changes at mobile/tablet/desktop"
   "Run accessibility audit on [page]"
   "Check if there are any similar patterns in the codebase"
   ```

4. **After Deployment:**
   ```
   "Post deployment success to #engineering"
   "Check database performance for new queries"
   "Monitor error rates in production"
   ```

### Code Quality Checklist

Use these MCPs to ensure high-quality code:

- ✅ **Sequential Thinking:** Architecture planning
- ✅ **Memory:** Maintain consistency with past decisions
- ✅ **Figma:** Brand-compliant colors/spacing
- ✅ **Storybook:** Component documentation
- ✅ **Puppeteer:** Visual regression testing
- ✅ **PostgreSQL:** Query performance validation
- ✅ **GitHub:** Code review automation

### Design Quality Checklist

- ✅ **Figma:** Extract exact design tokens
- ✅ **Storybook:** Document all variants
- ✅ **Puppeteer:** Screenshot all breakpoints
- ✅ **Everart:** Generate on-brand assets
- ✅ **Brave Search:** Research latest UX patterns
- ✅ **Memory:** Remember design decisions

---

## 🚀 Advanced Usage

### Combining MCPs for Powerful Workflows

**Example 1: Brand-Compliant Component Development**
```
1. "Extract button styles from Figma design system" (Figma MCP)
2. "Use sequential-thinking to design the component API" (Sequential)
3. "Generate Tailwind classes matching Figma tokens" (Figma)
4. "Create Storybook stories showing all variants" (Storybook)
5. "Take screenshots at all breakpoints" (Puppeteer)
6. "Remember this component pattern for future reference" (Memory)
```

**Example 2: Database-Driven Feature**
```
1. "Analyze query performance for blueprint generation" (PostgreSQL)
2. "Research latest Supabase RLS patterns" (Brave Search)
3. "Use sequential-thinking to optimize the schema" (Sequential)
4. "Update migration file" (Filesystem)
5. "Commit changes with descriptive message" (Git)
6. "Notify team in #backend channel" (Slack)
```

**Example 3: Production Debugging**
```
1. "Check recent errors in production" (Slack/GitHub)
2. "Query database for failed blueprint generations" (PostgreSQL)
3. "Search for similar issues in GitHub" (GitHub)
4. "Research error message online" (Brave Search)
5. "Document the fix in memory" (Memory)
6. "Create PR with fix" (GitHub)
```

---

## 📊 MCP Effectiveness Matrix

| MCP | Code Quality | Design Quality | Development Speed | Collaboration |
|-----|-------------|----------------|-------------------|---------------|
| Sequential Thinking | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Memory | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Figma | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Storybook | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Puppeteer | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| PostgreSQL | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| GitHub | ⭐⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Filesystem | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐ |
| Git | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| Slack | ⭐⭐ | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Brave Search | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Fetch | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐ |
| Everart | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| Task Master | ⭐⭐⭐⭐ | ⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |

---

## 🎓 Learning Resources

- **MCP Official Docs:** https://modelcontextprotocol.io/
- **Anthropic MCP Guide:** https://docs.anthropic.com/en/docs/build-with-claude/mcp
- **MCP Server List:** https://github.com/modelcontextprotocol/servers
- **Figma Plugin:** https://www.figma.com/community/plugin/mcp-figma
- **Storybook Docs:** https://storybook.js.org/docs

---

## 🔐 Security Best Practices

1. **Never commit `.cursor/mcp.json`** (already in `.gitignore`)
2. **Rotate keys immediately** if exposed
3. **Use read-only credentials** where possible (PostgreSQL)
4. **Principle of least privilege** for all API tokens
5. **Regular security audits** of MCP configurations
6. **Monitor MCP usage** for anomalies

---

## 📝 Maintenance

- **Monthly:** Review and rotate API keys
- **Quarterly:** Update MCP packages to latest versions
- **After major changes:** Document new patterns in Memory MCP
- **Before releases:** Audit all MCP configurations

---

## 🤝 Contributing

When adding new MCPs:

1. Research thoroughly before adding
2. Document use cases specific to SmartSlate
3. Add security considerations
4. Update this guide with examples
5. Test thoroughly before committing

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintainer:** SmartSlate Development Team


