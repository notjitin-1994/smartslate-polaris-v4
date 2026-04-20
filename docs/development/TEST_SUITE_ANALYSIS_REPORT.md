# SmartSlate Polaris V3 - Comprehensive Test Suite Analysis Report

**Generated:** 2025-01-12
**Analyst:** Claude Code
**Analysis Method:** Code implementation review (source of truth), not documentation

---

## Executive Summary

### Current State
- **Total Test Files:** 361
- **Total API Routes:** 113
- **Total Service Files:** 15
- **Total Components:** 494
- **Test Coverage Target:** 90%+ (per vitest.config.ts)
- **Actual Coverage:** Unknown (needs measurement with --coverage flag)

### Critical Findings
🔴 **CRITICAL GAPS IDENTIFIED:**
1. **Zero test coverage for Claude AI client** - The most critical service
2. **Missing tests for 80%+ of API routes** (~90 untested routes)
3. **Minimal component testing** (~1% of 494 components tested)
4. **No E2E tests running** (excluded in vitest.config.ts)
5. **Missing AI integration failure scenarios**
6. **No tests for export features** (PDF, Word, Markdown)

---

## 1. Test Infrastructure Analysis

### 1.1 Test Framework Configuration ✅ GOOD

**Vitest Configuration** (`frontend/vitest.config.ts`)
- **Environment:** jsdom (appropriate for React)
- **Coverage Provider:** v8
- **Coverage Thresholds:** Ambitious (90%+ across the board)
  - Global: 90% branches/functions/lines/statements
  - API routes: 95% (even more stringent)
  - Services: 90%
- **Test Timeout:** 30s (appropriate for AI operations)
- **Isolation:** Enabled (good practice)
- **Mock Clearing:** Automatic (clearMocks: true, restoreMocks: true)

**Environment Variables:** Well-configured for testing
```typescript
NEXT_PUBLIC_APP_URL: 'http://localhost:3000'
NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321'
ANTHROPIC_API_KEY: 'test-anthropic-key'
RAZORPAY_KEY_ID: 'test-razorpay-key-id'
```

### 1.2 Test Organization ✅ GOOD STRUCTURE

```
frontend/__tests__/
├── unit/                 # Unit tests (utils, services, security)
├── integration/          # Integration tests (API, Supabase, auth)
├── components/           # Component tests (very limited)
├── checkout/             # Payment flow tests
├── blueprints/           # Blueprint-specific tests
├── e2e/                  # E2E tests (EXCLUDED from runs)
├── fixtures/             # Test data and factories
└── mocks/                # Mock implementations
```

**ISSUE:** E2E tests are excluded in vitest config:
```typescript
exclude: [
  '__tests__/e2e/',  // ❌ E2E tests not running
]
```

---

## 2. Detailed Coverage Analysis by Domain

### 2.1 🔴 CRITICAL: Claude AI Integration (0% Coverage)

**Files Without Tests:**
- `lib/claude/client.ts` (318 lines) - **ZERO TESTS**
- `lib/claude/clientWithCostTracking.ts` - **ZERO TESTS**
- `lib/claude/validation.ts` - **ZERO TESTS**
- `lib/claude/prompts.ts` - **ZERO TESTS**
- `lib/claude/fallback.ts` - **ZERO TESTS**
- `lib/claude/config.ts` - **ZERO TESTS**

**Why This is Critical:**
The Claude client is the **core dependency** for:
- Blueprint generation (dual-fallback: Sonnet 4.5 → Sonnet 4)
- Dynamic question generation
- All AI-powered features

**Current Implementation Review:**
```typescript
// lib/claude/client.ts:113-170
async generate(request: ClaudeRequest): Promise<ClaudeResponse> {
  // Complex logic:
  // - Retry with exponential backoff
  // - Automatic token limit adjustment
  // - Truncation detection and retry
  // - Timeout handling (AbortController)
  // - Error classification and wrapping

  // NONE OF THIS IS TESTED! ❌
}
```

**Missing Test Scenarios:**
1. ✗ Successful API calls with various models
2. ✗ Retry logic with exponential backoff
3. ✗ Timeout handling (408 errors)
4. ✗ Rate limiting (429 errors)
5. ✗ Token truncation detection (`max_tokens` stop reason)
6. ✗ Automatic token limit escalation (1.5x increase)
7. ✗ Network failures and error wrapping
8. ✗ Response parsing (JSON extraction)
9. ✗ Invalid API key handling (401 errors)
10. ✗ Malformed responses
11. ✗ AbortController signal handling
12. ✗ Cost tracking integration
13. ✗ Prompt caching token usage

### 2.2 🟡 Services Layer (20% Coverage)

