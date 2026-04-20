/**
 * Blueprint to Slides Parser
 * Transforms validated blueprint_json into presentation slide array
 *
 * Created for Task 4.2: Implement Core Blueprint to Slides Parser Logic
 *
 * @module blueprintToSlides
 */

import * as DOMPurify from 'isomorphic-dompurify';
import { createServiceLogger } from '@/lib/logging';
import { validateBlueprint, getBlueprintSections, type Blueprint } from './blueprintSchema';
import { getTransformer, type TransformerOptions } from './slideTransformers';
import type {
  SlideContent,
  CoverSlideContent,
  SectionSlideContent,
  ContentSlideContent,
  MetricsSlideContent,
  ModuleSlideContent,
  TimelineSlideContent,
  ResourcesSlideContent,
  ChartSlideContent,
} from '@/types/presentation';

const logger = createServiceLogger('blueprint-parser');

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ParseOptions {
  /**
   * Sanitize HTML content to prevent XSS attacks
   * @default true
   */
  sanitizeContent?: boolean;

  /**
   * Maximum number of slides to generate
   * @default 100
   */
  maxSlides?: number;

  /**
   * Include speaker notes in slides
   * @default true
   */
  includeSpeakerNotes?: boolean;

  /**
   * Generate table of contents slide
   * @default false
   */
  generateTableOfContents?: boolean;
}

export interface ParseResult {
  /**
   * Generated slides array
   */
  slides: SlideContent[];

  /**
   * Metadata from parsing
   */
  metadata: {
    totalSlides: number;
    blueprintTitle: string;
    generatedAt: string;
    sectionCount: number;
    warnings: string[];
  };
}

export class BlueprintParseError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'BlueprintParseError';
  }
}

// ============================================================================
// Content Sanitization
// ============================================================================

/**
 * Sanitize text content to prevent XSS attacks
 * Uses DOMPurify with strict configuration
 *
 * @param content - Raw text content
 * @returns Sanitized content safe for rendering
 */
export function sanitizeContent(content: string): string {
  if (!content || typeof content !== 'string') {
    return '';
  }

  // Use default export from isomorphic-dompurify
  const purify = DOMPurify.default || DOMPurify;
  return purify.sanitize(content, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'br', 'p', 'span'],
    ALLOWED_ATTR: ['href', 'title', 'target'],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false,
  });
}

/**
 * Sanitize array of strings
 * @param items - Array of strings to sanitize
 * @returns Sanitized array
 */
export function sanitizeArray(items: string[]): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return items.map((item) => sanitizeContent(item));
}

/**
 * Sanitize object with string values
 * @param obj - Object with string values
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeContent(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) =>
        typeof item === 'string' ? sanitizeContent(item) : sanitizeObject(item)
      );
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }
  return sanitized as T;
}

// ============================================================================
// Slide Generation Helpers
// ============================================================================

/**
 * Generate unique slide ID
 * @param type - Slide type
 * @param index - Slide index
 * @returns Unique slide ID
 */
function generateSlideId(type: string, index: number): string {
  return `${type}-${index}`;
}

/**
 * Create metadata for a slide
 * @param slideIndex - Global slide index
 * @param sectionName - Name of the blueprint section
 * @returns Slide metadata
 */
function createSlideMetadata(slideIndex: number, sectionName: string) {
  return {
    blueprintSection: sectionName,
    generatedAt: new Date().toISOString(),
    slideNumber: slideIndex + 1,
  };
}

// ============================================================================
// Section to Slide Transformers
// ============================================================================

/**
 * Create cover slide from blueprint metadata
 * @param blueprint - Validated blueprint
 * @param options - Parse options
 * @returns Cover slide
 */
export function createCoverSlide(blueprint: Blueprint, options: ParseOptions): CoverSlideContent {
  const { metadata } = blueprint;
  const sanitize = options.sanitizeContent !== false;

  return {
    id: generateSlideId('cover', 0),
    type: 'cover',
    title: 'Cover',
    subtitle: blueprint.overview
      ? sanitize
        ? sanitizeContent(blueprint.overview.substring(0, 200))
        : blueprint.overview.substring(0, 200)
      : undefined,
    mainTitle: sanitize ? sanitizeContent(metadata.title) : metadata.title,
    author: metadata.author
      ? sanitize
        ? sanitizeContent(metadata.author)
        : metadata.author
      : undefined,
    date: metadata.generated_at,
    backgroundImage: undefined,
    logo: undefined,
    transition: 'fade',
    duration: undefined,
    speakerNotes: options.includeSpeakerNotes
      ? 'Welcome slide - introduce the learning blueprint'
      : undefined,
    metadata: createSlideMetadata(0, 'metadata'),
  };
}

