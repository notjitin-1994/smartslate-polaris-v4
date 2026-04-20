# Dynamic Questions Loader Component

## Overview

The `DynamicQuestionsLoader` component is an exact replica of the loading screen implementation from the smartslate-polaris folder, adapted to match the frontend folder's design system, theming, and styling guidelines.

## Features

- ✨ **Brand-aligned design** - Uses semantic tokens and brand colors
- 🎨 **Glassmorphic aesthetic** - Consistent with application design language
- ⚡ **Smooth animations** - 60fps animations with proper easing
- ♿ **Accessibility compliant** - WCAG AA with proper ARIA labels
- 📱 **Responsive** - Optimized for all screen sizes
- 🎭 **Motion-safe** - Respects `prefers-reduced-motion`

## Components

### DynamicQuestionsLoader

Standalone loader component for inline usage within existing containers.

```tsx
import { DynamicQuestionsLoader } from '@/components/wizard/dynamic-questions';

<DynamicQuestionsLoader message="Generating personalized questions..." statusText="Analyzing" />;
```

**Props:**

- `message?: string` - Custom loading message (default: "Initializing AI analysis...")
- `showStatusIndicator?: boolean` - Show/hide the status pill (default: true)
- `statusText?: string` - Custom status text in the pill (default: "Preparing")
- `className?: string` - Additional CSS classes for the container

### DynamicQuestionsLoaderCard

Full card wrapper with glass effect and header section, matching the WizardContainer pattern from smartslate-polaris.

```tsx
import { DynamicQuestionsLoaderCard } from '@/components/wizard/dynamic-questions';

<DynamicQuestionsLoaderCard
  title="Preparing Your Blueprint"
  description="Setting up the AI analysis pipeline and preparing your personalized questions."
  message="Analyzing your responses..."
  statusText="Processing"
/>;
```

**Props:**

- All props from `DynamicQuestionsLoader`, plus:
- `title?: string` - Card title (default: "Preparing Your Questions")
- `description?: string` - Card description/subtitle

## Usage Examples

### Example 1: Inline Loader

Use within an existing card or section:

```tsx
import { DynamicQuestionsLoader } from '@/components/wizard/dynamic-questions';

export function DynamicQuestionsStep() {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState([]);

  if (loading) {
    return (
      <div className="space-y-6">
        <DynamicQuestionsLoader message="Loading personalized questions..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {questions.map((q) => (
        <QuestionField key={q.id} question={q} />
      ))}
    </div>
  );
}
```

### Example 2: Full Page Loading

Use the card variant for standalone loading pages:

```tsx
import { DynamicQuestionsLoaderCard } from '@/components/wizard/dynamic-questions';
import { QuestionnaireLayout } from '@/components/wizard/static-questions';

export default function GeneratingQuestionsPage() {
  return (
    <QuestionnaireLayout>
      <DynamicQuestionsLoaderCard
        title="Preparing Your Starmap"
        description="Setting up the AI analysis pipeline and preparing your personalized questions."
        message="Analyzing your responses..."
        statusText="Processing"
      />
    </QuestionnaireLayout>
  );
}
```

### Example 3: Dynamic Message Updates

Update the message as generation progresses:

```tsx
import { DynamicQuestionsLoaderCard } from '@/components/wizard/dynamic-questions';
import { useState, useEffect } from 'react';

export function GeneratingQuestionsView() {
  const [progress, setProgress] = useState('Initializing AI analysis...');

  useEffect(() => {
    const phases = [
      'Analyzing your responses...',
      'Identifying knowledge gaps...',
      'Generating targeted questions...',
      'Finalizing your personalized questionnaire...',
    ];

    let index = 0;
    const interval = setInterval(() => {
      index = (index + 1) % phases.length;
      setProgress(phases[index]);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <DynamicQuestionsLoaderCard
      title="Preparing Your Questions"
      description="This will take just a moment..."
      message={progress}
      statusText="Generating"
    />
  );
}
```

### Example 4: With Error Handling

Combine with error states:

```tsx
import { DynamicQuestionsLoaderCard } from '@/components/wizard/dynamic-questions';
import { useState } from 'react';

export function QuestionsGenerator() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  if (error) {
    return (
      <div className="glass-card p-8">
        <div className="text-center">
          <div className="text-error mb-4">⚠️</div>
          <h3 className="text-foreground mb-2 text-xl font-semibold">Generation Failed</h3>
          <p className="text-text-secondary mb-4">{error}</p>
          <button onClick={() => retry()} className="btn-primary">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <DynamicQuestionsLoaderCard
        title="Generating Questions"
        message="Please wait while we prepare your personalized questions..."
      />
    );
  }

  return <QuestionsForm />;
}
```

## Design Specifications

### Colors

- **Spinner**: Uses `--color-primary` (brand primary color)
- **Background**: Uses `rgba(primary, 0.1)` for pill background
- **Border**: Uses `rgba(primary, 0.2)` for pill border
- **Text**: Uses semantic tokens (`text-foreground`, `text-text-secondary`)
- **Dot**: Uses `bg-primary` with pulse animation

### Animations

- **Spinner**: 1s rotation with linear easing
- **Pulse Dot**: 1.5s pulse animation
- **Fade In**: Smooth entrance animation
- **Loading Dots**: 500ms interval text animation

### Spacing

- **Padding**: `py-12` (48px vertical padding)
- **Gaps**: `gap-2` (8px) for pill content, `mb-4` (16px) between elements
- **Pill Padding**: `px-4 py-2` (16px horizontal, 8px vertical)

### Accessibility

- ✅ Proper ARIA labels (`role="status"`, `aria-live="polite"`)
- ✅ Screen reader announcements
- ✅ Loading state indicators
- ✅ Semantic HTML structure
- ✅ Keyboard navigation support (inherited from parent)

## Comparison with smartslate-polaris

| Feature       | smartslate-polaris | frontend (this)         |
| ------------- | ------------------ | ----------------------- |
| Container     | `WizardContainer`  | `glass-card`            |
| Spinner Size  | `h-16 w-16`        | `h-16 w-16` ✅          |
| Colors        | `primary-500/20`   | `rgba(primary, 0.1)` ✅ |
| Status Pill   | ✅                 | ✅                      |
| Pulsing Dot   | ✅                 | ✅                      |
| Message       | Dynamic via prop   | Dynamic via prop ✅     |
| Animations    | CSS only           | CSS only ✅             |
| Accessibility | Basic              | Enhanced ✅             |

## Integration Points

This component integrates seamlessly with:

- **QuestionnaireLayout** - Full-page wizard layout with swirls
- **StepWizard** - Multi-step questionnaire flow
- **DynamicForm components** - Dynamic question rendering
- **Export flow** - Blueprint generation pipeline

## Best Practices

1. **Always provide meaningful messages** - Update the message prop as generation progresses
2. **Use the Card variant for pages** - Use `DynamicQuestionsLoaderCard` for standalone pages
3. **Use inline loader in sections** - Use `DynamicQuestionsLoader` within existing containers
4. **Handle errors gracefully** - Show fallback UI when generation fails
5. **Test with slow connections** - Ensure the loader is visible long enough to be meaningful
6. **Respect motion preferences** - Animations will automatically respect `prefers-reduced-motion`

## Related Components

- `QuestionnaireLayout` - Full-page layout with swirl background
- `QuestionnaireCard` - Glass card container
- `StepWizard` - Multi-step wizard flow
- `DynamicForm` - Dynamic question rendering
- `LoadingSpinner` - Generic spinner component

## Migration from smartslate-polaris

If migrating from the smartslate-polaris implementation:

```tsx
// Before (smartslate-polaris)
{
  dynamicQuestions.length === 0 && (
    <div className="py-8 text-center">
      <p className="mb-4 text-white/70">Loading personalized questions...</p>
      <div className="border-primary-400 mx-auto h-8 w-8 animate-spin rounded-full border-b-2"></div>
    </div>
  );
}

// After (frontend)
import { DynamicQuestionsLoader } from '@/components/wizard/dynamic-questions';

{
  dynamicQuestions.length === 0 && (
    <DynamicQuestionsLoader message="Loading personalized questions..." />
  );
}
```