**Well-Tested Services:**
- ✅ `BlueprintUsageService` - **EXCELLENT** (931 lines of tests)
  - Comprehensive fail-closed logic testing
  - Dual counting (creation + saving)
  - Edge cases for limit enforcement
  - Monthly rollover testing
  - Security-critical CVE-001 fix validation

**Services Missing Tests:**
- ❌ `blueprintGenerationService.ts` (518 lines) - **CRITICAL**
  - Dual-fallback cascade (Sonnet 4.5 → Sonnet 4)
  - Cache integration (exact + similar match)
  - Input validation and sanitization
  - Blueprint markdown conversion
  - Usage tracking integration

- ❌ `questionGenerationService.ts` (113 lines) - **CRITICAL**
  - Claude primary generation
  - Error handling and fallback
  - Context building from static answers
  - V2.0 format support

- ❌ `markdownGenerator.ts` - Blueprint to markdown conversion
- ❌ `blueprintMarkdownConverter.ts` - Alternative markdown converter
- ❌ `reportExportService.ts` - PDF/Word export (SECURITY CONCERN)
- ❌ `razorpayCheckoutService.ts` - Payment integration
- ❌ `costTrackingService.ts` - AI cost monitoring
- ❌ `alertGenerationService.ts` - Admin alerts

### 2.3 🟡 API Routes (25% Coverage)

**API Route Test Coverage:**
```
Tested:      ~28 routes
Untested:    ~85 routes
Coverage:    ~25%
```

**Well-Tested Routes:**
- ✅ `/api/auth/check-password` - Comprehensive (466 lines)
  - OAuth vs email user detection
  - Edge cases (no identities, malformed data)
  - Timing attack prevention
  - User metadata handling

- ✅ `/api/subscriptions/create-subscription` - Extensive (956 lines)
  - Request validation (Zod schemas)
  - Razorpay integration mocking
  - Business logic (active subscription checks)
  - Database operations
  - Error handling (rate limits, failures)
  - Security (XSS, SQL injection sanitization)

**Critical Untested Routes:**
- ❌ `/api/blueprints/generate` (14KB file!) - **MOST CRITICAL**
  - Main blueprint generation endpoint
  - Complex workflow orchestration
  - Dual-fallback AI cascade
  - Usage limit checking
  - Markdown conversion
  - Admin bypass logic
  - Counter increment V2 (fail-closed)

- ❌ `/api/generate-dynamic-questions` (12KB file!) - **CRITICAL**
  - AI question generation
  - V2.0 schema validation
  - Retry mechanism with metadata
  - Counter increment logic
  - Rollback on limit exceeded

- ❌ `/api/admin/*` - Most admin routes untested (~40 routes)
- ❌ `/api/user/activity/*` - Activity logging untested
- ❌ `/api/blueprints/share/*` - Sharing functionality untested
- ❌ `/api/payments/*` - Payment verification untested
- ❌ `/api/webhooks/razorpay` - Webhook handling untested (SECURITY RISK)

### 2.4 🔴 Component Testing (1% Coverage)

**Components:**
- Total: 494 components
- Tested: ~5-10 components
- Coverage: **<2%**

**Tested Components:**
- ✅ `SystemStatusModal` - Basic rendering tests
- ✅ `CardPaymentForm` - Payment form validation
- ✅ `CustomCheckoutModal` - Checkout flow
- ✅ `SignupFormContent` - Auth form validation
- ✅ `SetPasswordModal` - Password setting

**Critical Untested Components:**
- ❌ `DynamicQuestionRenderer` - **MOST CRITICAL COMPONENT**
  - Renders 27+ input types
  - Auto-save every 30 seconds
  - Section navigation
  - Form validation with Zod
  - 1000+ lines of complex logic

- ❌ `DynamicQuestionnaireProgress` - Progress tracking
- ❌ Blueprint viewer components
- ❌ Static questionnaire components
- ❌ Dashboard components
- ❌ Admin panel components
- ❌ Pricing/subscription components

### 2.5 🟢 Validation & Security (GOOD)

**Well-Tested:**
- ✅ `dynamicQuestionSchemas.test.ts` (303 lines)
  - Checkbox/multi-select validation
  - Fuzzy matching (case-insensitive, underscore/hyphen normalization)
  - Edge cases (empty arrays, malformed data)
  - Real bug reproduction (priorities_challenges case)

- ✅ `dataIntegrity.test.ts`
  - Static answers V2 format validation
  - Dynamic answers validation
  - Sanitization logic

- ✅ `errorSanitization.test.ts`
  - PII removal
  - Stacktrace sanitization
  - Error message sanitization

