# Interactive Debugging Workflows & Checklists

## 🔄 Workflow: Systematic Debugging Process

### Phase 1: Issue Triage (30 seconds)
```
⚡ RAPID ASSESSMENT CHECKLIST
┌─────────────────────────────────────────────────────────────┐
│ ❏ Parse error message for key indicators                    │
│ ❏ Categorize error type (syntax/runtime/logic/config)      │
│ ❏ Assess severity (blocking/degraded/minor)                │
│ ❏ Identify affected components/modules                     │
│ ❏ Check recent changes (git status, recent commits)        │
└─────────────────────────────────────────────────────────────┘
```

### Phase 2: Context Gathering (2-5 minutes)
```
📊 CONTEXT INVENTORY
┌─────────────────────────────────────────────────────────────┐
│ CODEBASE ANALYSIS:                                          │
│ ❏ Examine error location and related files                 │
│ ❏ Check imports/exports and dependencies                   │
│ ❏ Review configuration files (tsconfig, next.config)       │
│ ❏ Analyze package.json for version conflicts               │
│                                                             │
│ ENVIRONMENT CHECK:                                          │
│ ❏ Browser console errors/warnings                          │
│ ❏ Network tab for API call failures                        │
│ ❏ Environment variables and .env files                     │
│ ❏ Build tools configuration                               │
│                                                             │
│ ERROR PATTERNS:                                            │
│ ❏ Search for similar error patterns in codebase           │
│ ❏ Check for common anti-patterns                           │
│ ❏ Review recent similar issues or fixes                    │
└─────────────────────────────────────────────────────────────┘
```

### Phase 3: Hypothesis Generation (1-2 minutes)
```
🎯 HYPOTHESIS BOARD
┌─────────────────────────────────────────────────────────────┐
│ GENERATE 3-5 WORKING HYPOTHESES:                            │
│                                                             │
│ H1: [Most likely cause]                                     │
│ ├─ Supporting evidence:                                     │
│ ├─ Verification method:                                     │
│ ├─ Quick test:                                             │
│ └─ Estimated time:                                         │
│                                                             │
│ H2: [Second most likely]                                    │
│ ├─ Supporting evidence:                                     │
│ ├─ Verification method:                                     │
│ ├─ Quick test:                                             │
│ └─ Estimated time:                                         │
│                                                             │
│ H3: [Alternative possibility]                               │
│ └─ ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Phase 4: Systematic Investigation (5-15 minutes)
```
🔬 INVESTIGATION PIPELINE
┌─────────────────────────────────────────────────────────────┐
│ FOR EACH HYPOTHESIS:                                        │
│                                                             │
│ 1️⃣ ISOLATE VARIABLE                                        │
│    ❏ Create minimal reproduction case                       │
│    ❏ Test component/module in isolation                     │
│    ❏ Mock external dependencies                            │
│                                                             │
│ 2️⃣ EXECUTE TEST                                           │
│    ❏ Run the specific test scenario                        │
│    ❏ Collect evidence and logs                             │
│    ❏ Document results clearly                              │
│                                                             │
│ 3️⃣ ANALYZE RESULTS                                         │
│    ❏ Compare expected vs actual behavior                   │
│    ❏ Identify supporting or refuting evidence              │
│    ❏ Update hypothesis confidence level                    │
│                                                             │
│ 4️⃣ ITERATE                                                │
│    ❏ Move to next hypothesis if refuted                    │
│    ❏ Refine current hypothesis if partially confirmed      │
│    ❏ Stop when root cause is identified                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Technology-Specific Workflows

