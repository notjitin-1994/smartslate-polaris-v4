# Polaris Chat Revamp: World-Class Architecture & UX Plan

**Version:** 2.0 (Overhauled)  
**Date:** April 12, 2026  
**AI SDK:** `ai@6.0.156` / `@ai-sdk/react@3.0.158`  
**Status:** Awaiting User Approval

---

## 0. Executive Summary

The Polaris chat implementation has 8 identified bugs (3 critical, 4 medium, 1 low) that collectively break streaming quality, generative UI persistence, and message deduplication. This plan addresses every bug with specific, code-level fixes aligned to the official AI SDK v6 documentation and industry best practices (Claude, ChatGPT, Vercel AI Chatbot template).

**Root causes, not symptoms.** The previous plan misdiagnosed several issues (blaming ID mismatches for what is actually dual persistence, proposing custom markdown diffing when `smoothStream` is the bottleneck). This version fixes the actual problems.

**Core principles:**
1. **Single persistence path** — Server-side `onFinish` only (per [AI SDK persistence docs](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence))
2. **No artificial latency** — Remove `smoothStream`, use Streamdown for rendering
3. **No semantic envelopes** — Store native `input`/`output` on tool parts, not `[TOOL_RESULT]` strings
4. **No uncontrolled re-sends** — Remove `sendAutomaticallyWhen` for HITL tools
5. **Validate on load** — Use `validateUIMessages` when hydrating from DB

---

## 1. Phase 1: Data Integrity & Persistence (Critical — Day 1)

### 1.1 Remove `sendAutomaticallyWhen` — Stop Uncontrolled Re-sends

**File:** `src/hooks/useDiscovery.ts`

**The Bug (🔴 BUG 5):** `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` fires immediately when the AI calls any tool — including HITL tools like `askInteractiveQuestions` that have no `execute` function. The user hasn't filled the form yet, but the SDK re-sends messages to the API, causing:
- The AI to re-call the same tool (duplication)
- Extra unwanted messages ("please fill the form")
- Race conditions with `addToolOutput`

**The Fix:**
```ts
// BEFORE
const { messages, sendMessage: chatSendMessage, addToolOutput, status, error, stop } = useChat({
  id: starmapId,
  messages: initialMessages,
  transport: new DefaultChatTransport({ api: '/api/chat', body: { starmapId } }),
  sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls, // ← REMOVE
});

// AFTER
const { messages, sendMessage: chatSendMessage, addToolOutput, status, error, stop } = useChat({
  id: starmapId,
  messages: initialMessages,
  transport: new DefaultChatTransport({ api: '/api/chat', body: { starmapId } }),
  // sendAutomaticallyWhen removed — HITL tools rely on explicit addToolOutput
});
```

**Why this is correct per AI SDK docs:** The official [Tool Usage guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) states `sendAutomaticallyWhen` is for when "all tool results are available." For HITL tools without `execute`, the user must explicitly call `addToolOutput` after filling forms. The `sendAutomaticallyWhen` helper was designed for tools where results are *automatically* available (server-side `execute` or instant client-side `onToolCall`). Our tools require human input — there's nothing automatic about them.

**Also remove the unused imports:**
```ts
// Remove from imports:
import { lastAssistantMessageIsCompleteWithToolCalls } from 'ai';
```

---

### 1.2 Eliminate Dual Persistence — Single `onFinish` Path

**Files:** `src/hooks/useDiscovery.ts`, `src/app/api/chat/route.ts`

**The Bug (🔴 BUG 3 + 🟡 BUG 7):** Messages are persisted in TWO places:
1. **Server-side** `onFinish` in `route.ts` — saves assistant messages after stream completes
2. **Client-side** `persistMessage` in `useDiscovery.ts` — called for user messages AND tool results

These create conflicting entries. On reload, both get loaded as `initialMessages`, causing duplicates. The `uniqueMessages` dedup in `DiscoveryClient.tsx` is a band-aid that runs *after* React processes duplicates, causing layout thrashing.

**The Fix:**

**Step A — Remove all `persistMessage` calls from `useDiscovery.ts`:**
```ts
// In sendMessage() — REMOVE:
persistMessage({ id: messageId, starmapId, role: 'user', parts }).catch(...)

// In approveStage() — REMOVE:
persistMessage({ id: toolMessageId, starmapId, role: 'assistant', parts }).catch(...)

// In rejectStage() — REMOVE:
persistMessage({ id: toolMessageId, starmapId, role: 'assistant', parts }).catch(...)

// In submitToolResult() — REMOVE:
persistMessage({ id: toolMessageId, starmapId, role: 'assistant', parts }).catch(...)
```