**Missing:**
- ❌ XSS testing in PDF/Word export
- ❌ RLS policy testing (Supabase)
- ❌ Rate limiting tests (per-user, per-IP)
- ❌ CSRF token validation
- ❌ API key exposure prevention

### 2.6 🔴 Integration Testing (WEAK)

**Current Integration Tests:**
- Admin user management (sessions, analytics)
- Authentication flows (OAuth, password)
- Razorpay integration (types, plans, client)
- Set password flow

**Missing:**
- ❌ **End-to-end blueprint generation flow**
  - Static questionnaire → Dynamic questions → Blueprint generation
  - Cache hits (exact + similar)
  - Usage limit enforcement
  - Multiple user scenarios

- ❌ **Supabase RLS policies** (CRITICAL SECURITY GAP)
  - Row-level security for blueprints
  - User isolation testing
  - Admin access bypass testing
  - Service role vs anon key behavior

- ❌ **AI integration failure scenarios**
  - Claude API down → No fallback to Ollama in current impl
  - Partial response handling
  - Token limit exceeded
  - Rate limiting cascade

- ❌ **Payment flow integration**
  - End-to-end Razorpay webhook handling
  - Subscription activation
  - Usage limit updates
  - Failed payment handling

### 2.7 🔴 E2E Testing (DISABLED)

**Status:** E2E tests exist but are **excluded from test runs**

```typescript
// vitest.config.ts:65
exclude: [
  '__tests__/e2e/',  // ❌ Not running
]
```

**Existing E2E Test Files:**
- `__tests__/e2e/oauth-password-flow.test.tsx`
- `__tests__/e2e/admin/user-management.spec.ts`
- `__tests__/e2e/admin/analytics.spec.ts`

**Why This Matters:**
E2E tests are the **only way** to verify:
- Complete user workflows
- Browser-specific behavior
- Real database interactions
- Authentication flows with Supabase
- Payment flows with Razorpay

**Recommendation:** Use Playwright or Cypress for E2E tests

---

## 3. Edge Cases & Failure Scenarios Analysis

### 3.1 AI Integration Failures (UNTESTED)

**Current Implementation:**
- Primary: Claude Sonnet 4.5
- Fallback: Claude Sonnet 4
- **NO Ollama fallback** (removed from implementation)

**Untested Scenarios:**
1. ❌ Claude API completely down (no fallback!)
2. ❌ Partial response (network interruption mid-stream)
3. ❌ Malformed JSON in response
4. ❌ Token limit exceeded (max 20K tokens)
5. ❌ Rate limiting (429) during peak usage
6. ❌ Concurrent request handling
7. ❌ Cache poisoning (storing malformed blueprints)
8. ❌ Retry exhaustion (max 3 attempts)
9. ❌ Timeout scenarios (13.3 min max on Vercel)
10. ❌ Cost tracking failure impact

### 3.2 Database & Supabase Failures (PARTIALLY TESTED)

**Tested:**
- ✅ Connection errors (some API routes)
- ✅ Not found errors (404)
- ✅ Timeout errors (some services)

**Untested:**
- ❌ **RLS policy violations** (CRITICAL)
  - User A accessing User B's blueprint
  - Bypassing RLS with service role (accidental exposure)
  - Missing RLS on new tables

- ❌ Transaction rollback scenarios
- ❌ Concurrent update conflicts
- ❌ Database migration failures
- ❌ Supabase storage failures (if used)
- ❌ Realtime subscription failures

### 3.3 Payment & Subscription Failures (MINIMAL TESTING)

**Tested:**
- ✅ Razorpay customer creation
- ✅ Subscription creation
- ✅ Some error scenarios

**Untested:**
- ❌ Webhook signature verification (SECURITY RISK!)
- ❌ Duplicate webhook delivery
- ❌ Webhook replay attacks
- ❌ Payment failure after subscription created
- ❌ Subscription cancellation edge cases
- ❌ Upgrade/downgrade scenarios
- ❌ Grace period handling
- ❌ Usage limit sync after payment

### 3.4 Validation & Sanitization Gaps

**Well-Tested:**
- ✅ Dynamic question validation (fuzzy matching)
- ✅ Data integrity checks
- ✅ Error sanitization

**Missing:**
- ❌ XSS in blueprint content (user-generated data)
- ❌ ReDoS vulnerabilities (regex in validation)
  - **NOTE:** CVE fix exists for dynamic form validation
- ❌ SQL injection in raw queries (if any)
- ❌ Path traversal in file exports
- ❌ SSRF in webhook handlers

---

## 4. Industry Best Practices Comparison

### 4.1 Next.js 15 Testing (Based on 2025 Research)

**✅ Following Best Practices:**
- Using Vitest (modern, fast, Vite-native)
- Proper environment setup (jsdom for React)
- Mock Supabase client in tests
- node-mocks-http for API route testing