/**
 * Create section divider slide
 * @param title - Section title
 * @param sectionNumber - Section number
 * @param slideIndex - Global slide index
 * @param sectionKey - Blueprint section key
 * @param options - Parse options
 * @returns Section slide
 */
export function createSectionSlide(
  title: string,
  sectionNumber: number,
  slideIndex: number,
  sectionKey: string,
  options: ParseOptions
): SectionSlideContent {
  const sanitize = options.sanitizeContent !== false;

  return {
    id: generateSlideId('section', slideIndex),
    type: 'section',
    title: sanitize ? sanitizeContent(title) : title,
    subtitle: undefined,
    sectionNumber,
    icon: getSectionIcon(sectionKey),
    accentColor: getSectionColor(sectionNumber),
    transition: 'slide',
    duration: undefined,
    speakerNotes: options.includeSpeakerNotes ? `Section ${sectionNumber}: ${title}` : undefined,
    metadata: createSlideMetadata(slideIndex, sectionKey),
  };
}

/**
 * Get icon for section based on section key
 * @param sectionKey - Blueprint section key
 * @returns Emoji icon
 */
function getSectionIcon(sectionKey: string): string {
  const key = sectionKey.toLowerCase();
  if (key.includes('objective')) return '🎯';
  if (key.includes('module') || key.includes('curriculum')) return '📚';
  if (key.includes('timeline') || key.includes('schedule')) return '📅';
  if (key.includes('resource')) return '📦';
  if (key.includes('assessment') || key.includes('evaluation')) return '✅';
  if (key.includes('metric') || key.includes('kpi')) return '📊';
  if (key.includes('risk')) return '⚠️';
  return '📄';
}

/**
 * Get color for section
 * @param sectionNumber - Section number (1-indexed)
 * @returns Hex color code
 */
function getSectionColor(sectionNumber: number): string {
  const colors = [
    '#14b8a6', // Teal
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#6366f1', // Indigo
    '#f97316', // Orange
  ];
  return colors[(sectionNumber - 1) % colors.length];
}

/**
 * Format duration for display
 * @param duration - Duration value (number or string)
 * @returns Formatted duration string
 */
