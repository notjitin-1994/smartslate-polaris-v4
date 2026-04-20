# SmartSlate Polaris Slidev Theme - Quick Start Guide

Get up and running with stunning presentations in 5 minutes.

---

## Prerequisites

- Node.js 18+ installed
- SmartSlate Polaris frontend running
- Basic familiarity with Markdown

---

## Installation

### Step 1: Install Dependencies

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3/frontend
npm install
```

This installs Slidev and all required dependencies.

---

### Step 2: Test the Example Presentation

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3/frontend
npm run slidev:dev
```

This will:

- Start Slidev dev server on `http://localhost:3030`
- Open example presentation in your browser
- Enable hot reload for live editing

**Navigate slides**: Use arrow keys or click navigation

---

## Creating Your First Presentation

### Step 1: Create a New Presentation File

```bash
cd /home/jitin-m-nair/Desktop/polaris-v3/frontend/slidev
touch my-blueprint.md
```

---

### Step 2: Add Basic Structure

Open `my-blueprint.md` and paste:

```markdown
---
theme: ./theme
title: 'My First Blueprint'
subtitle: 'Learning Objectives Demo'
author: 'Your Name'
date: 'January 15, 2025'
duration: '8 Weeks'
class: text-left
highlighter: shiki
---

# Welcome to My Blueprint

This is my first SmartSlate presentation

---

# Key Points

- Point one
- Point two
- Point three

---

layout: section
sectionNumber: '01'

---

# First Section

Ready to explore

---

# Content Here

Add your blueprint content

---

## layout: cover

# Thank You

Questions?
```

---

### Step 3: Preview Your Presentation

```bash
npx slidev my-blueprint.md
```

Opens at `http://localhost:3030`

---

## Using Different Layouts

### Cover Slide (Title)

```yaml
---
theme: ./theme
title: 'Enterprise AI Training'
subtitle: 'Building AI-Ready Teams'
author: 'Dr. Sarah Chen'
date: 'January 2025'
---
# Welcome

Your content
```

**When to use**: First slide, final thank you slide

---

### Default Slide (Standard Content)

```markdown
---
title: 'My Section'
---

# Heading

Regular content with:

- Lists
- Tables
- Code blocks
```

**When to use**: 80% of your slides

---

### Section Divider

```yaml
---
layout: section
sectionNumber: '01'
title: 'Executive Summary'
subtitle: 'Overview'
---
# Executive Summary

Brief intro
```

**When to use**: Major section breaks (4-6 per presentation)

---

### Two Columns

```yaml
---
layout: two-cols
title: 'Comparison'
---
::left::
  ### Theory
  - Concept A
  - Concept B

::right::
  ### Practice
  - Project 1
  - Project 2
```

**When to use**: Before/after, theory/practice, pros/cons

---

### Timeline

```yaml
---
layout: timeline
title: 'Implementation Roadmap'
---

<div class="timeline">
  <div class="timeline-item">
    <h3>Week 1-2: Setup</h3>
    <p>Initial configuration</p>
  </div>

  <div class="timeline-item">
    <h3>Week 3-4: Build</h3>
    <p>Core development</p>
  </div>

  <div class="timeline-item">
    <h3>Week 5-6: Test</h3>
    <p>Quality assurance</p>
  </div>
</div>
```

**When to use**: Roadmaps, curriculum phases, project milestones

---

### Metrics Grid

```yaml
---
layout: metrics
title: 'Success Metrics'
---
<div class="metric-card">
<div class="metric-value">95%</div>
<div class="metric-label">Completion Rate</div>
<div class="metric-subtitle">Target goal</div>
</div>

<div class="metric-card">
<div class="metric-value">4.8/5</div>
<div class="metric-label">Satisfaction</div>
<div class="metric-subtitle">Participant feedback</div>
</div>

<div class="metric-card">
<div class="metric-value">120</div>
<div class="metric-label">Hours</div>
<div class="metric-subtitle">Total duration</div>
</div>
```

**When to use**: KPIs, statistics, achievements, learning objectives

---

### Table Layout

```yaml
---
layout: table
title: 'Resources & Budget'
---

| Resource | Description | Cost | Duration |
|----------|-------------|------|----------|
| Cloud Credits | AWS/GCP | $15,000 | 12 weeks |
| Licenses | DataCamp | $8,500 | 12 weeks |
| Instructors | Lead + TAs | $120,000 | 12 weeks |
```

**When to use**: Budget breakdowns, resource lists, comparison tables

---

### Quote Slide