**❌ Not Following Best Practices:**
- Missing `next-test-api-route-handler` for App Router testing
- No MSW (Mock Service Worker) for API mocking
- E2E tests disabled (should use Playwright/Cypress)
- No visual regression testing

**Recommendations:**
```bash
# Add recommended packages
npm install -D next-test-api-route-handler
npm install -D msw
npm install -D @playwright/test
```

### 4.2 Supabase Testing (Based on Official Docs)

**✅ Following Best Practices:**
- Separate test environment variables
- Service role for test setup/teardown

**❌ Not Following Best Practices:**
- **NO pgTAP tests for RLS policies** (CRITICAL GAP)
- No database-level testing
- Missing test helpers for user simulation
- No transaction isolation for tests

**Supabase Official Recommendation:**
> "Testing is critical for database development, especially when working with Row Level Security (RLS) policies. Use pgTAP for database-level tests."

**Missing Implementation:**
```sql
-- Example: Should have tests like this
BEGIN;
SELECT plan(5);

-- Test: User can only see their own blueprints
SELECT set_config('request.jwt.claims', '{"sub": "user-123"}', true);
SELECT results_eq(
    'SELECT id FROM blueprint_generator WHERE user_id = ''user-123''',
    $$VALUES ('expected-id')$$,
    'User can only access own blueprints'
);

SELECT finish();
ROLLBACK;
```

### 4.3 AI/LLM API Testing (Based on 2025 Research)

**✅ Following Best Practices:**
- Structured test data (fixtures)
- Error scenario planning

**❌ Not Following Best Practices:**
- **NO AI response mocking** (testing against live API)
- No LLM-as-a-Judge pattern for evaluation
- No automated grading for AI outputs
- Missing fallback architecture tests
- No retry strategy tests
- No cost tracking validation

**Industry Standard (from research):**
> "Production deployments report 99.7% uptime using multi-provider strategies compared to 88.3% with Claude-only implementations"

**Current Implementation:**
- Only dual-fallback (Sonnet 4.5 → Sonnet 4)
- **NO third provider fallback**
- **NO health checking**
- **NO response quality validation**

---

## 5. Test Quality Assessment

### 5.1 Existing Test Quality ✅ HIGH

**Excellent Examples:**
- `BlueprintUsageService.test.ts` - **EXEMPLARY**
  - Clear test organization
  - Comprehensive edge cases
  - Proper mocking with Vitest
  - Security-focused (fail-closed testing)
  - Well-documented test intent

- `check-password.test.ts` - **EXEMPLARY**
  - AAA pattern (Arrange, Act, Assert)
  - Security considerations (timing attacks)
  - API contract validation
  - Comprehensive edge cases

**Code Quality:**
```typescript
// GOOD: Clear test intent, proper mocking
describe('incrementCreationCountV2 - SECURITY CRITICAL (CVE-001 fix)', () => {
  it('should DENY when limit exceeded (fail-closed)', async () => {
    mocks.mockRpc.mockResolvedValue({
      data: [{ success: false, reason: 'Monthly creation limit of 10 reached', new_count: 10 }],
      error: null,
    });

    const result = await BlueprintUsageService.incrementCreationCountV2(
      mocks.supabase,
      'test-user-id'
    );

    expect(result).toEqual({
      success: false,
      reason: 'Monthly creation limit of 10 reached',
      newCount: 10,
    });
  });
});
```

### 5.2 Test Patterns Used

**✅ Good Patterns:**
- Factory functions for test data
- Mock builders (createMockSupabaseClient)
- Shared fixtures (__tests__/fixtures/)
- Descriptive test names
- Proper setup/teardown (beforeEach/afterEach)

**❌ Anti-patterns Found:**
- Some tests don't clean up timers
- Missing async/await in some tests
- Hard-coded test data (should use factories)
- Inconsistent mock structure across files

---

## 6. Critical Gaps Summary

### 6.1 MUST FIX (P0 - Critical)

1. **Claude AI Client Testing** (0 tests → Need 50+ tests)
   - Retry logic with exponential backoff
   - Token limit escalation
   - Error handling and classification
   - Response parsing
   - Timeout handling

2. **Blueprint Generation Service** (0 tests → Need 30+ tests)
   - Dual-fallback cascade
   - Cache integration
   - Usage tracking
   - Markdown conversion

3. **Question Generation Service** (0 tests → Need 20+ tests)
   - Claude generation
   - Error handling
   - Context building

4. **Critical API Routes** (0 tests → Need 100+ tests)
   - `/api/blueprints/generate`
   - `/api/generate-dynamic-questions`
   - `/api/webhooks/razorpay` (SECURITY)

