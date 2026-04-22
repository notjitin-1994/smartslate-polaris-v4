/**
 * Section-Specific Slide Transformation Functions
 * Individual transformers for each blueprint section type
 *
 * Created for Task 4.3: Build Section-Specific Slide Transformation Functions
 *
 * @module slideTransformers
 */

import { createServiceLogger } from '@/lib/logging';
import { sanitizeContent, sanitizeArray, sanitizeObject } from './blueprintToSlides';
import type {
  Blueprint,
  Module,
  TimelinePhase,
  ResourceItem,
  Assessment,
  Metric,
} from './blueprintSchema';
import type {
  SlideContent,
  ContentSlideContent,
  ModuleSlideContent,
  TimelineSlideContent,
  ResourcesSlideContent,
  MetricsSlideContent,
} from '@/types/presentation';

const logger = createServiceLogger('slide-transformers');

// ============================================================================
// Transformer Options
// ============================================================================

export interface TransformerOptions {
  sanitizeContent: boolean;
  includeSpeakerNotes: boolean;
  slideIndex: number;
  sectionKey: string;
  sectionTitle?: string;
}

// ============================================================================
// Objectives Section Transformers
// ============================================================================

/**
 * Create content slides from objectives section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createObjectiveSlides(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  // Check both objectives and learning_objectives (aliases)
  const objectivesSection = blueprint.objectives || blueprint.learning_objectives;

  if (!objectivesSection) {
    logger.debug('slide-transformers.no_objectives', 'No objectives section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes } = options;
  let { slideIndex } = options;

  // Get objectives array
  const objectives = objectivesSection.objectives || [];

  if (objectives.length === 0) {
    logger.warn('slide-transformers.empty_objectives', 'Objectives section is empty');
    return slides;
  }

  // Create content slide with objectives
  const objectivesList = objectives.map((obj) => {
    if (typeof obj === 'string') {
      return shouldSanitize ? sanitizeContent(obj) : obj;
    }
    return shouldSanitize ? sanitizeContent(obj.objective || '') : obj.objective || '';
  });

  const slide: ContentSlideContent = {
    id: `objectives-${slideIndex}`,
    type: 'content',
    title: options.sectionTitle || 'Learning Objectives',
    subtitle: 'Key Goals & Outcomes',
    content: 'This program is designed to help you achieve the following objectives:',
    bullets: objectivesList,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Introduce the key learning objectives for this program. Total objectives: ${objectivesList.length}`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.objectives_created', 'Created objectives slide', {
    objectiveCount: objectivesList.length,
  });

  return slides;
}

// ============================================================================
// Modules Section Transformers
// ============================================================================

/**
 * Create module slides from modules section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of module slides
 */
