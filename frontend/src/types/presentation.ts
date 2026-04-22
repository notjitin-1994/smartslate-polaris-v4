/**
 * Presentation Mode Type Definitions
 *
 * Comprehensive TypeScript interfaces and types for Smartslate Polaris
 * presentation mode feature. Follows TypeScript 5.7 strict mode conventions.
 */

// ============================================================================
// Slide Type Definitions
// ============================================================================

/**
 * Available slide layout types
 */
export type SlideLayoutType =
  | 'cover'
  | 'section'
  | 'content'
  | 'metrics'
  | 'module'
  | 'timeline'
  | 'resources'
  | 'chart';

/**
 * Slide transition types
 */
export type TransitionType = 'fade' | 'slide' | 'zoom' | 'none';

/**
 * Chart types for chart slides
 */
export type ChartType = 'bar' | 'line' | 'pie' | 'radar' | 'area';

/**
 * Animation preset types
 */
export type AnimationPreset = 'fade-in' | 'slide-up' | 'scale' | 'none';

// ============================================================================
// Base Slide Content Interfaces
// ============================================================================

/**
 * Base interface for all slide content types
 */
export interface BaseSlideContent {
  id: string;
  type: SlideLayoutType;
  title: string;
  subtitle?: string;
  transition?: TransitionType;
  duration?: number; // Auto-advance duration in milliseconds
  speakerNotes?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Cover slide content (introduction/title slide)
 */
export interface CoverSlideContent extends BaseSlideContent {
  type: 'cover';
  mainTitle: string;
  subtitle?: string;
  backgroundImage?: string;
  logo?: string;
  author?: string;
  date?: string;
}

/**
 * Section slide content (divider slides)
 */
export interface SectionSlideContent extends BaseSlideContent {
  type: 'section';
  sectionNumber?: number;
  icon?: string;
  accentColor?: string;
}

/**
 * Content slide (general content with text/images)
 */
export interface ContentSlideContent extends BaseSlideContent {
  type: 'content';
  content: string | React.ReactNode;
  bullets?: string[];
  image?: {
    src: string;
    alt: string;
    position: 'left' | 'right' | 'top' | 'bottom' | 'background';
  };
  layout?: 'single-column' | 'two-column' | 'centered';
}

/**
 * Metrics slide (KPIs and statistics)
 */
export interface MetricsSlideContent extends BaseSlideContent {
  type: 'metrics';
  metrics: Array<{
    id: string;
    label: string;
    value: number | string;
    unit?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: number;
    icon?: string;
    color?: string;
  }>;
  layout?: 'grid' | 'list';
}

/**
 * Module slide (learning module/chapter overview)
 */
export interface ModuleSlideContent extends BaseSlideContent {
  type: 'module';
  moduleNumber: number;
  objectives?: string[];
  estimatedDuration?: string; // Human-readable duration like "45 minutes"
  topics?: Array<{
    id: string;
    title: string;
    completed?: boolean;
  }>;
}

/**
 * Timeline slide (chronological progression)
 */
export interface TimelineSlideContent extends BaseSlideContent {
  type: 'timeline';
  items: Array<{
    id: string;
    date?: string;
    phase?: string;
    title: string;
    description?: string;
    status?: 'completed' | 'in-progress' | 'upcoming';
  }>;
  orientation?: 'horizontal' | 'vertical';
}

/**
 * Resources slide (links, references, materials)
 */
export interface ResourcesSlideContent extends BaseSlideContent {
  type: 'resources';
  resources: Array<{
    id: string;
    title: string;
    description?: string;
    url?: string;
    type: 'link' | 'document' | 'video' | 'tool' | 'other';
    icon?: string;
  }>;
  categories?: string[];
}

/**
 * Chart slide (data visualization)
 */
export interface ChartSlideContent extends BaseSlideContent {
  type: 'chart';
  chartType: ChartType;
  data: Array<Record<string, unknown>>;
  xAxis?: string;
  yAxis?: string;
  legend?: boolean;
  colors?: string[];
  annotations?: Array<{
    x: number | string;
    y: number | string;
    label: string;
  }>;
}

/**
 * Discriminated union of all slide content types
 */
export type SlideContent =
  | CoverSlideContent
  | SectionSlideContent
  | ContentSlideContent
  | MetricsSlideContent
  | ModuleSlideContent
  | TimelineSlideContent
  | ResourcesSlideContent
  | ChartSlideContent;

// ============================================================================
// Presentation State & Navigation
// ============================================================================

/**
 * Presentation navigation state
 */
export interface PresentationState {
  currentSlideIndex: number;
  totalSlides: number;
  isFullscreen: boolean;
  isPlaying: boolean;
  showSpeakerNotes: boolean;
  showLaserPointer: boolean;
  laserPointerPosition: { x: number; y: number } | null;
  progress: number; // 0-100 percentage
  visitedSlides: Set<number>;
  startTime?: Date;
  elapsedTime?: number; // milliseconds
}

/**
 * Navigation direction
 */
export type NavigationDirection = 'next' | 'previous' | 'first' | 'last' | 'goto';

/**
 * Navigation options
 */
export interface NavigationOptions {
  enableKeyboard: boolean;
  enableSwipe: boolean;
  enableWheel: boolean;
  loop: boolean;
  autoAdvance: boolean;
  autoAdvanceDelay?: number;
}

/**
 * Keyboard shortcuts configuration
 */
export interface KeyboardShortcuts {
  nextSlide: string[];
  previousSlide: string[];
  firstSlide: string[];
  lastSlide: string[];
  toggleFullscreen: string[];
  toggleSpeakerNotes: string[];
  toggleLaserPointer: string[];
  togglePlay: string[];
  exitPresentation: string[];
}

// ============================================================================
// Speaker Notes & Settings
// ============================================================================

/**
 * Speaker notes for a slide
 */
export interface SpeakerNotes {
  slideId: string;
  notes: string;
  tips?: string[];
  timing?: {
    estimated: number; // milliseconds
    actual?: number;
  };
  nextSlidePreview?: boolean;
}

/**
 * Presentation settings
 */
export interface PresentationSettings {
  theme: 'dark' | 'light' | 'auto';
  fontSize: 'small' | 'medium' | 'large';
  animations: boolean;
  transitions: boolean;
  laserPointerColor: string;
  laserPointerSize: number;
  showProgressBar: boolean;
  showSlideNumbers: boolean;
  showTimer: boolean;
  autoHideControls: boolean;
  autoHideDelay?: number;
  navigation: NavigationOptions;
  shortcuts: KeyboardShortcuts;
}

/**
 * Default presentation settings
 */
export const DEFAULT_PRESENTATION_SETTINGS: PresentationSettings = {
  theme: 'dark',
  fontSize: 'medium',
  animations: true,
  transitions: true,
  laserPointerColor: '#14b8a6',
  laserPointerSize: 16,
  showProgressBar: true,
  showSlideNumbers: true,
  showTimer: false,
  autoHideControls: true,
  autoHideDelay: 3000,
  navigation: {
    enableKeyboard: true,
    enableSwipe: true,
    enableWheel: true,
    loop: false,
    autoAdvance: false,
  },
  shortcuts: {
    nextSlide: ['ArrowRight', 'Space', 'PageDown'],
    previousSlide: ['ArrowLeft', 'PageUp'],
    firstSlide: ['Home'],
    lastSlide: ['End'],
    toggleFullscreen: ['f', 'F11'],
    toggleSpeakerNotes: ['s', 'n'],
    toggleLaserPointer: ['l'],
    togglePlay: ['p'],
    exitPresentation: ['Escape'],
  },
};

// ============================================================================
// Presentation Container & Props
// ============================================================================

/**
 * Complete presentation data structure
 */
export interface Presentation {
  id: string;
  blueprintId: string;
  title: string;
  author?: string;
  createdAt: Date;
  updatedAt: Date;
  slides: SlideContent[];
  settings?: Partial<PresentationSettings>;
  metadata?: {
    version: string;
    tags?: string[];
    category?: string;
    duration?: number;
    thumbnail?: string;
  };
}

/**
 * Props for PresentationMode container component
 */
export interface PresentationModeProps {
  presentation: Presentation;
  initialSlideIndex?: number;
  onExit?: () => void;
  onSlideChange?: (slideIndex: number) => void;
  onComplete?: () => void;
  settings?: Partial<PresentationSettings>;
  className?: string;
}

/**
 * Props for individual slide components
 */
export interface SlideProps<T extends SlideContent = SlideContent> {
  slide: T;
  isActive: boolean;
  isVisible: boolean;
  animationPreset?: AnimationPreset;
  onReady?: () => void;
  className?: string;
}

/**
 * Props for presentation controls
 */
export interface PresentationControlsProps {
  state: PresentationState;
  onNavigate: (direction: NavigationDirection, slideIndex?: number) => void;
  onToggleFullscreen: () => void;
  onToggleSpeakerNotes: () => void;
  onToggleLaserPointer: () => void;
  onTogglePlay: () => void;
  onExit: () => void;
  className?: string;
}

/**
 * Props for speaker notes component
 */
export interface SpeakerNotesProps {
  notes: SpeakerNotes | null;
  isVisible: boolean;
  nextSlide?: SlideContent;
  onClose: () => void;
  className?: string;
}

/**
 * Props for laser pointer component
 */
export interface LaserPointerProps {
  isActive: boolean;
  position: { x: number; y: number } | null;
  color: string;
  size: number;
  className?: string;
}

/**
 * Props for progress bar component
 */
export interface ProgressBarProps {
  current: number;
  total: number;
  visited: Set<number>;
  showPercentage?: boolean;
  className?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Parser function type for converting blueprint to slides
 */
export type BlueprintToSlidesParser = (blueprintData: Record<string, unknown>) => SlideContent[];

/**
 * Slide transition callback
 */
export type SlideTransitionCallback = (
  from: number,
  to: number,
  direction: 'forward' | 'backward'
) => void;

/**
 * Fullscreen API state
 */
export interface FullscreenState {
  isSupported: boolean;
  isFullscreen: boolean;
  element: Element | null;
}

/**
 * Touch/Swipe gesture data
 */
export interface SwipeGesture {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
  velocity: number;
}

/**
 * Presentation analytics/tracking data
 */
export interface PresentationAnalytics {
  presentationId: string;
  sessionId: string;
  startTime: Date;
  endTime?: Date;
  slideViews: Array<{
    slideIndex: number;
    slideId: string;
    viewTime: number;
    timestamp: Date;
  }>;
  interactions: Array<{
    type: 'navigation' | 'laser-pointer' | 'fullscreen' | 'speaker-notes';
    timestamp: Date;
    data?: Record<string, unknown>;
  }>;
  completion: number; // 0-100 percentage
}

// ============================================================================
// Export Type Guards
// ============================================================================

/**
 * Type guard to check if a slide is a cover slide
 */
export function isCoverSlide(slide: SlideContent): slide is CoverSlideContent {
  return slide.type === 'cover';
}

/**
 * Type guard to check if a slide is a section slide
 */
export function isSectionSlide(slide: SlideContent): slide is SectionSlideContent {
  return slide.type === 'section';
}

/**
 * Type guard to check if a slide is a content slide
 */
export function isContentSlide(slide: SlideContent): slide is ContentSlideContent {
  return slide.type === 'content';
}

/**
 * Type guard to check if a slide is a metrics slide
 */
export function isMetricsSlide(slide: SlideContent): slide is MetricsSlideContent {
  return slide.type === 'metrics';
}

/**
 * Type guard to check if a slide is a module slide
 */
export function isModuleSlide(slide: SlideContent): slide is ModuleSlideContent {
  return slide.type === 'module';
}

/**
 * Type guard to check if a slide is a timeline slide
 */
export function isTimelineSlide(slide: SlideContent): slide is TimelineSlideContent {
  return slide.type === 'timeline';
}

/**
 * Type guard to check if a slide is a resources slide
 */
export function isResourcesSlide(slide: SlideContent): slide is ResourcesSlideContent {
  return slide.type === 'resources';
}

/**
 * Type guard to check if a slide is a chart slide
 */
export function isChartSlide(slide: SlideContent): slide is ChartSlideContent {
  return slide.type === 'chart';
}
