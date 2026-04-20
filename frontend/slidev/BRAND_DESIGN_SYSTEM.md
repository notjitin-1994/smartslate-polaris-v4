# SmartSlate Polaris - Presentation Design System

Complete visual reference for the SmartSlate Polaris Slidev theme.

---

## Color Palette

### Primary Colors

```
┌─────────────────────────────────────────┐
│  Primary Accent                         │
│  #A7DADB (Cyan-Teal)                   │
│  RGB: 167, 218, 219                     │
│  HSL: 181°, 44%, 76%                    │
│  Main brand color, CTAs, links          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Primary Accent Light                   │
│  #D0EDF0                                │
│  RGB: 208, 237, 240                     │
│  Hover states, highlights               │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Primary Accent Dark                    │
│  #7BC5C7                                │
│  RGB: 123, 197, 199                     │
│  Active states, emphasis                │
└─────────────────────────────────────────┘
```

---

### Secondary Colors

```
┌─────────────────────────────────────────┐
│  Secondary Accent                       │
│  #4F46E5 (Indigo)                      │
│  RGB: 79, 70, 229                       │
│  Secondary actions, gradients           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Secondary Accent Light                 │
│  #7C69F5                                │
│  RGB: 124, 105, 245                     │
│  Hover states                           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Secondary Accent Dark                  │
│  #3730A3                                │
│  RGB: 55, 48, 163                       │
│  Active states                          │
└─────────────────────────────────────────┘
```

---

### Background Colors

```
┌─────────────────────────────────────────┐
│  Background Dark (Canvas)               │
│  #020C1B (Deep Space)                  │
│  RGB: 2, 12, 27                         │
│  Main slide background                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Background Paper (Cards)               │
│  #0D1B2A                                │
│  RGB: 13, 27, 42                        │
│  Glassmorphic card backgrounds          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Background Surface (Elevated)          │
│  #142433                                │
│  RGB: 20, 36, 51                        │
│  Elevated UI elements                   │
└─────────────────────────────────────────┘
```

---

### Text Colors

```
┌─────────────────────────────────────────┐
│  Text Primary                           │
│  #E0E0E0 (Light Gray)                  │
│  RGB: 224, 224, 224                     │
│  Main content, headings                 │
│  WCAG AA: 12.6:1 on dark bg            │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Text Secondary                         │
│  #B0C5C6 (Cool Gray)                   │
│  RGB: 176, 197, 198                     │
│  Supporting text, body copy             │
│  WCAG AA: 7.8:1 on dark bg             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Text Disabled                          │
│  #7A8A8B (Muted Gray)                  │
│  RGB: 122, 138, 139                     │
│  Placeholders, disabled states          │
│  WCAG AA: 4.6:1 on dark bg             │
└─────────────────────────────────────────┘
```

---

### Semantic Colors

```
┌─────────────────────────────────────────┐
│  Success (Green)                        │
│  #10B981                                │
│  RGB: 16, 185, 129                      │
│  Success states, positive metrics       │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Warning (Amber)                        │
│  #F59E0B                                │
│  RGB: 245, 158, 11                      │
│  Warnings, attention needed             │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Error (Red)                            │
│  #EF4444                                │
│  RGB: 239, 68, 68                       │
│  Errors, critical issues                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Info (Blue)                            │
│  #3B82F6                                │
│  RGB: 59, 130, 246                      │
│  Informational messages                 │
└─────────────────────────────────────────┘
```

---

## Typography

### Font Families

**Body Text**: Lato

- Clean, professional, highly readable
- Use for: Paragraphs, lists, tables, body content
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Headings**: Quicksand

- Friendly, modern, approachable
- Use for: Titles, headings, metric labels
- Weights: 400 (regular), 500 (medium), 600 (semibold), 700 (bold)

**Code**: Monaco / Menlo / Courier New

- Monospace for code blocks
- Use for: Code snippets, technical content

---

### Type Scale

