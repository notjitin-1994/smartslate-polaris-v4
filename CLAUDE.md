# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SmartSlate Polaris v3 is an AI-powered learning blueprint generation platform. It uses a two-phase questionnaire system (static → dynamic) to capture context, then generates comprehensive learning blueprints using Claude AI with dual-fallback architecture (Claude Sonnet 4.5 → Claude Sonnet 4).

**Tech Stack**: Next.js 15 App Router, TypeScript 5.7 (strict mode), Supabase PostgreSQL, Tailwind CSS v4, Radix UI, Zustand, React Hook Form, Zod validation

## Essential Commands

### Development
```bash
# Frontend development (from /frontend directory)
npm run dev              # Start dev server on localhost:3000
npm run build            # Production build
npm run typecheck        # TypeScript type checking
npm run lint             # ESLint with auto-fix
npm run format           # Prettier formatting

# Testing
npm run test             # Run all tests with Vitest
npm run test:watch       # Watch mode for development
npm run test:integration # Integration tests

# Database (from project root)
npm run db:reset         # Reset local Supabase database
npm run db:push          # Push migrations to remote
npm run db:status        # Check Supabase status
npm run db:migrations:new <name> # Create new migration
```

### Running a Single Test
```bash
cd frontend
npm run test -- tests/claude/client.test.ts
npm run test -- --grep "specific test name"
```

## High-Level Architecture

### Data Flow Architecture
```
User Auth (Supabase)
  → Static Questionnaire (3 sections, 30+ fields)
  → AI Dynamic Question Gen (Claude → 10 sections, 50-70 questions)
  → Dynamic Questionnaire (user answers)
  → AI Blueprint Generation (Claude → comprehensive blueprint)
  → Multi-format Export (PDF/Word/Markdown) + Shareable Links
```

### Dual-Fallback AI System
The platform uses a sophisticated fallback mechanism for reliability:

1. **Primary**: Claude Sonnet 4.5 (cost-effective, high-quality)
2. **Fallback**: Claude Sonnet 4 (reliability and capacity management)

**Location**: `frontend/lib/claude/fallback.ts`, `frontend/lib/services/blueprintGenerationService.ts`

Each AI provider has:
- HTTP client with retry logic (`frontend/lib/claude/client.ts`)
- Zod schema validation for responses (`frontend/lib/claude/validation.ts`)
- Prompt templates (`frontend/lib/claude/prompts.ts`)
- Error handling with automatic failover

### Database Schema

**Core Table**: `blueprint_generator` (all questionnaire and blueprint data)
- `static_answers` (JSONB) - Phase 1 responses
- `dynamic_questions` (JSONB) - AI-generated questions
- `dynamic_answers` (JSONB) - Phase 2 responses  
- `blueprint_json` (JSONB) - Generated blueprint
- `blueprint_markdown` (TEXT) - Markdown version
- `status` - Workflow state machine ('draft' | 'generating' | 'completed' | 'error')

**Subscription Table**: `user_profiles` (usage limits and tier management)
- `subscription_tier` - Current tier (explorer/navigator/voyager/crew/fleet/armada/enterprise)
- `user_role` - Permission level (explorer/navigator/etc./developer)
- `blueprint_creation_count` / `blueprint_saving_count` - Usage tracking
- `blueprint_creation_limit` / `blueprint_saving_limit` - Tier limits
- `usage_metadata` (JSONB) - Flexible usage data

**Tier Display Naming Convention**:
- Default tier (explorer) → "Free Tier Member" in UI
- Paid tiers (navigator, voyager, etc.) → "[Tier Name] Member" (e.g., "Navigator Member")
- Developer tier → "Developer"
- Use `getTierDisplayName()` from `@/lib/utils/tierDisplay` for consistent naming

**Security**: All tables use Row Level Security (RLS) policies. Users can only access their own data.

**Migrations**: Located in `supabase/migrations/`, named sequentially (e.g., `0003_blueprint_generator.sql`). Always include rollback logic.

