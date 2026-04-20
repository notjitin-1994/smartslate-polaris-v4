# Dynamic Questions Generation: Retry & Repair Mechanisms

**Last Updated**: 2025-11-01
**Status**: Production-ready
**Owners**: Backend Engineering, AI Integration

---

## Overview

The dynamic questions generation system uses Claude API to create personalized follow-up questionnaires. Due to the complexity of generating 10 sections with 50-70 questions, responses can sometimes be truncated or malformed. This document describes the comprehensive retry and repair mechanisms implemented to ensure system reliability.

---

## Architecture

### Data Flow

```
User completes static questionnaire
  ↓
API: POST /api/generate-dynamic-questions
  ↓
generateDynamicQuestionsV2() service
  ↓
Claude API (Sonnet 4.5) with max_tokens=16384
  ↓
[IF TRUNCATED OR MALFORMED]
  ↓
3-Tier Aggressive JSON Repair
  ↓
[IF REPAIR FAILS]
  ↓
Retry mechanism (max 3 attempts)
  ↓
Reset status to 'draft', track metadata
  ↓
User can retry generation
```

---

## Retry Mechanism

### Database Schema

Two new columns in `blueprint_generator` table:

```sql
-- Tracks retry attempts and generation metadata
dynamic_questions_metadata JSONB DEFAULT '{}'::jsonb

-- Stores raw LLM output for debugging
dynamic_questions_raw JSONB DEFAULT NULL
```

**Migration**: `supabase/migrations/20251101120000_add_dynamic_questions_metadata.sql`

### Retry Logic

**Location**: `frontend/app/api/generate-dynamic-questions/route.ts`

#### Retry Counter
```typescript
const retryAttempt = (blueprint.dynamic_questions_metadata?.retryAttempt as number) || 0;
const maxRetries = 3;

if (retryAttempt >= maxRetries) {
  return NextResponse.json({
    error: `Maximum retry attempts (${maxRetries}) reached...`,
    canRetry: false,
  }, { status: 429 }); // Too Many Requests
}
```

#### Success Case
On successful generation, the system:
1. Saves normalized questions to `dynamic_questions`
2. Saves raw output to `dynamic_questions_raw`
3. **Resets retry counter to 0**
4. Updates status to `'draft'`
5. Records metadata:
```typescript
dynamic_questions_metadata: {
  retryAttempt: 0, // Reset on success
  lastGeneratedAt: new Date().toISOString(),
  sectionsGenerated: normalizedSections.length,
  truncationRepaired: metadata.truncationRepaired || false,
}
```

#### Failure Case
On generation failure, the system:
1. **Increments retry counter**
2. Resets status to `'draft'` (allows user to retry)
3. **Clears incomplete data** (`dynamic_questions` and `dynamic_questions_raw` set to null)
4. Records error metadata:
```typescript
dynamic_questions_metadata: {
  retryAttempt: retryAttempt + 1,
  lastAttemptAt: new Date().toISOString(),
  lastError: error.message,
}
```
5. Returns actionable error with retry info:
```typescript
{
  error: 'Failed to generate dynamic questions. Please try again.',
  canRetry: retryAttempt + 1 < maxRetries,
  attemptsRemaining: maxRetries - (retryAttempt + 1),
}
```

---

## JSON Repair Mechanism

### Overview

**Location**: `frontend/src/lib/services/dynamicQuestionGenerationV2.ts`

The repair mechanism uses a **3-tier aggressive strategy** to salvage as much valid content as possible from truncated or malformed JSON responses.

### Strategy 1: Section-Level Repair (Primary)

**Goal**: Find and preserve the last complete section

**How it works**:
1. Uses regex to find all section start patterns: `{ "id": "s#", "title": `
2. Works backwards from the last section found
3. For each section, uses `findMatchingBrace()` to find the closing `}`
4. If a complete section is found:
   - Truncates JSON to that section's end
   - Properly closes the sections array
   - Adds metadata with `truncationRepaired: true`
   - Closes the root object