5. **RLS Policy Testing** (0 tests → Need pgTAP setup)
   - User isolation
   - Admin access
   - Service role behavior

### 6.2 SHOULD FIX (P1 - High Priority)

6. **Component Testing** (<2% → Target 60%+)
   - DynamicQuestionRenderer (most critical)
   - Blueprint viewers
   - Static questionnaire

7. **E2E Testing** (disabled → Need 20+ E2E tests)
   - Enable E2E tests
   - Add Playwright configuration
   - Complete user workflows

8. **Integration Testing** (weak → Need 30+ tests)
   - End-to-end blueprint flow
   - Payment flow integration
   - Supabase integration

9. **Export Functionality** (0 tests → Need 15+ tests)
   - PDF generation
   - Word generation
   - Markdown generation
   - XSS prevention in exports

### 6.3 NICE TO HAVE (P2 - Medium Priority)

10. **Visual Regression Testing** (0 → Need setup)
11. **Performance Testing** (0 → Need benchmarks)
12. **Load Testing** (0 → Need stress tests)
13. **Accessibility Testing** (0 → Need a11y tests)
14. **Internationalization** (0 → Need i18n tests if applicable)

---

## 7. Test Coverage Metrics Analysis

### 7.1 Current vs Target

| Category | Target | Estimated Current | Gap | Priority |
|----------|--------|-------------------|-----|----------|
| **Services** | 90% | ~20% | **-70%** | 🔴 P0 |
| **API Routes** | 95% | ~25% | **-70%** | 🔴 P0 |
| **Components** | 90% | ~1% | **-89%** | 🟡 P1 |
| **Utilities** | 95% | ~60% | **-35%** | 🟢 P2 |
| **Integration** | 80% | ~15% | **-65%** | 🔴 P0 |
| **E2E** | 70% | **0%** | **-70%** | 🟡 P1 |

### 7.2 Test Execution Metrics

**Run the full test suite with coverage:**
```bash
cd frontend
npm run test -- --coverage
```

**Current Test Results:** (From test-results.json)
- File size: 1.7MB (extensive test suite!)
- JSON format (need to parse for detailed metrics)

---

## 8. Actionable Recommendations

### 8.1 Immediate Actions (Week 1)

**Priority 1: Claude AI Client Testing**
```bash
# Create test file
touch frontend/lib/claude/__tests__/client.test.ts

# Essential tests needed:
# - API call success scenarios
# - Retry logic (3 attempts, exponential backoff)
# - Timeout handling (AbortController)
# - Token truncation detection
# - Error classification (429, 408, 500, etc.)
# - Response parsing (text, JSON)
```

**Priority 2: Blueprint Generation Service Testing**
```bash
touch frontend/lib/services/__tests__/blueprintGenerationService.test.ts

# Essential tests:
# - Dual-fallback cascade (Sonnet 4.5 → 4)
# - Cache hits (exact match)
# - Cache hits (similar match)
# - Input validation
# - Usage limit checking
# - Markdown conversion integration
```

**Priority 3: Critical API Route Testing**
```bash
touch frontend/__tests__/integration/api/blueprints-generate.test.ts
touch frontend/__tests__/integration/api/generate-dynamic-questions.test.ts
touch frontend/__tests__/unit/api/webhooks-razorpay.test.ts

# Use next-test-api-route-handler for App Router testing
npm install -D next-test-api-route-handler
```

### 8.2 Short-term Actions (Month 1)

**Set up RLS Policy Testing (pgTAP)**
```bash
# Add to supabase/tests/
mkdir -p supabase/tests
touch supabase/tests/rls_blueprint_generator.test.sql

# Configure Supabase CLI for testing
supabase test new rls_policies
```

**Enable E2E Testing (Playwright)**
```bash
# Install Playwright
npm init playwright@latest

# Configure for Next.js 15
# Update vitest.config.ts to NOT exclude e2e tests
# Migrate existing e2e tests to Playwright
```

**Add MSW for API Mocking**
```bash
npm install -D msw
npx msw init public/ --save

# Create handlers for Claude API, Supabase, Razorpay
touch frontend/__tests__/mocks/handlers/claude.ts
touch frontend/__tests__/mocks/handlers/supabase.ts
touch frontend/__tests__/mocks/handlers/razorpay.ts
```

### 8.3 Medium-term Actions (Quarter 1)

**Component Testing Strategy**
- Test critical components first (DynamicQuestionRenderer)
- Use React Testing Library best practices
- Mock external dependencies (Supabase, APIs)
- Test accessibility (WCAG AA compliance)

**Integration Testing Strategy**
- End-to-end user workflows
- Database transaction rollback after tests
- Realistic test data (factories)
- Concurrent user scenarios