### State Management Strategy

**Zustand Store** (`frontend/lib/stores/blueprintStore.ts`) + **TanStack Query** integration:
- Optimistic updates for instant UI feedback
- Automatic background sync with Supabase
- Conflict resolution with server-side timestamps
- Action history for undo/redo
- Persistence to localStorage/IndexedDB
- Performance monitoring and debugging utilities

**Key Files**:
- `frontend/lib/stores/blueprintStore.ts` - Main state container
- `frontend/lib/stores/zustandQueryIntegration.ts` - Sync layer
- `frontend/lib/stores/optimisticUpdates.ts` - UI responsiveness
- `frontend/lib/stores/conflictResolution.ts` - Data consistency

### API Route Structure

All API routes are in `frontend/app/api/` and follow Next.js 15 conventions:

**Pattern**: Each route is a `route.ts` file exporting named HTTP methods:
```typescript
export async function GET(request: Request) { }
export async function POST(request: Request) { }
```

**Critical Routes**:
- `POST /api/questionnaire/save` - Save static questionnaire (Phase 1)
- `POST /api/generate-dynamic-questions` - AI question generation (Phase 2)
- `POST /api/dynamic-questionnaire/save` - Save dynamic answers
- `POST /api/blueprints/generate` - AI blueprint generation
- `GET /api/user/usage` - Usage stats for current user

**Middleware Pattern**: Composable auth/role/limit checks in `frontend/lib/auth/`:
- Always validate authentication server-side
- Check role permissions before operations
- Track usage atomically using Supabase functions
- Return structured errors with upgrade URLs for limits

### Component Architecture

**Server Components by Default** - Use `"use client"` only when necessary:
- Client-side state (useState, useEffect, Zustand)
- Browser APIs (localStorage, window)
- Event handlers (onClick, onChange)
- Third-party client libraries (Framer Motion, etc.)

**Form Handling**: React Hook Form + Zod validation
- Schema definitions in `frontend/lib/schemas/`
- Reusable field components in `frontend/components/demo-dynamicv2/`
- 27+ input types (radio pills, sliders, scales, currency, multi-select, etc.)

**Dynamic Question Renderer** (`frontend/components/demo-dynamicv2/DynamicQuestionRenderer.tsx`):
- Reads `dynamic_questions` JSONB from database
- Renders appropriate input type per question
- Auto-save every 30 seconds
- Section-by-section navigation with progress tracking
- Accessibility-first (WCAG AA compliance)

### Subscription & Role System

**Tiers** (from free to enterprise):
- **Personal**: Explorer (free, 2 blueprints/month), Navigator, Voyager
- **Team**: Crew, Fleet, Armada (collaborative features)
- **Enterprise**: Unlimited everything, custom pricing
- **Developer**: Special role with full access for admin operations

**Implementation Areas**:
1. Database schema with usage counters (`user_profiles` table)
2. TypeScript types (`frontend/types/roles.ts` - create this)
3. API middleware enforcement (`frontend/lib/auth/roleMiddleware.ts` - create this)
4. React hooks (`frontend/lib/hooks/useUserRole.ts` - create this)
5. UI components (`frontend/components/role/FeatureGate.tsx` - create this)
6. Admin dashboard (`frontend/app/(auth)/admin/` - create this)

**Key Principle**: Never trust client-side checks. Always enforce limits server-side with middleware.

## Critical Development Patterns

### TypeScript Strictness
```typescript
// ✅ DO: Explicit types, discriminated unions
type Status = 'draft' | 'generating' | 'completed' | 'error';
function processBlueprint(id: string): Promise<Blueprint> { }

// ❌ DON'T: any, implicit types
function processBlueprint(id): Promise<any> { }
```

### Error Handling in API Routes
```typescript
// ✅ DO: Structured errors with context
return NextResponse.json(
  { error: 'Blueprint not found', code: 'NOT_FOUND' },
  { status: 404 }
);

// ✅ DO: Log errors with structured logging
import { logError } from '@/lib/logging';
logError('blueprint-generation-failed', error, { blueprintId });
```

