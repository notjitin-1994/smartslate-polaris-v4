/**
 * Presentation Mode Components
 *
 * Main barrel export file for the presentation mode feature.
 * Provides clean, centralized imports for all presentation components.
 *
 * @example
 * ```typescript
 * import { PresentationMode, CoverSlide, MetricsSlide } from '@/components/presentation';
 * ```
 */

// Main container component
export { PresentationMode } from './PresentationMode';
export { default as PresentationModeDefault } from './PresentationMode';

// Shared components
export * from './components';

// Slide layouts
export * from './layouts';

// Type re-exports for convenience
export type {
  Presentation,
  PresentationModeProps,
  PresentationState,
  PresentationSettings,
  SlideContent,
  CoverSlideContent,
  SectionSlideContent,
  ContentSlideContent,
  MetricsSlideContent,
  ModuleSlideContent,
  TimelineSlideContent,
  ResourcesSlideContent,
  ChartSlideContent,
  SlideProps,
  NavigationDirection,
  SlideLayoutType,
  TransitionType,
  ChartType,
  AnimationPreset,
} from '@/types/presentation';
