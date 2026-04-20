# PRD: Vercel AI SDK Migration for SmartSlate Polaris v3

**Document Status**: Draft
**Version**: 1.0
**Last Updated**: 2025-10-25
**Author**: AI Architect
**Taskmaster Compatible**: ✓

---

## Executive Summary

Migrate SmartSlate Polaris v3's AI integration from custom Claude/Perplexity/Ollama clients to the Vercel AI SDK 5.0, leveraging Anthropic Sonnet 4.5 for dynamic questionnaire generation and Perplexity Sonar Deep Research model for final blueprint generation. This migration will provide streaming capabilities, unified error handling, better TypeScript support, and long-term maintainability while preserving all existing functionality.

---

## Table of Contents

1. [Background & Context](#background--context)
2. [Current Architecture Analysis](#current-architecture-analysis)
3. [Migration Objectives](#migration-objectives)
4. [Technical Specification](#technical-specification)
5. [Implementation Plan](#implementation-plan)
6. [Risk Assessment](#risk-assessment)
7. [Success Criteria](#success-criteria)
8. [Appendix](#appendix)

---

## Background & Context

### Current State

**SmartSlate Polaris v3** uses a custom triple-fallback AI architecture:

**Dynamic Questionnaire Generation**:
- **Primary**: Perplexity Sonar Pro (`perplexityQuestionService.ts`)
- **Fallback**: Claude Sonnet 4 (`dynamicQuestionGenerationV2.ts`)
- **Emergency**: Ollama Qwen3:32b (local, via `OllamaClient`)

**Blueprint Generation**:
- **Primary**: Claude Sonnet 4 (`blueprintGenerationService.ts`)
- **Fallback**: Claude Opus 4
- **Emergency**: Ollama Qwen3:32b (local)

### Problems with Current Implementation

1. **Custom HTTP Clients**: Manual `fetch()` calls with custom retry logic, timeout handling, and error management
2. **No Streaming**: Static responses only, limiting UX for long-running operations (13+ minutes)
3. **Inconsistent Error Handling**: Different error patterns across Claude/Perplexity/Ollama
4. **Manual JSON Repair**: Complex `repairJSON()` and `repairTruncatedJSON()` functions to handle malformed responses
5. **Duplicate Code**: Similar prompt building, retry logic, and validation across multiple services
6. **Type Safety**: Manual typing of API responses without SDK guarantees
7. **Maintenance Burden**: Three separate client implementations to maintain

### Why Migrate to Vercel AI SDK?

**Vercel AI SDK 5.0** provides:

✅ **Unified Interface**: Single API for multiple providers (Anthropic, Perplexity, OpenAI, etc.)
✅ **Streaming Support**: Native `streamText()` and `streamObject()` for real-time UX
✅ **Type Safety**: Full TypeScript support with Zod schema integration
✅ **Error Handling**: Standardized error types and automatic retry logic
✅ **Token Management**: Built-in usage tracking and cost monitoring
✅ **Tool Calling**: Native support for function calling and structured outputs
✅ **Middleware**: Request/response interceptors for logging and debugging
✅ **Maintainability**: Offload SDK maintenance to Vercel's team

---

## Current Architecture Analysis

### Existing Services Map

```
┌─────────────────────────────────────────────────────────────┐
│         DYNAMIC QUESTIONNAIRE GENERATION FLOW               │
└─────────────────────────────────────────────────────────────┘

API Route: /api/generate-dynamic-questions/route.ts
    ↓
Service: dynamicQuestionGenerationV2.ts
    ↓
Providers (with fallback):
    1. Perplexity Sonar Pro (perplexityQuestionService.ts)
       - Custom fetch() with manual retry
       - 14-minute timeout
       - JSON extraction & validation
    ↓ FALLBACK ON ERROR
    2. Claude Sonnet 4 (via ClaudeClient)
       - Custom HTTP client (claude/client.ts)
       - Exponential backoff retry (3 attempts)
       - 2-minute timeout
    ↓ FALLBACK ON ERROR
    3. Ollama Qwen3:32b (OllamaClient)
       - Local model, no API key required
       - Memory-aware fallback to 14b model
       - 14-minute timeout


┌─────────────────────────────────────────────────────────────┐
│            BLUEPRINT GENERATION FLOW                         │
└─────────────────────────────────────────────────────────────┘

API Route: /api/blueprints/generate/route.ts
    ↓
Service: blueprintGenerationService.ts
    ↓
Providers (with intelligent fallback):
    1. Claude Sonnet 4 (primary, cost-effective)
       - Uses ClaudeClient with retry logic
       - 12,000 max tokens
       - Fallback trigger: shouldFallbackToOpus()
    ↓ FALLBACK ON SPECIFIC ERRORS
    2. Claude Opus 4 (complex scenarios)
       - Same ClaudeClient, different model
       - 16,000 max tokens
       - Fallback trigger: All Claude errors
    ↓ EMERGENCY FALLBACK
    3. Ollama Qwen3:32b (local, offline)
       - OllamaClient with blueprint-specific prompts
       - No API costs
```

### Critical Files to Migrate

| File Path | Purpose | Lines of Code | Complexity |
|-----------|---------|---------------|------------|
| `frontend/lib/services/dynamicQuestionGenerationV2.ts` | V2 question generation with Perplexity→Claude fallback | 678 | High |
| `frontend/lib/services/perplexityQuestionService.ts` | Perplexity API integration for questions | 922 | High |
| `frontend/lib/services/blueprintGenerationService.ts` | Triple-fallback blueprint orchestrator | 325 | Medium |
| `frontend/lib/claude/client.ts` | Custom Claude HTTP client with retry logic | 238 | Medium |
| `frontend/lib/claude/fallback.ts` | Fallback decision logic | 179 | Low |
| `frontend/lib/claude/validation.ts` | Response validation & normalization | 258 | Medium |
| `frontend/lib/claude/prompts.ts` | Blueprint prompt templates | 463 | Low |
| `frontend/lib/ollama/client.ts` | Ollama integration with memory-aware fallback | 441 | Medium |
| `frontend/app/api/generate-dynamic-questions/route.ts` | Dynamic questions API endpoint | 375 | Medium |
| `frontend/app/api/blueprints/generate/route.ts` | Blueprint generation API endpoint | 416 | Medium |

**Total**: ~4,295 lines of custom AI integration code to replace/refactor

### Data Flow Analysis

**Input**: Static Questionnaire Answers (V2.0 3-section format)
```typescript
{
  section_1_role_experience: { current_role, years_in_role, ... },
  section_2_organization: { organization_name, industry_sector, ... },
  section_3_learning_gap: { learning_gap_description, total_learners_range, ... }
}
```

**Output**: Dynamic Questions (10 sections, 50-70 questions)
```typescript
{
  sections: [
    {
      id: "s1",
      title: "Learning Objectives & Outcomes",
      questions: [
        { id: "q1_s1", type: "radio_pills", label: "...", options: [...] },
        ...
      ]
    },
    ...
  ],
  metadata: { generatedAt, model, duration }
}
```

**Input**: Static + Dynamic Answers
```typescript
{
  staticAnswers: { section_1_role_experience, section_2_organization, section_3_learning_gap },
  dynamicAnswers: { q1_s1: "value", q2_s1: [...], ... }
}
```

**Output**: Learning Blueprint (JSON + Markdown)
```typescript
{
  metadata: { title, organization, role, generated_at, version, model },
  executive_summary: { content, displayType: "markdown" },
  learning_objectives: { objectives: [...], displayType: "infographic" },
  target_audience: { demographics, learning_preferences, displayType: "infographic" },
  content_outline: { modules: [...], displayType: "timeline" },
  instructional_strategy: { overview, modalities, displayType: "markdown" },
  resources: { human_resources, tools_and_platforms, budget, displayType: "table" },
  assessment_strategy: { kpis, evaluation_methods, displayType: "infographic" },
  implementation_timeline: { phases, critical_path, displayType: "timeline" },
  risk_mitigation: { risks, contingency_plans, displayType: "table" },
  success_metrics: { metrics, reporting_cadence, displayType: "infographic" },
  sustainability_plan: { content, maintenance_schedule, displayType: "markdown" }
}
```

### Prompt Engineering Patterns

**System Prompts**: Loaded from files or constants
- `lib/prompts/dynamic-questions-system-v2.txt` (for questions)
- `BLUEPRINT_SYSTEM_PROMPT` constant (for blueprints)

**User Prompts**: Template-based with variable substitution
- `buildUserPromptV2()` - Injects V2.0 static answers into template
- `buildBlueprintPrompt()` - Combines static + dynamic answers with structured instructions

**Prompt Characteristics**:
- **Length**: 3,000-8,000+ characters
- **Format**: Markdown with section headers, tables, examples
- **Context**: Comprehensive organizational, learner, and learning gap data
- **Instructions**: Strict JSON output requirements, schema definitions, validation rules
- **Test Mode Detection**: Generates realistic sample data when placeholder text detected

---

## Migration Objectives

### Primary Goals

1. **Replace Custom Clients**: Migrate from custom HTTP clients to Vercel AI SDK providers
2. **Add Streaming**: Implement progressive rendering for long-running generations
3. **Improve Error Handling**: Standardize error types and recovery strategies
4. **Maintain Functionality**: Preserve all existing features, fallbacks, and user experience
5. **Enhance Type Safety**: Leverage Zod schemas with AI SDK for validation
6. **Simplify Codebase**: Reduce custom code by ~60% (from 4,295 to ~1,700 LOC)

### Non-Goals

- ❌ Change database schema or API contracts
- ❌ Modify UI components or state management
- ❌ Alter prompt engineering or content strategy
- ❌ Replace Ollama local fallback (keep for offline/cost scenarios)
- ❌ Change subscription tier limits or usage tracking

---

## Technical Specification

### New Architecture Design

```
┌─────────────────────────────────────────────────────────────┐
│   VERCEL AI SDK UNIFIED ARCHITECTURE (POST-MIGRATION)       │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────┐
│  API Routes (Next.js 15 App Router)   │
│  - /api/generate-dynamic-questions    │
│  - /api/blueprints/generate           │
└────────────────┬───────────────────────┘
                 │
                 ▼
┌────────────────────────────────────────┐
│  Orchestration Services               │
│  - dynamicQuestionGenerationService   │
│  - blueprintGenerationService         │
│  (NEW: Vercel AI SDK based)           │
└────────────────┬───────────────────────┘
                 │
                 ├─────────────────────────┐
                 │                         │
                 ▼                         ▼
┌───────────────────────────┐  ┌─────────────────────┐
│  Vercel AI SDK Providers  │  │  Ollama Fallback    │
│  ----------------------   │  │  ----------------   │
│  • Anthropic Provider     │  │  • Local qwen3:32b  │
│    (Sonnet 4.5)          │  │  • No API costs     │
│  • Custom Perplexity      │  │  • Emergency only   │
│    Provider (Sonar Deep)  │  │                     │
└───────────────────────────┘  └─────────────────────┘
         │
         ▼
┌────────────────────────────────────────┐
│  Shared Utilities                     │
│  - promptBuilder.ts (unified)         │
│  - schemaValidation.ts (Zod)          │
│  - errorHandler.ts (standardized)     │
│  - streamingHelpers.ts (new)          │
└────────────────────────────────────────┘
```

### Technology Stack

| Component | Current | New (Post-Migration) |
|-----------|---------|----------------------|
| **Dynamic Questions Primary** | Perplexity Sonar Pro (custom fetch) | **Anthropic Sonnet 4.5** (AI SDK) |
| **Dynamic Questions Fallback** | Claude Sonnet 4 (ClaudeClient) | Ollama (unchanged) |
| **Blueprint Primary** | Claude Sonnet 4 (ClaudeClient) | **Perplexity Sonar Deep Research** (AI SDK) |
| **Blueprint Fallback** | Claude Opus 4 → Ollama | Ollama (unchanged) |
| **HTTP Client** | Custom `fetch()` wrappers | Vercel AI SDK (built-in) |
| **Streaming** | None | `streamObject()` + React Server Components |
| **Schema Validation** | Manual Zod + custom repair | AI SDK `experimental_output` with Zod |
| **Error Handling** | Custom `ClaudeApiError`, etc. | AI SDK standard errors + custom wrapper |
| **Retry Logic** | Custom exponential backoff | AI SDK built-in (configurable) |

### Dependencies

**Install New Packages**:
```json
{
  "dependencies": {
    "ai": "5.0.0",                      // ✅ Already installed
    "@ai-sdk/anthropic": "1.0.0",       // ✅ Already installed
    "ollama-ai-provider": "0.15.2",     // ✅ Already installed
    "zod": "3.25.76"                    // ✅ Already installed
  }
}
```

**No new dependencies required!** All Vercel AI SDK packages are already in `package.json`.

### File Structure (New)

```
frontend/
├── lib/
│   ├── ai/                                    # NEW: Unified AI integration
│   │   ├── providers/
│   │   │   ├── anthropicProvider.ts          # Sonnet 4.5 setup
│   │   │   ├── perplexityProvider.ts         # Custom Perplexity provider
│   │   │   └── ollamaProvider.ts             # Ollama fallback (wrap existing)
│   │   ├── services/
│   │   │   ├── questionGenerationService.ts  # NEW: Replaces dynamicQuestionGenerationV2
│   │   │   └── blueprintGenerationService.ts # NEW: Replaces existing service
│   │   ├── prompts/
│   │   │   ├── questionPrompts.ts            # Centralized question prompts
│   │   │   └── blueprintPrompts.ts           # Centralized blueprint prompts
│   │   ├── schemas/
│   │   │   ├── questionSchema.ts             # Zod schemas for questions
│   │   │   └── blueprintSchema.ts            # Zod schemas for blueprints
│   │   ├── utils/
│   │   │   ├── streamingHelpers.ts           # Server-sent events utilities
│   │   │   ├── errorHandler.ts               # Unified error handling
│   │   │   └── usageTracking.ts              # Token/cost tracking
│   │   └── config.ts                         # AI provider configuration
│   ├── claude/                                # DEPRECATED: Mark for removal
│   ├── ollama/                                # KEEP: Emergency fallback
│   └── services/
│       ├── perplexityQuestionService.ts      # DEPRECATED: Remove after migration
│       └── dynamicQuestionGenerationV2.ts    # DEPRECATED: Remove after migration
├── app/
│   └── api/
│       ├── generate-dynamic-questions/
│       │   └── route.ts                      # UPDATE: Use new service + streaming
│       └── blueprints/
│           └── generate/
│               └── route.ts                  # UPDATE: Use new service + streaming
└── components/
    └── blueprint/
        └── GenerationProgress.tsx            # NEW: Streaming UI component
```

---

## Implementation Plan

### Phase 1: Foundation Setup (Week 1)

**Objective**: Set up Vercel AI SDK providers and core utilities without disrupting existing functionality.

#### Task 1.1: Create Anthropic Provider Configuration
**File**: `frontend/lib/ai/providers/anthropicProvider.ts`

```typescript
import { anthropic } from '@ai-sdk/anthropic';
import type { LanguageModelV1 } from '@ai-sdk/provider';

export const ANTHROPIC_MODELS = {
  SONNET_45: 'claude-sonnet-4.5-20250514',
  SONNET_4: 'claude-sonnet-4-20250514',
  OPUS_4: 'claude-opus-4-20250514',
} as const;

export function getAnthropicModel(
  model: keyof typeof ANTHROPIC_MODELS = 'SONNET_45'
): LanguageModelV1 {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable not set');
  }

  return anthropic(ANTHROPIC_MODELS[model], {
    apiKey,
  });
}

export const questionGenerationModel = getAnthropicModel('SONNET_45');
```

**Acceptance Criteria**:
- ✅ Anthropic provider instantiates successfully
- ✅ Environment variable validation works
- ✅ Model selection is type-safe
- ✅ Unit tests pass for model initialization

---

#### Task 1.2: Create Custom Perplexity Provider
**File**: `frontend/lib/ai/providers/perplexityProvider.ts`

```typescript
import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV1 } from '@ai-sdk/provider';

export const PERPLEXITY_MODELS = {
  SONAR_PRO: 'sonar-pro',
  SONAR_DEEP_RESEARCH: 'sonar-deep-research',
} as const;

/**
 * Perplexity uses OpenAI-compatible API format
 * We create a custom provider using AI SDK's OpenAI adapter
 */
export function getPerplexityModel(
  model: keyof typeof PERPLEXITY_MODELS = 'SONAR_DEEP_RESEARCH'
): LanguageModelV1 {
  const apiKey = process.env.PERPLEXITY_API_KEY;

  if (!apiKey) {
    throw new Error('PERPLEXITY_API_KEY environment variable not set');
  }

  const perplexity = createOpenAI({
    apiKey,
    baseURL: 'https://api.perplexity.ai',
  });

  return perplexity(PERPLEXITY_MODELS[model]);
}

export const blueprintGenerationModel = getPerplexityModel('SONAR_DEEP_RESEARCH');
```

**Acceptance Criteria**:
- ✅ Perplexity provider works with OpenAI-compatible adapter
- ✅ Model selection is configurable
- ✅ Base URL points to Perplexity API
- ✅ Error handling for missing API key

---

#### Task 1.3: Wrap Existing Ollama Client
**File**: `frontend/lib/ai/providers/ollamaProvider.ts`

```typescript
import { OllamaClient } from '@/lib/ollama/client';
import type { GenerationInput, DynamicQuestions, FullBlueprint } from '@/lib/ollama/schema';

/**
 * Wrapper for existing Ollama client to maintain compatibility
 * This is the emergency fallback when cloud providers fail
 */
export class OllamaProviderWrapper {
  private client: OllamaClient;

  constructor() {
    this.client = new OllamaClient({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
      model: 'qwen3:32b',
      fallbackModel: 'qwen3:14b',
    });
  }

  async generateQuestions(input: GenerationInput): Promise<DynamicQuestions> {
    return this.client.generateQuestions(input);
  }

  async generateBlueprint(
    systemPrompt: string,
    userPrompt: string
  ): Promise<FullBlueprint> {
    return this.client.generateBlueprint(systemPrompt, userPrompt);
  }

  async health(): Promise<boolean> {
    return this.client.health();
  }
}

export const ollamaProvider = new OllamaProviderWrapper();
```

**Acceptance Criteria**:
- ✅ Wraps existing `OllamaClient` without modifications
- ✅ Maintains all existing Ollama functionality
- ✅ Provides consistent interface for orchestration layer

---

#### Task 1.4: Create Unified Configuration
**File**: `frontend/lib/ai/config.ts`

```typescript
export const AI_CONFIG = {
  // Provider selection
  providers: {
    questions: {
      primary: 'anthropic',     // Sonnet 4.5
      fallback: 'ollama',        // Local Qwen3
    },
    blueprints: {
      primary: 'perplexity',     // Sonar Deep Research
      fallback: 'ollama',        // Local Qwen3
    },
  },

  // Model configurations
  anthropic: {
    model: 'claude-sonnet-4.5-20250514',
    temperature: 0.7,
    maxTokens: 32000,
  },

  perplexity: {
    model: 'sonar-deep-research',
    temperature: 0.1,
    maxTokens: 16000,
  },

  ollama: {
    model: 'qwen3:32b',
    fallbackModel: 'qwen3:14b',
    temperature: 0.7,
    maxTokens: 32000,
  },

  // Retry & timeout
  retry: {
    maxAttempts: 3,
    initialDelayMs: 1000,
    maxDelayMs: 10000,
    backoffFactor: 2,
  },

  timeout: {
    questionsMs: 840000,  // 14 minutes
    blueprintsMs: 840000, // 14 minutes
  },

  // Streaming
  streaming: {
    enabled: true,
    chunkSize: 512, // bytes
  },
} as const;

export type AIConfig = typeof AI_CONFIG;
```

**Acceptance Criteria**:
- ✅ Centralized configuration for all providers
- ✅ Type-safe access to config values
- ✅ Easy to override for testing
- ✅ Documented with comments

---

### Phase 2: Schema Migration (Week 1-2)

**Objective**: Migrate Zod schemas to work with AI SDK's `experimental_output` feature.

#### Task 2.1: Create Question Generation Schema
**File**: `frontend/lib/ai/schemas/questionSchema.ts`

```typescript
import { z } from 'zod';

// Question input types (already exist in codebase)
export const questionInputTypes = [
  'radio_pills',
  'radio_cards',
  'checkbox_pills',
  'checkbox_cards',
  'scale',
  'enhanced_scale',
  'labeled_slider',
  'toggle_switch',
  'text',
  'textarea',
  'currency',
  'number_spinner',
  'number',
  'date',
  'email',
  'url',
] as const;

// Option schema for selection-based inputs
const optionSchema = z.object({
  value: z.string(),
  label: z.string(),
  icon: z.string().optional(),
  description: z.string().optional(),
});

// Config schemas for specialized inputs
const scaleConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  minLabel: z.string(),
  maxLabel: z.string(),
  step: z.number(),
  labels: z.array(z.string()).optional(),
});

const sliderConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number(),
  unit: z.string().optional(),
  markers: z.array(z.number()).optional(),
});

const numberConfigSchema = z.object({
  min: z.number(),
  max: z.number(),
  step: z.number(),
});

// Question schema
export const questionSchema = z.object({
  id: z.string().regex(/^q\d+_s\d+$/), // e.g., q1_s1
  label: z.string().min(1),
  type: z.enum(questionInputTypes),
  required: z.boolean(),
  helpText: z.string().optional(),
  placeholder: z.string().optional(),
  options: z.array(optionSchema).optional(),
  scaleConfig: scaleConfigSchema.optional(),
  sliderConfig: sliderConfigSchema.optional(),
  numberConfig: numberConfigSchema.optional(),
  currencySymbol: z.string().optional(),
  min: z.number().optional(),
  max: z.number().optional(),
  rows: z.number().optional(),
  maxLength: z.number().optional(),
  maxSelections: z.number().optional(),
  validation: z.array(z.any()).optional(),
  metadata: z.record(z.any()).optional(),
});

// Section schema
export const sectionSchema = z.object({
  id: z.string().regex(/^s\d+$/), // e.g., s1
  title: z.string().min(1),
  description: z.string(),
  order: z.number().int().positive(),
  questions: z.array(questionSchema).min(5).max(7), // 5-7 questions per section
});

// Complete response schema (10 sections, 50-70 questions total)
export const dynamicQuestionsResponseSchema = z.object({
  sections: z.array(sectionSchema).length(10), // Exactly 10 sections
  metadata: z.object({
    generatedAt: z.string(),
    model: z.string(),
    context: z.string().optional(),
    researchCitations: z.array(z.string()).optional(),
    duration: z.number().optional(),
  }),
});

export type Question = z.infer<typeof questionSchema>;
export type Section = z.infer<typeof sectionSchema>;
export type DynamicQuestionsResponse = z.infer<typeof dynamicQuestionsResponseSchema>;
```

**Acceptance Criteria**:
- ✅ Schema validates all 27+ question input types
- ✅ Enforces structural requirements (10 sections, 5-7 questions each)
- ✅ Compatible with AI SDK `experimental_output`
- ✅ Type exports work with existing codebase

---

#### Task 2.2: Create Blueprint Generation Schema
**File**: `frontend/lib/ai/schemas/blueprintSchema.ts`

```typescript
import { z } from 'zod';

// Display types for blueprint sections
const displayTypeSchema = z.enum(['infographic', 'timeline', 'chart', 'table', 'markdown']);

// Metadata section
const metadataSchema = z.object({
  title: z.string(),
  organization: z.string(),
  role: z.string(),
  generated_at: z.string(),
  version: z.string(),
  model: z.string(),
});

// Executive summary
const executiveSummarySchema = z.object({
  content: z.string(),
  displayType: displayTypeSchema,
});

// Learning objectives
const objectiveSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  metric: z.string(),
  baseline: z.string(),
  target: z.string(),
  due_date: z.string(),
});

const learningObjectivesSchema = z.object({
  objectives: z.array(objectiveSchema),
  displayType: displayTypeSchema,
  chartConfig: z.object({
    type: z.string(),
    metrics: z.array(z.string()),
  }).optional(),
});

// Target audience
const targetAudienceSchema = z.object({
  demographics: z.object({
    roles: z.array(z.string()),
    experience_levels: z.array(z.string()),
    department_distribution: z.array(z.object({
      department: z.string(),
      percentage: z.number(),
    })),
  }),
  learning_preferences: z.object({
    modalities: z.array(z.object({
      type: z.string(),
      percentage: z.number(),
    })),
  }),
  displayType: displayTypeSchema,
});

// Content outline
const moduleSchema = z.object({
  module_id: z.string(),
  title: z.string(),
  description: z.string(),
  topics: z.array(z.string()),
  duration: z.string(),
  delivery_method: z.string(),
  learning_activities: z.array(z.object({
    activity: z.string(),
    type: z.string(),
    duration: z.string(),
  })),
  assessment: z.object({
    type: z.string(),
    description: z.string(),
  }),
});

const contentOutlineSchema = z.object({
  modules: z.array(moduleSchema),
  displayType: displayTypeSchema,
});

// Instructional strategy
const instructionalStrategySchema = z.object({
  overview: z.string(),
  modalities: z.array(z.object({
    type: z.string(),
    rationale: z.string(),
    allocation_percent: z.number(),
    tools: z.array(z.string()),
  })),
  cohort_model: z.string(),
  accessibility_considerations: z.array(z.string()),
  displayType: displayTypeSchema,
});

// Resources
const resourcesSchema = z.object({
  human_resources: z.array(z.object({
    role: z.string(),
    fte: z.number(),
    duration: z.string(),
  })),
  tools_and_platforms: z.array(z.object({
    category: z.string(),
    name: z.string(),
    cost_type: z.string(),
  })),
  budget: z.object({
    currency: z.string(),
    items: z.array(z.object({
      item: z.string(),
      amount: z.number(),
    })),
    total: z.number(),
  }),
  displayType: displayTypeSchema,
});

// Assessment strategy
const assessmentStrategySchema = z.object({
  overview: z.string(),
  kpis: z.array(z.object({
    metric: z.string(),
    target: z.string(),
    measurement_method: z.string(),
    frequency: z.string(),
  })),
  evaluation_methods: z.array(z.object({
    method: z.string(),
    timing: z.string(),
    weight: z.string(),
  })),
  displayType: displayTypeSchema,
  chartConfig: z.object({
    type: z.string(),
    metric: z.string(),
  }).optional(),
});

// Implementation timeline
const implementationTimelineSchema = z.object({
  phases: z.array(z.object({
    phase: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    milestones: z.array(z.string()),
    dependencies: z.array(z.string()),
  })),
  critical_path: z.array(z.string()),
  displayType: displayTypeSchema,
});

// Risk mitigation
const riskMitigationSchema = z.object({
  risks: z.array(z.object({
    risk: z.string(),
    probability: z.string(),
    impact: z.string(),
    mitigation_strategy: z.string(),
  })),
  contingency_plans: z.array(z.string()),
  displayType: displayTypeSchema,
});

// Success metrics
const successMetricsSchema = z.object({
  metrics: z.array(z.object({
    metric: z.string(),
    current_baseline: z.string(),
    target: z.string(),
    measurement_method: z.string(),
    timeline: z.string(),
  })),
  reporting_cadence: z.string(),
  dashboard_requirements: z.array(z.string()),
  displayType: displayTypeSchema,
});

// Sustainability plan
const sustainabilityPlanSchema = z.object({
  content: z.string(),
  maintenance_schedule: z.object({
    review_frequency: z.string(),
    update_triggers: z.array(z.string()),
  }),
  scaling_considerations: z.array(z.string()),
  displayType: displayTypeSchema,
});

// Complete blueprint schema
export const blueprintResponseSchema = z.object({
  metadata: metadataSchema,
  executive_summary: executiveSummarySchema,
  learning_objectives: learningObjectivesSchema,
  target_audience: targetAudienceSchema,
  content_outline: contentOutlineSchema,
  instructional_strategy: instructionalStrategySchema,
  resources: resourcesSchema,
  assessment_strategy: assessmentStrategySchema,
  implementation_timeline: implementationTimelineSchema,
  risk_mitigation: riskMitigationSchema,
  success_metrics: successMetricsSchema,
  sustainability_plan: sustainabilityPlanSchema,
});

export type Blueprint = z.infer<typeof blueprintResponseSchema>;
```

**Acceptance Criteria**:
- ✅ Schema validates all 11 blueprint sections
- ✅ Enforces `displayType` for all sections except metadata
- ✅ Compatible with AI SDK `experimental_output`
- ✅ Matches existing blueprint structure exactly

---

### Phase 3: Service Layer Rewrite (Week 2-3)

**Objective**: Rebuild generation services using Vercel AI SDK with streaming support.

#### Task 3.1: Question Generation Service
**File**: `frontend/lib/ai/services/questionGenerationService.ts`

```typescript
import { streamObject } from 'ai';
import { questionGenerationModel } from '../providers/anthropicProvider';
import { ollamaProvider } from '../providers/ollamaProvider';
import { dynamicQuestionsResponseSchema } from '../schemas/questionSchema';
import type { DynamicQuestionsResponse } from '../schemas/questionSchema';
import { buildQuestionPrompt } from '../prompts/questionPrompts';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('question-generation');

export interface QuestionGenerationContext {
  blueprintId: string;
  userId: string;
  staticAnswers: Record<string, any>;
}

export interface QuestionGenerationResult {
  success: boolean;
  data?: DynamicQuestionsResponse;
  stream?: ReadableStream;
  error?: string;
  metadata: {
    provider: 'anthropic' | 'ollama';
    duration: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

/**
 * Generate dynamic questions using Anthropic Sonnet 4.5 with streaming
 * Falls back to Ollama on failure
 */
export async function generateDynamicQuestions(
  context: QuestionGenerationContext,
  streaming: boolean = false
): Promise<QuestionGenerationResult> {
  const startTime = Date.now();

  logger.info('question-generation.start', 'Starting question generation', {
    blueprintId: context.blueprintId,
    provider: 'anthropic',
    streaming,
  });

  try {
    const { systemPrompt, userPrompt } = buildQuestionPrompt(context.staticAnswers);

    // Try Anthropic Sonnet 4.5 (primary)
    if (streaming) {
      // Streaming mode
      const result = streamObject({
        model: questionGenerationModel,
        schema: dynamicQuestionsResponseSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxTokens: 32000,
        onFinish: ({ usage }) => {
          logger.info('question-generation.complete', 'Generation completed', {
            blueprintId: context.blueprintId,
            provider: 'anthropic',
            tokenUsage: usage,
          });
        },
      });

      return {
        success: true,
        stream: result.textStream,
        metadata: {
          provider: 'anthropic',
          duration: Date.now() - startTime,
        },
      };
    } else {
      // Non-streaming mode
      const { object, usage } = await streamObject({
        model: questionGenerationModel,
        schema: dynamicQuestionsResponseSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.7,
        maxTokens: 32000,
      }).then(async (result) => {
        const object = await result.object; // Wait for completion
        return { object, usage: result.usage };
      });

      const duration = Date.now() - startTime;

      logger.info('question-generation.success', 'Anthropic generation successful', {
        blueprintId: context.blueprintId,
        sectionCount: object.sections.length,
        questionCount: object.sections.reduce((sum, s) => sum + s.questions.length, 0),
        duration,
        tokenUsage: usage,
      });

      return {
        success: true,
        data: object,
        metadata: {
          provider: 'anthropic',
          duration,
          tokenUsage: {
            promptTokens: usage?.promptTokens ?? 0,
            completionTokens: usage?.completionTokens ?? 0,
            totalTokens: usage?.totalTokens ?? 0,
          },
        },
      };
    }
  } catch (anthropicError) {
    logger.error('question-generation.anthropic-failed', 'Anthropic failed, falling back to Ollama', {
      blueprintId: context.blueprintId,
      error: anthropicError instanceof Error ? anthropicError.message : String(anthropicError),
    });

    // Fallback to Ollama
    try {
      const ollamaInput = {
        role: 'Learning Professional',
        organization: context.staticAnswers.section_2_organization?.organization_name || 'Organization',
        learningGap: context.staticAnswers.section_3_learning_gap?.learning_gap_description || 'Not specified',
        resources: 'Standard resources',
        constraints: 'No specific constraints',
        numSections: 10,
        questionsPerSection: 7,
      };

      const result = await ollamaProvider.generateQuestions(ollamaInput);
      const duration = Date.now() - startTime;

      logger.info('question-generation.ollama-success', 'Ollama fallback successful', {
        blueprintId: context.blueprintId,
        duration,
      });

      return {
        success: true,
        data: result as any, // Type assertion - Ollama returns compatible format
        metadata: {
          provider: 'ollama',
          duration,
        },
      };
    } catch (ollamaError) {
      const duration = Date.now() - startTime;

      logger.error('question-generation.all-failed', 'All providers failed', {
        blueprintId: context.blueprintId,
        duration,
        anthropicError: anthropicError instanceof Error ? anthropicError.message : String(anthropicError),
        ollamaError: ollamaError instanceof Error ? ollamaError.message : String(ollamaError),
      });

      return {
        success: false,
        error: 'Question generation failed on all providers',
        metadata: {
          provider: 'ollama',
          duration,
        },
      };
    }
  }
}
```

**Acceptance Criteria**:
- ✅ Uses Vercel AI SDK `streamObject()` for structured outputs
- ✅ Supports both streaming and non-streaming modes
- ✅ Falls back to Ollama on Anthropic failure
- ✅ Logs telemetry (tokens, duration, provider)
- ✅ Returns type-safe results with Zod validation

---

#### Task 3.2: Blueprint Generation Service
**File**: `frontend/lib/ai/services/blueprintGenerationService.ts`

```typescript
import { streamObject } from 'ai';
import { blueprintGenerationModel } from '../providers/perplexityProvider';
import { ollamaProvider } from '../providers/ollamaProvider';
import { blueprintResponseSchema } from '../schemas/blueprintSchema';
import type { Blueprint } from '../schemas/blueprintSchema';
import { buildBlueprintPrompt } from '../prompts/blueprintPrompts';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('blueprint-generation');

export interface BlueprintGenerationContext {
  blueprintId: string;
  userId: string;
  staticAnswers: Record<string, any>;
  dynamicAnswers: Record<string, any>;
  organization: string;
  role: string;
  industry: string;
  learningObjectives: string[];
}

export interface BlueprintGenerationResult {
  success: boolean;
  data?: Blueprint;
  stream?: ReadableStream;
  error?: string;
  metadata: {
    provider: 'perplexity' | 'ollama';
    duration: number;
    tokenUsage?: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  };
}

/**
 * Generate learning blueprint using Perplexity Sonar Deep Research with streaming
 * Falls back to Ollama on failure
 */
export async function generateBlueprint(
  context: BlueprintGenerationContext,
  streaming: boolean = false
): Promise<BlueprintGenerationResult> {
  const startTime = Date.now();

  logger.info('blueprint-generation.start', 'Starting blueprint generation', {
    blueprintId: context.blueprintId,
    provider: 'perplexity',
    streaming,
  });

  try {
    const { systemPrompt, userPrompt } = buildBlueprintPrompt(context);

    // Try Perplexity Sonar Deep Research (primary)
    if (streaming) {
      // Streaming mode
      const result = streamObject({
        model: blueprintGenerationModel,
        schema: blueprintResponseSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1,
        maxTokens: 16000,
        onFinish: ({ usage }) => {
          logger.info('blueprint-generation.complete', 'Generation completed', {
            blueprintId: context.blueprintId,
            provider: 'perplexity',
            tokenUsage: usage,
          });
        },
      });

      return {
        success: true,
        stream: result.textStream,
        metadata: {
          provider: 'perplexity',
          duration: Date.now() - startTime,
        },
      };
    } else {
      // Non-streaming mode
      const { object, usage } = await streamObject({
        model: blueprintGenerationModel,
        schema: blueprintResponseSchema,
        system: systemPrompt,
        prompt: userPrompt,
        temperature: 0.1,
        maxTokens: 16000,
      }).then(async (result) => {
        const object = await result.object; // Wait for completion
        return { object, usage: result.usage };
      });

      const duration = Date.now() - startTime;

      logger.info('blueprint-generation.success', 'Perplexity generation successful', {
        blueprintId: context.blueprintId,
        duration,
        tokenUsage: usage,
      });

      return {
        success: true,
        data: object,
        metadata: {
          provider: 'perplexity',
          duration,
          tokenUsage: {
            promptTokens: usage?.promptTokens ?? 0,
            completionTokens: usage?.completionTokens ?? 0,
            totalTokens: usage?.totalTokens ?? 0,
          },
        },
      };
    }
  } catch (perplexityError) {
    logger.error('blueprint-generation.perplexity-failed', 'Perplexity failed, falling back to Ollama', {
      blueprintId: context.blueprintId,
      error: perplexityError instanceof Error ? perplexityError.message : String(perplexityError),
    });

    // Fallback to Ollama
    try {
      const { systemPrompt, userPrompt } = buildBlueprintPrompt(context);
      const result = await ollamaProvider.generateBlueprint(systemPrompt, userPrompt);
      const duration = Date.now() - startTime;

      logger.info('blueprint-generation.ollama-success', 'Ollama fallback successful', {
        blueprintId: context.blueprintId,
        duration,
      });

      return {
        success: true,
        data: result as any, // Type assertion - Ollama returns compatible format
        metadata: {
          provider: 'ollama',
          duration,
        },
      };
    } catch (ollamaError) {
      const duration = Date.now() - startTime;

      logger.error('blueprint-generation.all-failed', 'All providers failed', {
        blueprintId: context.blueprintId,
        duration,
        perplexityError: perplexityError instanceof Error ? perplexityError.message : String(perplexityError),
        ollamaError: ollamaError instanceof Error ? ollamaError.message : String(ollamaError),
      });

      return {
        success: false,
        error: 'Blueprint generation failed on all providers',
        metadata: {
          provider: 'ollama',
          duration,
        },
      };
    }
  }
}
```

**Acceptance Criteria**:
- ✅ Uses Vercel AI SDK `streamObject()` with Perplexity
- ✅ Supports streaming and non-streaming modes
- ✅ Falls back to Ollama on Perplexity failure
- ✅ Validates output against blueprint schema
- ✅ Tracks usage and performance metrics

---

### Phase 4: API Route Migration (Week 3)

**Objective**: Update API routes to use new services with streaming support.

#### Task 4.1: Update Dynamic Questions API Route
**File**: `frontend/app/api/generate-dynamic-questions/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { generateDynamicQuestions } from '@/lib/ai/services/questionGenerationService';
import { z } from 'zod';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api-generate-questions');

export const dynamic = 'force-dynamic';
export const maxDuration = 800; // 13.3 minutes

const requestSchema = z.object({
  blueprintId: z.string().uuid(),
  streaming: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest): Promise<Response> {
  try {
    const body = await request.json();
    const { blueprintId, streaming } = requestSchema.parse(body);

    // Get Supabase client
    const supabase = await getSupabaseServerClient();

    // Fetch blueprint
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, static_answers, dynamic_questions, user_id, status')
      .eq('id', blueprintId)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json({ error: 'Blueprint not found' }, { status: 404 });
    }

    // Validate static answers exist
    if (!blueprint.static_answers || Object.keys(blueprint.static_answers).length === 0) {
      return NextResponse.json(
        { error: 'Static answers are empty. Please fill out the questionnaire first.' },
        { status: 400 }
      );
    }

    // Check if already exists
    if (blueprint.dynamic_questions && Array.isArray(blueprint.dynamic_questions) && blueprint.dynamic_questions.length > 0) {
      return NextResponse.json({
        success: true,
        dynamicQuestions: blueprint.dynamic_questions,
        message: 'Dynamic questions already exist',
      });
    }

    // Mark as generating
    await supabase.from('blueprint_generator').update({ status: 'generating' }).eq('id', blueprintId);

    // Generate questions
    const result = await generateDynamicQuestions({
      blueprintId,
      userId: blueprint.user_id,
      staticAnswers: blueprint.static_answers as Record<string, any>,
    }, streaming);

    if (!result.success) {
      // Reset status
      await supabase.from('blueprint_generator').update({ status: 'draft' }).eq('id', blueprintId);
      return NextResponse.json({ error: result.error }, { status: 502 });
    }

    // Handle streaming response
    if (streaming && result.stream) {
      return new Response(result.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const normalizedSections = result.data!.sections;

    // Save to database
    const { error: updateError } = await supabase
      .from('blueprint_generator')
      .update({
        dynamic_questions: normalizedSections,
        status: 'draft',
      })
      .eq('id', blueprintId);

    if (updateError) {
      logger.error('api-generate-questions.save-failed', 'Failed to save questions', {
        blueprintId,
        error: updateError.message,
      });
      return NextResponse.json({ error: 'Failed to save dynamic questions' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      dynamicQuestions: normalizedSections,
      metadata: result.metadata,
    });
  } catch (error) {
    logger.error('api-generate-questions.error', 'Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- ✅ Supports both streaming and non-streaming modes
- ✅ Validates request body with Zod
- ✅ Uses new `generateDynamicQuestions()` service
- ✅ Handles errors gracefully
- ✅ Returns Server-Sent Events for streaming

---

#### Task 4.2: Update Blueprint Generation API Route
**File**: `frontend/app/api/blueprints/generate/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase/server';
import { getSupabaseServerClient } from '@/lib/supabase/server';
import { generateBlueprint } from '@/lib/ai/services/blueprintGenerationService';
import { extractLearningObjectives } from '@/lib/ai/prompts/blueprintPrompts';
import { convertBlueprintToMarkdown } from '@/lib/services/blueprintMarkdownConverter';
import { createServiceLogger } from '@/lib/logging';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import { z } from 'zod';

const logger = createServiceLogger('api-generate-blueprint');

export const maxDuration = 800; // 13.3 minutes

const requestSchema = z.object({
  blueprintId: z.string().uuid(),
  streaming: z.boolean().optional().default(false),
});

export async function POST(req: NextRequest): Promise<Response> {
  const startTime = Date.now();

  try {
    // Authenticate
    const { session } = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { blueprintId, streaming } = requestSchema.parse(body);

    // Fetch blueprint
    const supabase = await getSupabaseServerClient();
    const { data: blueprint, error: blueprintError } = await supabase
      .from('blueprint_generator')
      .select('id, user_id, static_answers, dynamic_answers, status')
      .eq('id', blueprintId)
      .eq('user_id', userId)
      .single();

    if (blueprintError || !blueprint) {
      return NextResponse.json({ success: false, error: 'Blueprint not found' }, { status: 404 });
    }

    // Validate questionnaires complete
    if (!blueprint.static_answers || Object.keys(blueprint.static_answers).length === 0) {
      return NextResponse.json({ success: false, error: 'Static questionnaire incomplete' }, { status: 400 });
    }
    if (!blueprint.dynamic_answers || Object.keys(blueprint.dynamic_answers).length === 0) {
      return NextResponse.json({ success: false, error: 'Dynamic questionnaire incomplete' }, { status: 400 });
    }

    // Check if already completed
    if (blueprint.status === 'completed') {
      return NextResponse.json({
        success: true,
        blueprintId,
        metadata: { model: 'cached', duration: 0, timestamp: new Date().toISOString() },
      });
    }

    // Check usage limits
    const canSave = await BlueprintUsageService.canSaveBlueprint(supabase, userId);
    if (!canSave.canSave) {
      return NextResponse.json({ success: false, error: canSave.reason }, { status: 429 });
    }

    // Mark as generating
    await supabase.from('blueprint_generator').update({ status: 'generating' }).eq('id', blueprintId);

    // Extract context
    const staticAnswers = blueprint.static_answers as Record<string, unknown>;
    const dynamicAnswers = blueprint.dynamic_answers as Record<string, unknown>;

    const isV20 =
      staticAnswers.section_1_role_experience &&
      staticAnswers.section_2_organization &&
      staticAnswers.section_3_learning_gap;

    let organization: string, role: string, industry: string;

    if (isV20) {
      const roleData = staticAnswers.section_1_role_experience as Record<string, unknown>;
      const orgData = staticAnswers.section_2_organization as Record<string, unknown>;
      role = (roleData?.current_role as string) || 'Manager';
      organization = (orgData?.organization_name as string) || 'Organization';
      industry = (orgData?.industry_sector as string) || 'General';
    } else {
      // Legacy format
      organization = 'Organization';
      role = 'Manager';
      industry = 'General';
    }

    const learningObjectives = extractLearningObjectives(dynamicAnswers);

    // Generate blueprint
    const result = await generateBlueprint({
      blueprintId,
      userId,
      staticAnswers,
      dynamicAnswers,
      organization,
      role,
      industry,
      learningObjectives,
    }, streaming);

    if (!result.success) {
      await supabase.from('blueprint_generator').update({ status: 'error' }).eq('id', blueprintId);
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    // Handle streaming response
    if (streaming && result.stream) {
      return new Response(result.stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }

    // Handle non-streaming response
    const blueprintData = result.data!;
    const markdown = convertBlueprintToMarkdown(blueprintData);
    const generatedTitle = blueprintData.metadata?.title || `Blueprint ${blueprintId.slice(0, 8)}`;

    // Save to database
    const { error: saveError } = await supabase
      .from('blueprint_generator')
      .update({
        blueprint_json: {
          ...blueprintData,
          _generation_metadata: result.metadata,
        },
        blueprint_markdown: markdown,
        status: 'completed',
        title: generatedTitle,
        updated_at: new Date().toISOString(),
      })
      .eq('id', blueprintId);

    if (saveError) {
      return NextResponse.json({ success: false, error: 'Failed to save blueprint' }, { status: 500 });
    }

    // Increment usage
    await BlueprintUsageService.incrementSavingCount(supabase, userId);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      blueprintId,
      metadata: {
        ...result.metadata,
        duration,
      },
    });
  } catch (error) {
    logger.error('api-generate-blueprint.error', 'Unexpected error', {
      error: error instanceof Error ? error.message : String(error),
    });

    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.flatten() }, { status: 400 });
    }

    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
```

**Acceptance Criteria**:
- ✅ Supports streaming and non-streaming modes
- ✅ Uses new `generateBlueprint()` service
- ✅ Preserves usage tracking logic
- ✅ Handles V2.0 and legacy static answer formats
- ✅ Returns SSE for streaming mode

---

### Phase 5: Frontend Streaming Integration (Week 4)

**Objective**: Add streaming UI components for real-time generation feedback.

#### Task 5.1: Create Streaming Progress Component
**File**: `frontend/components/blueprint/GenerationProgress.tsx`

```typescript
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export interface GenerationProgressProps {
  blueprintId: string;
  type: 'questions' | 'blueprint';
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
}

interface StreamEvent {
  type: 'section' | 'question' | 'complete' | 'error';
  data?: any;
}

export function GenerationProgress({
  blueprintId,
  type,
  onComplete,
  onError,
}: GenerationProgressProps) {
  const [status, setStatus] = useState<'streaming' | 'complete' | 'error'>('streaming');
  const [progress, setProgress] = useState(0);
  const [currentSection, setCurrentSection] = useState<string | null>(null);
  const [events, setEvents] = useState<StreamEvent[]>([]);

  useEffect(() => {
    const eventSource = new EventSource(
      type === 'questions'
        ? `/api/generate-dynamic-questions?blueprintId=${blueprintId}&streaming=true`
        : `/api/blueprints/generate?blueprintId=${blueprintId}&streaming=true`
    );

    eventSource.onmessage = (event) => {
      const parsedEvent: StreamEvent = JSON.parse(event.data);
      setEvents((prev) => [...prev, parsedEvent]);

      if (parsedEvent.type === 'section') {
        setCurrentSection(parsedEvent.data.title);
        const newProgress = type === 'questions' ? (parsedEvent.data.order / 10) * 100 : (parsedEvent.data.order / 11) * 100;
        setProgress(newProgress);
      } else if (parsedEvent.type === 'complete') {
        setStatus('complete');
        setProgress(100);
        onComplete?.(parsedEvent.data);
        eventSource.close();
      } else if (parsedEvent.type === 'error') {
        setStatus('error');
        onError?.(parsedEvent.data.message);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      setStatus('error');
      onError?.('Connection lost');
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [blueprintId, type, onComplete, onError]);

  return (
    <div className="space-y-4 p-6">
      {/* Progress bar */}
      <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <motion.div
          className="h-full bg-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Status */}
      <div className="flex items-center gap-2">
        {status === 'streaming' && (
          <>
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
            <span className="text-sm text-gray-700">
              {currentSection ? `Generating ${currentSection}...` : 'Starting generation...'}
            </span>
          </>
        )}
        {status === 'complete' && (
          <>
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm text-gray-700">Generation complete!</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-sm text-gray-700">Generation failed. Please try again.</span>
          </>
        )}
      </div>

      {/* Event log (for debugging) */}
      {process.env.NODE_ENV === 'development' && (
        <details className="text-xs text-gray-500">
          <summary>Event log ({events.length} events)</summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded bg-gray-100 p-2">
            {JSON.stringify(events, null, 2)}
          </pre>
        </details>
      )}
    </div>
  );
}
```

**Acceptance Criteria**:
- ✅ Consumes Server-Sent Events from API
- ✅ Shows real-time progress updates
- ✅ Handles complete and error states
- ✅ Provides event log for debugging
- ✅ Accessible UI with status indicators

---

### Phase 6: Testing & Migration (Week 4-5)

**Objective**: Comprehensive testing and gradual rollout.

#### Task 6.1: Write Integration Tests
**File**: `frontend/__tests__/ai/questionGeneration.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { generateDynamicQuestions } from '@/lib/ai/services/questionGenerationService';

describe('Question Generation Service', () => {
  it('should generate questions using Anthropic', async () => {
    const context = {
      blueprintId: 'test-blueprint-id',
      userId: 'test-user-id',
      staticAnswers: {
        section_1_role_experience: { current_role: 'Manager' },
        section_2_organization: { organization_name: 'Test Corp', industry_sector: 'Technology' },
        section_3_learning_gap: { learning_gap_description: 'Need AI training' },
      },
    };

    const result = await generateDynamicQuestions(context, false);

    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data?.sections).toHaveLength(10);
    expect(result.metadata.provider).toBe('anthropic');
  });

  it('should fallback to Ollama on Anthropic failure', async () => {
    // Mock Anthropic to fail
    vi.mock('@/lib/ai/providers/anthropicProvider', () => ({
      questionGenerationModel: {
        generate: vi.fn().mockRejectedValue(new Error('Anthropic API error')),
      },
    }));

    const context = {
      blueprintId: 'test-blueprint-id',
      userId: 'test-user-id',
      staticAnswers: {},
    };

    const result = await generateDynamicQuestions(context, false);

    expect(result.metadata.provider).toBe('ollama');
  });
});
```

**Acceptance Criteria**:
- ✅ Tests primary provider (Anthropic)
- ✅ Tests fallback logic (Ollama)
- ✅ Validates response schema
- ✅ Mocks external dependencies

---

#### Task 6.2: Feature Flag Implementation
**File**: `frontend/lib/ai/config.ts` (update)

```typescript
export const AI_CONFIG = {
  // ... existing config ...

  // Feature flags for gradual rollout
  featureFlags: {
    useVercelAISDK: process.env.NEXT_PUBLIC_USE_VERCEL_AI_SDK === 'true',
    enableStreaming: process.env.NEXT_PUBLIC_ENABLE_STREAMING === 'true',
    enableOllamaFallback: process.env.NEXT_PUBLIC_ENABLE_OLLAMA_FALLBACK !== 'false', // Default true
  },
} as const;
```

**Environment Variables**:
```bash
# .env.local
NEXT_PUBLIC_USE_VERCEL_AI_SDK=true        # Gradual rollout flag
NEXT_PUBLIC_ENABLE_STREAMING=true          # Streaming feature flag
NEXT_PUBLIC_ENABLE_OLLAMA_FALLBACK=true    # Ollama fallback flag
```

**Acceptance Criteria**:
- ✅ Feature flags control AI SDK usage
- ✅ Can toggle streaming independently
- ✅ Ollama fallback can be disabled for testing
- ✅ Environment-based configuration

---

#### Task 6.3: Performance Benchmarking
**File**: `frontend/__tests__/ai/performance.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { generateDynamicQuestions } from '@/lib/ai/services/questionGenerationService';
import { generateBlueprint } from '@/lib/ai/services/blueprintGenerationService';

describe('AI Performance Benchmarks', () => {
  it('should generate questions within 5 minutes', async () => {
    const startTime = Date.now();

    const result = await generateDynamicQuestions({
      blueprintId: 'perf-test',
      userId: 'perf-user',
      staticAnswers: { /* ... */ },
    }, false);

    const duration = Date.now() - startTime;

    expect(duration).toBeLessThan(5 * 60 * 1000); // 5 minutes
    expect(result.success).toBe(true);
  }, 600000); // 10-minute timeout

  it('should track token usage accurately', async () => {
    const result = await generateDynamicQuestions({
      blueprintId: 'token-test',
      userId: 'token-user',
      staticAnswers: { /* ... */ },
    }, false);

    expect(result.metadata.tokenUsage).toBeDefined();
    expect(result.metadata.tokenUsage?.totalTokens).toBeGreaterThan(0);
  });
});
```

**Acceptance Criteria**:
- ✅ Measures generation duration
- ✅ Tracks token consumption
- ✅ Compares old vs new architecture
- ✅ Identifies performance regressions

---

### Phase 7: Deprecation & Cleanup (Week 5)

**Objective**: Remove old custom clients and consolidate codebase.

#### Task 7.1: Mark Old Services as Deprecated
Add deprecation comments to old services:

```typescript
/**
 * @deprecated Use `generateDynamicQuestions` from `@/lib/ai/services/questionGenerationService` instead.
 * This service will be removed in v4.0.
 */
export async function generateDynamicQuestionsV2(...) { ... }
```

**Files to deprecate**:
- `frontend/lib/services/dynamicQuestionGenerationV2.ts`
- `frontend/lib/services/perplexityQuestionService.ts`
- `frontend/lib/services/blueprintGenerationService.ts` (old)
- `frontend/lib/claude/client.ts`
- `frontend/lib/claude/fallback.ts`
- `frontend/lib/claude/validation.ts`

**Acceptance Criteria**:
- ✅ All deprecated services have warnings
- ✅ TypeScript shows deprecation notices
- ✅ Documentation updated

---

#### Task 7.2: Remove Old Code (After 2-Week Grace Period)
After validating new architecture in production:

```bash
# Delete deprecated files
rm -rf frontend/lib/claude/
rm frontend/lib/services/dynamicQuestionGenerationV2.ts
rm frontend/lib/services/perplexityQuestionService.ts
rm frontend/lib/services/blueprintGenerationService.ts
```

**Acceptance Criteria**:
- ✅ All old custom HTTP clients removed
- ✅ No references to deprecated services
- ✅ CI/CD passes without errors
- ✅ Production metrics stable

---

## Risk Assessment

### High Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Streaming failures in production** | High | Medium | Keep non-streaming mode as default; add circuit breakers |
| **Perplexity API incompatibility** | High | Low | Test thoroughly; maintain Ollama fallback |
| **Token cost increase** | Medium | Medium | Monitor usage with AI SDK telemetry; set budget alerts |
| **Performance regression** | High | Low | Benchmark before/after; gradual rollout with feature flags |

### Medium Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Schema validation failures** | Medium | Medium | Extensive testing with real data; keep JSON repair utilities |
| **Ollama fallback breaking** | Medium | Low | Keep existing `OllamaClient` unchanged; integration tests |
| **Type safety issues** | Low | Low | Strict TypeScript checks; unit tests |

### Low Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| **Developer learning curve** | Low | High | Documentation; pair programming; code reviews |
| **Third-party dependency issues** | Medium | Very Low | Pin AI SDK versions; monitor release notes |

---

## Success Criteria

### Technical Metrics

✅ **Code Reduction**: Reduce AI integration code by 60% (from ~4,295 to ~1,700 LOC)
✅ **Performance**: Maintain or improve generation speed (target: <10 minutes for questions, <13 minutes for blueprints)
✅ **Reliability**: Achieve 99%+ success rate with fallbacks
✅ **Type Safety**: Zero `any` types in AI integration layer
✅ **Test Coverage**: 85%+ coverage for new AI services

### User Experience Metrics

✅ **Streaming Adoption**: 50%+ of users opt for streaming mode within 2 weeks
✅ **Error Rate**: <2% generation failures (down from current ~5%)
✅ **User Satisfaction**: Net Promoter Score (NPS) increase of +5 points
✅ **Generation Time Perception**: Users report "faster" experience due to streaming feedback

### Business Metrics

✅ **Cost Optimization**: Reduce API costs by 20% through better token management
✅ **Maintenance Time**: Reduce AI integration maintenance time by 40%
✅ **Developer Velocity**: New AI features take 30% less time to implement
✅ **Incident Response**: AI-related incidents resolved 50% faster

---

## Appendix

### A. Environment Variables

**Required**:
```bash
# Anthropic (for question generation)
ANTHROPIC_API_KEY=sk-ant-...

# Perplexity (for blueprint generation)
PERPLEXITY_API_KEY=pplx-...

# Ollama (fallback - optional if local instance unavailable)
OLLAMA_BASE_URL=http://localhost:11434
```

**Optional**:
```bash
# Feature flags
NEXT_PUBLIC_USE_VERCEL_AI_SDK=true
NEXT_PUBLIC_ENABLE_STREAMING=true
NEXT_PUBLIC_ENABLE_OLLAMA_FALLBACK=true
```

### B. Migration Checklist

- [ ] Phase 1: Foundation Setup (Week 1)
  - [ ] Task 1.1: Anthropic Provider
  - [ ] Task 1.2: Perplexity Provider
  - [ ] Task 1.3: Ollama Wrapper
  - [ ] Task 1.4: Unified Config
- [ ] Phase 2: Schema Migration (Week 1-2)
  - [ ] Task 2.1: Question Schema
  - [ ] Task 2.2: Blueprint Schema
- [ ] Phase 3: Service Layer Rewrite (Week 2-3)
  - [ ] Task 3.1: Question Generation Service
  - [ ] Task 3.2: Blueprint Generation Service
- [ ] Phase 4: API Route Migration (Week 3)
  - [ ] Task 4.1: Questions API Route
  - [ ] Task 4.2: Blueprint API Route
- [ ] Phase 5: Frontend Streaming Integration (Week 4)
  - [ ] Task 5.1: Streaming Progress Component
- [ ] Phase 6: Testing & Migration (Week 4-5)
  - [ ] Task 6.1: Integration Tests
  - [ ] Task 6.2: Feature Flags
  - [ ] Task 6.3: Performance Benchmarks
- [ ] Phase 7: Deprecation & Cleanup (Week 5)
  - [ ] Task 7.1: Mark Deprecated
  - [ ] Task 7.2: Remove Old Code

### C. Prompt Files to Create

**Question Generation Prompts**:
- `frontend/lib/ai/prompts/questionPrompts.ts`
  - System prompt (migrate from `lib/prompts/dynamic-questions-system-v2.txt`)
  - User prompt builder (migrate from `buildUserPromptV2()`)

**Blueprint Generation Prompts**:
- `frontend/lib/ai/prompts/blueprintPrompts.ts`
  - System prompt (migrate from `BLUEPRINT_SYSTEM_PROMPT`)
  - User prompt builder (migrate from `buildBlueprintPrompt()`)

### D. Testing Strategy

**Unit Tests** (Vitest):
- Provider initialization
- Schema validation
- Prompt building
- Error handling

**Integration Tests** (Vitest + Mocked APIs):
- End-to-end question generation
- End-to-end blueprint generation
- Fallback scenarios
- Streaming functionality

**E2E Tests** (Manual):
- Full user flow (static → dynamic → blueprint)
- Streaming UI in production
- Error recovery
- Cross-browser compatibility

### E. Documentation Updates

- [ ] Update `CLAUDE.md` with new AI architecture
- [ ] Create migration guide for developers
- [ ] Update API documentation
- [ ] Add streaming examples to component library
- [ ] Update troubleshooting guide

### F. Rollout Plan

**Week 1-2**: Development (internal testing)
**Week 3**: Staging deployment (QA testing)
**Week 4**: Gradual production rollout (10% → 50% → 100%)
**Week 5**: Monitor, optimize, deprecate old code

### G. Rollback Plan

If critical issues arise:
1. **Immediate**: Flip `NEXT_PUBLIC_USE_VERCEL_AI_SDK=false` environment variable
2. **Short-term**: Revert API routes to use old services
3. **Long-term**: Fix issues, re-test, re-deploy

---

## Conclusion

This migration to Vercel AI SDK will modernize SmartSlate Polaris v3's AI integration, reduce maintenance burden by 60%, and enable real-time streaming UX. By leveraging Anthropic Sonnet 4.5 for questions and Perplexity Sonar Deep Research for blueprints, we'll maintain high-quality outputs while improving developer experience and system reliability.

**Estimated Effort**: 5 weeks (1 senior full-stack engineer)
**Estimated Cost Savings**: $2,000/month in reduced API costs + 40% less maintenance time
**Estimated ROI**: 300% within 6 months

---

**Next Steps**:
1. Review and approve PRD
2. Set up Taskmaster tasks from this PRD
3. Begin Phase 1 implementation
4. Schedule weekly progress reviews

**Questions or Concerns?**
Contact: AI Architect or Engineering Manager