### React Component Debugging Workflow
```
🔴 REACT COMPONENT DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ SYMPTOM ASSESSMENT:                                         │
│ ❏ Component not rendering?                                 │
│ ❏ State not updating?                                      │
│ ❏ Props not passing correctly?                             │
│ ❏ useEffect not running?                                   │
│ ❏ Performance issues?                                      │
│                                                             │
│ QUICK CHECKS (First 2 minutes):                             │
│ ❏ Check React DevTools for component state                 │
│ ❏ Console.log component render and state updates           │
│ ❏ Verify props are being passed correctly                  │
│ ❏ Check useEffect dependency array                         │
│ ❏ Look for direct state mutation                           │
│                                                             │
│ DEEP DIVE (If quick checks don't solve):                   │
│ ❏ Trace component lifecycle with React DevTools            │
│ ❏ Check for stale closures in callbacks                    │
│ ❏ Verify key prop usage in lists                           │
│ ❏ Analyze re-renders with React Profiler                   │
│ ❏ Check Context provider values                            │
│                                                             │
│ COMMON FIXES:                                              │
│ ❏ Use functional state updates                            │
│ ❏ Fix useEffect dependencies                              │
│ ❏ Use useCallback/useMemo for expensive operations       │
│ ❏ Ensure immutable updates                                │
│ ❏ Add proper error boundaries                             │
└─────────────────────────────────────────────────────────────┘
```

### Next.js App Router Debugging Workflow
```
🟡 NEXT.JS APP ROUTER DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ ROUTE ISSUES:                                               │
│ ❏ 404 errors?                                             │
│ ❏ Server components not working?                          │
│ ❏ Static generation failing?                              │
│ ❏ Middleware issues?                                      │
│ ❏ Data fetching problems?                                │
│                                                             │
│ SERVER COMPONENT CHECKS:                                    │
│ ❏ Verify "use client" directive usage                     │
│ ❏ Check for browser-only APIs in server components       │
│ ❏ Verify data fetching patterns (fetch vs direct DB)      │
│ ❏ Check for proper async/await usage                     │
│ ❏ Validate environment variable access                    │
│                                                             │
│ HYDRATION DEBUGGING:                                        │
│ ❏ Check for SSR/client mismatch                           │
│ ❏ Verify dynamic vs static content                        │
│ ❏ Use useEffect only for client-side effects              │
│ ❏ Check localStorage/sessionStorage usage                 │
│ ❏ Validate date/time rendering                            │
│                                                             │
│ BUILD ISSUES:                                              │
│ ❏ Check next.config.js configuration                     │
│ ❏ Verify import/export consistency                        │
│ ❏ Check for circular dependencies                         │
│ ❏ Validate TypeScript configuration                       │
│ ❏ Check environment variables in build process           │
└─────────────────────────────────────────────────────────────┘
```

### TypeScript Error Debugging Workflow
```
🔵 TYPESCRIPT DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ ERROR ANALYSIS:                                             │
│ ❏ Parse TypeScript error message carefully               │
│ ❏ Identify error code (TSxxxx)                            │
│ ❏ Note file location and line number                      │
│ ❏ Understand type relationship causing error               │
│                                                             │
│ COMMON TYPE ERRORS:                                         │
│ ❏ Type mismatches (string vs number, etc.)               │
│ ❏ Missing type declarations                               │
│ ❏ Generic constraint violations                           │
│ ❏ Interface vs type usage                                 │
│ ❏ Any type escapes                                        │
│ ❏ Module resolution issues                                │
│                                                             │
│ SYSTEMATIC RESOLUTION:                                      │
│ ❏ Check actual type with typeof or console.log           │
│ ❏ Verify expected type in documentation                   │
│ ❏ Use type assertion only when necessary                  │
│ ❏ Create proper type definitions                          │
│ ❏ Use utility types (Partial, Pick, Omit)               │
│ ❏ Configure tsconfig.json appropriately                 │
│                                                             │
│ PREVENTION:                                                │
│ ❏ Enable strict mode in tsconfig.json                     │
│ ❏ Use explicit return types                               │
│ ❏ Avoid 'any' type                                        │
│ ❏ Use type guards                                         │
│ ❏ Configure ESLint TypeScript rules                      │
└─────────────────────────────────────────────────────────────┘
```