**Performance Testing**
- Lighthouse CI for performance regression
- Load testing for API routes (K6, Artillery)
- Database query optimization tests
- AI response time monitoring

### 8.4 Test Data Management

**Create Comprehensive Test Fixtures**
```typescript
// frontend/__tests__/fixtures/blueprints.ts
export const mockBlueprintWithAllSections = { /* ... */ };
export const mockBlueprintMinimal = { /* ... */ };
export const mockBlueprintTruncated = { /* ... */ };

// frontend/__tests__/fixtures/claude-responses.ts
export const mockClaudeSuccessResponse = { /* ... */ };
export const mockClaudeTruncatedResponse = { /* ... */ };
export const mockClaudeRateLimitError = { /* ... */ };
```

**Factory Pattern for Test Data**
```typescript
// frontend/__tests__/factories/blueprint.ts
export const createBlueprint = (overrides?: Partial<Blueprint>) => ({
  id: uuid(),
  user_id: uuid(),
  status: 'draft',
  created_at: new Date().toISOString(),
  ...overrides,
});
```

---

## 9. Testing Tools & Infrastructure Recommendations

### 9.1 Add Missing Tools

```json
// package.json additions
{
  "devDependencies": {
    "@playwright/test": "^1.41.0",
    "msw": "^2.0.0",
    "next-test-api-route-handler": "^4.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@axe-core/react": "^4.8.0",
    "lighthouse-ci": "^0.12.0"
  }
}
```

### 9.2 CI/CD Integration

**GitHub Actions Workflow** (`.github/workflows/test.yml`)
```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: supabase/postgres:15
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npx playwright install
      - run: npm run test:e2e
```

### 9.3 Test Reporting & Monitoring

**Add Test Coverage Reporting**
```bash
# Generate and view coverage report
npm run test -- --coverage --coverage.reporter=html
open coverage/index.html

# CI: Upload to Codecov
npx codecov --token=$CODECOV_TOKEN
```

**Performance Monitoring**
```bash
# Add Lighthouse CI
npm install -D @lhci/cli
npx lhci autorun
```

---

## 10. Specific Test Cases Needed

### 10.1 Claude Client Test Suite (50+ tests)

<details>
<summary><b>Click to expand detailed test cases</b></summary>

```typescript
// frontend/lib/claude/__tests__/client.test.ts

describe('ClaudeClient', () => {
  describe('generate()', () => {
    // Success Scenarios
    it('should successfully generate with default model');
    it('should successfully generate with Sonnet 4.5');
    it('should successfully generate with Sonnet 4');
    it('should handle custom temperature');
    it('should handle custom max_tokens');

    // Retry Logic
    it('should retry on network failure with exponential backoff');
    it('should retry 3 times before failing');
    it('should wait 1s, 2s, 4s between retries');
    it('should not retry on 401 (auth error)');
    it('should not retry on 400 (bad request)');

    // Token Truncation
    it('should detect max_tokens truncation');
    it('should retry with 1.5x token limit on truncation');
    it('should retry up to 3 times with increasing limits');
    it('should throw error when reaching 20k token limit');
    it('should log truncation warnings');

    // Timeout Handling
    it('should timeout after configured duration');
    it('should abort request on timeout (AbortController)');
    it('should throw ClaudeApiError with 408 status');
    it('should clear timeout on success');
    it('should clear timeout on error');

    // Error Handling
    it('should wrap network errors in ClaudeApiError');
    it('should preserve original error in originalError field');
    it('should classify error types (timeout, network, rate_limit)');
    it('should handle 429 rate limit errors');
    it('should handle 500 server errors');
    it('should handle 503 service unavailable');
    it('should handle malformed JSON responses');

    // Response Parsing
    it('should extract text from response');
    it('should handle multiple content blocks');
    it('should filter non-text content blocks');
    it('should parse JSON from response');
    it('should throw on invalid JSON');

    // Prompt Caching
    it('should track cache_creation_input_tokens');
    it('should track cache_read_input_tokens');
    it('should report cache metrics');
  });
});
```
</details>

### 10.2 Blueprint Generation Service Test Suite (30+ tests)

<details>
<summary><b>Click to expand detailed test cases</b></summary>