```
┌─────────────────────────────────────────┐
│  Display (Hero Text)                    │
│  3rem (48px)                            │
│  Font: Quicksand Bold                   │
│  Line Height: 1.1                       │
│  Use: Cover slide titles                │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Title (Section Headers)                │
│  2rem (32px)                            │
│  Font: Quicksand Bold                   │
│  Line Height: 1.2                       │
│  Use: Slide titles, major headings      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Heading (Subsections)                  │
│  1.5rem (24px)                          │
│  Font: Quicksand Semibold               │
│  Line Height: 1.3                       │
│  Use: Subsection titles, card headers   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Body (Main Content)                    │
│  1.125rem (18px)                        │
│  Font: Lato Regular/Medium              │
│  Line Height: 1.6                       │
│  Use: Paragraphs, lists, body text      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Caption (Labels)                       │
│  1rem (16px)                            │
│  Font: Lato Medium                      │
│  Line Height: 1.5                       │
│  Use: Labels, captions, metadata        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Small (Fine Print)                     │
│  0.875rem (14px)                        │
│  Font: Lato Regular                     │
│  Line Height: 1.4                       │
│  Use: Fine print, footer text           │
└─────────────────────────────────────────┘
```

---

### Text Styles Examples

```
DISPLAY TEXT (48px Quicksand Bold)
AI-Powered Learning Blueprint

TITLE TEXT (32px Quicksand Bold)
Executive Summary

HEADING TEXT (24px Quicksand Semibold)
Learning Objectives

BODY TEXT (18px Lato Regular)
This comprehensive training program transforms professionals
into AI-ready leaders through hands-on projects and mentorship.

CAPTION TEXT (16px Lato Medium)
Duration: 12 Weeks | Cost: $7,230 per participant

SMALL TEXT (14px Lato Regular)
Generated by SmartSlate Polaris • Powered by Solara
```

---

## Spacing System

### Base Grid: 4px / 8px

```
┌─────────────────────────────────────────┐
│  --space-1: 0.5rem (8px)               │
│  ████                                   │
│  Tight spacing between related items    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  --space-2: 1rem (16px)                │
│  ████████                               │
│  Standard spacing between elements      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  --space-3: 1.5rem (24px)              │
│  ████████████                           │
│  Comfortable spacing between groups     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  --space-4: 2rem (32px)                │
│  ████████████████                       │
│  Section spacing                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  --space-6: 3rem (48px)                │
│  ████████████████████████               │
│  Major section breaks                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  --space-8: 4rem (64px)                │
│  ████████████████████████████████       │
│  Large spacing, slide padding           │
└─────────────────────────────────────────┘
```

---

### Usage Guidelines

**Tight (8px)**: Badge spacing, list item gaps
**Standard (16px)**: Paragraph margins, form field spacing
**Comfortable (24px)**: Card content padding, subsection gaps
**Section (32px)**: Between major content blocks
**Major (48px)**: Slide header to content, section dividers
**Large (64px)**: Slide container padding

---

## Border Radius

```
┌─────────────────────────────────────────┐
│  Small (8px)                            │
│  ╭───────╮                              │
│  │ Badge │                              │
│  ╰───────╯                              │
│  Pills, small badges                    │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Medium (12px)                          │
│  ╭────────────╮                         │
│  │   Button   │                         │
│  ╰────────────╯                         │
│  Buttons, inputs, small cards           │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Large (16px)                           │
│  ╭─────────────────────╮                │
│  │   Glass Card        │                │
│  │                     │                │
│  ╰─────────────────────╯                │
│  Cards, containers                      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Extra Large (24px)                     │
│  ╭──────────────────────────╮           │
│  │   Hero Element           │           │
│  │                          │           │
│  │                          │           │
│  ╰──────────────────────────╯           │
│  Modal backgrounds, hero cards          │
└─────────────────────────────────────────┘
```

---

## Glassmorphism System

### Glass Card (Primary)

```css
background: rgba(13, 27, 42, 0.65);
backdrop-filter: blur(24px);
border-radius: 16px;
border: 1px solid;
border-image: linear-gradient(135deg, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0.06) 100%)
  1;
box-shadow:
  0 4px 6px rgba(0, 0, 0, 0.1),
  0 10px 20px rgba(0, 0, 0, 0.15),
  inset 0 1px 0 rgba(255, 255, 255, 0.1);
```

**Visual Effect**:

- Frosted glass appearance
- Soft blur of background content
- Gradient border (bright top, subtle bottom)
- Multi-layer shadows for depth
- Inset highlight for dimension

---

### Glass Variants

**Glass Shell** (border only):

