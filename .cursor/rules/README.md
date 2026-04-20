# Cursor Rules Documentation

This directory contains modular cursor rules (`.mdc` files) that guide development practices across the SmartSlate Polaris v3 project. Each rule file targets specific aspects of the codebase and can be referenced by the AI assistant.

## 📋 Rule Files Overview

### Core Development Rules

- **`cursor_rules.mdc`** - Rule structure and best practices for creating/maintaining cursor rules
- **`eslint_quality.mdc`** - Code quality standards and ESLint configuration alignment
- **`prd_driven_development.mdc`** - PRD-first development workflow and Taskmaster integration
- **`self_improve.mdc`** - Guidelines for improving rules based on emerging patterns

### Framework & Platform Rules

- **`nextjs_app.mdc`** - Next.js 15 App Router conventions, Server Components, and React 19 patterns
- **`typescript.mdc`** - TypeScript strictness, naming conventions, and type safety
- **`tailwind.mdc`** - Tailwind v4 utilities, responsive design, and accessibility
- **`vercel.mdc`** - Vercel deployment, environment variables, and CI/CD

### Security & Authentication

- **`security_secrets.mdc`** - Secrets management, environment configuration, and API key handling
- **`supabase.mdc`** ✨ **NEW** - Database patterns, RLS policies, migrations, and PostgreSQL best practices
- **`api-middleware.mdc`** ✨ **NEW** - API route handlers, composable middleware, and request/response handling
- **`role-based-access.mdc`** ✨ **NEW** - Role system, subscription tiers, limits enforcement, and feature gates

### Feature-Specific Rules

- **`claude-blueprint-generation.mdc`** - Claude API integration for blueprint generation
- **`perplexity-dynamic-questionnaire.mdc`** - Perplexity-powered questionnaire system
- **`dynamic_questionnaire_alignment.mdc`** - Dynamic questionnaire implementation rules

### Testing & Quality

- **`testing.mdc`** ✨ **NEW** - Comprehensive testing strategies, patterns, and coverage requirements

### Workflow & Tooling

- **`mcp_execution_context.mdc`** - MCP server execution context and shell management
- **`taskmaster/`** - Taskmaster-specific rules
  - `dev_workflow.mdc` - Development workflow using Taskmaster
  - `taskmaster.mdc` - Taskmaster commands and tool reference

## ✨ What's New (For Roles & Subscriptions)

Four new comprehensive rule files have been added to support the user roles and subscriptions system:

### 1. **supabase.mdc** - Database Excellence
Comprehensive guide for working with Supabase:
- **Migration Patterns**: Sequential migrations with rollback logic
- **RLS Policies**: Row-level security for all user data
- **JSONB Best Practices**: Flexible metadata storage
- **Database Functions**: Atomic operations for usage tracking
- **Query Optimization**: Indexes, EXPLAIN ANALYZE, pagination
- **TypeScript Integration**: Type generation from schema
- **Audit Logging**: Immutable audit trails

**Key Sections:**
- Schema design conventions
- PostgreSQL 15+ features (JSONB, generated columns)
- Performance monitoring and connection pooling
- Common pitfalls to avoid

### 2. **api-middleware.mdc** - Robust API Patterns
Complete guide for Next.js API routes and middleware:
- **Composable Middleware**: Reusable auth, role, and limit checks
- **Authentication**: requireAuth, requireRole, requireFeature
- **Error Standards**: Consistent error responses with upgrade URLs
- **Usage Tracking**: Atomic counters and idempotency
- **Rate Limiting**: In-memory and distributed rate limiting
- **Logging**: Structured logging and audit trails

**Key Sections:**
- Middleware architecture and composition
- Request validation with Zod
- Developer role bypass patterns
- Caching strategies

### 3. **role-based-access.mdc** - Subscription System
Complete implementation guide for the role system:
- **Type Definitions**: SubscriptionTier, UserRole, FeatureCategory
- **Limits Configuration**: Complete ROLE_LIMITS mapping for all tiers
- **Helper Functions**: canAccessFeature, getRemainingUsage, etc.
- **React Context**: RoleProvider and useUserRole hook
- **Component Patterns**: FeatureGate, UsageWidget, UpgradePrompt

**Key Sections:**
- Personal tiers: Explorer, Navigator, Voyager
- Team tiers: Crew, Fleet, Armada
- Enterprise tier with unlimited features
- Developer role with full access

### 4. **testing.mdc** - Quality Assurance
Comprehensive testing guide:
- **Unit Tests**: Type guards, middleware, hooks, components (95%+ coverage)
- **Integration Tests**: API routes, database functions (85%+ coverage)
- **E2E Tests**: User journeys with Playwright
- **Security Tests**: RLS policies, auth bypass attempts
- **Performance Tests**: Load testing with k6