```typescript
// frontend/lib/services/__tests__/blueprintGenerationService.test.ts

describe('BlueprintGenerationService', () => {
  describe('generate()', () => {
    // Dual-Fallback Cascade
    it('should try Sonnet 4.5 first');
    it('should fallback to Sonnet 4 on Sonnet 4.5 failure');
    it('should log fallback decision reason');
    it('should return metadata with fallbackUsed flag');
    it('should not fallback on auth errors');
    it('should not fallback on validation errors');

    // Cache Integration
    it('should check cache before generation (exact match)');
    it('should check cache for similar blueprints');
    it('should cache generated blueprints');
    it('should handle cache misses gracefully');
    it('should handle cache errors gracefully');

    // Input Validation
    it('should validate static answers before generation');
    it('should validate dynamic answers before generation');
    it('should sanitize user input');
    it('should reject invalid static answers');
    it('should reject invalid dynamic answers');
    it('should log validation errors');

    // Blueprint Validation
    it('should validate generated blueprint structure');
    it('should detect incomplete blueprints');
    it('should retry on incomplete blueprint');
    it('should validate required sections exist');
    it('should log validation warnings');

    // Usage Tracking
    it('should check creation limits before generation');
    it('should check saving limits after generation');
    it('should increment creation count on success');
    it('should increment saving count on completion');
    it('should handle limit exceeded errors');
    it('should respect admin bypass for limits');

    // Performance
    it('should complete within timeout (13.3 min)');
    it('should track generation duration');
    it('should report performance metrics');
  });
});
```
</details>

### 10.3 DynamicQuestionRenderer Component Test Suite (40+ tests)

<details>
<summary><b>Click to expand detailed test cases</b></summary>

```typescript
// frontend/components/demo-dynamicv2/__tests__/DynamicQuestionRenderer.test.tsx

describe('DynamicQuestionRenderer', () => {
  describe('Input Type Rendering', () => {
    // 27+ input types to test
    it('should render text input');
    it('should render textarea');
    it('should render number input');
    it('should render email input');
    it('should render url input');
    it('should render tel input');
    it('should render date input');
    it('should render time input');
    it('should render datetime input');
    it('should render select dropdown');
    it('should render radio buttons');
    it('should render radio pills');
    it('should render checkbox');
    it('should render checkbox pills');
    it('should render checkbox cards');
    it('should render slider');
    it('should render range slider');
    it('should render rating scale');
    it('should render toggle switch');
    it('should render currency input');
    it('should render percentage input');
    it('should render multi-select');
    it('should render tag input');
    it('should render file upload');
    it('should render rich text editor');
    it('should render code editor');
    it('should render color picker');
    it('should render date range picker');
  });

  describe('Form Validation', () => {
    it('should validate required fields');
    it('should validate email format');
    it('should validate URL format');
    it('should validate phone format');
    it('should validate number ranges');
    it('should validate min/max length');
    it('should validate pattern (regex)');
    it('should show validation errors');
    it('should clear validation errors on fix');
  });

  describe('Auto-Save', () => {
    it('should auto-save every 30 seconds');
    it('should debounce rapid changes');
    it('should show save status indicator');
    it('should handle save errors');
    it('should retry failed saves');
  });

  describe('Section Navigation', () => {
    it('should navigate to next section');
    it('should navigate to previous section');
    it('should track current section');
    it('should validate section before navigation');
    it('should show progress indicator');
  });
});
```
</details>

---

## 11. Security Testing Requirements

### 11.1 OWASP Top 10 Coverage

| Vulnerability | Current Testing | Gap | Priority |
|---------------|----------------|-----|----------|
| **A01: Broken Access Control** | Partial (auth tests) | RLS policies untested | 🔴 P0 |
| **A02: Cryptographic Failures** | None | API keys, secrets handling | 🔴 P0 |
| **A03: Injection** | Good (sanitization) | SQL injection in raw queries | 🟡 P1 |
| **A04: Insecure Design** | None | Rate limiting, account enumeration | 🟡 P1 |
| **A05: Security Misconfiguration** | None | CORS, CSP headers | 🟢 P2 |
| **A06: Vulnerable Components** | None | Dependency scanning | 🟢 P2 |
| **A07: Authentication Failures** | Good | Session management | 🟢 P2 |
| **A08: Software/Data Integrity** | Good | Webhook signature verification | 🔴 P0 |
| **A09: Logging Failures** | None | Security event logging | 🟡 P1 |
| **A10: SSRF** | None | Webhook URL validation | 🟡 P1 |

### 11.2 Specific Security Tests Needed

```typescript
describe('Security Tests', () => {
  // RLS Policy Testing (pgTAP)
  it('should prevent cross-user blueprint access');
  it('should enforce admin-only routes');
  it('should handle service role correctly');

  // API Key Security
  it('should not expose API keys in responses');
  it('should not log API keys');
  it('should validate API key format');

  // Webhook Security
  it('should verify Razorpay webhook signatures');
  it('should reject invalid signatures');
  it('should prevent replay attacks');
  it('should handle duplicate webhooks idempotently');

  // XSS Prevention
  it('should sanitize user input in blueprints');
  it('should sanitize PDF export content');
  it('should sanitize Word export content');
  it('should escape HTML in markdown');

  // Rate Limiting
  it('should rate limit API requests per user');
  it('should rate limit API requests per IP');
  it('should rate limit login attempts');
  it('should rate limit blueprint generation');
});
```

