# Chat Bug Audit — Polaris v4

**Date:** April 12, 2026  
**Auditor:** Astra  
**AI SDK Version:** `ai@6.0.156` / `@ai-sdk/react@3.0.158`  
**Scope:** Chat streaming, generative UI, message persistence, deduplication

---

## 🔴 BUG 1: Streaming Doesn't Work Like Claude/ChatGPT

**Files:** `src/app/api/chat/route.ts`, `src/components/Discovery/StreamingMarkdown.tsx`

**Root cause:** `smoothStream({ chunking: 'word', delayInMs: 30 })` in `experimental_transform` is a post-processing transformer that buffers tokens server-side, groups them into word-level chunks, and adds a 30ms artificial delay. This makes the stream feel laggy and batched compared to Claude/ChatGPT which stream token-by-token with no artificial delay.

Additionally, `StreamingMarkdown.tsx` does a full `ReactMarkdown` re-render on every content change. ReactMarkdown is expensive — it parses the entire markdown AST from scratch each time. During streaming, this means:
- The cursor (`▍`) jitters because ReactMarkdown re-renders the entire paragraph
- Words appear in "pops" rather than smooth character-by-character flow
- The `animate-pulse` on the cursor creates a visible flicker between renders

**Fix direction:**
- Remove `smoothStream` entirely (or reduce `delayInMs` to 0–5ms)
- For the markdown renderer, either use a streaming-aware markdown parser that does incremental diffs, or split text at the last complete paragraph boundary during streaming and only run ReactMarkdown on complete paragraphs, appending the in-progress paragraph as plain text with a cursor

---

## 🔴 BUG 2: Generative UI Forms Lose Data on Reload

**Files:** `src/hooks/useDiscovery.ts`, `src/components/Discovery/InteractiveFormCard.tsx`, `src/components/Discovery/ChatMessage.tsx`

**Root cause:** Two-part problem.

**Part A — Form state is ephemeral.** `InteractiveFormCard` stores `formData` in `useState(initialData)`. When the page reloads, `initialMessages` are loaded from the DB (via `discovery/[id]/page.tsx`), but the tool parts in those messages don't carry the form data back. Here's why:

In `ChatMessage.tsx`, the `InteractiveFormCard` receives `initialData` from:
```ts
initialData={isSubmitted ? (part as any).result?.data || (part as any).output?.data : {}}
```

But when the user fills the form and submits via `submitToolResult` → `addToolOutput`, the output is a wrapped string:
```ts
`[TOOL_RESULT tool="${toolName}" stage="${currentStage}" persisted="false"]\n${JSON.stringify(result)}\n[/TOOL_RESULT]`
```

This wrapped string gets persisted to DB. On reload, the tool part's `result` is this string — not the original `{ status: 'submitted_via_form', data: {...} }` object. So `(part as any).result?.data` returns `undefined`, and `initialData` becomes `{}`.

**Part B — Tool parts are not persisted with their inputs.** The assistant message containing the tool call is persisted by the `onFinish` callback in `route.ts`. That callback wraps tool results in `[TOOL_RESULT]...[/TOOL_RESULT]` envelopes and persists them. On reload, the tool parts lose their original `args`/`input` data because the SDK creates tool parts from the stream, and the persistence layer mangles the format.

**Fix direction:**
- Stop wrapping tool results in `[TOOL_RESULT]...[/TOOL_RESULT]` semantic envelopes
- Store the raw tool call `args`/`input` alongside the `output` in a way that survives serialization
- When loading messages from DB, ensure tool parts have both their `args` (for rendering the form) and `output` (for showing submitted state)

---

## 🔴 BUG 3: Message Duplication — Same Messages and Cards Appear Multiple Times

**Files:** `src/app/api/chat/route.ts`, `src/hooks/useDiscovery.ts`, `src/components/Discovery/DiscoveryClient.tsx`

**Root cause:** Multiple duplication sources.