**Code**:
```typescript
const sectionPattern = /\{\s*"id"\s*:\s*"s\d+"\s*,\s*"title"\s*:/g;
const sectionMatches = Array.from(repaired.matchAll(sectionPattern));

for (let i = sectionMatches.length - 1; i >= Math.max(0, sectionMatches.length - 3); i--) {
  const startPos = sectionMatches[i].index || 0;
  const sectionEndPos = findMatchingBrace(repaired, startPos);

  if (sectionEndPos > 0) {
    repaired = repaired.substring(0, sectionEndPos + 1);
    // Close sections array, add metadata, close root
    return repaired;
  }
}
```

**Logging**:
- `dynamic_questions.repair.sections_found`: Number of sections detected
- `dynamic_questions.repair.section_truncation`: Success, which section preserved
- `dynamic_questions.repair.success`: Final repair stats

### Strategy 2: Question-Level Repair (Fallback)

**Goal**: If no complete section found, salvage individual questions

**How it works**:
1. Looks for question start patterns: `{ "id": "s#_q#"`
2. Works backwards through last 5 questions
3. Uses `findMatchingBrace()` to find complete questions
4. Manually closes all nested structures:
   - Questions array: `]`
   - Section object: `}`
   - Sections array: `]`
   - Metadata object
   - Root object: `}`

**Code**:
```typescript
const questionPattern = /\{\s*"id"\s*:\s*"s\d+_q\d+"/g;
const questionMatches = Array.from(repaired.matchAll(questionPattern));

for (let i = questionMatches.length - 1; i >= Math.max(0, questionMatches.length - 5); i--) {
  const questionEndPos = findMatchingBrace(repaired, startPos);
  if (questionEndPos > 0) {
    repaired = repaired.substring(0, questionEndPos + 1);
    // Close all nested structures
    return repaired;
  }
}
```

**Logging**:
- `dynamic_questions.repair.fallback`: Entered fallback mode
- `dynamic_questions.repair.partial_success`: Number of questions preserved

### Strategy 3: Nuclear Repair (Last Resort)

**Goal**: Just close all open brackets/braces to produce valid JSON

**How it works**:
1. Finds last complete character (last `}`, `]`, or `"`)
2. Truncates to that position
3. Removes trailing commas
4. Counts unclosed brackets and braces
5. Adds closing characters until balanced

**Code**:
```typescript
const lastCompleteChar = Math.max(
  repaired.lastIndexOf('}'),
  repaired.lastIndexOf(']'),
  repaired.lastIndexOf('"')
);
repaired = repaired.substring(0, lastCompleteChar + 1);
repaired = repaired.replace(/,\s*$/, '');

// Add missing closings
for (let i = 0; i < bracketDiff; i++) repaired += ']';
for (let i = 0; i < braceDiff; i++) repaired += '}';
```

**Logging**:
- `dynamic_questions.repair.nuclear`: Entered nuclear mode
- `dynamic_questions.repair.nuclear_complete`: Number of brackets added

---

## Helper Function: findMatchingBrace()

**Purpose**: Find the matching closing brace `}` for an opening brace at a given position

**Algorithm**:
1. Tracks brace depth (increments on `{`, decrements on `}`)
2. Ignores braces inside strings (tracks `inString` state)
3. Handles escaped quotes (`\"`) correctly
4. Returns position of matching `}` when depth reaches 0
5. Returns -1 if no matching brace found

**Code**:
```typescript
function findMatchingBrace(str: string, startPos: number): number {
  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startPos; i < str.length; i++) {
    const char = str[i];

    if (escapeNext) { escapeNext = false; continue; }
    if (char === '\\') { escapeNext = true; continue; }
    if (char === '"' && !escapeNext) { inString = !inString; continue; }

    if (!inString) {
      if (char === '{') depth++;
      else if (char === '}') {
        depth--;
        if (depth === 0) return i;
      }
    }
  }

  return -1; // No match
}
```