**Step B — Update `onFinish` in `route.ts` to persist ALL messages (user + assistant):**
```ts
onFinish: async ({ messages: allMessages }) => {
  // allMessages includes the user message AND the assistant response
  if (!starmapId) return;
  
  for (const msg of allMessages) {
    await db.insert(dbMessages).values({
      id: msg.id,
      starmapId,
      role: msg.role,
      parts: msg.parts as any,
    }).onConflictDoNothing({ target: dbMessages.id });
  }
}
```

**Step C — Remove the `persistMessage` server action entirely** (`src/app/actions/chat.ts`) once all callers are cleaned up.

**Why this is correct per AI SDK docs:** The official [persistence guide](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) shows exactly one save path:
> "Storing messages is done in the `onFinish` callback of the `toUIMessageStreamResponse` function. `onFinish` receives the complete messages including the new AI response."

The `originalMessages` option in `toUIMessageStreamResponse` (already used in `route.ts`) handles ID reconciliation automatically — no custom ID mapping needed.

---

### 1.3 Eliminate Semantic Envelopes — Native Tool Part Persistence

**Files:** `src/hooks/useDiscovery.ts`, `src/app/api/chat/route.ts`, `src/components/Discovery/InteractiveFormCard.tsx`

**The Bug (🔴 BUG 2):** Tool results are wrapped in `[TOOL_RESULT tool="..." stage="..." persisted="..."]\n...\n[/TOOL_RESULT]` strings. This breaks generative UI on reload because:
- `InteractiveFormCard` reads `part.result?.data` to populate `initialData`
- But `result` is a string envelope, not the original object
- So `initialData` is always `{}` on reload — form data disappears

Similarly, `sendMessage` wraps form data in `[FORM_SUBMISSION]...[/FORM_SUBMISSION]` text envelopes sent as user message content.

**The Fix:**

**Step A — In `useDiscovery.ts`, pass raw objects to `addToolOutput`:**
```ts
// BEFORE (approveStage)
const wrappedResult = `[TOOL_RESULT tool="requestApproval" ...]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`;
addToolOutput({ tool: 'requestApproval', toolCallId, output: wrappedResult });

// AFTER
addToolOutput({ tool: 'requestApproval', toolCallId, output: result });
// result = { approved: true, stageAdvanced: true } — plain object
```

Apply the same pattern to `rejectStage` and `submitToolResult` — remove all envelope wrapping.

**Step B — In `route.ts`, remove envelope wrapping in `onFinish`:**
```ts
// BEFORE
const processedParts = responseMessage.parts.map(part => {
  if (part.type === 'tool-result') {
    const semanticResult = `[TOOL_RESULT tool="${toolName}" ...]\n${JSON.stringify(toolPart.result)}\n[/TOOL_RESULT]`;
    return { ...toolPart, result: semanticResult };
  }
  return part;
});

// AFTER
const processedParts = responseMessage.parts; // No wrapping — store as-is
```

**Step C — In `InteractiveFormCard.tsx`, read form data from `part.input`:**
```ts
// The AI SDK typed tool part carries input (the questions) and output (user's answers)
// On initial render (input-available): part.input contains the questions schema
// On submitted (output-available): part.output contains the user's answers
const formData = isSubmitted ? part.output : part.input?.questions || {};
```

**Step D — In `ChatMessage.tsx`, update `InteractiveFormCard` props:**
```ts
<InteractiveFormCard
  toolCallId={part.toolCallId}
  questions={part.input?.questions || []}  // From native tool input
  initialData={part.output || {}}           // From native tool output
  onSubmit={(data) => submitToolResult('askInteractiveQuestions', part.toolCallId, data)}
/>
```

**Step E — Replace `[FORM_SUBMISSION]` envelopes with native `data` parts:**
```ts
// BEFORE — wrapping in text envelopes
const wrappedText = `[FORM_SUBMISSION tool="${toolName}"]\n${JSON.stringify(formData)}\n[/FORM_SUBMISSION]`;
chatSendMessage({ parts: [{ type: 'text', text: wrappedText }] });

// AFTER — using native data parts
chatSendMessage({ 
  parts: [
    { type: 'data', data: { toolName, formData } }
  ]
});
```