**Source A — `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`.** When the AI calls a tool (like `askInteractiveQuestions`), the AI SDK marks the assistant message as "complete with tool calls." This config then automatically re-sends the messages to the API, which generates a new assistant message (the AI's follow-up text). But tool-result messages are also persisted separately via `persistMessage` in `useDiscovery.ts`. This creates duplicate messages: one from the stream, one from manual persistence.

**Source B — Dual persistence.** Messages are persisted in TWO places:
1. `onFinish` in `route.ts` — persists the assistant message after stream completes
2. `persistMessage` in `useDiscovery.ts` — called for user messages AND tool results separately

These can create conflicting entries in the DB. On reload, both get loaded as `initialMessages`, causing duplicates.

**Source C — The dedup engine is a band-aid.** The `uniqueMessages` useMemo in `DiscoveryClient.tsx` tries to deduplicate by message ID and filter out tool invocations where a result exists. But this runs after React has already processed the messages, causing layout thrashing (Framer Motion `layout` animations trigger on the duplicate-then-remove cycle).

**Fix direction:** Choose ONE persistence path:
- Either persist everything server-side in `onFinish` (recommended per Vercel docs)
- Or persist everything client-side via `persistMessage`
- Not both

Reference: [Vercel AI SDK — Repeated Assistant Messages](https://ai-sdk.dev/docs/troubleshooting/repeated-assistant-messages) — the `originalMessages` option is already correctly used, but the dual persistence undermines it.

---

## 🟡 BUG 4: `smoothStream` + `maxDuration = 30` = Premature Cutoffs

**File:** `src/app/api/chat/route.ts`

The `smoothStream` transformer adds latency (30ms per word). Combined with `maxDuration = 30`, long AI responses (especially with tool calls that trigger multi-step) can hit the timeout before the stream completes. This would cause partial responses or errors.

**Fix:** Increase `maxDuration` to 60 or remove `smoothStream`.

---

## 🟡 BUG 5: `sendAutomaticallyWhen` Creates Uncontrolled Re-sends

**File:** `src/hooks/useDiscovery.ts`

When the AI calls `askInteractiveQuestions`, `sendAutomaticallyWhen` fires immediately (because the message is "complete with tool calls"). But the user hasn't filled the form yet! This sends the messages back to the API with the tool call but no tool output, causing the AI to either:
- Re-call the same tool (duplication)
- Generate text saying "please fill the form" (extra unwanted message)

The tools `askInteractiveQuestions`, `requestApproval`, and `setProjectParameters` are client-side HITL (Human-in-the-Loop) tools — they have no `execute` function. The AI SDK should wait for `addToolOutput` before continuing. But `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls` bypasses this wait by auto-sending.

**Fix:** Remove `sendAutomaticallyWhen` entirely. Let the user explicitly trigger the next turn by sending a message or submitting a form (which calls `submitToolResult` → `addToolOutput`). The AI SDK will then continue the multi-step loop correctly.

---

## 🟡 BUG 6: Tool Part Type Mismatches on Reload

**Files:** `src/components/Discovery/ChatMessage.tsx`, `src/app/api/chat/route.ts`

AI SDK v6 uses typed tool parts like `tool-askInteractiveQuestions` and `tool-requestApproval`. But persistence stores parts as JSON, and on reload, the part `type` might be `dynamic-tool` instead of the typed version. `ChatMessage.tsx` tries to handle this with fallbacks:

```ts
if (part.type === 'tool-requestApproval' || (part.type as any) === 'tool-invocation' && (part as any).toolName === 'requestApproval' || part.type === 'dynamic-tool' && ...)
```

This is fragile. The conditions use **operator precedence bugs** — `(part.type as any) === 'tool-invocation' && (part as any).toolName === 'requestApproval'` is parsed as `(part.type as any) === ('tool-invocation' && ...)` which is always `false`.

**Fix:** Add proper parentheses. Better yet, normalize part types on load from DB using a utility function.

---

## 🟡 BUG 7: User Message Double-Persisted

**Files:** `src/hooks/useDiscovery.ts`, `src/app/actions/chat.ts`

In `sendMessage`, the code:
1. Calls `chatSendMessage` (which the SDK sends to API)
2. Calls `persistMessage` (which inserts to DB)

But the `onFinish` callback in `route.ts` also runs after the stream completes. If the SDK includes the user message in the `onFinish` messages array (which it does — `onFinish` receives ALL messages including the user's), and `persistMessage` is also called, this creates a duplicate insert (mitigated by `onConflictDoNothing`, but the timing can still cause issues).

**Fix:** Remove the client-side `persistMessage` call for user messages. Let `onFinish` handle all persistence server-side.

---

## 🟢 BUG 8: `convertToModelMessages` with Semantic Envelopes

**File:** `src/app/api/chat/route.ts`

`sendMessage` wraps form data in `[FORM_SUBMISSION]...[/FORM_SUBMISSION]` envelopes. These get sent as user message text. `convertToModelMessages` passes them to the LLM as-is. While the system prompt handles this, the envelopes also get persisted in the DB and shown to the user on reload (though `cleanText` in `ChatMessage.tsx` strips them from display).

The real issue: if `convertToModelMessages` chokes on malformed envelope text (e.g., user types something containing `[FORM_SUBMISSION]`), it could cause unexpected behavior.

**Fix:** Consider using the AI SDK's native `data` parts instead of text envelopes for structured data.

---

## Priority Matrix

| # | Bug | Severity | Impact |
|---|-----|----------|--------|
| 1 | Streaming not smooth (smoothStream + ReactMarkdown) | 🔴 High | UX feels laggy, not like Claude/ChatGPT |
| 2 | Form data lost on reload | 🔴 High | User-entered data disappears |
| 3 | Message/card duplication | 🔴 High | Confusing, cluttered chat |
| 5 | `sendAutomaticallyWhen` fires before form fill | 🟡 Medium | Uncontrolled re-sends, extra messages |
| 6 | Tool part type mismatches on reload | 🟡 Medium | Cards don't render correctly after reload |
| 7 | User message double-persisted | 🟡 Medium | Race conditions, potential data loss |
| 4 | `maxDuration` too low | 🟡 Medium | Long responses get cut off |
| 8 | Semantic envelopes in model messages | 🟢 Low | Edge case, unlikely but possible |

## Recommended Fix Order

1. **Batch 1 — Critical flow:** BUG 5 → BUG 3 → BUG 7
2. **Batch 2 — Persistence/rendering:** BUG 2 → BUG 6
3. **Batch 3 — UX polish:** BUG 1 → BUG 4 → BUG 8

---

## References

- [Vercel AI SDK — Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [Vercel AI SDK — Repeated Assistant Messages (Troubleshooting)](https://ai-sdk.dev/docs/troubleshooting/repeated-assistant-messages)
- [Vercel AI SDK — Chatbot Tool Usage](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-tool-usage)
- [Vercel AI SDK — useChat Reference](https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat)
- [vercel/ai #8854 — Duplicate messages with addToolResult](https://github.com/vercel/ai/issues/8854)
- [vercel/ai #12772 — Duplicate tool parts with non-existent tools](https://github.com/vercel/ai/issues/12772)
- [vercel/ai #13307 — Duplicate toolCallId across messages](https://github.com/vercel/ai/issues/13307)