```yaml
---
layout: quote
author: 'Dr. Andrew Ng'
role: 'Founder, DeepLearning.AI'
---
AI is the new electricity. Just as electricity transformed every industry 100 years ago, AI will now do the same.
```

**When to use**: Testimonials, key insights, inspirational quotes

---

## Adding Components

### Glassmorphic Cards

```html
<div class="glass-card p-6">
  <h3>Card Title</h3>
  <p>Your content with premium glass effect</p>
</div>
```

---

### Badges

```html
<span class="badge badge-primary">New Feature</span>
<span class="badge badge-success">Active</span>
<span class="badge badge-warning">Beta</span>
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

## Export Options

### Build Static HTML

```bash
npm run slidev:build
```

Output: `/dist/` folder (deploy to Vercel/Netlify)

---

### Export to PDF

```bash
npm run slidev:export
```

Output: `slides-export.pdf`

---

### Export to PNG

```bash
npm run slidev:export --format png
```

Output: Individual slide images in `slides-export/`

---

## Keyboard Shortcuts

| Key             | Action                     |
| --------------- | -------------------------- |
| **Arrow Right** | Next slide                 |
| **Arrow Left**  | Previous slide             |
| **Space**       | Next slide                 |
| **Home**        | First slide                |
| **End**         | Last slide                 |
| **G**           | Go to slide (enter number) |
| **Escape**      | Overview mode              |
| **F**           | Fullscreen                 |
| **O**           | Overview mode              |
| **D**           | Dark mode toggle           |

---

## Customization

### Change Primary Color

Create `theme/styles/custom.css`:

```css
:root {
  --primary-accent: #ff6b6b; /* Your brand color */
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

```yaml
---
theme: ./theme
fonts:
  sans: 'Inter'
  serif: 'Playfair Display'
---
```

Then import fonts in your HTML/CSS.

---

## Troubleshooting

### Issue: Slides not loading

**Solution**: Check that you're in the `frontend` directory and theme path is correct:

```yaml
---
theme: ./slidev/theme # Correct path
---
```

---

### Issue: Glassmorphism not working

**Solution**: Use a modern browser (Chrome 88+, Safari 14+). Fallback styles are automatic.

---

### Issue: Animations too fast/slow

**Solution**: Override timing in custom CSS:

```css
:root {
  --duration-base: 500ms; /* Slower */
}
```

---

## Best Practices

### 1. Keep It Simple

- 1 main idea per slide
- Max 6 bullet points per slide
- Use visuals over text when possible

---

### 2. Consistent Layout

- Use section dividers between major topics
- Group related content with same layout
- Maintain left-alignment for readability

---

### 3. Visual Hierarchy

- H1 for slide titles
- H2 for subsections
- H3 for details
- Body text for explanations

---

### 4. Optimize for Presentation

- 16:9 aspect ratio (default)
- 18px minimum text size (automatic)
- High contrast colors (WCAG AA)
- Left-aligned text (easier to read)

---

### 5. Performance

- Limit to 30-40 slides per file
- Optimize images (WebP, max 1920px)
- Use built-in components (faster than custom)

---

## Example Presentation Structure

```
1. Cover - Title + metadata
2. Section - Introduction
3. Default - Problem statement
4. Two-cols - Current vs Desired state
5. Section - Solution
6. Metrics - Key benefits
7. Timeline - Implementation phases
8. Table - Budget breakdown
9. Default - Next steps
10. Quote - Testimonial
11. Cover - Thank you
```

**Total**: 10-15 slides (optimal length)

---

## Resources

### Documentation

- **Full README**: `/frontend/slidev/theme/README.md`
- **Integration Guide**: `/frontend/slidev/INTEGRATION_GUIDE.md`
- **This Guide**: `/frontend/slidev/QUICKSTART.md`

### Examples

- **Complete Demo**: `/frontend/slidev/theme/example.md`
- **Layouts Showcase**: All 8 layouts with real content

### External

- **Slidev Docs**: https://sli.dev
- **Markdown Guide**: https://www.markdownguide.org

---

## Next Steps

1. **Try the example**: `npm run slidev:dev`
2. **Create your first presentation**: Copy example, modify content
3. **Experiment with layouts**: Test each layout type
4. **Export**: Build static HTML or PDF
5. **Integrate**: Connect to SmartSlate blueprint generation

---

## Support

**Need help?**

- Read the full README (`theme/README.md`)
- Check the integration guide (`INTEGRATION_GUIDE.md`)
- Review example presentation (`theme/example.md`)
- Contact: support@smartslate-polaris.com

---

**Ready to create stunning presentations! 🎉**

**Version**: 1.0.0
**Last Updated**: January 15, 2025