### Supabase RLS Security
```typescript
// ✅ DO: Always use authenticated Supabase client
import { createClient } from '@/lib/supabase/server';
const supabase = await createClient();

// ❌ DON'T: Never expose service role key to client
// Service role bypasses RLS - server-side only!
```

### Tailwind Styling
```tsx
// ✅ DO: Use semantic utilities, design tokens
<button className="rounded-md bg-primary-600 px-4 py-2 text-white hover:bg-primary-700">

// ❌ DON'T: Inline styles or hardcoded values  
<button style={{ backgroundColor: '#3b82f6' }}>
```

### Testing Strategy
```bash
# Unit tests: Type guards, utilities, pure functions (95%+ coverage)
frontend/__tests__/unit/

# Integration tests: API routes, database operations (85%+ coverage)  
frontend/__tests__/integration/

# Component tests: UI components with React Testing Library
frontend/__tests__/claude/, frontend/__tests__/ollama/

# Fixtures: Shared test data
frontend/__tests__/fixtures/
```

### Migration Best Practices
1. Name sequentially: `0026_descriptive_name.sql`
2. Always include rollback/down migration
3. Test locally first: `npm run db:reset` (from root)
4. Use PostgreSQL 15+ features (JSONB, generated columns)
5. Add RLS policies for new tables
6. Document schema changes in migration comments

### AI Integration Patterns

**Question Generation**:
```typescript
// Location: frontend/lib/services/dynamicQuestionGenerationV2.ts
// Uses Claude with fallback to Ollama
// Returns validated 10-section structure
```

**Blueprint Generation**:
```typescript
// Location: frontend/lib/services/blueprintGenerationService.ts  
// Triple-fallback: Sonnet 4 → Opus 4 → Ollama
// Validates against Zod schema
// Saves both JSON and Markdown formats
```

## File Path Conventions

**Absolute Imports**: Always use `@/` prefix from `frontend/` directory
```typescript
import { createClient } from '@/lib/supabase/server';
import { Button } from '@/components/ui/button';
import type { Blueprint } from '@/types/blueprint';
```

**Path Aliases** (defined in `tsconfig.json`):
- `@/*` → `frontend/*`
- `@/components/*` → `frontend/components/*`
- `@/lib/*` → `frontend/lib/*`
- `@/types/*` → `frontend/types/*`

## Environment Variables

**Required** (in `frontend/.env.local`):
```bash
NEXT_PUBLIC_SUPABASE_URL=         # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=    # Public anon key
SUPABASE_SERVICE_ROLE_KEY=        # Server-side only, never expose
ANTHROPIC_API_KEY=                # Claude API access
```

**Optional**:
```bash
OLLAMA_BASE_URL=http://localhost:11434  # Local Ollama fallback
```

**Security**: Never commit real keys. Use `.env.example` template. Rotate exposed keys immediately.

## Important Development Notes

### Authentication Flow
1. Supabase Auth handles signup/login (email + OAuth)
2. User session stored in cookies (httpOnly, secure)
3. RLS policies enforce data isolation
4. Server components use `createClient()` from `@/lib/supabase/server`
5. Client components use `createBrowserClient()` from `@/lib/supabase/client`

### Blueprint Generation Workflow
1. User completes static questionnaire → saves to `blueprint_generator.static_answers`
2. Click "Generate Questions" → AI creates dynamic questions → saves to `dynamic_questions`
3. User completes dynamic questionnaire → saves to `dynamic_answers`
4. Click "Generate Blueprint" → AI creates blueprint → saves to `blueprint_json` + `blueprint_markdown`
5. Status field tracks progress: draft → generating → completed/error

### Usage Tracking Pattern
```typescript
// Atomic increment using Supabase function
await supabase.rpc('increment_blueprint_creation_count', { user_id });

// Check limit before allowing action
const { data: profile } = await supabase
  .from('user_profiles')
  .select('blueprint_creation_count, blueprint_creation_limit')
  .single();

if (profile.blueprint_creation_count >= profile.blueprint_creation_limit) {
  return { error: 'Limit reached', upgradeUrl: '/pricing' };
}
```