### API Endpoint Debugging Workflow
```
🟢 API ENDPOINT DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ ENDPOINT ASSESSMENT:                                        │
│ ❏ HTTP status code (400, 401, 404, 500, etc.)            │
│ ❏ Request method (GET, POST, PUT, DELETE)                │
│ ❏ Request headers and body format                        │
│ ❏ Response structure and timing                          │
│ ❏ Authentication/authorization status                    │
│                                                             │
│ CLIENT-SIDE CHECKS:                                         │
│ ❏ Verify fetch/axios configuration                        │
│ ❏ Check request headers (Content-Type, Authorization)     │
│ ❏ Validate request body structure                         │
│ ❏ Check CORS configuration                                │
│ ❏ Test with Postman/curl directly                         │
│                                                             │
│ SERVER-SIDE CHECKS:                                         │
│ ❏ Check route definition and middleware                  │
│ ❏ Verify request parsing (body-parser, multer)           │
│ ❏ Validate authentication middleware                     │
│ ❏ Check database queries and connections                  │
│ ❏ Review error handling and logging                      │
│ ❏ Test endpoint independently                           │
│                                                             │
│ COMMON ISSUES:                                             │
│ ❏ Missing Content-Type headers                           │
│ ❏ CORS configuration problems                            │
│ ❏ Authentication token issues                            │
│ ❏ Request body parsing errors                            │
│ ❏ Database connection problems                           │
│ ❏ Async/await error handling                            │
└─────────────────────────────────────────────────────────────┘
```

### Database Debugging Workflow (Supabase)
```
🟣 DATABASE DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ CONNECTION ISSUES:                                          │
│ ❏ Supabase client configuration                          │
│ ❏ Environment variables (URL, keys)                      │
│ ❏ Network connectivity and firewall                       │
│ ❏ Service role vs anon key usage                         │
│ ❏ Row Level Security (RLS) policies                      │
│                                                             │
│ QUERY PROBLEMS:                                            │
│ ❏ SQL syntax errors                                      │
│ ❏ Table/column name mismatches                           │
│ ❏ Data type conflicts                                    │
│ ❏ Join operation failures                                │
│ ❏ Null value handling                                    │
│                                                             │
│ RLS DEBUGGING:                                             │
│ ❏ Check RLS policy conditions                            │
│ ❏ Verify user authentication status                       │
│ ❏ Test with service role key (bypass RLS)                │
│ ❏ Check policy logic with user context                    │
│ ❏ Review policy performance impacts                       │
│                                                             │
│ MIGRATION ISSUES:                                          │
│ ❏ Check migration order and dependencies                  │
│ ❏ Verify rollback scripts                                 │
│ ❏ Test migrations locally first                          │
│ ❏ Check for data loss in rollbacks                       │
│ ❏ Validate schema changes                               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Performance Debugging Workflow

### Frontend Performance Workflow
```
⚡ PERFORMANCE DEBUGGING
┌─────────────────────────────────────────────────────────────┐
│ PERFORMANCE AUDIT:                                          │
│ ❏ Lighthouse performance score                           │
│ ❏ Core Web Vitals (LCP, FID, CLS)                       │
│ ❏ Bundle size analysis (webpack-bundle-analyzer)        │
│ ❏ Network request waterfall                              │
│ ❏ Memory usage patterns                                 │
│                                                             │
│ RENDERING ISSUES:                                          │
│ ❏ Identify unnecessary re-renders (React DevTools)      │
│ ❏ Check for expensive calculations in render            │
│ ❏ Verify virtual scrolling for long lists               │
│ ❏ Optimize images and assets                            │
│ ❏ Implement code splitting and lazy loading             │
│                                                             │
│ NETWORK OPTIMIZATION:                                      │
│ ❏ Enable gzip/brotli compression                        │
│ ❏ Implement proper caching strategies                   │
│ ❏ Optimize API calls (debouncing, batching)             │
│ ❏ Use CDN for static assets                            │
│ ❏ Minimize HTTP requests                               │
│                                                             │
│ MEMORY LEAKS:                                              │
│ ❏ Check for unremoved event listeners                   │
│ ❏ Verify useEffect cleanup functions                    │
│ ❏ Analyze closure retention patterns                    │
│ ❏ Monitor timer/interval management                     │
│ ❏ Profile with Chrome DevTools Memory tab               │
└─────────────────────────────────────────────────────────────┘
```

## 🔍 Error Pattern Recognition

### Common Anti-Patterns Checklist
```
❌ COMMON ANTI-PATTERNS TO CHECK:
┌─────────────────────────────────────────────────────────────┐
│ REACT ANTI-PATTERNS:                                        │
│ ❏ Direct state mutation (state.items = newItems)         │
│ ❏ Missing useEffect dependencies                         │
│ ❏ Stale closures in callbacks                            │
│ ❏ Using index as key in lists                            │
│ ❏ Props drilling instead of context                      │
│ ❏ setState in render                                     │
│                                                             │
│ JAVASCRIPT ANTI-PATTERNS:                                  │
│ ❏ Promise without .catch()                               │
│ ❏ Async function without try/catch                       │
│ ❏ == instead of ===                                      │
│ ❏ Variable hoisting issues                              │
│ ❏ This binding problems                                 │
│ ❏ Memory leaks in event listeners                        │
│                                                             │
│ TYPESCRIPT ANTI-PATTERNS:                                  │
│ ❏ Using 'any' type                                      │
│ ❏ Type assertions without validation                     │
│ ❏ Missing return types                                  │
│ ❏ Interface vs type misuse                              │
│ ❏ Optional chaining overuse                             │
│                                                             │
│ API ANTI-PATTERNS:                                          │
│ ❏ No error handling in API calls                        │
│ ❏ Hardcoded API endpoints                              │
│ ❏ Missing request headers                              │
│ ❏ No request/response validation                        │
│ ❏ Authentication token storage in localStorage          │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Reference Debugging Commands

