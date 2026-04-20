import type {
  SlideContent,
  CoverSlideContent,
  SectionSlideContent,
  ContentSlideContent,
  MetricsSlideContent,
  ModuleSlideContent,
  TimelineSlideContent,
  ResourcesSlideContent,
  BlueprintToSlidesParser,
} from '@/types/presentation';

/**
 * Blueprint to Slides Parser
 * Converts blueprint JSON data to presentation slides
 */

interface BlueprintData {
  title?: string;
  overview?: {
    title?: string;
    description?: string;
    duration?: string;
    objectives?: string[];
  };
  modules?: Array<{
    moduleNumber?: number;
    title?: string;
    objectives?: string[];
    duration?: string;
    topics?: Array<{
      title?: string;
      description?: string;
    }>;
  }>;
  learningObjectives?: string[];
  learningOutcomes?: string[];
  prerequisites?: string[];
  resources?: Array<{
    title?: string;
    description?: string;
    url?: string;
    type?: string;
  }>;
  assessmentCriteria?: string[];
  timeline?: Array<{
    phase?: string;
    title?: string;
    description?: string;
    duration?: string;
  }>;
  metrics?: Array<{
    label?: string;
    value?: string | number;
    description?: string;
  }>;
}

/**
 * Main parser function - converts blueprint to slides
 */
export const parseBlueprint: BlueprintToSlidesParser = (
  blueprintData: Record<string, unknown>
): SlideContent[] => {
  const data = blueprintData as BlueprintData;
  const slides: SlideContent[] = [];

  // 1. Cover Slide
  slides.push(createCoverSlide(data));

  // 2. Overview/Introduction
  if (data.overview) {
    slides.push(createOverviewSection(data.overview));
  }

  // 3. Learning Objectives
  if (data.learningObjectives && data.learningObjectives.length > 0) {
    slides.push(createLearningObjectivesSlide(data.learningObjectives));
  }

  // 4. Prerequisites
  if (data.prerequisites && data.prerequisites.length > 0) {
    slides.push(createPrerequisitesSlide(data.prerequisites));
  }

  // 5. Timeline (if available)
  if (data.timeline && data.timeline.length > 0) {
    slides.push(createTimelineSlide(data.timeline));
  }

  // 6. Modules
  if (data.modules && data.modules.length > 0) {
    data.modules.forEach((module, index) => {
      slides.push(...createModuleSlides(module, index));
    });
  }

  // 7. Metrics/KPIs (if available)
  if (data.metrics && data.metrics.length > 0) {
    slides.push(createMetricsSlide(data.metrics));
  }

  // 8. Learning Outcomes
  if (data.learningOutcomes && data.learningOutcomes.length > 0) {
    slides.push(createLearningOutcomesSlide(data.learningOutcomes));
  }

  // 9. Resources
  if (data.resources && data.resources.length > 0) {
    slides.push(createResourcesSlide(data.resources));
  }

  // 10. Closing/Summary
  slides.push(createClosingSlide(data));

  return slides;
};

/**
 * Create cover slide
 */
function createCoverSlide(data: BlueprintData): CoverSlideContent {
  return {
    id: 'slide-cover',
    type: 'cover',
    title: data.title || 'Learning Blueprint',
    mainTitle: data.title || 'Learning Blueprint',
    subtitle: data.overview?.description || '',
    transition: 'fade',
    speakerNotes: 'Welcome! Introduce the learning blueprint and set expectations.',
  };
}

/**
 * Create overview section slide
 */
function createOverviewSection(overview: BlueprintData['overview']): SectionSlideContent {
  return {
    id: 'slide-overview-section',
    type: 'section',
    title: overview?.title || 'Overview',
    subtitle: overview?.description,
    sectionNumber: 1,
    transition: 'slide',
    speakerNotes: 'Provide a high-level overview of the learning journey.',
  };
}

/**
 * Create learning objectives slide
 */
function createLearningObjectivesSlide(objectives: string[]): ContentSlideContent {
  return {
    id: 'slide-objectives',
    type: 'content',
    title: 'Learning Objectives',
    subtitle: 'What you will learn',
    content: 'By the end of this learning path, you will be able to:',
    bullets: objectives,
    layout: 'single-column',
    transition: 'fade',
    speakerNotes: 'Emphasize the key learning objectives and outcomes.',
  };
}

/**
 * Create prerequisites slide
 */
function createPrerequisitesSlide(prerequisites: string[]): ContentSlideContent {
  return {
    id: 'slide-prerequisites',
    type: 'content',
    title: 'Prerequisites',
    subtitle: 'What you need to know',
    content: 'Before starting, you should have:',
    bullets: prerequisites,
    layout: 'single-column',
    transition: 'fade',
    speakerNotes: 'Review prerequisites to ensure learners are prepared.',
  };
}

/**
 * Create timeline slide
 */