```css
background: transparent;
backdrop-filter: blur(18px);
border: 2px solid rgba(255, 255, 255, 0.15);
```

**Glass Panel** (strong background):

```css
background: rgba(13, 27, 42, 0.85);
backdrop-filter: blur(30px);
```

**Glass Interactive** (for forms):

```css
background: rgba(13, 27, 42, 0.45);
backdrop-filter: blur(20px);
border: 1px solid rgba(167, 218, 219, 0.2);
```

---

## Shadows System

### Elevation Levels

```
┌─────────────────────────────────────────┐
│  Level 1: Subtle                        │
│  box-shadow:                            │
│    0 1px 2px rgba(0, 0, 0, 0.05)       │
│  Use: Badges, pills                     │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Level 2: Raised                        │
│  box-shadow:                            │
│    0 4px 6px rgba(0, 0, 0, 0.1)        │
│  Use: Buttons, inputs                   │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Level 3: Floating (Default)           │
│  box-shadow:                            │
│    0 4px 6px rgba(0, 0, 0, 0.1),       │
│    0 10px 20px rgba(0, 0, 0, 0.15)     │
│  Use: Cards, containers                 │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Level 4: Elevated (Hover)             │
│  box-shadow:                            │
│    0 8px 12px rgba(0, 0, 0, 0.15),     │
│    0 16px 32px rgba(0, 0, 0, 0.2)      │
│  Use: Hover states                      │
└─────────────────────────────────────────┘
```

---

## Animation System

### Timing Functions

```
┌─────────────────────────────────────────┐
│  Fast (200ms)                           │
│  cubic-bezier(0.4, 0, 0.2, 1)          │
│  Use: Micro-interactions, hover         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Base (300ms)                           │
│  cubic-bezier(0.4, 0, 0.2, 1)          │
│  Use: Standard transitions              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Slow (500ms)                           │
│  cubic-bezier(0.4, 0, 0.2, 1)          │
│  Use: Page transitions, entrances       │
└─────────────────────────────────────────┘
```

---

### Animation Types

**Slide In Left**:

```css
@keyframes slideInLeft {
  from {
    opacity: 0;
    transform: translateX(-30px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

**Slide In Up**:

```css
@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

**Fade In**:

```css
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
```

**Scale In**:

```css
@keyframes scaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
```

**Pulse** (continuous):

```css
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

---

### Staggered Animations

List items animate sequentially:

```css
li:nth-child(1) {
  animation-delay: 0.1s;
}
li:nth-child(2) {
  animation-delay: 0.2s;
}
li:nth-child(3) {
  animation-delay: 0.3s;
}
li:nth-child(4) {
  animation-delay: 0.4s;
}
li:nth-child(5) {
  animation-delay: 0.5s;
}
```

Creates cascading entrance effect.

---

## Component Anatomy

### Metric Card

```
┌──────────────────────────────────────┐
│ ═══ Gradient Top Border (3px)       │ ← Primary → Secondary
├──────────────────────────────────────┤
│                                      │
│            95%                       │ ← metric-value (3rem, bold)
│                                      │
│       Success Rate                   │ ← metric-label (1rem, uppercase)
│                                      │
│    Industry leading                  │ ← metric-subtitle (0.875rem, muted)
│                                      │
└──────────────────────────────────────┘
  ↑                                  ↑
  Glass background               Hover lift
  24px blur                      Shadow increase
  32px padding                   Border glow
```

---

### Timeline Item

```
     │
     ●  ← Dot (16px, primary color)
     │     Pulse animation
     │     Shadow glow
     │
   ──┼──  Phase 1: Setup
     │
     │    Initial configuration and
     │    environment setup
     │
     ●
     │
   ──┼──  Phase 2: Build
     │
     │    Core development work
     │
```

---

### Glass Card

```
╔════════════════════════════════════╗
║ ┌──────────────────────────────┐   ║ ← Gradient border
║ │                              │   ║
║ │   Content Area               │   ║ ← Frosted background
║ │                              │   ║   rgba(13, 27, 42, 0.65)
║ │   • Blur: 24px               │   ║
║ │   • Border radius: 16px      │   ║ ← Inset highlight
║ │   • Padding: 32px            │   ║   (top edge glow)
║ │                              │   ║
║ └──────────────────────────────┘   ║
╚════════════════════════════════════╝
  ↑                              ↑
  Multi-layer                Shadow depth
  box-shadow                 (2 layers)
