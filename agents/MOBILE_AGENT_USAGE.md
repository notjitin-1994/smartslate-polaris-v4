# Mobile Responsiveness Agent - Usage Guide

## Quick Start

The Mobile Responsiveness Agent is your expert for creating pixel-perfect mobile and tablet experiences. Here's how to use it effectively.

## Basic Usage

### Method 1: Using the Task Tool (Recommended)

In Claude Code, use the Task tool to invoke the mobile responsiveness agent:

```typescript
Task({
  description: "Optimize blueprint hero for mobile",
  prompt: `
    Analyze the InteractiveBlueprintDashboard hero section and create mobile-optimized variants.

    Requirements:
    - Mobile (320-767px): Vertical stacking, 2x2 button grid
    - Tablet (768-1023px): Hybrid layout
    - Touch targets ≥44px
    - Maintain glassmorphism aesthetic
    - Test on iPhone SE, iPad, and Android devices
  `,
  subagent_type: "mobile-responsiveness"
})
```

### Method 2: Natural Language

Simply describe your mobile optimization needs:

```bash
# Claude Code will automatically route to the mobile agent
"Make the dashboard cards responsive for mobile and tablet"
"Optimize the form for touch interactions on iOS and Android"
"Audit the blueprint viewer for mobile responsiveness issues"
```

## Common Use Cases

### 1. Component Optimization

**Scenario**: You have a desktop-only component that needs mobile variants.

```typescript
Task({
  description: "Mobile-optimize action buttons",
  prompt: `
    The hero action buttons currently use expanding hover states.
    Create mobile variants:
    - 2x2 grid layout on mobile
    - Always-visible labels
    - 56px touch targets
    - Tap feedback animations

    Component: frontend/components/blueprints/HeroActionButtons.tsx
  `,
  subagent_type: "mobile-responsiveness"
})
```

**Expected Output**:
- Mobile-specific component variant
- Touch-optimized interactions
- Performance metrics
- Accessibility report

---

### 2. Full Page Audit

**Scenario**: You want to ensure an entire page works perfectly on mobile.

```typescript
Task({
  description: "Mobile responsiveness audit",
  prompt: `
    Audit the InteractiveBlueprintDashboard for mobile issues:

    Check:
    - Touch target sizes (minimum 44×44px)
    - Layout overflow (horizontal scroll)
    - Typography readability
    - Animation performance
    - Accessibility compliance (WCAG AA)

    Provide prioritized list of fixes with estimated impact.
  `,
  subagent_type: "mobile-responsiveness"
})
```

**Expected Output**:
- Comprehensive audit report
- Prioritized issue list (P0, P1, P2)
- Code examples for fixes
- Performance recommendations

---

### 3. Platform-Specific Optimization

**Scenario**: You need iOS-specific or Android-specific optimizations.

```typescript
Task({
  description: "iOS-specific optimizations",
  prompt: `
    Optimize the blueprint viewer for iOS devices:

    iOS-specific requirements:
    - Handle safe area insets
    - Respect system gestures (swipe back)
    - Optimize for Safari iOS rendering
    - Add haptic feedback patterns
    - Test on iPhone SE, 12 Pro, 14 Pro Max
  `,
  subagent_type: "mobile-responsiveness"
})
```

**Expected Output**:
- iOS-specific code patterns
- Safe area handling
- Safari optimizations
- Testing checklist

---

### 4. Performance Optimization

**Scenario**: Mobile performance is slow, need to optimize.

```typescript
Task({
  description: "Mobile performance optimization",
  prompt: `
    Optimize mobile performance for the blueprint dashboard:

    Current issues:
    - Lighthouse mobile score: 67/100
    - LCP: 3.2s (target: <2.5s)
    - Heavy animations causing jank

    Optimize:
    - Lazy load infographics
    - Reduce animation complexity
    - Optimize images with Next.js Image
    - Implement skeleton screens

    Target: Lighthouse score ≥90, LCP <2.5s
  `,
  subagent_type: "mobile-responsiveness"
})
```

**Expected Output**:
- Performance optimization plan
- Code changes for lazy loading
- Animation simplifications
- Before/after metrics

---

### 5. Accessibility Audit

**Scenario**: Ensure mobile accessibility compliance.