function createTimelineSlide(
  timeline: NonNullable<BlueprintData['timeline']>
): TimelineSlideContent {
  return {
    id: 'slide-timeline',
    type: 'timeline',
    title: 'Learning Timeline',
    subtitle: 'Your journey at a glance',
    items: timeline.map((item, index) => ({
      id: `timeline-${index}`,
      phase: item.phase,
      title: item.title || '',
      description: item.description,
      status: 'upcoming',
    })),
    orientation: 'horizontal',
    transition: 'slide',
    speakerNotes: 'Walk through the learning timeline and key milestones.',
  };
}

/**
 * Create module slides (section + content)
 */
function createModuleSlides(
  module: NonNullable<BlueprintData['modules']>[0],
  index: number
): SlideContent[] {
  const slides: SlideContent[] = [];

  // Module section slide
  slides.push({
    id: `slide-module-${index}-section`,
    type: 'section',
    title: module.title || `Module ${index + 1}`,
    subtitle: `Module ${module.moduleNumber || index + 1}`,
    sectionNumber: index + 2, // Offset for overview
    transition: 'slide',
    speakerNotes: `Introduce Module ${index + 1}: ${module.title || ''}`,
  } as SectionSlideContent);

  // Module details slide
  slides.push({
    id: `slide-module-${index}-details`,
    type: 'module',
    title: module.title || `Module ${index + 1}`,
    subtitle: module.duration,
    moduleNumber: module.moduleNumber || index + 1,
    objectives: module.objectives,
    estimatedDuration: module.duration,
    topics: module.topics?.map((topic, topicIndex) => ({
      id: `topic-${index}-${topicIndex}`,
      title: topic.title || '',
      completed: false,
    })),
    transition: 'fade',
    speakerNotes: `Cover the objectives and topics for Module ${index + 1}.`,
  } as ModuleSlideContent);

  // Create content slides for each topic
  module.topics?.forEach((topic, topicIndex) => {
    slides.push({
      id: `slide-module-${index}-topic-${topicIndex}`,
      type: 'content',
      title: topic.title || `Topic ${topicIndex + 1}`,
      subtitle: `Module ${index + 1}`,
      content: topic.description || '',
      layout: 'single-column',
      transition: 'fade',
      speakerNotes: `Explain the details of: ${topic.title || ''}`,
    } as ContentSlideContent);
  });

  return slides;
}

/**
 * Create metrics slide
 */
function createMetricsSlide(metrics: NonNullable<BlueprintData['metrics']>): MetricsSlideContent {
  return {
    id: 'slide-metrics',
    type: 'metrics',
    title: 'Key Metrics',
    subtitle: 'Success indicators',
    metrics: metrics.map((metric, index) => ({
      id: `metric-${index}`,
      label: metric.label || '',
      value: metric.value || '',
      unit: '',
    })),
    layout: 'grid',
    transition: 'fade',
    speakerNotes: 'Highlight the key metrics and success indicators.',
  };
}

/**
 * Create learning outcomes slide
 */
function createLearningOutcomesSlide(outcomes: string[]): ContentSlideContent {
  return {
    id: 'slide-outcomes',
    type: 'content',
    title: 'Learning Outcomes',
    subtitle: 'What you will achieve',
    content: 'Upon completion, you will have:',
    bullets: outcomes,
    layout: 'single-column',
    transition: 'fade',
    speakerNotes: 'Summarize the key learning outcomes and achievements.',
  };
}

/**
 * Create resources slide
 */
function createResourcesSlide(
  resources: NonNullable<BlueprintData['resources']>
): ResourcesSlideContent {
  return {
    id: 'slide-resources',
    type: 'resources',
    title: 'Resources',
    subtitle: 'Additional materials',
    resources: resources.map((resource, index) => ({
      id: `resource-${index}`,
      title: resource.title || '',
      description: resource.description,
      url: resource.url,
      type: (resource.type as any) || 'other',
    })),
    transition: 'fade',
    speakerNotes: 'Share additional resources and reference materials.',
  };
}

/**
 * Create closing slide
 */
function createClosingSlide(data: BlueprintData): ContentSlideContent {
  return {
    id: 'slide-closing',
    type: 'content',
    title: 'Thank You',
    subtitle: 'Questions?',
    content: `Thank you for exploring this learning blueprint: "${data.title || 'Learning Blueprint'}"`,
    layout: 'centered',
    transition: 'fade',
    speakerNotes: 'Closing remarks and Q&A session.',
  };
}

/**
 * Helper: Filter empty slides
 */
export function filterEmptySlides(slides: SlideContent[]): SlideContent[] {
  return slides.filter((slide) => {
    if (slide.type === 'content') {
      return slide.title || slide.content || (slide.bullets && slide.bullets.length > 0);
    }
    return true;
  });
}

/**
 * Helper: Validate slide structure
 */
export function validateSlide(slide: SlideContent): boolean {
  if (!slide.id || !slide.type || !slide.title) {
    return false;
  }
  return true;
}

/**
 * Helper: Generate slide ID
 */
export function generateSlideId(prefix: string, index: number): string {
  return `${prefix}-${index}-${Date.now()}`;
}