---

## Validation and Normalization

### Lenient Validation

**Location**: `frontend/src/lib/services/dynamicQuestionGenerationV2.ts`

After repair, validation accepts **7+ sections** instead of requiring all 10:

```typescript
if (parsed.sections.length < 7) {
  throw new Error(
    `Response has insufficient sections (${parsed.sections.length}), minimum 7 required...`
  );
}
```

**Rationale**: Better to have 7-9 high-quality sections than to reject and force retry.

### Option Value Normalization

**Location**: `frontend/app/api/generate-dynamic-questions/route.ts`

All option values are normalized for consistency:

```typescript
const { normalizeSectionQuestions } = await import('@/lib/validation/dynamicQuestionSchemas');
const normalizedSections = normalizeSectionQuestions(resultTyped.sections);
```

This ensures:
- Consistent option value formats
- No duplicate values
- Proper type coercion

---

## Monitoring and Logging

### Key Log Messages

#### Truncation Detection
```
[WARN] dynamic_questions.json.truncation_detected
{
  openBraces: 150,
  closeBraces: 145,
  openBrackets: 25,
  closeBrackets: 23,
  position: 61938
}
```

#### Section Repair Success
```
[INFO] dynamic_questions.repair.sections_found
{ count: 9 }

[INFO] dynamic_questions.repair.section_truncation
{
  sectionIndex: 8,
  truncatedAt: 58234,
  preservedSections: 9
}

[INFO] dynamic_questions.repair.success
{
  originalLength: 61938,
  repairedLength: 58400,
  sectionsPreserved: 9
}
```

#### Question Repair (Fallback)
```
[WARN] dynamic_questions.repair.fallback
"No complete sections found, attempting question-level repair"

[INFO] dynamic_questions.repair.partial_success
{
  originalLength: 61938,
  repairedLength: 42000,
  questionsPreserved: 35
}
```

#### Nuclear Repair (Last Resort)
```
[ERROR] dynamic_questions.repair.nuclear
"Could not find any complete structures, attempting nuclear repair"

[WARN] dynamic_questions.repair.nuclear_complete
{
  originalLength: 61938,
  repairedLength: 60500,
  bracketsAdded: 8
}
```

### Error Tracking

All failures are logged with:
```typescript
logger.error('dynamic_questions.json.repair_failure', 'JSON repair attempt failed', {
  originalError: parseError.message,
  repairError: repairError.message,
  jsonPreview: jsonString.substring(position - 200, position + 200),
  errorPosition,
  totalLength: jsonString.length,
});
```

---

## Configuration

### Token Limits

**Location**: `frontend/src/lib/services/dynamicQuestionGenerationV2.ts`

```typescript
const LLM_CONFIG = {
  claude: {
    model: 'claude-sonnet-4-5',
    maxTokens: 16384, // Claude Sonnet 4.5 max output tokens
    temperature: 0.7,
  },
}
```

### Verbosity Limits

**Location**: `frontend/lib/prompts/dynamic-questions-system-v2.txt`

System prompt includes character limits:
- Question labels: max 120 characters
- Help text: max 150 characters
- Option descriptions: max 80 characters
- Questions per section: 5 (not 7)

```
**CRITICAL OUTPUT STRATEGY**:
- Keep question labels concise (max 120 characters)
- Keep helpText brief but personalized (max 150 characters)
- Keep option descriptions short (max 80 characters)
- Limit to 5 questions per section to ensure completion

**ADAPTIVE OUTPUT RULE**:
If you're past section 7, make sections 8-10 extra concise to ensure completion.
```

---

## Testing Strategy

### Manual Testing

1. **Happy Path**: Complete static questionnaire → generate → verify all 10 sections
2. **Truncation Simulation**: Manually truncate API response → verify repair works
3. **Retry Flow**: Force failure → verify retry counter increments → verify reset on success
4. **Max Retries**: Trigger 3 failures → verify error message shows `canRetry: false`