```typescript
Task({
  description: "Mobile accessibility audit",
  prompt: `
    Audit mobile accessibility for the blueprint sections:

    Check:
    - Screen reader support (VoiceOver, TalkBack)
    - Touch target sizes
    - Color contrast (WCAG AA)
    - Keyboard navigation
    - Motion preferences

    Test with:
    - iOS VoiceOver
    - Android TalkBack
    - Reduced motion preference
  `,
  subagent_type: "mobile-responsiveness"
})
```

**Expected Output**:
- Accessibility audit report
- WCAG compliance status
- Screen reader test results
- Remediation code examples

---

## Advanced Usage Patterns

### Pattern 1: Iterative Refinement

Start broad, then refine based on feedback:

```typescript
// Step 1: Initial audit
Task({
  description: "Initial mobile audit",
  prompt: "Audit the blueprint dashboard for mobile issues",
  subagent_type: "mobile-responsiveness"
})

// Step 2: Fix critical issues
Task({
  description: "Fix critical P0 issues",
  prompt: "Implement the top 5 P0 fixes from the audit report",
  subagent_type: "mobile-responsiveness"
})

// Step 3: Performance optimization
Task({
  description: "Optimize mobile performance",
  prompt: "Optimize animations and lazy loading based on audit",
  subagent_type: "mobile-responsiveness"
})

// Step 4: Final validation
Task({
  description: "Validate mobile implementation",
  prompt: "Test all changes on device matrix and report metrics",
  subagent_type: "mobile-responsiveness"
})
```

### Pattern 2: Cross-Agent Collaboration

Combine mobile agent with UX/UI agent for comprehensive improvements:

```typescript
// Mobile optimization
Task({
  description: "Mobile optimization",
  prompt: "Optimize component for mobile/tablet devices",
  subagent_type: "mobile-responsiveness"
})

// Then enhance UX (if using UX agent)
Task({
  description: "UX enhancement",
  prompt: "Apply premium animations and micro-interactions",
  subagent_type: "ux-ui-designer"
})
```

### Pattern 3: Component Library Building

Create reusable mobile-optimized components:

```typescript
Task({
  description: "Create mobile component library",
  prompt: `
    Create a library of mobile-optimized components:

    Components:
    1. TouchButton - Touch-safe button (44×44px min)
    2. MobileGrid - Responsive grid (2-col mobile, 4-col desktop)
    3. TouchCard - Card with tap feedback
    4. MobileModal - Full-screen modal for mobile
    5. SwipeableSection - Swipe-to-navigate sections

    Include:
    - TypeScript interfaces
    - Usage examples
    - Accessibility features
    - Performance optimizations
  `,
  subagent_type: "mobile-responsiveness"
})
```

---

## Best Practices

### 1. Be Specific About Requirements

❌ **Vague**: "Make this mobile-friendly"

✅ **Specific**:
```typescript
Task({
  description: "Mobile optimization with specifics",
  prompt: `
    Optimize the metric cards for mobile:
    - Mobile (320-767px): 2x2 grid with compact design
    - Tablet (768-1023px): 2x2 grid with more spacing
    - Desktop (1024px+): 4x1 grid (unchanged)
    - Touch targets: 48×48px minimum
    - Reduce padding by 33% on mobile
    - Maintain glassmorphism aesthetic
  `,
  subagent_type: "mobile-responsiveness"
})
```

### 2. Provide Context

Always mention:
- Component file paths
- Current issues or pain points
- Target devices/breakpoints
- Performance constraints
- Accessibility requirements

### 3. Request Metrics

Ask for measurable outcomes:
```typescript
prompt: `
  ... optimize for mobile

  Report:
  - Lighthouse mobile score
  - Core Web Vitals (FCP, LCP, CLS)
  - Touch target compliance percentage
  - Accessibility audit results
`
```

### 4. Specify Testing Requirements

```typescript
prompt: `
  ... implement mobile optimizations

  Test on:
  - Mobile: iPhone SE (320px), iPhone 12 (390px), Samsung Galaxy S21 (360px)
  - Tablet: iPad Mini (768px), iPad Pro 11" (834px)
  - Browsers: Safari iOS, Chrome Android, Firefox Mobile
`
```

---

## Troubleshooting

### Issue: Agent Makes Desktop Changes

