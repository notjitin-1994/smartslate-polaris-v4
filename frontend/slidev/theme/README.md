# Smartslate Polaris Slidev Theme

A premium, glassmorphic presentation theme designed specifically for Smartslate Polaris learning blueprints. Features stunning animations, brand-consistent design, and professional layouts optimized for educational content.

## Features

✨ **Glassmorphic Design** - Premium frosted glass aesthetic matching the Smartslate Polaris brand
🎨 **Brand-Consistent Colors** - Uses exact Smartslate color tokens (#A7DADB primary)
🎬 **Smooth Animations** - Entrance animations, hover effects, and transitions
📱 **Responsive** - Optimized for 16:9 presentations
♿ **Accessible** - WCAG AA compliant with proper contrast and focus states
🎯 **Multiple Layouts** - 8 specialized layouts for different content types
📊 **Data Visualization** - Built-in metric cards, timelines, and table styling
🚀 **Performance** - Optimized animations and glassmorphism effects

## Installation

### Option 1: Use as Theme Directory

```bash
cd your-presentation-folder
cp -r /path/to/slidev/theme ./theme
```

Then in your `slides.md`:

```yaml
---
theme: ./theme
---
```

### Option 2: NPM Package (Future)

```bash
npm install slidev-theme-smartslate-polaris
```

```yaml
---
theme: smartslate-polaris
---
```

## Quick Start

1. Create a new presentation file `slides.md`
2. Add the theme configuration:

```yaml
---
theme: ./theme
title: 'Your Blueprint Title'
subtitle: 'Your Subtitle'
author: 'Your Name'
date: 'January 2025'
class: text-left
highlighter: shiki
lineNumbers: false
---
```

3. Start the dev server:

```bash
npm run dev
```

## Available Layouts

### 1. Cover (Title Slide)

Perfect for blueprint title slides with metadata.

```yaml
---
theme: ./theme
title: 'Enterprise AI Training Program'
subtitle: 'Building AI-Ready Teams'
author: 'Dr. Sarah Chen'
date: 'January 15, 2025'
duration: '12 Weeks'
---
# Welcome to your Blueprint

Additional content here
```

**Features**:

- Animated gradient background
- Large title with gradient text
- Metadata cards (author, date, duration)
- Smartslate branding

---

### 2. Default (Content Slide)

Standard content slide with left-aligned text.

```yaml
---
title: 'Section Title'
---
# Main Content

Your content here with:
  - Bullet points
  - Tables
  - Code blocks
```

**Features**:

- Left-aligned text throughout
- Animated entrance
- Progress bar
- Page numbers

---

### 3. Section (Divider Slide)

Large section dividers between blueprint sections.

```yaml
---
layout: section
sectionNumber: '01'
title: 'Executive Summary'
subtitle: 'Blueprint overview'
---
# Executive Summary

Brief description
```

**Features**:

- Large section numbers (optional)
- Gradient title text
- Thick accent line
- Radial gradient background

---

### 4. Two Columns

Side-by-side content comparison.

```yaml
---
layout: two-cols
title: 'Learning Approach'
---
::left::
  ### Theory
  - Content here

::right::
  ### Practice
  - Content here
```

**Features**:

- Glassmorphic cards for each column
- Independent scrolling
- Staggered entrance animations

---

### 5. Timeline

Vertical timeline for implementation phases.

```yaml
---
layout: timeline
title: 'Implementation Roadmap'
---

<div class="timeline">
  <div class="timeline-item">
    <h3>Phase 1: Setup</h3>
    <p>Description</p>
  </div>

  <div class="timeline-item">
    <h3>Phase 2: Deploy</h3>
    <p>Description</p>
  </div>
</div>
```

**Features**:

- Vertical gradient line
- Animated dots
- Staggered item animations
- Responsive spacing

---

### 6. Metrics

Grid layout for KPIs and statistics.

```yaml
---
layout: metrics
title: 'Learning Objectives'
---
<div class="metric-card">
<div class="metric-value">95%</div>
<div class="metric-label">Success Rate</div>
<div class="metric-subtitle">Industry leading</div>
</div>

<!-- More metric cards -->
```

**Features**:

- Auto-grid layout (responsive)
- Gradient top border
- Hover lift effect
- Large numeric display

---

### 7. Table

Enhanced table styling with glassmorphism.

```yaml
---
layout: table
title: 'Resources & Budget'
---

| Item | Cost | Duration |
|------|------|----------|
| Licenses | $10,000 | 12 weeks |
| Infrastructure | $25,000 | 12 weeks |
```

**Features**:

- Gradient header
- Row hover effects
- Staggered row animations
- Glassmorphic container

---

### 8. Quote

Centered quote layout for testimonials or key insights.

```yaml
---
layout: quote
author: 'Dr. Andrew Ng'
role: 'Founder, DeepLearning.AI'
---
AI is the new electricity.
```

**Features**:

- Large decorative quote mark
- Centered layout
- Attribution with divider line
- Radial background glow

---

## Component Patterns

### Glassmorphic Cards

```html
<div class="glass-card p-6">Your content here</div>
```

Automatic blur, border gradient, and hover effects.

---

### Badges

```html
<span class="badge badge-primary">New</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Beta</span>
<span class="badge badge-error">Deprecated</span>
```

---

### Metric Cards

```html
<div class="metric-card">
  <div class="metric-value">42</div>
  <div class="metric-label">Active Users</div>
  <div class="metric-subtitle">Last 30 days</div>
</div>
```

---

### Timeline

```html
<div class="timeline">
  <div class="timeline-item">
    <h3>Event Title</h3>
    <p>Description</p>
  </div>
</div>
```

---

### Grid Layouts

```html
<!-- 2 columns -->
<div class="grid-2">
  <div>Column 1</div>
  <div>Column 2</div>
</div>

<!-- 3 columns -->
<div class="grid-3">
  <div>Column 1</div>
  <div>Column 2</div>
  <div>Column 3</div>
</div>
```

---

## Customization

### Override Colors

Create `theme/styles/custom.css`:

```css
:root {
  --primary-accent: #your-color;
  --secondary-accent: #your-color;
}
```

Import in your slides:

```yaml
---
theme: ./theme
css: theme/styles/custom.css
---
```

---

### Custom Fonts

Add to frontmatter:

```yaml
---
theme: ./theme
fonts:
  sans: 'Your Font'
  serif: 'Your Heading Font'
---
```

---

### Disable Animations

For accessibility or performance:

```css
/* In custom.css */
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

Or disable globally:

```yaml
---
theme: ./theme
transition: none
---
```

---

## Brand Guidelines

### Color Palette

```css
--primary-accent: #a7dadb /* Teal/Cyan - Main brand */ --primary-accent-light: #d0edf0
  /* Light teal - Highlights */ --primary-accent-dark: #7bc5c7 /* Dark teal - Emphasis */
  --secondary-accent: #4f46e5 /* Indigo - Secondary actions */ --background-dark: #020c1b
  /* Deep space - Canvas */ --background-paper: #0d1b2a /* Card backgrounds */
  --text-primary: #e0e0e0 /* Primary content */ --text-secondary: #b0c5c6 /* Secondary content */;
```

### Typography

- **Headings**: Quicksand (friendly, modern)
- **Body**: Lato (readable, professional)
- **Code**: Monaco/Menlo (monospace)

### Spacing

All spacing uses 4px/8px grid system:

- `--space-1`: 8px
- `--space-2`: 16px
- `--space-3`: 24px
- `--space-4`: 32px
- `--space-6`: 48px
- `--space-8`: 64px

---

## Best Practices

### 1. Left-Align Content

All text should be left-aligned (default behavior):

```markdown
<!-- ✅ Good -->

# Title

Content flows naturally from left

<!-- ❌ Avoid -->
<div class="text-center">
  Centered content breaks flow
</div>
```

---

### 2. Use Semantic HTML

```html
<!-- ✅ Good -->
<h2>Section Title</h2>
<p>Description</p>
<ul>
  <li>Item 1</li>
</ul>

<!-- ❌ Avoid -->
<div class="big-text">Section Title</div>
<div class="small-text">Description</div>
```

---

### 3. Leverage Animations

Content animates automatically, but you can control timing:

```html
<!-- Stagger custom content -->
<div style="animation-delay: 0.1s">First item</div>
<div style="animation-delay: 0.2s">Second item</div>
<div style="animation-delay: 0.3s">Third item</div>
```

---

### 4. Optimize Slide Count

- **Cover**: 1 slide (title)
- **Section**: 1 per major section (4-6 total)
- **Content**: 2-3 slides per subsection
- **Summary**: 1 slide (next steps)

**Typical blueprint presentation**: 15-25 slides

---

### 5. Use Appropriate Layouts

| Content Type     | Layout     |
| ---------------- | ---------- |
| Title            | `cover`    |
| Section break    | `section`  |
| Lists/paragraphs | `default`  |
| Comparisons      | `two-cols` |
| Roadmap          | `timeline` |
| KPIs             | `metrics`  |
| Data             | `table`    |
| Testimonials     | `quote`    |

---

## Accessibility

### Keyboard Navigation

- **Arrow keys**: Next/previous slide
- **Home**: First slide
- **End**: Last slide
- **Escape**: Overview mode
- **G**: Go to slide (enter number)

### Screen Readers

All layouts include proper ARIA labels and semantic HTML.

### High Contrast Mode

Automatically adjusts for system preferences:

```css
@media (prefers-contrast: high) {
  /* Enhanced contrast mode */
}
```

---

## Performance Tips

1. **Limit animations**: Each slide auto-animates, don't add excessive custom animations
2. **Optimize images**: Use WebP format, max 1920px width
3. **Reduce blur**: Lower `--glass-blur` value if performance is slow
4. **Disable animations**: For large presentations (50+ slides)

---

## Export Options

### PDF

```bash
npm run export
```

Generates `slides-export.pdf` with all animations disabled for print.

### PNG Images

```bash
npm run export --format png
```

Creates one PNG per slide in `slides-export/` folder.

### Hosted Presentation

```bash
npm run build
```

Deploy `dist/` folder to any static host (Vercel, Netlify, GitHub Pages).

---

## Troubleshooting

### Glassmorphic cards not showing blur

**Issue**: Backdrop-filter not supported
**Solution**: Fallback styles are included, or use newer browser (Chrome 76+, Safari 14+)

---

### Animations too slow/fast

**Issue**: Animation timing doesn't match preference
**Solution**: Override in custom CSS:

```css
:root {
  --duration-base: 200ms; /* Faster */
}
```

---

### Font not loading

**Issue**: Google Fonts blocked or slow
**Solution**: Self-host fonts in `theme/public/fonts/`

---

### Progress bar not updating

**Issue**: Slidev navigation context issue
**Solution**: Restart dev server with `npm run dev`

---

## Advanced Usage

### Custom Components

Create `theme/components/MyComponent.vue`:

```vue
<template>
  <div class="my-component glass-card">
    <slot />
  </div>
</template>

<style scoped>
.my-component {
  /* Your styles */
}
</style>
```

Use in slides:

```markdown
<MyComponent>
  Content here
</MyComponent>
```

---

### Global Setup

Create `theme/setup/main.ts`:

```typescript
import { defineAppSetup } from '@slidev/types';

export default defineAppSetup(({ app, router }) => {
  // Add global components, plugins, etc.
});
```

---

## Examples

See `example.md` for a complete blueprint presentation showcasing all layouts and components.

**Key examples**:

- Executive summary with two-column comparison
- Timeline for implementation phases
- Metrics grid for learning objectives
- Table layout for budget breakdown
- Quote slide for testimonials
- Section dividers between major sections

---

## Support

- **Documentation**: This README
- **Examples**: `example.md` (comprehensive demo)
- **Issues**: [GitHub Issues](https://github.com/smartslate/polaris/issues)
- **Community**: [Smartslate Discord](https://discord.gg/smartslate)

---

## License

MIT License - Free for commercial and personal use

---

## Credits

**Design**: Smartslate Polaris Team
**Theme Framework**: Slidev by Anthony Fu
**Brand Colors**: Smartslate Polaris Design System
**Typography**: Google Fonts (Lato, Quicksand)

---

## Changelog

### v1.0.0 (2025-01-15)

- Initial release
- 8 layout types
- Glassmorphic design system
- Brand-consistent colors
- Comprehensive animations
- Full accessibility support
- Example presentation

---

**Built with ❤️ for Smartslate Polaris by the Solara Team**