### Performance Considerations
- Static questionnaire auto-saves every 30 seconds (debounced)
- Dynamic questionnaire saves per-section (not per-field)
- Blueprint generation can take 10-30 seconds (show progress UI)
- Use React.memo for expensive re-renders
- Lazy load blueprint viewer components
- Optimize images with Next.js Image component

### Common Pitfalls to Avoid
1. **Never use `any` type** - Use `unknown` and type guards instead
2. **Server/Client boundary** - Don't import server code into client components
3. **API keys** - Never expose SUPABASE_SERVICE_ROLE_KEY or ANTHROPIC_API_KEY to client
4. **RLS bypass** - Service role client bypasses RLS, use sparingly and server-side only
5. **Hardcoded limits** - Always read from database or config, never hardcode tier limits
6. **Missing error handling** - Every API call needs try/catch and user-friendly errors
7. **Unvalidated inputs** - Always use Zod schemas for API payloads and AI responses

## Cursor Rules Reference

The `.cursor/rules/` directory contains detailed MDC files for specific domains:

**Core Development**:
- `nextjs_app.mdc` - Next.js 15, Server Components, React 19 patterns
- `typescript.mdc` - Strict typing, naming conventions
- `tailwind.mdc` - Tailwind v4, responsive design, accessibility
- `testing.mdc` - Comprehensive testing strategies

**Backend & Data**:
- `supabase.mdc` - Database patterns, RLS policies, migrations, PostgreSQL
- `api-middleware.mdc` - API routes, composable middleware, request/response handling
- `role-based-access.mdc` - Subscription tiers, limits enforcement, feature gates

**AI & Features**:
- `claude-blueprint-generation.mdc` - Claude API integration
- `perplexity-dynamic-questionnaire.mdc` - Question generation system
- `dynamic_questionnaire_alignment.mdc` - Implementation patterns

**Security & Quality**:
- `security_secrets.mdc` - Secrets management, environment config
- `eslint_quality.mdc` - Code quality standards

**Workflow**:
- `prd_driven_development.mdc` - PRD-first workflow, Taskmaster integration

Read relevant `.mdc` files when working in their domain. They contain detailed DO/DON'T examples and implementation patterns.

## Key Architectural Decisions

### Why Triple-Fallback AI?
- **Reliability**: If Claude API is down, app still works via Ollama
- **Cost Control**: Use cheaper Sonnet 4 primarily, Opus 4 for edge cases
- **Quality**: Claude Opus 4 handles complex nuance, Ollama is backup

### Why Zustand + TanStack Query?
- **Zustand**: Lightweight, no boilerplate, easy TypeScript integration
- **TanStack Query**: Best-in-class server state management, caching, background sync
- **Together**: Local state (Zustand) + server state (Query) separation of concerns

### Why Next.js App Router?
- **Server Components**: Reduce client bundle, better performance
- **Streaming**: Progressive rendering for better UX
- **API Routes**: Integrated backend, no separate server needed
- **React 19**: Latest features (use actions, async components, etc.)

### Why Supabase?
- **PostgreSQL**: Powerful relational database with JSON support (JSONB)
- **RLS**: Row-level security enforced at database layer
- **Realtime**: Built-in subscriptions for live updates
- **Auth**: Complete auth system out of the box
- **Hosted**: No infrastructure management

## PRD-Driven Development

All features align with PRDs in `docs/prds/`. Current focus: User Roles & Subscriptions system.

**Workflow**:
1. Read PRD in `docs/prds/`
2. Check tasks in `.taskmaster/tasks/tasks.json`
3. Reference relevant `.cursor/rules/*.mdc` files
4. Implement with tests
5. Update documentation

**Task Management**: Use Taskmaster CLI for task tracking (`npm run taskmaster` from root).

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