**Solution**: Explicitly state "Do not modify desktop layout"

```typescript
prompt: `
  Optimize for mobile/tablet only.
  IMPORTANT: Do not modify desktop layout (1024px+).
  Only change mobile (320-767px) and tablet (768-1023px) breakpoints.
`
```

### Issue: Touch Targets Still Too Small

**Solution**: Request specific minimum sizes

```typescript
prompt: `
  Ensure ALL interactive elements meet these minimums:
  - Primary actions: 48×48px
  - Secondary actions: 44×44px
  - Icon-only buttons: 44×44px
  - Text links: 44px height with padding
`
```

### Issue: Performance Not Improved

**Solution**: Ask for specific optimizations

```typescript
prompt: `
  Performance is still slow. Apply these optimizations:
  1. Lazy load all infographics with React.lazy()
  2. Reduce animation duration to 200ms max
  3. Use GPU-accelerated transforms only
  4. Implement skeleton screens
  5. Optimize images with Next.js Image component

  Target: LCP <2.5s, TBT <200ms
`
```

---

## Example Outputs

### What to Expect

When you invoke the mobile agent, expect:

1. **Analysis Report**
   - Current state assessment
   - Issues identified
   - Recommended transformations

2. **Implementation Code**
   - Mobile component variants
   - Responsive utility functions
   - TypeScript interfaces

3. **Testing Guidance**
   - Device testing matrix
   - Browser compatibility checklist
   - Accessibility validation steps

4. **Performance Metrics**
   - Lighthouse scores
   - Core Web Vitals
   - Bundle size impact
   - Animation FPS

5. **Documentation**
   - Usage examples
   - Migration guide
   - Best practices
   - Troubleshooting tips

---

## Integration with Existing Workflow

### During Development

```bash
# Before committing mobile changes
1. Run mobile agent audit
2. Fix P0 issues
3. Test on real devices
4. Run Lighthouse mobile audit
5. Commit with metrics in PR description
```

### During Code Review

```bash
# Use agent to validate PR changes
Task({
  description: "Review mobile implementation",
  prompt: "Review this PR for mobile responsiveness compliance",
  subagent_type: "mobile-responsiveness"
})
```

### During QA

```bash
# Use agent to generate test cases
Task({
  description: "Generate mobile test cases",
  prompt: "Generate comprehensive mobile test cases for this feature",
  subagent_type: "mobile-responsiveness"
})
```

---

## Success Criteria

A successful mobile optimization with this agent achieves:

✅ **Technical Metrics**
- 100% touch target compliance (≥44px)
- WCAG AA accessibility (4.5:1 contrast)
- Lighthouse mobile score ≥90
- Zero layout shift (CLS < 0.1)
- Fast load times (FCP < 1.5s, LCP < 2.5s)

✅ **User Experience**
- No horizontal scroll on any breakpoint
- Smooth animations (60fps)
- Immediate touch feedback
- Logical navigation
- Readable typography

✅ **Brand Integrity**
- Glassmorphism aesthetic preserved
- Color system compliance
- Typography scale consistency
- Spacing system adherence
- Animation philosophy maintained

---

## Quick Reference Card

```
MOBILE AGENT QUICK COMMANDS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 Audit
Task: "Audit [component] for mobile issues"
Focus: Touch targets, overflow, performance

🎨 Optimize
Task: "Optimize [component] for mobile/tablet"
Focus: Layouts, interactions, animations

🚀 Performance
Task: "Optimize mobile performance for [feature]"
Focus: Lazy loading, bundle size, animations

♿ Accessibility
Task: "Audit mobile accessibility for [feature]"
Focus: Screen readers, contrast, keyboard nav

📱 Platform-Specific
Task: "Optimize [feature] for iOS/Android"
Focus: Platform patterns, native behaviors

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
BREAKPOINTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Mobile:  320px - 767px  (sm: prefix)
Tablet:  768px - 1023px (md: prefix)
Desktop: 1024px+        (lg: prefix)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TOUCH TARGETS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary:   48×48px minimum
Secondary: 44×44px minimum
Icons:     44×44px minimum
Links:     44px height + padding

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Happy mobile optimizing! 📱✨**

For questions or issues, refer to the full agent documentation at `.claude/agents/mobile-responsiveness.md`