function formatDuration(duration: number | string): string {
  if (typeof duration === 'string') {
    return duration;
  }
  if (duration < 60) {
    return `${duration} minutes`;
  }
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours} hours`;
}

// ============================================================================
// Main Parser Function
// ============================================================================

/**
 * Parse blueprint_json into presentation slides
 *
 * @param blueprintJson - Raw blueprint JSON data
 * @param options - Parse options
 * @returns Parse result with slides and metadata
 * @throws BlueprintParseError if validation fails
 */
export function blueprintToSlides(blueprintJson: unknown, options: ParseOptions = {}): ParseResult {
  const opts: Required<ParseOptions> = {
    sanitizeContent: options.sanitizeContent !== false,
    maxSlides: options.maxSlides || 100,
    includeSpeakerNotes: options.includeSpeakerNotes !== false,
    generateTableOfContents: options.generateTableOfContents || false,
  };

  logger.info('blueprint-parser.parsing_started', 'Starting blueprint parsing', {
    sanitizeContent: opts.sanitizeContent,
    maxSlides: opts.maxSlides,
  });

  // Step 1: Validate blueprint structure
  let blueprint: Blueprint;
  try {
    blueprint = validateBlueprint(blueprintJson);
    logger.info('blueprint-parser.validation_success', 'Blueprint validation successful', {
      title: blueprint.metadata.title,
      sectionCount: getBlueprintSections(blueprint).length,
    });
  } catch (error) {
    logger.error('blueprint-parser.validation_failed', 'Blueprint validation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw new BlueprintParseError('Blueprint validation failed', 'VALIDATION_ERROR', error);
  }

  // Step 2: Initialize slides array and tracking
  const slides: SlideContent[] = [];
  const warnings: string[] = [];
  let currentSlideIndex = 0;

  // Step 3: Create cover slide
  try {
    const coverSlide = createCoverSlide(blueprint, opts);
    slides.push(coverSlide);
    currentSlideIndex++;
    logger.debug('blueprint-parser.cover_created', 'Cover slide created');
  } catch (error) {
    logger.error('blueprint-parser.cover_failed', 'Failed to create cover slide', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    warnings.push('Failed to create cover slide');
  }

  // Step 4: Get all content sections
  const sections = getBlueprintSections(blueprint);
  logger.info('blueprint-parser.sections_found', 'Found blueprint sections', {
    count: sections.length,
    sections,
  });

  // Step 5: Process each section
  let sectionNumber = 1;
  for (const sectionKey of sections) {
    if (currentSlideIndex >= opts.maxSlides) {
      logger.warn('blueprint-parser.max_slides_reached', 'Maximum slide limit reached', {
        maxSlides: opts.maxSlides,
        sectionKey,
      });
      warnings.push(`Stopped at section "${sectionKey}" due to max slides limit`);
      break;
    }

    try {
      const section = blueprint[sectionKey as keyof Blueprint];

      // Skip empty or invalid sections
      if (!section || (typeof section === 'string' && !section.trim())) {
        logger.debug('blueprint-parser.section_skipped', 'Skipping empty section', {
          sectionKey,
        });
        continue;
      }

      // Get section title for use in content slides
      const sectionTitle = formatSectionTitle(sectionKey);

      // Try to find a specific transformer for this section
      const transformer = getTransformer(sectionKey);

      if (transformer) {
        // Use specific transformer with section title included
        const transformerOptions: TransformerOptions = {
          sanitizeContent: opts.sanitizeContent,
          includeSpeakerNotes: opts.includeSpeakerNotes,
          slideIndex: currentSlideIndex,
          sectionKey,
          sectionTitle, // Pass section title to transformers
        };

        const contentSlides = transformer(blueprint, transformerOptions);

        if (contentSlides.length > 0) {
          // Add all generated slides
          slides.push(...contentSlides);
          currentSlideIndex += contentSlides.length;
          sectionNumber++;

          logger.debug('blueprint-parser.content_slides_created', 'Created content slides', {
            sectionKey,
            slideCount: contentSlides.length,
          });
        } else {
          // If no content slides were generated, create a single content slide with section info
          const fallbackSlide: ContentSlideContent = {
            id: `content-${currentSlideIndex}`,
            type: 'content',
            title: sectionTitle,
            subtitle: `Section ${sectionNumber}`,
            content: `Content for ${sectionTitle} is being processed...`,
            bullets: undefined,
            layout: 'single-column',
            transition: 'slide',
            duration: undefined,
            speakerNotes: opts.includeSpeakerNotes
              ? `Section ${sectionNumber}: ${sectionTitle}`
              : undefined,
            metadata: createSlideMetadata(currentSlideIndex, sectionKey),
          };
          slides.push(fallbackSlide);
          currentSlideIndex++;
          sectionNumber++;
        }
      } else {
        // Create a content slide instead of section divider when no transformer exists
        // Pass objects directly if they have displayType, otherwise stringify
        let slideContent: any = section;
        if (typeof section === 'object' && section !== null) {
          // Check if it's meant to be an infographic
          if (!(section as any).displayType) {
            slideContent = JSON.stringify(section, null, 2);
          }
        }

        const fallbackSlide: ContentSlideContent = {
          id: `content-${currentSlideIndex}`,
          type: 'content',
          title: sectionTitle,
          subtitle: `Section ${sectionNumber}`,
          content: slideContent,
          bullets: undefined,
          layout: 'single-column',
          transition: 'slide',
          duration: undefined,
          speakerNotes: opts.includeSpeakerNotes
            ? `Section ${sectionNumber}: ${sectionTitle}`
            : undefined,
          metadata: createSlideMetadata(currentSlideIndex, sectionKey),
        };
        slides.push(fallbackSlide);
        currentSlideIndex++;
        sectionNumber++;

        logger.debug(
          'blueprint-parser.no_transformer',
          'No specific transformer found, created fallback content slide',
          {
            sectionKey,
          }
        );
      }

      logger.debug('blueprint-parser.section_processed', 'Processed section', {
        sectionKey,
        slidesAdded: slides.length - currentSlideIndex + sectionNumber - 1,
      });
    } catch (error) {
      logger.error('blueprint-parser.section_failed', 'Failed to process section', {
        sectionKey,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      warnings.push(`Failed to process section: ${sectionKey}`);
    }
  }

  // Step 6: Build result
  const result: ParseResult = {
    slides,
    metadata: {
      totalSlides: slides.length,
      blueprintTitle: blueprint.metadata.title,
      generatedAt: new Date().toISOString(),
      sectionCount: sections.length,
      warnings,
    },
  };

  logger.info('blueprint-parser.parsing_complete', 'Blueprint parsing complete', {
    totalSlides: result.metadata.totalSlides,
    sectionCount: result.metadata.sectionCount,
    warningCount: warnings.length,
  });

  return result;
}

/**
 * Format section key to human-readable title
 * @param sectionKey - Raw section key
 * @returns Formatted title
 */
function formatSectionTitle(sectionKey: string): string {
  return sectionKey
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ============================================================================
// Exports
// ============================================================================

export default blueprintToSlides;
