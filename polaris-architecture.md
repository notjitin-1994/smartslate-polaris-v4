# Polaris v4 Architecture: The Agentic Discovery Blueprint

Polaris v4 is a complete ground-up rebuild of the Smartslate Polaris platform, optimized for 2026 standards. It transitions from a "job-based form application" to a "Human-in-the-Loop Agentic Workspace."

## 1. Core Technology Stack
- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript (Strict Mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database / ORM:** Supabase + Drizzle ORM
- **AI Orchestration:** Vercel AI SDK 6.0 (Unified Provider Registry)
- **State Management:** TanStack Query (Server State) + Nuqs (URL State)
- **Validation:** Zod (Single source of truth for DB, Form, and AI schemas)

## 2. Unified Multi-LLM Architecture
Polaris v4 uses a **Provider Registry** pattern to support multiple LLM vendors interchangeably without logic changes.

### Supported Providers
- **Anthropic:** Claude 4.6 (Primary for reasoning and structured discovery)
- **OpenAI:** GPT-5.4 (Primary for high-speed interactions)
- **Google:** Gemini 3 Flash (Primary for massive context and multimodal input)
- **DeepSeek / GLM / Kimi / Minimax:** Integrated via dedicated community providers or OpenAI-compatible adapters.

### Intelligence Routing
The system uses an **Intelligence Orchestrator** that selects the best model based on:
1. **Task Complexity:** Reasoning models for final report generation.
2. **Cost Efficiency:** Flash/Mini models for interactive interviewing.
3. **Availability:** Automatic failover across providers.

## 3. Human-in-the-Loop (HITL) UX Flow
The discovery process is no longer a static multi-page form. It is an **Interactive Interview**.

### Phase 1: Collaborative Intake
- The user provides high-level goals.
- The AI uses `streamObject` to generate dynamic questions phase-by-phase.
- **HITL Pattern:** The AI uses tools with `needsApproval: true`. Before generating the next set of questions, it pauses and asks: *"I've drafted these 5 questions based on your previous answers. Should we proceed or do you want to adjust the focus?"*

### Phase 2: Dynamic Starmap Assembly
- As questions are answered, the "Starmap Blueprint" is rendered in a side-panel using **Generative UI**.
- Users can click any section of the draft blueprint to "Override" or "Deepen" the AI's understanding.

### Phase 3: Verified Finalization
- Before the final Strategy Blueprint is generated, the AI presents a "Critical Assumptions" list.
- The user must verify or correct these assumptions (HITL) to ensure the final report is bug-free and aligned with reality.

## 4. Performance & Cost Optimization
### Advanced Caching
- **Native Prompt Caching:** Leveraging Anthropic and Gemini native caching for the 7-stage discovery instructions.
- **Semantic KV Caching:** Using Upstash Redis to cache common industry-specific discovery patterns.
- **Structured Output Buffering:** Using `output: 'array'` in `streamObject` to prevent layout shifts and provide a flawless streaming experience.

## 5. Security & Stability
- **Type-Safe Boundary:** Every AI interaction is constrained by a Zod schema. If the LLM output doesn't match, the SDK automatically retries or repairs the response before it reaches the UI.
- **Stateless Auth:** Supabase Auth with Middleware-based route protection.