export function createModuleSlides(
  blueprint: Blueprint,
  options: TransformerOptions
): ModuleSlideContent[] {
  const slides: ModuleSlideContent[] = [];

  // Check modules, learning_modules, curriculum (aliases)
  const modulesSection = blueprint.modules || blueprint.learning_modules || blueprint.curriculum;

  if (!modulesSection) {
    logger.debug('slide-transformers.no_modules', 'No modules section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes } = options;
  let { slideIndex } = options;

  const modules = modulesSection.modules || [];

  if (modules.length === 0) {
    logger.warn('slide-transformers.empty_modules', 'Modules section is empty');
    return slides;
  }

  // Create a slide for each module
  modules.forEach((module: Module, index: number) => {
    const moduleNumber = index + 1;

    // Prepare module data
    const objectives = module.objectives || [];
    const topics = module.topics || [];
    const estimatedDuration =
      typeof module.duration === 'number' ? `${module.duration} minutes` : String(module.duration);

    const slide: ModuleSlideContent = {
      id: `module-${slideIndex}`,
      type: 'module',
      title: shouldSanitize ? sanitizeContent(module.title) : module.title,
      subtitle: module.description
        ? shouldSanitize
          ? sanitizeContent(module.description)
          : module.description
        : undefined,
      moduleNumber,
      objectives: shouldSanitize ? sanitizeArray(objectives) : objectives,
      estimatedDuration,
      topics: topics.map((topic, topicIndex) => ({
        id: `topic-${topicIndex}`,
        title: shouldSanitize ? sanitizeContent(topic) : topic,
        completed: false,
      })),
      transition: 'slide',
      duration: undefined,
      speakerNotes: includeSpeakerNotes
        ? `Module ${moduleNumber}: ${module.title}. Estimated duration: ${estimatedDuration}`
        : undefined,
      metadata: {
        blueprintSection: options.sectionKey,
        moduleNumber,
        generatedAt: new Date().toISOString(),
        slideNumber: slideIndex + 1,
      },
    };

    slides.push(slide);
    slideIndex++;
  });

  logger.debug('slide-transformers.modules_created', 'Created module slides', {
    moduleCount: modules.length,
  });

  return slides;
}

// ============================================================================
// Timeline Section Transformers
// ============================================================================

/**
 * Create timeline slide from timeline/implementation section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array with single timeline slide
 */
export function createTimelineSlide(
  blueprint: Blueprint,
  options: TransformerOptions
): TimelineSlideContent[] {
  const slides: TimelineSlideContent[] = [];

  // Check timeline, implementation_plan, schedule (aliases)
  const timelineSection = blueprint.timeline || blueprint.implementation_plan || blueprint.schedule;

  if (!timelineSection) {
    logger.debug('slide-transformers.no_timeline', 'No timeline section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  // Get phases array (or timeline array as alias)
  const phases = timelineSection.phases || timelineSection.timeline || [];

  if (phases.length === 0) {
    logger.warn('slide-transformers.empty_timeline', 'Timeline section is empty');
    return slides;
  }

  // Transform phases to timeline items
  const items = phases.map((phase: TimelinePhase, index: number) => {
    const phaseNumber = typeof phase.phase === 'number' ? phase.phase : index + 1;

    // Map status to allowed values, default to 'upcoming' for 'blocked' or unknown
    const status: 'completed' | 'in-progress' | 'upcoming' =
      phase.status === 'completed' || phase.status === 'in-progress' ? phase.status : 'upcoming';

    return {
      id: `event-${index}`,
      date: phase.start_date || undefined,
      phase: `Phase ${phaseNumber}`,
      title: shouldSanitize ? sanitizeContent(phase.title) : phase.title,
      description: phase.duration
        ? `Duration: ${phase.duration}`
        : phase.end_date
          ? `Ends: ${phase.end_date}`
          : undefined,
      status,
    };
  });

  const slide: TimelineSlideContent = {
    id: `timeline-${slideIndex}`,
    type: 'timeline',
    title: 'Implementation Timeline',
    subtitle: timelineSection.duration ? `Total Duration: ${timelineSection.duration}` : undefined,
    items,
    orientation: 'horizontal',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Timeline showing ${phases.length} phases of implementation`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.timeline_created', 'Created timeline slide', {
    phaseCount: phases.length,
  });

  return slides;
}

// ============================================================================
// Resources Section Transformers
// ============================================================================

/**
 * Create resources slide from resources section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array with single resources slide
 */
export function createResourcesSlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ResourcesSlideContent[] {
  const slides: ResourcesSlideContent[] = [];

  // Check resources, learning_resources (aliases)
  const resourcesSection = blueprint.resources || blueprint.learning_resources;

  if (!resourcesSection) {
    logger.debug('slide-transformers.no_resources', 'No resources section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  const resources = resourcesSection.resources || [];

  if (resources.length === 0) {
    logger.warn('slide-transformers.empty_resources', 'Resources section is empty');
    return slides;
  }

  // Transform resources to presentation format
  const resourceItems = resources.map((resource: ResourceItem, index: number) => {
    const title = resource.title || resource.name || 'Untitled Resource';
    return {
      id: `resource-${index}`,
      title: shouldSanitize ? sanitizeContent(title) : title,
      description: resource.description
        ? shouldSanitize
          ? sanitizeContent(resource.description)
          : resource.description
        : undefined,
      url: resource.url,
      type: resource.type as 'link' | 'video' | 'document' | 'tool' | 'other',
      icon: getResourceIcon(resource.type),
    };
  });

  // Get categories from section or group by type
  const categories =
    resourcesSection.categories || Array.from(new Set(resources.map((r: ResourceItem) => r.type)));

  const slide: ResourcesSlideContent = {
    id: `resources-${slideIndex}`,
    type: 'resources',
    title: 'Learning Resources',
    subtitle: `${resources.length} resources available`,
    resources: resourceItems,
    categories,
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Overview of ${resources.length} learning resources organized by type`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.resources_created', 'Created resources slide', {
    resourceCount: resources.length,
    categoryCount: categories.length,
  });

  return slides;
}

/**
 * Get icon for resource type
 * @param type - Resource type
 * @returns Emoji icon
 */
function getResourceIcon(type: string): string {
  const typeMap: Record<string, string> = {
    link: '🔗',
    video: '🎥',
    document: '📄',
    documentation: '📚',
    tool: '🔧',
    article: '📰',
    book: '📖',
    course: '🎓',
    other: '📎',
  };
  return typeMap[type.toLowerCase()] || '📎';
}

// ============================================================================
// Assessments Section Transformers
// ============================================================================

/**
 * Create content slides from assessments section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createAssessmentSlides(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  // Check multiple possible field names
  const assessmentsSection =
    (blueprint as any).assessments ||
    (blueprint as any).evaluation ||
    (blueprint as any).assessment_strategy ||
    (blueprint as any).evaluation_methods;

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  let assessmentBullets: string[] = [];

  if (assessmentsSection) {
    // Handle different data formats
    if (typeof assessmentsSection === 'string') {
      // String format - split into lines
      assessmentBullets = assessmentsSection.split('\n').filter((line: string) => line.trim());
    } else if (Array.isArray(assessmentsSection)) {
      // Direct array of assessments
      assessmentBullets = assessmentsSection.map((assessment: any) => {
        if (typeof assessment === 'string') {
          return shouldSanitize ? sanitizeContent(assessment) : assessment;
        }
        const title = assessment.title || assessment.name || assessment.method || '';
        const type = assessment.type ? ` - ${assessment.type}` : '';
        const weight = assessment.weight ? ` (${assessment.weight}%)` : '';
        const description = assessment.description ? `: ${assessment.description}` : '';
        return shouldSanitize
          ? sanitizeContent(title + type + weight + description)
          : title + type + weight + description;
      });
    } else if (typeof assessmentsSection === 'object' && assessmentsSection !== null) {
      // Check if it's an infographic
      if ((assessmentsSection as any).displayType === 'infographic') {
        const slide: ContentSlideContent = {
          id: `assessments-${slideIndex}`,
          type: 'content',
          title: options.sectionTitle || 'Assessment Strategy',
          subtitle: 'Evaluation Methods & Criteria',
          content: assessmentsSection,
          bullets: undefined,
          layout: 'single-column',
          transition: 'slide',
          duration: undefined,
          speakerNotes: includeSpeakerNotes ? 'Assessment strategy infographic' : undefined,
          metadata: {
            blueprintSection: options.sectionKey,
            generatedAt: new Date().toISOString(),
            slideNumber: slideIndex + 1,
          },
        };
        slides.push(slide);
        return slides;
      }

      // Object with assessments array
      const assessments =
        assessmentsSection.assessments ||
        assessmentsSection.methods ||
        assessmentsSection.items ||
        [];

      if (Array.isArray(assessments) && assessments.length > 0) {
        assessmentBullets = assessments.map((assessment: any) => {
          const title = assessment.title || assessment.name || assessment.method || '';
          const type = assessment.type ? ` - ${assessment.type}` : '';
          const weight = assessment.weight ? ` (${assessment.weight}%)` : '';
          const criteria = assessment.criteria ? ` | ${assessment.criteria}` : '';
          return shouldSanitize
            ? sanitizeContent(title + type + weight + criteria)
            : title + type + weight + criteria;
        });
      } else {
        // Extract from object properties
        assessmentBullets = Object.entries(assessmentsSection)
          .filter(([key]) => key !== 'displayType')
          .map(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            const valueStr =
              typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            return `${formattedKey}: ${valueStr}`;
          });
      }
    }
  }

  // If no assessments found, create default content
  if (assessmentBullets.length === 0) {
    assessmentBullets = [
      'Formative Assessments - Ongoing feedback and progress checks',
      'Summative Assessments - End-of-module evaluations',
      'Performance-Based Tasks - Practical application exercises',
      'Self-Assessment Tools - Reflection and self-evaluation',
      'Peer Review Activities - Collaborative feedback sessions',
    ];
  }

  const slide: ContentSlideContent = {
    id: `assessments-${slideIndex}`,
    type: 'content',
    title: options.sectionTitle || 'Assessment Strategy',
    subtitle: 'Evaluation Methods & Success Criteria',
    content: 'Key assessment components and evaluation strategies:',
    bullets: assessmentBullets,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Overview of ${assessmentBullets.length} assessment methods in the program`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.assessments_created', 'Created assessments slide', {
    assessmentCount: assessmentBullets.length,
  });

  return slides;
}

// ============================================================================
// Metrics/KPIs Section Transformers
// ============================================================================

/**
 * Create metrics slide from metrics/KPIs section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array with single metrics slide
 */
export function createMetricsSlide(
  blueprint: Blueprint,
  options: TransformerOptions
): MetricsSlideContent[] {
  const slides: MetricsSlideContent[] = [];

  // Check metrics, kpis, success_metrics (aliases)
  const metricsSection = blueprint.metrics || blueprint.kpis || blueprint.success_metrics;

  if (!metricsSection) {
    logger.debug('slide-transformers.no_metrics', 'No metrics section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  // Get metrics array (or kpis as alias)
  const metrics = metricsSection.metrics || metricsSection.kpis || [];

  if (metrics.length === 0) {
    logger.warn('slide-transformers.empty_metrics', 'Metrics section is empty');
    return slides;
  }

  // Transform metrics to presentation format
  const metricItems = metrics.map((metric: Metric, index: number) => {
    const label = shouldSanitize ? sanitizeContent(metric.name) : metric.name;
    const value =
      typeof metric.target === 'number' ? metric.target : parseFloat(String(metric.target)) || 0;
    const unit = metric.unit || '';

    return {
      id: `metric-${index}`,
      label,
      value,
      unit,
      trend: 'up' as const,
      trendValue: 0,
      icon: '📊',
      color: getMetricColor(index),
    };
  });

  const slide: MetricsSlideContent = {
    id: `metrics-${slideIndex}`,
    type: 'metrics',
    title: 'Key Performance Indicators',
    subtitle: 'Success metrics for this program',
    metrics: metricItems,
    layout: 'grid',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Overview of ${metrics.length} key performance indicators`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.metrics_created', 'Created metrics slide', {
    metricCount: metrics.length,
  });

  return slides;
}

/**
 * Get color for metric card
 * @param index - Metric index
 * @returns Hex color code
 */
function getMetricColor(index: number): string {
  const colors = [
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
  ];
  return colors[index % colors.length];
}

// ============================================================================
// Executive Summary / Overview Transformers
// ============================================================================

/**
 * Create content slide from executive summary or overview
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array with single content slide
 */
export function createExecutiveSummarySlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  // Check both executive_summary and overview
  const summary = blueprint.executive_summary || blueprint.overview;

  if (!summary || typeof summary !== 'string' || !summary.trim()) {
    logger.debug('slide-transformers.no_summary', 'No executive summary found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  // Split summary into paragraphs for better readability
  const paragraphs = summary
    .split('\n')
    .filter((p) => p.trim())
    .map((p) => p.trim());

  const slide: ContentSlideContent = {
    id: `summary-${slideIndex}`,
    type: 'content',
    title: 'Executive Summary',
    subtitle: undefined,
    content: paragraphs[0] || summary,
    bullets: paragraphs.length > 1 ? paragraphs.slice(1) : undefined,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? 'Overview of the learning blueprint and its key components'
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.summary_created', 'Created executive summary slide');

  return slides;
}

// ============================================================================
// Risks Section Transformers
// ============================================================================

/**
 * Create content slides from risks section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createRisksSlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  // Check multiple possible field names
  const risksSection =
    (blueprint as any).risks ||
    (blueprint as any).risk_management ||
    (blueprint as any).risk_mitigation ||
    (blueprint as any).risk_assessment;

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  let riskBullets: string[] = [];

  if (risksSection) {
    // Extract risks from various possible structures
    if (typeof risksSection === 'string') {
      // String format - split into lines
      riskBullets = risksSection.split('\n').filter((line: string) => line.trim());
    } else if (Array.isArray(risksSection)) {
      // Direct array of risks
      riskBullets = risksSection.map((risk: any) => {
        if (typeof risk === 'string') {
          return shouldSanitize ? sanitizeContent(risk) : risk;
        }
        const riskText = risk.risk || risk.title || risk.description || JSON.stringify(risk);
        const mitigation = risk.mitigation ? ` → Mitigation: ${risk.mitigation}` : '';
        return shouldSanitize ? sanitizeContent(riskText + mitigation) : riskText + mitigation;
      });
    } else if (typeof risksSection === 'object' && risksSection !== null) {
      // Check if it's an infographic
      if ((risksSection as any).displayType === 'infographic') {
        const slide: ContentSlideContent = {
          id: `risks-${slideIndex}`,
          type: 'content',
          title: options.sectionTitle || 'Risk Management',
          subtitle: 'Potential Risks & Mitigation Strategies',
          content: risksSection,
          bullets: undefined,
          layout: 'single-column',
          transition: 'slide',
          duration: undefined,
          speakerNotes: includeSpeakerNotes ? 'Risk management infographic' : undefined,
          metadata: {
            blueprintSection: options.sectionKey,
            generatedAt: new Date().toISOString(),
            slideNumber: slideIndex + 1,
          },
        };
        slides.push(slide);
        return slides;
      }

      // Object with risks array
      const risks = risksSection.risks || risksSection.items || [];
      if (Array.isArray(risks) && risks.length > 0) {
        riskBullets = risks.map((risk: any) => {
          if (typeof risk === 'string') {
            return shouldSanitize ? sanitizeContent(risk) : risk;
          }
          const riskText = risk.risk || risk.title || risk.description || '';
          const mitigation = risk.mitigation ? ` → ${risk.mitigation}` : '';
          const probability = risk.probability ? ` (${risk.probability} probability)` : '';
          const impact = risk.impact ? ` [${risk.impact} impact]` : '';
          return shouldSanitize
            ? sanitizeContent(riskText + probability + impact + mitigation)
            : riskText + probability + impact + mitigation;
        });
      } else {
        // Extract from object properties
        riskBullets = Object.entries(risksSection)
          .filter(([key]) => key !== 'displayType')
          .map(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
            const valueStr =
              typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
            return `${formattedKey}: ${valueStr}`;
          });
      }
    }
  }

  // If no risks found, create default content
  if (riskBullets.length === 0) {
    riskBullets = [
      'Resource constraints → Regular resource audits and contingency planning',
      'Stakeholder resistance → Early engagement and change management strategies',
      'Technology challenges → Phased implementation and technical support',
      'Timeline delays → Buffer time and milestone-based tracking',
      'Quality concerns → Regular reviews and feedback loops',
    ];
  }

  const slide: ContentSlideContent = {
    id: `risks-${slideIndex}`,
    type: 'content',
    title: options.sectionTitle || 'Risk Management',
    subtitle: 'Identification & Mitigation Strategies',
    content: 'Key risks and their corresponding mitigation approaches:',
    bullets: riskBullets,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? `Overview of ${riskBullets.length} key risks and their mitigation strategies`
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.risks_created', 'Created risks slide', {
    riskCount: riskBullets.length,
  });

  return slides;
}

// ============================================================================
// Content Outline Section Transformers
// ============================================================================

/**
 * Create content slides from content outline section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createContentOutlineSlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  const outlineSection = (blueprint as any).content_outline || (blueprint as any).content;

  if (!outlineSection) {
    // Create a fallback slide with available content
    const fallbackSlide: ContentSlideContent = {
      id: `content-outline-${options.slideIndex}`,
      type: 'content',
      title: options.sectionTitle || 'Content Outline',
      subtitle: 'Program Structure & Organization',
      content:
        'This section will outline the key topics and learning modules covered in this program.',
      bullets: [
        'Core concepts and fundamentals',
        'Practical applications and exercises',
        'Assessment methodologies',
        'Resources and support materials',
      ],
      layout: 'single-column',
      transition: 'slide',
      duration: undefined,
      speakerNotes: options.includeSpeakerNotes ? 'Overview of content structure' : undefined,
      metadata: {
        blueprintSection: options.sectionKey,
        generatedAt: new Date().toISOString(),
        slideNumber: options.slideIndex + 1,
      },
    };
    slides.push(fallbackSlide);
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  let contentText = '';
  let bullets: string[] = [];

  // Handle different data formats
  if (typeof outlineSection === 'string') {
    // String format - split into paragraphs
    const paragraphs = outlineSection.split('\n').filter((p) => p.trim());
    contentText = paragraphs[0] || outlineSection;
    bullets = paragraphs.length > 1 ? paragraphs.slice(1) : [];
  } else if (Array.isArray(outlineSection)) {
    // Array format - use as bullets
    bullets = outlineSection.map((item: any) => {
      if (typeof item === 'string') {
        return shouldSanitize ? sanitizeContent(item) : item;
      }
      return shouldSanitize
        ? sanitizeContent(item.title || item.name || item.topic || JSON.stringify(item))
        : item.title || item.name || item.topic || JSON.stringify(item);
    });
    contentText = 'Content structure and organization:';
  } else if (typeof outlineSection === 'object' && outlineSection !== null) {
    // Check if it's an infographic
    if ((outlineSection as any).displayType === 'infographic') {
      const slide: ContentSlideContent = {
        id: `content-outline-${slideIndex}`,
        type: 'content',
        title: options.sectionTitle || 'Content Outline',
        subtitle: 'Program Structure',
        content: outlineSection,
        bullets: undefined,
        layout: 'single-column',
        transition: 'slide',
        duration: undefined,
        speakerNotes: includeSpeakerNotes ? 'Content outline infographic' : undefined,
        metadata: {
          blueprintSection: options.sectionKey,
          generatedAt: new Date().toISOString(),
          slideNumber: slideIndex + 1,
        },
      };
      slides.push(slide);
      return slides;
    }

    // Object format - extract content
    if (outlineSection.content) {
      contentText = shouldSanitize
        ? sanitizeContent(outlineSection.content)
        : outlineSection.content;
    }
    if (outlineSection.outline || outlineSection.items || outlineSection.modules) {
      const items = outlineSection.outline || outlineSection.items || outlineSection.modules;
      bullets = Array.isArray(items)
        ? items.map((item: any) => {
            if (typeof item === 'string') {
              return shouldSanitize ? sanitizeContent(item) : item;
            }
            return shouldSanitize
              ? sanitizeContent(item.title || item.name || item.topic || JSON.stringify(item))
              : item.title || item.name || item.topic || JSON.stringify(item);
          })
        : [];
    }

    // If no structured data, create bullets from object properties
    if (bullets.length === 0 && !contentText) {
      bullets = Object.entries(outlineSection)
        .filter(([key]) => key !== 'displayType')
        .map(([key, value]) => {
          const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
          const valueStr =
            typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
          return `${formattedKey}: ${valueStr}`;
        });
    }
  }

  const slide: ContentSlideContent = {
    id: `content-outline-${slideIndex}`,
    type: 'content',
    title: options.sectionTitle || 'Content Outline',
    subtitle: 'Program Structure & Topics',
    content: contentText || 'Key learning areas covered in this program:',
    bullets: bullets.length > 0 ? bullets : undefined,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? 'Overview of the content structure and organization'
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.content_outline_created', 'Created content outline slide');

  return slides;
}

// ============================================================================
// Instructional Strategy Section Transformers
// ============================================================================

/**
 * Create content slides from instructional strategy section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createInstructionalStrategySlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  const strategySection = (blueprint as any).instructional_strategy;

  if (!strategySection) {
    logger.debug(
      'slide-transformers.no_instructional_strategy',
      'No instructional strategy section found'
    );
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  let contentText = '';
  let bullets: string[] = [];

  // Handle different data formats
  if (typeof strategySection === 'string') {
    // String format - split into paragraphs
    const paragraphs = strategySection.split('\n').filter((p) => p.trim());
    contentText = paragraphs[0] || strategySection;
    bullets = paragraphs.length > 1 ? paragraphs.slice(1) : [];
  } else if (Array.isArray(strategySection)) {
    // Array format - use as bullets
    bullets = strategySection.map((item: any) => {
      if (typeof item === 'string') {
        return shouldSanitize ? sanitizeContent(item) : item;
      }
      return shouldSanitize
        ? sanitizeContent(item.strategy || item.approach || '')
        : item.strategy || item.approach || '';
    });
    contentText = 'Key instructional strategies:';
  } else if (typeof strategySection === 'object' && strategySection !== null) {
    // Object format - extract content
    if (strategySection.description || strategySection.strategy) {
      contentText = shouldSanitize
        ? sanitizeContent(strategySection.description || strategySection.strategy)
        : strategySection.description || strategySection.strategy;
    }
    if (strategySection.strategies || strategySection.approaches) {
      const items = strategySection.strategies || strategySection.approaches;
      bullets = Array.isArray(items)
        ? items.map((item: any) => {
            if (typeof item === 'string') {
              return shouldSanitize ? sanitizeContent(item) : item;
            }
            return shouldSanitize
              ? sanitizeContent(item.strategy || item.approach || '')
              : item.strategy || item.approach || '';
          })
        : [];
    }
  }

  if (!contentText && bullets.length === 0) {
    logger.warn(
      'slide-transformers.empty_instructional_strategy',
      'Instructional strategy section is empty'
    );
    return slides;
  }

  const slide: ContentSlideContent = {
    id: `instructional-strategy-${slideIndex}`,
    type: 'content',
    title: 'Instructional Strategy',
    subtitle: undefined,
    content: contentText || 'Teaching and learning approaches:',
    bullets: bullets.length > 0 ? bullets : undefined,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? 'Overview of the instructional strategies and pedagogical approaches'
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug(
    'slide-transformers.instructional_strategy_created',
    'Created instructional strategy slide'
  );

  return slides;
}

// ============================================================================
// Sustainability Plan Section Transformers
// ============================================================================

/**
 * Create content slides from sustainability plan section
 * @param blueprint - Validated blueprint
 * @param options - Transformer options
 * @returns Array of content slides
 */
export function createSustainabilitySlide(
  blueprint: Blueprint,
  options: TransformerOptions
): ContentSlideContent[] {
  const slides: ContentSlideContent[] = [];

  const sustainabilitySection =
    (blueprint as any).sustainability_plan || (blueprint as any).sustainability;

  if (!sustainabilitySection) {
    logger.debug('slide-transformers.no_sustainability', 'No sustainability section found');
    return slides;
  }

  const { sanitizeContent: shouldSanitize, includeSpeakerNotes, slideIndex } = options;

  let contentText = '';
  let bullets: string[] = [];

  // Handle different data formats
  if (typeof sustainabilitySection === 'string') {
    // String format - split into paragraphs
    const paragraphs = sustainabilitySection.split('\n').filter((p) => p.trim());
    contentText = paragraphs[0] || sustainabilitySection;
    bullets = paragraphs.length > 1 ? paragraphs.slice(1) : [];
  } else if (Array.isArray(sustainabilitySection)) {
    // Array format - use as bullets
    bullets = sustainabilitySection.map((item: any) => {
      if (typeof item === 'string') {
        return shouldSanitize ? sanitizeContent(item) : item;
      }
      return shouldSanitize
        ? sanitizeContent(item.plan || item.strategy || '')
        : item.plan || item.strategy || '';
    });
    contentText = 'Sustainability strategies:';
  } else if (typeof sustainabilitySection === 'object' && sustainabilitySection !== null) {
    // Object format - extract content
    if (sustainabilitySection.description || sustainabilitySection.plan) {
      contentText = shouldSanitize
        ? sanitizeContent(sustainabilitySection.description || sustainabilitySection.plan)
        : sustainabilitySection.description || sustainabilitySection.plan;
    }
    if (sustainabilitySection.strategies || sustainabilitySection.plans) {
      const items = sustainabilitySection.strategies || sustainabilitySection.plans;
      bullets = Array.isArray(items)
        ? items.map((item: any) => {
            if (typeof item === 'string') {
              return shouldSanitize ? sanitizeContent(item) : item;
            }
            return shouldSanitize
              ? sanitizeContent(item.plan || item.strategy || '')
              : item.plan || item.strategy || '';
          })
        : [];
    }
  }

  if (!contentText && bullets.length === 0) {
    logger.warn('slide-transformers.empty_sustainability', 'Sustainability section is empty');
    return slides;
  }

  const slide: ContentSlideContent = {
    id: `sustainability-${slideIndex}`,
    type: 'content',
    title: 'Sustainability Plan',
    subtitle: undefined,
    content: contentText || 'Long-term sustainability strategies:',
    bullets: bullets.length > 0 ? bullets : undefined,
    layout: 'single-column',
    transition: 'slide',
    duration: undefined,
    speakerNotes: includeSpeakerNotes
      ? 'Overview of sustainability strategies for long-term program success'
      : undefined,
    metadata: {
      blueprintSection: options.sectionKey,
      generatedAt: new Date().toISOString(),
      slideNumber: slideIndex + 1,
    },
  };

  slides.push(slide);
  logger.debug('slide-transformers.sustainability_created', 'Created sustainability slide');

  return slides;
}

// ============================================================================
// Transformer Registry
// ============================================================================

export interface TransformerFunction {
  (blueprint: Blueprint, options: TransformerOptions): SlideContent[];
}

/**
 * Map of section keys to transformer functions
 * Allows dynamic lookup of appropriate transformer
 */
export const transformerRegistry: Record<string, TransformerFunction> = {
  // Executive Summary / Overview
  executive_summary: createExecutiveSummarySlide,
  overview: createExecutiveSummarySlide,

  // Objectives
  objectives: createObjectiveSlides,
  learning_objectives: createObjectiveSlides,

  // Modules
  modules: createModuleSlides,
  learning_modules: createModuleSlides,
  curriculum: createModuleSlides,

  // Timeline
  timeline: createTimelineSlide,
  implementation_plan: createTimelineSlide,
  schedule: createTimelineSlide,

  // Resources
  resources: createResourcesSlide,
  learning_resources: createResourcesSlide,

  // Assessments
  assessments: createAssessmentSlides,
  evaluation: createAssessmentSlides,

  // Metrics
  metrics: createMetricsSlide,
  kpis: createMetricsSlide,
  success_metrics: createMetricsSlide,

  // Risks
  risks: createRisksSlide,
  risk_management: createRisksSlide,

  // Content Outline
  content_outline: createContentOutlineSlide,

  // Instructional Strategy
  instructional_strategy: createInstructionalStrategySlide,

  // Sustainability
  sustainability_plan: createSustainabilitySlide,
  sustainability: createSustainabilitySlide,
};

/**
 * Get appropriate transformer function for a section
 * @param sectionKey - Blueprint section key
 * @returns Transformer function or null if not found
 */
export function getTransformer(sectionKey: string): TransformerFunction | null {
  const key = sectionKey.toLowerCase();
  return transformerRegistry[key] || null;
}