---

## 12. Conclusion & Next Steps

### 12.1 Key Takeaways

**Strengths:**
- ✅ Solid test infrastructure (Vitest, good configuration)
- ✅ Excellent test quality for existing tests
- ✅ Good security focus (fail-closed testing in BlueprintUsageService)
- ✅ Comprehensive validation testing

**Critical Weaknesses:**
- ❌ **Zero coverage for Claude AI client** (most critical dependency)
- ❌ **Minimal API route coverage** (25% of 113 routes)
- ❌ **Virtually no component testing** (<2% of 494 components)
- ❌ **E2E tests disabled** (critical user workflows untested)
- ❌ **No RLS policy testing** (critical security gap)

### 12.2 Recommended Prioritization

**Phase 1 (Weeks 1-2): Critical Foundations**
1. Claude AI Client (50+ tests)
2. Blueprint Generation Service (30+ tests)
3. Question Generation Service (20+ tests)
4. Critical API routes (100+ tests)

**Phase 2 (Weeks 3-4): Security & Integration**
5. RLS Policy Testing (pgTAP setup + 20+ tests)
6. Webhook security (15+ tests)
7. Integration tests (30+ tests)
8. Enable E2E testing (20+ tests)

**Phase 3 (Weeks 5-8): Components & Coverage**
9. DynamicQuestionRenderer (40+ tests)
10. Other critical components (60+ tests)
11. Remaining API routes (70+ tests)
12. Export functionality (15+ tests)

**Phase 4 (Ongoing): Maintenance & Enhancement**
13. Visual regression testing
14. Performance testing
15. Load testing
16. Accessibility testing

### 12.3 Success Metrics

**Coverage Goals by End of Phase 3:**
- Overall: 90%+ (currently unknown, likely <40%)
- Services: 90%+ (currently ~20%)
- API Routes: 95%+ (currently ~25%)
- Components: 60%+ (currently <2%)
- Integration: 80%+ (currently ~15%)
- E2E: 70%+ (currently 0%)

**Quality Metrics:**
- Zero critical security vulnerabilities in test coverage
- All RLS policies tested (pgTAP)
- All AI failure scenarios tested
- All payment flows tested
- All export features tested

---

## Appendix A: Quick Reference Commands

### Run Tests
```bash
cd frontend

# Run all tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- __tests__/unit/services/blueprintUsageService.test.ts

# Run in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration
```

### Generate Coverage Report
```bash
npm run test -- --coverage --coverage.reporter=html
open coverage/index.html
```

### Add New Test File
```bash
# Service test
mkdir -p lib/claude/__tests__
touch lib/claude/__tests__/client.test.ts

# API route test
mkdir -p __tests__/integration/api
touch __tests__/integration/api/blueprints-generate.test.ts

# Component test
mkdir -p components/__tests__
touch components/__tests__/DynamicQuestionRenderer.test.tsx
```

---

## Appendix B: Test Template Examples

### API Route Test Template
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/your-route/route';

vi.mock('@/lib/supabase/server');

describe('POST /api/your-route', () => {
  let mockSupabase: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockSupabase = createMockSupabaseClient();
    const { createClient } = require('@/lib/supabase/server');
    createClient.mockReturnValue(mockSupabase);
  });

  it('should handle successful request', async () => {
    const request = new NextRequest('http://localhost:3000/api/your-route', {
      method: 'POST',
      body: JSON.stringify({ /* test data */ }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toMatchObject({ /* expected structure */ });
  });
});
```

### Service Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { YourService } from '@/lib/services/yourService';

describe('YourService', () => {
  describe('methodName()', () => {
    it('should handle success case', async () => {
      const service = new YourService();
      const result = await service.methodName(/* params */);

      expect(result).toBeDefined();
      expect(result).toMatchObject({ /* expected */ });
    });

    it('should handle error case', async () => {
      const service = new YourService();

      await expect(
        service.methodName(/* invalid params */)
      ).rejects.toThrow('Expected error message');
    });
  });
});
```

### Component Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { YourComponent } from './YourComponent';

describe('YourComponent', () => {
  it('should render correctly', () => {
    render(<YourComponent />);

    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const user = userEvent.setup();
    render(<YourComponent />);

    await user.click(screen.getByRole('button'));

    expect(screen.getByText('Changed text')).toBeInTheDocument();
  });
});
```

---

**Report End**

*For questions or clarifications, refer to the codebase implementation as the source of truth.*