**Key Sections:**
- Test pyramid strategy
- Vitest and Playwright setup
- Fixtures and test data management
- CI/CD integration with GitHub Actions

## 🎯 How to Use These Rules

### For AI Assistants
Rules are automatically applied based on:
1. **`alwaysApply: true`** - Applied to all relevant file patterns
2. **`globs`** - Applied when working on matching file paths
3. **Manual reference** - Use `@filename.mdc` syntax to explicitly reference

### For Developers
1. **Read rules before implementing** - Understand patterns and conventions
2. **Follow the standards** - Consistency is key
3. **Update rules when patterns evolve** - Keep documentation current
4. **Cross-reference related rules** - Many rules work together

## 🔗 Rule Relationships

### Roles & Subscriptions Implementation Flow
```
1. Database (supabase.mdc)
   ↓
2. Types & Limits (role-based-access.mdc)
   ↓
3. API Enforcement (api-middleware.mdc)
   ↓
4. React Components (role-based-access.mdc)
   ↓
5. Testing (testing.mdc)
```

### Core Stack
```
Next.js (nextjs_app.mdc)
  + TypeScript (typescript.mdc)
  + Tailwind (tailwind.mdc)
  + Supabase (supabase.mdc)
  → API Routes (api-middleware.mdc)
  → Security (security_secrets.mdc)
  → Testing (testing.mdc)
  → Deploy (vercel.mdc)
```

## 📊 Coverage Map

| Task | Primary Rules | Supporting Rules |
|------|--------------|------------------|
| Database schema | supabase.mdc | typescript.mdc, prd_driven_development.mdc |
| Type definitions | role-based-access.mdc | typescript.mdc |
| API middleware | api-middleware.mdc | security_secrets.mdc, nextjs_app.mdc |
| React hooks | role-based-access.mdc | nextjs_app.mdc, typescript.mdc |
| UI components | role-based-access.mdc | tailwind.mdc, nextjs_app.mdc |
| Testing | testing.mdc | All of the above |
| Deployment | vercel.mdc | security_secrets.mdc |

## 🚀 Quick Reference

### Starting a New Task
1. Check `.taskmaster/tasks/tasks.json` for current task
2. Read relevant PRD section in `docs/prds/`
3. Reference applicable `.mdc` files
4. Implement following patterns in rules
5. Write tests per `testing.mdc`
6. Deploy per `vercel.mdc`

### Common Scenarios

**Adding a new subscription tier:**
- Update: `role-based-access.mdc` (ROLE_LIMITS)
- Update: Database schema (supabase.mdc)
- Test: All tiers (testing.mdc)

**Creating an API endpoint:**
- Follow: `api-middleware.mdc`
- Secure: `security_secrets.mdc`
- Test: `testing.mdc`

**Building a feature gate:**
- Pattern: `role-based-access.mdc` (FeatureGate)
- Style: `tailwind.mdc`
- Test: `testing.mdc` (component tests)

## 📝 Contributing to Rules

When you identify a new pattern or best practice:

1. **Check existing rules** - Avoid duplication
2. **Create focused rules** - One concern per file
3. **Follow the template** - See `cursor_rules.mdc`
4. **Use examples** - Show DO and DON'T patterns
5. **Link related rules** - Cross-reference with `[filename](mdc:path)`
6. **Update this README** - Keep the index current

## 🎓 Learning Path

For new team members working on the roles system:

1. **Week 1: Foundations**
   - Read: `typescript.mdc`, `nextjs_app.mdc`, `tailwind.mdc`
   - Practice: Basic Next.js components

2. **Week 2: Database & API**
   - Read: `supabase.mdc`, `api-middleware.mdc`, `security_secrets.mdc`
   - Practice: Create test API routes with auth

3. **Week 3: Roles System**
   - Read: `role-based-access.mdc`
   - Practice: Implement feature gates and usage tracking

4. **Week 4: Quality & Deployment**
   - Read: `testing.mdc`, `vercel.mdc`
   - Practice: Write comprehensive tests and deploy

## 📚 Additional Resources

- **Project PRD**: `docs/prds/user-roles-and-subscriptions.txt`
- **Tasks**: `.taskmaster/tasks/tasks.json`
- **API Docs**: `frontend/API_DOCUMENTATION.md`
- **Code Structure**: `frontend/CODE_STRUCTURE.md`
- **Test Coverage**: `frontend/TEST_COVERAGE_REPORT.md`

---

*Last updated: 2025-10-09*
*For questions or suggestions, create an issue or update the relevant `.mdc` file.*