```

---

## Layout Grid System

### 2-Column Grid

```
┌─────────────────────┬─────────────────────┐
│                     │                     │
│   Left Column       │   Right Column      │
│                     │                     │
│   Glass Card        │   Glass Card        │
│   32px padding      │   32px padding      │
│                     │                     │
└─────────────────────┴─────────────────────┘
         ↑                      ↑
      32px gap              Equal width
```

---

### 3-Column Grid

```
┌──────────┬──────────┬──────────┐
│          │          │          │
│  Col 1   │  Col 2   │  Col 3   │
│          │          │          │
└──────────┴──────────┴──────────┘
     ↑          ↑          ↑
  Equal width  32px gap  Auto-responsive
```

Collapses to single column on mobile.

---

## Accessibility Standards

### Color Contrast Ratios (WCAG AA)

```
Text Primary (#E0E0E0) on Dark (#020C1B)
Contrast: 12.6:1 ✅ AAA

Text Secondary (#B0C5C6) on Dark (#020C1B)
Contrast: 7.8:1 ✅ AAA

Text Disabled (#7A8A8B) on Dark (#020C1B)
Contrast: 4.6:1 ✅ AA

Primary Accent (#A7DADB) on Dark (#020C1B)
Contrast: 9.1:1 ✅ AAA

Success (#10B981) on Dark (#020C1B)
Contrast: 5.2:1 ✅ AA

Error (#EF4444) on Dark (#020C1B)
Contrast: 5.9:1 ✅ AA
```

All combinations exceed WCAG AA standards.

---

### Focus States

```css
/* Visible focus ring */
:focus-visible {
  outline: 2px solid var(--primary-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

/* Never remove without replacement */
*:focus {
  outline: none; /* ❌ NEVER */
}
```

---

### Motion Preferences

```css
/* Respect user settings */
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Usage Examples

### Proper Color Usage

```css
/* ✅ CORRECT - Use design tokens */
.element {
  color: var(--text-primary);
  background: var(--primary-accent);
}

/* ❌ WRONG - Hardcoded values */
.element {
  color: #e0e0e0;
  background: #a7dadb;
}
```

---

### Proper Spacing

```css
/* ✅ CORRECT - Use spacing scale */
.container {
  padding: var(--space-4);
  gap: var(--space-3);
  margin-bottom: var(--space-6);
}

/* ❌ WRONG - Random values */
.container {
  padding: 28px;
  gap: 22px;
  margin-bottom: 45px;
}
```

---

### Proper Typography

```css
/* ✅ CORRECT - Use type scale */
h1 {
  font-size: var(--text-display);
  font-family: 'Quicksand', sans-serif;
  font-weight: var(--font-bold);
}

/* ❌ WRONG - Arbitrary values */
h1 {
  font-size: 47px;
  font-family: Arial;
  font-weight: 650;
}
```

---

## Brand Assets

### Logo Spacing

```
     ┌───┐
     │SP │  SmartSlate Polaris
     └───┘
      ↕         ↕
     32px     16px gap
     icon     Quicksand Bold, 16px
```

---

### Powered By Lockup

```
SmartSlate Polaris
Powered by Solara

  ↕
14px gap
Text: 14px Lato Regular
Color: var(--text-disabled)
```

---

## File Organization

```
theme/
├── styles/
│   └── index.css          # All design tokens here
├── layouts/
│   └── *.vue              # Use tokens via var()
└── components/
    └── *.vue              # Inherit from layouts
```

---

## Quality Checklist

Design System Compliance:

- [ ] Uses color tokens (not hardcoded hex)
- [ ] Uses spacing scale (not arbitrary px)
- [ ] Uses type scale (not random font sizes)
- [ ] Uses border radius tokens
- [ ] Uses animation timing tokens
- [ ] Meets WCAG AA contrast (4.5:1+)
- [ ] Has visible focus states
- [ ] Respects reduced motion preference
- [ ] Left-aligns text for readability
- [ ] Uses Lato for body, Quicksand for headings

---

**SmartSlate Polaris Design System v1.0.0**
**Maintained by: SmartSlate Team**
**Last Updated: January 15, 2025**