### Integration Testing

**Test file**: `frontend/__tests__/integration/dynamicQuestionGeneration.test.ts` (to be created)

```typescript
describe('Dynamic Questions Retry Mechanism', () => {
  it('should increment retry counter on failure', async () => {
    // Mock Claude API to fail
    // Call generation endpoint
    // Verify metadata.retryAttempt === 1
  });

  it('should reset retry counter on success', async () => {
    // Set retryAttempt to 2
    // Mock successful generation
    // Verify metadata.retryAttempt === 0
  });

  it('should block after max retries', async () => {
    // Set retryAttempt to 3
    // Attempt generation
    // Verify 429 status code
  });
});

describe('JSON Repair Strategies', () => {
  it('should repair truncated section-level JSON', async () => {
    // Load fixture with truncated section
    // Call repairTruncatedJSON()
    // Verify valid JSON returned
  });

  it('should repair truncated question-level JSON', async () => {
    // Load fixture with truncated question
    // Verify fallback strategy works
  });

  it('should handle nuclear repair as last resort', async () => {
    // Load severely corrupted JSON
    // Verify nuclear strategy produces valid JSON
  });
});
```

---

## Troubleshooting

### Issue: Generation always fails after 3 attempts

**Symptoms**: User sees "Maximum retry attempts reached" error

**Diagnosis**:
1. Check `blueprint_generator.dynamic_questions_metadata` for `lastError`
2. Review logs for pattern of failures (same error each time?)
3. Check if static answers are valid/complete

**Fix**:
- If persistent API issue: Manually reset `retryAttempt` to 0 in database
- If data issue: Have user re-do static questionnaire
- If prompt issue: Review and update system prompt

### Issue: Repair produces invalid JSON

**Symptoms**: Logs show repair success but validation fails

**Diagnosis**:
1. Check logs for which repair strategy succeeded
2. Examine `dynamic_questions_raw` to see LLM output
3. Look for edge cases in brace matching

**Fix**:
- Add more comprehensive test cases
- Enhance `findMatchingBrace()` to handle edge cases
- Consider adding validator for repaired JSON before returning

### Issue: Sections are too verbose, causing truncation

**Symptoms**: Consistent truncation around same position (60k-65k chars)

**Diagnosis**:
1. Check if hitting max_tokens limit (16384)
2. Review generated questions for excessive verbosity
3. Check system prompt is properly limiting character counts

**Fix**:
- Reduce questions per section from 5 to 4
- Lower character limits in system prompt
- Add token usage monitoring to detect approaching limit

---

## Future Enhancements

### 1. Predictive Truncation Detection
Monitor token usage during streaming and proactively simplify remaining sections if approaching limit.

### 2. Section Prioritization
Generate most important sections first (1-5), then optional sections (6-10), so truncation affects less critical content.

### 3. Checkpoint System
Save progress after each complete section, allowing resume from last checkpoint on retry.

### 4. Adaptive Complexity
Dynamically adjust verbosity based on remaining token budget after each section.

### 5. Enhanced Monitoring
- Dashboard showing retry rates by user/time
- Alert if retry rate exceeds threshold (>10%)
- Token usage distribution analysis

---

## Related Documentation

- [Dynamic Questions System Overview](./DYNAMIC_QUESTIONS_V2.md)
- [API Routes Documentation](../api/GENERATE_DYNAMIC_QUESTIONS.md)
- [Database Schema](../database/BLUEPRINT_GENERATOR_TABLE.md)
- [Error Handling Guide](../guides/ERROR_HANDLING.md)

---

## Revision History

| Date | Version | Author | Changes |
|------|---------|--------|---------|
| 2025-11-01 | 1.0 | Backend Team | Initial comprehensive documentation |
| 2025-11-01 | 1.1 | Backend Team | Added 3-tier repair strategy details |