### Essential MCP Tool Commands
```bash
# File Analysis
Read /path/to/file.ts                    # Read source code
Grep "pattern" --type ts                # Search in TypeScript files
Glob "**/*.tsx"                          # Find React components

# Project Structure
mcp__filesystem__directory_tree /src    # View project structure
mcp__filesystem__search_files /src "error"  # Search for error patterns

# Build and Configuration
Bash "npm run build"                     # Test build process
Bash "npm run typecheck"                 # Check TypeScript
mcp__eslint__lint-files [filePaths]     # Run ESLint

# Database (Supabase)
mcp__supabase__list_tables projectId     # List database tables
mcp__supabase__execute_sql projectId "SELECT * FROM table"  # Test query
mcp__supabase__get_logs projectId "api"  # Check API logs

# Performance
mcp__vercel__get_deployment_build_logs deploymentId teamId  # Build logs
```

### Browser DevTools Shortcuts
```
Chrome DevTools:
┌─────────────────────────────────────────────────────────────┐
│ 🖥️ ELEMENTS:                                                │
│ Ctrl+Shift+C: Element inspector                            │
│ Ctrl+Shift+M: Device toolbar                               │
│                                                             │
│ 📊 CONSOLE:                                                │
│ Ctrl+Shift+J: Open console                                │
│ console.table(data): Display data as table                │
│ console.group(): Group related logs                       │
│                                                             │
│ 🌐 NETWORK:                                                │
│ Ctrl+Shift+I → Network tab                               │
│ Preserve log: Keep logs across page reloads               │
│ Disable cache: Test with fresh resources                 │
│                                                             │
│ ⚡ PERFORMANCE:                                            │
│ Ctrl+Shift+I → Performance tab                           │
│ Record: Analyze runtime performance                       │
│ Memory: Take heap snapshots                              │
│                                                             │
│ 🔧 APPLICATION:                                            │
│ Redux DevTools: State management debugging               │
│ React DevTools: Component inspection                      │
│ Lighthouse: Performance and SEO audit                    │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Communication Templates

### Debugging Report Template
```
🐛 DEBUGGING REPORT

**ISSUE SUMMARY:**
[Clear, concise description of the problem]

**SYMPTOMS:**
- [What users see/experience]
- [Error messages shown]
- [Impact on functionality]

**INVESTIGATION FINDINGS:**
- [Root cause analysis]
- [Supporting evidence]
- [Code locations involved]

**SOLUTIONS PROVIDED:**
1. **Immediate Fix:** [Quick solution]
   - Risk assessment
   - Implementation steps

2. **Robust Solution:** [Long-term fix]
   - Benefits and trade-offs
   - Migration strategy

**VERIFICATION:**
- [How to test the fix]
- [Expected results]
- [Rollback plan]

**PREVENTION:**
- [How to prevent similar issues]
- [Code improvements]
- [Team recommendations]

**LESSONS LEARNED:**
- [Technical insights]
- [Process improvements]
- [Knowledge to share]
```

These workflows provide a systematic approach to debugging any web development issue, ensuring thorough investigation and effective resolution.