**Why this is correct:** AI SDK v6 tool parts natively carry `input` (what the AI requested) and `output` (what the user provided) as typed objects. Wrapping them in string envelopes destroys type information and breaks reload. The [validateUIMessages](https://ai-sdk.dev/docs/reference/ai-sdk-core/validate-ui-messages) API validates tool parts against your schemas — but only if they're actual objects, not stringified envelopes.

---

### 1.4 Validate Messages on Load from DB

**File:** `src/app/discovery/[id]/page.tsx`

**The Fix:** When loading messages from the database to pass as `initialMessages`, validate them against your tool definitions:
```ts
import { validateUIMessages, tool } from 'ai';

// Define tool schemas matching your route.ts definitions
const toolDefs = {
  askInteractiveQuestions: tool({
    description: 'Ask interactive questions',
    parameters: z.object({ questions: z.array(...) }),
  }),
  requestApproval: tool({
    description: 'Request approval',
    parameters: z.object({ stageNumber: z.number(), ... }),
  }),
  setProjectParameters: tool({
    description: 'Set project parameters',
    parameters: z.object({ parameterName: z.string(), ... }),
  }),
  saveDiscoveryContext: tool({
    description: 'Save discovery context',
    parameters: z.object({ starmapId: z.string().uuid(), data: z.record(z.string(), z.unknown()) }),
  }),
};

// In your page component or loader:
let initialMessages = await loadMessagesFromDB(starmapId);

try {
  initialMessages = await validateUIMessages({
    messages: initialMessages,
    tools: toolDefs,
  });
} catch (error) {
  console.error('Message validation failed, starting with empty history:', error);
  initialMessages = [];
}
```

**Why:** The official persistence docs explicitly state: "When loading messages from storage that contain tools, metadata, or custom data parts, validate them using `validateUIMessages` before processing." This catches stale/mangled tool parts from old envelope formats and prevents `convertToModelMessages` from crashing on bad data.

---

### 1.5 Fix Tool Part Type Checks in ChatMessage.tsx

**File:** `src/components/Discovery/ChatMessage.tsx`

**The Bug (🟡 BUG 6):** The condition that checks tool part types has operator precedence bugs:
```ts
if (part.type === 'tool-requestApproval' || 
    (part.type as any) === 'tool-invocation' && (part as any).toolName === 'requestApproval' || 
    part.type === 'dynamic-tool' && ...)
```
This parses as `(part.type as any) === ('tool-invocation' && (part as any).toolName === 'requestApproval')` — always `false`.

**The Fix:** Add a normalization utility and use it consistently:
```ts
// src/lib/utils/tool-parts.ts
export function getToolInfo(part: any): { toolName: string; state: string } | null {
  if (part.type?.startsWith('tool-') && part.type !== 'tool-result' && part.type !== 'tool-invocation') {
    // Typed tool part: tool-askInteractiveQuestions, tool-requestApproval, etc.
    return {
      toolName: part.type.replace('tool-', ''),
      state: part.state,
    };
  }
  if (part.type === 'dynamic-tool') {
    return {
      toolName: part.toolName,
      state: part.state,
    };
  }
  // Legacy fallback
  if (part.type === 'tool-invocation' || part.type === 'tool-result') {
    return {
      toolName: part.toolName,
      state: part.state || (part.result ? 'output-available' : 'input-available'),
    };
  }
  return null;
}
```

Then in `ChatMessage.tsx`:
```ts
const toolInfo = getToolInfo(part);
if (!toolInfo) return null;

switch (toolInfo.toolName) {
  case 'askInteractiveQuestions':
    return <InteractiveFormCard ... />;
  case 'requestApproval':
    return <ApprovalCard ... />;
  case 'setProjectParameters':
    return <ParameterSlider ... />;
}
```

---

### 1.6 Increase `maxDuration` & Remove History Truncation

**File:** `src/app/api/chat/route.ts`

**The Bug (🟡 BUG 4):** `maxDuration = 30` combined with tool call multi-step flows can cause premature timeouts. Additionally, the aggressive history trimming (`modelMessages.length > 12 ? [first, ...last11]`) can drop important context.

**The Fix:**
```ts
export const maxDuration = 60; // Was 30 — tool call flows need more time

// Remove aggressive truncation or make it smarter:
// Keep full context for the current session; let the LLM handle token limits
const modelMessages = await convertToModelMessages(messages as UIMessage[]);
// Don't trim — the model's context window handles this
// If you must trim, keep ALL tool call/result pairs intact (they come in pairs)
```

---

## 2. Phase 2: Claude-Grade Streaming (Day 2)

### 2.1 Remove `smoothStream` — Eliminate Artificial Latency

**File:** `src/app/api/chat/route.ts`

**The Bug (🔴 BUG 1):** `smoothStream({ chunking: 'word', delayInMs: 30 })` buffers tokens server-side into word-level chunks and adds a 30ms artificial delay per chunk. This is the **primary cause** of laggy, batched streaming. Claude and ChatGPT stream token-by-token with zero artificial delay.

**The Fix:**
```ts
// BEFORE
const result = streamText({
  model: getModel(modelId),
  system: systemPrompt,
  messages: trimmedMessages,
  experimental_transform: smoothStream({ chunking: 'word', delayInMs: 30 }),
  tools: { ... },
});

// AFTER
const result = streamText({
  model: getModel(modelId),
  system: systemPrompt,
  messages: modelMessages,
  // smoothStream removed — raw token streaming
  tools: { ... },
});
```

**Also remove the `smoothStream` import:**
```ts
import { streamText, UIMessage, convertToModelMessages, generateId } from 'ai';
// smoothStream removed
```

---

### 2.2 Replace ReactMarkdown with Streamdown

**Files:** `src/components/Discovery/StreamingMarkdown.tsx`, `package.json`

**The Problem:** `ReactMarkdown` does a full AST re-parse on every content change. During streaming, this means the entire markdown document is re-rendered for every token — expensive and janky. The `▍` cursor flickers between renders because ReactMarkdown remounts the paragraph.

**The Fix:** Install [Streamdown](https://github.com/vercel/streamdown) (4.8k ⭐, 1.8M weekly downloads, official Vercel project) — a drop-in replacement for ReactMarkdown built specifically for AI streaming:

```bash
npm install streamdown @streamdown/code
```

**Rewrite `StreamingMarkdown.tsx`:**
```tsx
'use client';

import { Streamdown } from 'streamdown';
import { code } from '@streamdown/code';

interface StreamingMarkdownProps {
  content: string;
  isStreaming?: boolean;
}

export function StreamingMarkdown({ content, isStreaming = false }: StreamingMarkdownProps) {
  return (
    <Streamdown
      mode={isStreaming ? 'streaming' : 'static'}
      isAnimating={isStreaming}
      plugins={{ code }}
    >
      {content}
    </Streamdown>
  );
}
```

**Why Streamdown over ReactMarkdown:**
- **Block-level memoization:** Splits content into blocks, only re-renders the last (active) block. Completed blocks stay frozen in the React tree.
- **`remend` preprocessor:** Automatically completes unclosed `**bold**`, `` `code` ``, `[links]`, etc. in real-time during streaming. ReactMarkdown has no equivalent.
- **Stable React keys:** Index-based keys mean completed blocks never unmount/remount — no cursor flicker.
- **Built-in cursor:** `isAnimating` prop shows a blinking caret at the end of streaming content. No custom `▍` span needed.
- **Drop-in compatible:** The `components` prop API is identical to ReactMarkdown.
- **Performance:** Memoized at two levels (component + block). Only the last block re-renders during streaming.

**Tailwind setup:** Add to `globals.css`:
```css
@source "../node_modules/streamdown/dist/*.js";
```

---

### 2.3 Ghost Assistant Bubble + Shimmer

**File:** `src/components/Discovery/DiscoveryClient.tsx`

This is a UX enhancement (carried over from the previous plan — directionally correct).

**The Fix:** When `status` transitions to `'submitted'`, immediately render a ghost assistant message at the bottom of the chat before any text arrives:
```tsx
{status === 'submitted' && (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex gap-3 items-start"
  >
    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
      <Sparkles className="w-4 h-4 text-white/40 animate-pulse" />
    </div>
    <div className="flex-1 rounded-2xl rounded-tl-sm bg-white/5 px-4 py-3">
      <div className="h-4 w-32 bg-white/10 rounded animate-shimmer" />
    </div>
  </motion.div>
)}
```

The shimmer disappears automatically once the first token arrives and the real assistant message renders.

---

## 3. Phase 3: Mobile & Input (Day 3)

### 3.1 Viewport-Safe Keyboard Handling

**Files:** `src/components/Discovery/DiscoveryClient.tsx`, associated CSS

**The Fix:**
```tsx
useEffect(() => {
  if (typeof window === 'undefined' || !window.visualViewport) return;
  
  const viewport = window.visualViewport;
  const handleResize = () => {
    document.documentElement.style.setProperty(
      '--viewport-height',
      `${viewport.height}px`
    );
  };
  
  viewport.addEventListener('resize', handleResize);
  handleResize();
  
  return () => viewport.removeEventListener('resize', handleResize);
}, []);
```

```css
.message-container {
  overscroll-behavior-y: none;
  height: 100dvh; /* or var(--viewport-height, 100dvh) */
}
```

---

### 3.2 On-Blur Form Validation

**File:** `src/components/Discovery/InteractiveFormCard.tsx`

Move validation from submit-time to blur-time with visual feedback:
```tsx
<input
  onBlur={(e) => {
    const isValid = validateField(e.target.value, field);
    setFieldErrors(prev => ({ ...prev, [field.id]: isValid ? null : 'Required' }));
  }}
  className={cn(
    'transition-all duration-200',
    fieldErrors[field.id] 
      ? 'ring-2 ring-red-500/50' 
      : touchedFields[field.id] 
        ? 'ring-2 ring-emerald-500/50' 
        : ''
  )}
/>
```

---

## 4. Phase 4: Resilience & Observability (Day 4)

### 4.1 Client-Side Connection Health

**File:** `src/hooks/useDiscovery.ts`

```ts
useEffect(() => {
  if (status !== 'streaming') return;
  
  const timeout = setTimeout(() => {
    setConnectionStatus('weak');
  }, 5000); // 5 seconds without a token = weak connection
  
  // Reset on any message update (token received)
  const messageHandler = () => setConnectionStatus('strong');
  // ... listen for message updates
  
  return () => clearTimeout(timeout);
}, [status, messages.length]);
```

Display in the UI as a subtle banner: "Connection weak — [Retry]"

### 4.2 Stream Resumption (Optional — Industry-Leading)

**Files:** `src/app/api/chat/route.ts` (add GET handler), `src/hooks/useDiscovery.ts`

The AI SDK v6 supports `resume: true` in `useChat` with Redis-backed stream storage. If the user refreshes mid-generation, the stream reconnects automatically. Claude does this.

**Prerequisites:** Redis instance (Vercel KV or self-hosted), `resumable-stream` package.

```ts
// Client-side
const { messages, sendMessage } = useChat({
  id: starmapId,
  messages: initialMessages,
  resume: true, // ← Enable stream resumption
  transport: new DefaultChatTransport({
    prepareSendMessagesRequest: ({ id, messages }) => ({
      body: { id, message: messages[messages.length - 1] },
    }),
  }),
});
```

```ts
// Server-side POST handler — use consumeSseStream
return result.toUIMessageStreamResponse({
  originalMessages: messages,
  generateMessageId: createIdGenerator({ prefix: 'msg', size: 16 }),
  async consumeSseStream({ stream }) {
    const streamId = generateId();
    const streamContext = createResumableStreamContext({ waitUntil: after });
    await streamContext.createNewResumableStream(streamId, () => stream);
    // Store activeStreamId in DB for this starmap
  },
  onFinish: ({ messages }) => { /* save + clear activeStreamId */ },
});
```

```ts
// Server-side GET handler at /api/chat/[id]/stream
export async function GET(req, { params }) {
  const { id } = await params;
  const chat = await loadChat(id);
  if (!chat.activeStreamId) return new Response(null, { status: 204 });
  const streamContext = createResumableStreamContext({ waitUntil: after });
  return new Response(
    await streamContext.resumeExistingStream(chat.activeStreamId),
    { headers: UI_MESSAGE_STREAM_HEADERS }
  );
}
```

**Trade-off:** Requires Redis. Skip if deploying without Redis; add later as a polish feature.

---

## 5. Implementation Timeline

| Day | Phase | Tasks | Bugs Fixed |
|-----|-------|-------|------------|
| **Day 1** | Data Integrity | 1.1 Remove `sendAutomaticallyWhen`, 1.2 Eliminate dual persistence, 1.3 Remove semantic envelopes, 1.4 Add `validateUIMessages`, 1.5 Fix tool part type checks, 1.6 Increase `maxDuration` | BUG 2, 3, 4, 5, 6, 7, 8 |
| **Day 2** | Streaming UX | 2.1 Remove `smoothStream`, 2.2 Replace ReactMarkdown with Streamdown, 2.3 Ghost bubble + shimmer | BUG 1 |
| **Day 3** | Mobile & Input | 3.1 Viewport-safe keyboard, 3.2 On-blur form validation | — |
| **Day 4** | Resilience | 4.1 Connection health, 4.2 Stream resumption (optional) | — |

**Dependency order:** Phase 1 must complete before Phase 2 (persistence fixes are prerequisites for streaming fixes). Phase 3 and 4 are independent and can run in parallel.

---

## 6. Files Changed Summary

| File | Changes |
|------|---------|
| `src/hooks/useDiscovery.ts` | Remove `sendAutomaticallyWhen`, remove all `persistMessage` calls, remove envelope wrapping in `approveStage`/`rejectStage`/`submitToolResult`, pass raw objects to `addToolOutput` |
| `src/app/api/chat/route.ts` | Remove `smoothStream`, remove envelope wrapping in `onFinish`, update `onFinish` to persist all messages, increase `maxDuration` to 60, remove history truncation |
| `src/app/actions/chat.ts` | Remove `persistMessage` function (or deprecate) |
| `src/app/discovery/[id]/page.tsx` | Add `validateUIMessages` call when loading messages from DB |
| `src/components/Discovery/ChatMessage.tsx` | Replace fragile type checks with `getToolInfo` utility, update `InteractiveFormCard`/`ApprovalCard` props to pass native `input`/`output` |
| `src/components/Discovery/InteractiveFormCard.tsx` | Read form data from `part.input`/`part.output` instead of envelope-parsed strings, add on-blur validation |
| `src/components/Discovery/StreamingMarkdown.tsx` | Replace ReactMarkdown with Streamdown, remove custom cursor logic |
| `src/components/Discovery/DiscoveryClient.tsx` | Add ghost bubble for `status === 'submitted'`, remove `uniqueMessages` dedup (no longer needed) |
| `src/lib/utils/tool-parts.ts` | **NEW** — `getToolInfo` utility for normalized tool part type checking |
| `package.json` | Add `streamdown`, `@streamdown/code`; remove `react-markdown` dependency |
| `src/app/globals.css` | Add `@source "../node_modules/streamdown/dist/*.js"` for Tailwind |

---

## 7. References

- [AI SDK UI — Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — Single `onFinish` persistence, `originalMessages`, `validateUIMessages`
- [AI SDK UI — Chatbot Tool Usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage) — `sendAutomaticallyWhen` behavior, HITL tool patterns, typed tool parts
- [AI SDK UI — Chatbot Resume Streams](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-resume-streams) — Resumable streams with Redis
- [AI SDK Core — validateUIMessages](https://ai-sdk.dev/docs/reference/ai-sdk-core/validate-ui-messages) — Message validation API
- [AI SDK — Repeated Assistant Messages](https://ai-sdk.dev/docs/troubleshooting/repeated-assistant-messages) — `originalMessages` fix for duplication
- [Streamdown](https://github.com/vercel/streamdown) — Drop-in ReactMarkdown replacement for AI streaming (4.8k ⭐, 1.8M weekly downloads)
- [vercel/ai #4845 — Guidance on persisting messages](https://github.com/vercel/ai/discussions/4845) — Matt Pocock + Nico Albanese on `parts`-based persistence
- [vercel/ai #13307 — Duplicate toolCallId](https://github.com/vercel/ai/issues/13307) — HITL tool duplication issues
- [vercel/ai #12709 — Missing tool output with approval-requested state](https://github.com/vercel/ai/issues/12709) — Orphaned tool calls on new message
- [CopilotKit — Generative UI in 2026](https://www.copilotkit.ai/blog/the-developer-s-guide-to-generative-ui-in-2026) — Generative UI patterns and state persistence

---

## 8. Changelog — What Changed from v1 and Why

### Removed from v1

| Section | Why Removed |
|---------|-------------|
| **§2.1 "Client-Side ID Sovereignty"** | Misdiagnosed. The code already uses `originalMessages` correctly per AI SDK docs. Duplication comes from dual persistence, not ID mismatches. |
| **§2.1 "Deterministic ID Generation from starmapId + turnIndex"** | Fragile and unnecessary. `generateId()` (crypto.randomUUID) is already used and is correct. The plan's `starmapId + turnIndex` breaks on deleted messages, multi-step tool calls, or concurrent requests. |
| **§2.2 "Server-Side Sanitizer" for missing tool results** | Over-engineered. The real fix is removing `sendAutomaticallyWhen` (prevents orphaned tool calls) and using `validateUIMessages` on load (catches bad data). The AI SDK's `convertToModelMessages` already handles `approval-requested` tools gracefully as of v6. |
| **§3.2 "Memoized Diffing Strategy" for markdown** | Wrong solution to the wrong diagnosis. The streaming lag comes from `smoothStream` (server-side 30ms/word delay), not from ReactMarkdown re-parsing. The fix is removing `smoothStream` and using Streamdown. |

### Added (New to v2)

| Section | Why Added |
|---------|-----------|
| **§1.1 Remove `sendAutomaticallyWhen`** | The #1 cause of message duplication and uncontrolled re-sends. Completely missing from v1. Per AI SDK docs, this helper is for tools with automatically available results — not HITL tools requiring human input. |
| **§1.2 Eliminate Dual Persistence** | v1 never identified that `persistMessage` (client) + `onFinish` (server) both write to the same DB table. The official pattern is `onFinish` only. |
| **§1.3 Eliminate Semantic Envelopes** | v1 never mentioned `[TOOL_RESULT]...[/TOOL_RESULT]` wrapping — the root cause of form data disappearing on reload. AI SDK tool parts natively carry `input`/`output` as typed objects. |
| **§1.4 Validate Messages on Load** | Official AI SDK docs require `validateUIMessages` when loading persisted messages that contain tool calls. Prevents `convertToModelMessages` crashes on stale data. |
| **§1.5 Fix Tool Part Type Checks** | The operator precedence bug in `ChatMessage.tsx` causes cards to not render on reload. Simple fix, zero mention in v1. |
| **§1.6 Increase `maxDuration`** | `smoothStream` + 30s timeout = premature cutoffs for long tool call flows. |
| **§2.1 Remove `smoothStream`** | The actual cause of laggy streaming (server-side 30ms/word buffering). v1 blamed ReactMarkdown; the real bottleneck is in `route.ts`. |
| **§2.2 Streamdown Replacement** | Drop-in replacement for ReactMarkdown with block-level memoization, remend (incomplete markdown healing), built-in cursor, and 1.8M weekly downloads. v1 proposed building a custom diffing engine — unnecessary when Streamdown exists. |
| **§4.2 Stream Resumption** | Claude-grade feature: resume generation after page refresh. Uses AI SDK's `resume: true` + Redis. |
| **§8 Changelog** | This section — documents all changes for traceability. |

### Modified from v1

| Section | What Changed | Why |
|---------|-------------|-----|
| **§3.1 Ghost States** | Kept but simplified. Removed complex "per-turn state machine" language. | The concept is sound (Claude does this), but v1 over-described it. A simple `status === 'submitted'` check with a shimmer div is sufficient. |
| **§4.1 Viewport Handling** | Kept as-is. | Correct approach per web standards. |
| **§4.2 Form Validation** | Kept as-is. | Standard UX pattern. |
| **§5 Observability** | Kept health check, added stream resumption as optional. | Health check is good observability; stream resumption is the "industry-leading" differentiator. |
| **§6 Timeline** | Restructured: Phase 1 (data integrity) is now Day 1 with 6 tasks. Phase 2 (streaming) is Day 2. | Data integrity must be fixed first — persistence bugs block everything else. Streaming polish comes after the foundation is solid. |

### Structural Changes

| Change | Why |
|--------|-----|
| Added §0 Executive Summary | Clear north star: root causes, not symptoms. 5 core principles. |
| Added §5 Files Changed Summary | Exact file-level impact for implementation. |
| Added §6 References | All sources cited with URLs for verification. |
| Added §7 Changelog | Full traceability of what changed from v1 → v2 and why. |
| Renumbered phases | Phase 1 is now "Data Integrity" (was "Protocol Hardening") because that's what it actually is. |
| Added bug IDs to each section | Maps every fix to the original audit (BUG 1–8) for traceability. |
