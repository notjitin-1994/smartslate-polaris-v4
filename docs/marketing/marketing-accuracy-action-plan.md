# SmartSlate Polaris v3: Marketing Accuracy Action Plan

## Executive Summary

**Critical Issue Identified**: The `recommended-workflow` page (lines 665-911) describes features that **do not exist in the codebase**. This creates significant risk of customer disappointment and potential churn.

**Affected Features** (all NOT implemented):
- Inline Commenting
- Version History & Change Tracking
- Change Highlighting (yellow/green/red)
- Role-Based Access Control
- Stakeholder Collaboration (@mentions)
- @mention tagging system

**Impact**: A user following the described workflow will encounter non-functional buttons, missing UI components, and confusing error messages.

---

## What's Marketed vs. What Exists

### Section 3: Blueprint Editing (Lines 665-911)

#### Marketed Features

| Feature | Lines | Status | Impact |
|---------|-------|--------|--------|
| **Inline Commenting** | 799-802 | ❌ NOT IMPLEMENTED | Users cannot add comments to blueprints |
| **Version History** | 806-808 | ❌ NOT IMPLEMENTED | No version tracking or restore capability |
| **Change Highlighting** | 812-814 | ❌ NOT IMPLEMENTED | No visual diff indicators |
| **Role-Based Access** | 818-820 | ❌ NOT IMPLEMENTED | All users get same access level |
| **Real-world scenario flow** | 860-875 | ❌ IMPOSSIBLE TO EXECUTE | Scenarios reference non-existent features |

#### Actually Implemented Features

| Feature | Location | Status | Capability |
|---------|----------|--------|------------|
| **Edit Executive Summary** | `/app/(auth)/blueprint/[id]/page.tsx` | ✅ WORKS | Visual JSON editor modal |
| **Rename Blueprint** | Blueprint viewer | ✅ WORKS | Dialog to change title |
| **Export to Word** | Blueprint viewer | ✅ WORKS | .docx download |
| **Export to PDF** | Blueprint viewer | ✅ PARTIAL | Button exists, may not be fully implemented |
| **Generate Share Link** | Blueprint viewer | ✅ WORKS | Token-based public sharing |

---

## The Real User Workflow

### What Actually Works Today

```
1. User logs in → Dashboard with usage stats
2. Start static questionnaire → Fill 3 sections
3. Wait for dynamic questions → AI generates 50-70 questions (Perplexity)
4. Answer dynamic questions → 10 sections with auto-save
5. Wait for blueprint → AI generates comprehensive blueprint (Claude)
6. View blueprint → Can edit Executive Summary, rename, export, share
7. Share link → Public read-only access (no auth required)
```

### What Does NOT Work

```
X User clicks "View History" → Null pointer (feature doesn't exist)
X User tries to add inline comment → No comment UI
X User filters by "Assigned to me" → RBAC not implemented
X User mentions @stakeholder → No @ mentions system
X User compares v3.0 vs v3.1 → No diff comparison
X User highlights "this changed" → No change highlighting
```

---

## Specific Code Issues in recommended-workflow/page.tsx

### Issue 1: "View History" Button (Line 711)
```tsx
<button className="rounded-md border...">
  View History
</button>
```

**Problem**: This button exists only as a mockup. No version history system exists in the database or API.

**Customer Experience**: User clicks button → Nothing happens or error occurs → Frustration

### Issue 2: "Version History" Sidebar (Lines 751-791)
```tsx
<h5 className="mb-3 text-sm font-semibold text-[rgb(224,224,224)]">
  Version History
</h5>
```

**Problem**: Shows fake version data (v3.2, v3.1, v3.0) with timestamps. Database has no version tracking.

**Customer Experience**: User expects to see this exact interface → Doesn't exist → "Was this demo real?"

### Issue 3: Inline Comment Mockup (Lines 733-744)
```tsx
<div className="flex items-start gap-2 rounded-md border border-blue-500/30 bg-blue-500/10 p-3">
  <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-400" />
  <div className="flex-1">
    <div className="mb-1 text-xs font-semibold text-blue-400">
      Sarah Chen (VP Sales) • 2 hours ago
    </div>
```

**Problem**: Shows "Sarah Chen" leaving a comment. No commenting system exists.

**Customer Experience**: User tries to add a comment → Feature doesn't exist → "Why was this shown in the demo?"

### Issue 4: Real-World Scenarios (Lines 855-896)

**Problem**: All three scenarios describe workflows that are impossible with current features:

**Scenario 1**: "Open version history. Restore v2.1"
- Required: Version history (doesn't exist)
- Required: Restore functionality (doesn't exist)

**Scenario 2**: "Use inline editing to add GDPR requirements... Share link with legal for approval. Track their review comments"
- Required: Inline editing (partially works for Executive Summary only)
- Required: Comments (doesn't exist)
- Required: Comment tracking (doesn't exist)

**Scenario 3**: "Add @mention comment tagging them on Executive Summary"
- Required: @mention system (doesn't exist)
- Required: Comments (doesn't exist)
- Required: Comment notifications (doesn't exist)

---

## Recommended Fixes

### Option A: Immediate (Quick Fix)

**Rewrite Section 3 to match actual features**:

```markdown
## From First Draft to Final Strategy (Without Starting Over)

Here's what makes SmartSlate different: You generate a beautiful, comprehensive blueprint in 
minutes—and then you can refine it immediately. Edit the Executive Summary, adjust timelines, 
and export to Word for stakeholder review—no manual rebuilding required.

### What You Can Do Right Now:

1. **Edit Sections** - Update the Executive Summary with our visual JSON editor
2. **Rename & Organize** - Give your blueprint a clear title for easy reference
3. **Export Anywhere** - Download as Word (.docx), PDF, Markdown, or JSON
4. **Share Securely** - Generate a public link for stakeholders to review (read-only)
```

**Effort**: 2-3 hours to rewrite Section 3

**Risk**: Low (matches current code exactly)

---

### Option B: Better (Honest Roadmap)

**Keep the aspirational messaging but clearly mark as "Phase 2"**:

```markdown
## Blueprint Refinement (Current) & Advanced Collaboration (Coming Soon)

### Available Now
- ✅ Edit Executive Summary
- ✅ Rename & organize blueprints
- ✅ Export to Word, PDF, Markdown
- ✅ Shareable public links

### Coming in Phase 2 (Q2 2025)
- 🔄 Inline commenting with stakeholder feedback
- 🔄 Version history & restore previous versions
- 🔄 Change highlighting & side-by-side comparison
- 🔄 Role-based access control
- 🔄 @mention notifications
```

**Effort**: 3-4 hours to restructure and label

**Risk**: Low (transparent about roadmap)

**Benefit**: Sets correct expectations, positions company as honest

---

### Option C: Strategic (Separate Pages)

**Create two distinct pages**:

1. **`/recommended-workflow` (Current)** - "How SmartSlate Works Today"
   - Focuses on the 4-phase questionnaire → blueprint generation workflow
   - Highlights what ACTUALLY works: smart question generation, comprehensive output
   - Shows export/sharing capabilities

2. **`/product-roadmap` (New)** - "What's Coming Next"
   - Shows Version 2 features (collaboration, comments, etc.)
   - Gives users visibility into future roadmap
   - Collects feedback on priorities

**Effort**: 6-8 hours (complete redesign)

**Risk**: Medium (requires messaging alignment)

**Benefit**: Highest - separates current from future, sets expectations clearly

---

## Database Schema Reality Check

### What Exists
```sql
-- blueprint_generator table HAS:
- static_answers (JSONB) ✅
- dynamic_questions (JSONB) ✅
- dynamic_answers (JSONB) ✅
- blueprint_json (JSONB) ✅
- blueprint_markdown (TEXT) ✅
- share_token (VARCHAR) ✅
- status (VARCHAR) ✅
- title (VARCHAR) ✅
- created_at (TIMESTAMP) ✅
```

### What Does NOT Exist
```sql
-- blueprint_generator table DOES NOT HAVE:
- version_history (JSONB) ❌
- blueprint_versions table ❌
- comments table ❌
- user_access_control table ❌
- change_log table ❌
- version_number (INT) ❌
```

**Finding**: The infrastructure for "Version History" and "Commenting" doesn't exist in the database schema.

---

## Risk Assessment

### If We Do Nothing

**Likelihood**: Very High
**Impact**: Critical

**Scenario**: A prospect or customer watches the recommended-workflow page demo, signs up, expects to use the features shown, then discovers they don't exist.

**Customer Journey**:
1. Watches recommended-workflow page
2. "Oh wow, this looks exactly like what we need!"
3. Signs up / purchases plan
4. Tries to "View History" on blueprint
5. Feature doesn't exist
6. Creates support ticket
7. Support says "That's coming in Phase 2"
8. Customer feels misled
9. Churn or negative review

---

## Implementation Decision Matrix

| Approach | Effort | Risk | Timeline | Recommendation |
|----------|--------|------|----------|-----------------|
| **Option A: Rewrite** | 2-3 hrs | Low | Immediate | ✅ BEST for short term |
| **Option B: Roadmap Labels** | 3-4 hrs | Low | Immediate | ✅ GOOD transparency |
| **Option C: Split Pages** | 6-8 hrs | Medium | 1 week | ⭐ BEST long term |

---

## Next Steps

### Week 1: Immediate Action
1. **Decide**: Which approach? (A, B, or C)
2. **Notify**: Marketing team about discrepancy
3. **Review**: Have product/engineering review proposed copy

### Week 2: Implementation
1. **Update**: recommended-workflow page (or create new pages)
2. **Test**: User flow on updated page
3. **Get QA**: Verify no dead buttons or broken links

### Week 3: Rollout
1. **Release**: Updated marketing page
2. **Monitor**: Check for support inquiries about "missing features"
3. **Document**: Add disclaimer if needed

---

## Questions for Product/Engineering

1. **When will version history be implemented?** (Needed for roadmap messaging)
2. **Is commenting system on the roadmap?** (Needed for Phase 2 messaging)
3. **Will inline editing be expanded beyond Executive Summary?** (Needed for accurate description)
4. **Is role-based access planned?** (Needed for Phase 2 messaging)

---

## Summary

The recommended-workflow page is a **beautiful, well-designed marketing asset** that describes a **version of the product that doesn't exist yet**. This creates significant customer expectation misalignment risk.

**Recommendation**: Implement **Option A (Quick Fix)** immediately to prevent customer disappointment, while planning **Option C (Split Pages)** for Q1/Q2 to properly communicate the roadmap.

The goal is not to reduce functionality claims, but to **match claims to reality** and build trust through transparency.
