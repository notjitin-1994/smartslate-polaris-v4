/**
 * Blueprint to Slides Parser Integration Tests
 * Tests the complete parsing pipeline from blueprint_json to slide array
 *
 * Task 4.5: Create Parser Integration Tests and Performance Optimization
 */

import { describe, it, expect, beforeEach } from 'vitest';
import blueprintToSlides from '@/lib/presentation/blueprintToSlides';
import type { Blueprint } from '@/lib/presentation/blueprintSchema';

describe('Blueprint to Slides Parser Integration', () => {
  let sampleBlueprint: Blueprint;

  beforeEach(() => {
    // Sample blueprint data matching the schema
    sampleBlueprint = {
      metadata: {
        title: 'Test Learning Blueprint',
        organization: 'Test Org',
        role: 'Developer',
        generated_at: new Date().toISOString(),
        version: '1.0',
        author: 'Test Author',
        description: 'A test blueprint for integration testing',
      },
      objectives: {
        displayType: 'infographic' as const,
        objectives: [
          'Understand unit testing',
          'Learn integration testing',
          'Apply TDD principles',
        ],
        learning_outcomes: ['Write effective unit tests', 'Create comprehensive integration tests'],
      },
      modules: {
        displayType: 'timeline' as const,
        modules: [
          {
            title: 'Module 1: Introduction to Testing',
            duration: '1 week',
            topics: ['Unit Tests', 'Integration Tests', 'E2E Tests'],
            activities: ['Write unit tests', 'Write integration tests'],
            assessments: ['Quiz 1'],
          },
          {
            title: 'Module 2: Advanced Testing',
            duration: '2 weeks',
            topics: ['Mocking', 'Stubbing', 'Test Coverage'],
            activities: ['Use test doubles', 'Measure coverage'],
            assessments: ['Final exam'],
          },
        ],
        total_duration: '3 weeks',
      },
      timeline: {
        displayType: 'timeline' as const,
        phases: [
          {
            phase: 'Phase 1',
            title: 'Foundation Phase',
            duration: '1 week',
            milestones: ['Complete Module 1', 'Pass assessments'],
          },
          {
            phase: 'Phase 2',
            title: 'Advanced Phase',
            duration: '2 weeks',
            milestones: ['Complete Module 2', 'Final project'],
          },
        ],
        duration: '3 weeks',
      },
      resources: {
        displayType: 'infographic' as const,
        resources: [
          {
            title: 'Vitest Documentation',
            type: 'documentation' as const,
            url: 'https://vitest.dev',
            description: 'Official Vitest docs',
          },
          {
            title: 'Testing Best Practices',
            type: 'article' as const,
            url: 'https://example.com/testing',
            description: 'Testing patterns and anti-patterns',
          },
          {
            title: 'Vitest',
            type: 'tool' as const,
            url: 'https://vitest.dev',
            description: 'Fast unit test framework',
          },
        ],
      },
      assessments: {
        displayType: 'table' as const,
        assessments: [
          {
            title: 'Unit Testing Quiz',
            type: 'quiz' as const,
            description: 'Test your unit testing knowledge',
            duration: 30,
          },
          {
            title: 'Integration Testing Project',
            type: 'project' as const,
            description: 'Build a tested application',
            duration: 120,
          },
        ],
      },
      metrics: {
        displayType: 'chart' as const,
        metrics: [
          {
            name: 'Test Coverage',
            target: '80%',
            current: '65%',
          },
          {
            name: 'Passing Tests',
            target: '100%',
            current: '95%',
          },
        ],
      },
    };
  });

  describe('Core Parsing Functionality', () => {
    it('should parse valid blueprint into slides', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result).toBeDefined();
      expect(result.slides).toBeInstanceOf(Array);
      expect(result.slides.length).toBeGreaterThan(0);
      expect(result.metadata).toBeDefined();
    });

    it('should create a cover slide from metadata', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const coverSlide = result.slides[0];

      expect(coverSlide).toBeDefined();
      expect(coverSlide.type).toBe('cover');
      // Cover slide uses 'Cover' as title, blueprint title is in mainTitle property
      expect(coverSlide.title).toBe('Cover');
      if ('mainTitle' in coverSlide) {
        expect(coverSlide.mainTitle).toBe(sampleBlueprint.metadata.title);
      }
    });

    it('should generate section slides for each blueprint section', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const sectionSlides = result.slides.filter((slide) => slide.type === 'section');

      expect(sectionSlides.length).toBeGreaterThan(0);
    });

    it('should generate content slides from objectives', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const contentSlides = result.slides.filter((slide) => slide.type === 'content');

      expect(contentSlides.length).toBeGreaterThan(0);
    });

    it('should generate module slides from modules array', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const moduleSlides = result.slides.filter((slide) => slide.type === 'module');

      expect(moduleSlides.length).toBe(sampleBlueprint.modules?.modules.length || 0);
    });

    it('should generate timeline slide from timeline data', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const timelineSlides = result.slides.filter((slide) => slide.type === 'timeline');

      expect(timelineSlides.length).toBeGreaterThan(0);
    });

    it('should generate resource slides from resources', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const resourceSlides = result.slides.filter((slide) => slide.type === 'resources');

      expect(resourceSlides.length).toBeGreaterThan(0);
    });

    it('should generate metrics slide from metrics', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const metricsSlides = result.slides.filter((slide) => slide.type === 'metrics');

      expect(metricsSlides.length).toBeGreaterThan(0);
    });
  });

  describe('Metadata Generation', () => {
    it('should include total slide count in metadata', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result.metadata.totalSlides).toBe(result.slides.length);
    });

    it('should include blueprint title in metadata', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result.metadata.blueprintTitle).toBe(sampleBlueprint.metadata.title);
    });

    it('should include generation timestamp in metadata', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result.metadata.generatedAt).toBeDefined();
      expect(new Date(result.metadata.generatedAt).getTime()).toBeGreaterThan(0);
    });

    it('should include section count in metadata', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result.metadata.sectionCount).toBeGreaterThan(0);
    });
  });

  describe('Options Handling', () => {
    it('should respect maxSlides option', () => {
      // The parser creates at least one cover slide and section slides
      // Setting maxSlides to a reasonable number that allows for cover + sections
      const result = blueprintToSlides(sampleBlueprint, { maxSlides: 10 });

      expect(result.slides.length).toBeLessThanOrEqual(10);
    });

    it('should sanitize content when sanitizeContent is true', () => {
      const maliciousBlueprint = {
        ...sampleBlueprint,
        objectives: {
          displayType: 'infographic' as const,
          objectives: [
            '<script>alert("XSS")</script>Safe objective',
            '<img src=x onerror=alert(1)>Outcome',
          ],
        },
      };

      const result = blueprintToSlides(maliciousBlueprint, { sanitizeContent: true });

      // Find objectives content slide
      const contentSlides = result.slides.filter((slide) => slide.type === 'content');
      const hasScript = contentSlides.some((slide) => JSON.stringify(slide).includes('<script>'));

      expect(hasScript).toBe(false);
    });

    it('should include speaker notes when includeSpeakerNotes is true', () => {
      const result = blueprintToSlides(sampleBlueprint, { includeSpeakerNotes: true });

      // At least some slides should have speaker notes
      const slidesWithNotes = result.slides.filter((slide) => slide.speakerNotes);
      expect(slidesWithNotes.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should throw error for invalid blueprint', () => {
      const invalidBlueprint = {
        // Missing required metadata field
        metadata: {
          title: '', // Empty title should fail validation
        },
      } as unknown as Blueprint;

      expect(() => blueprintToSlides(invalidBlueprint)).toThrow();
    });

    it('should handle missing optional sections gracefully', () => {
      const minimalBlueprint = {
        metadata: {
          title: 'Minimal Blueprint',
          organization: null,
          role: null,
          generated_at: new Date().toISOString(),
          version: null,
          author: null,
          description: null,
        },
      } as Blueprint;

      const result = blueprintToSlides(minimalBlueprint);

      expect(result).toBeDefined();
      expect(result.slides.length).toBeGreaterThan(0);
      expect(result.slides[0].type).toBe('cover');
    });

    it('should handle empty arrays in sections', () => {
      const emptyArrayBlueprint = {
        ...sampleBlueprint,
        modules: {
          displayType: 'timeline' as const,
          modules: [],
        },
        assessments: {
          displayType: 'table' as const,
          assessments: [],
        },
        metrics: {
          displayType: 'chart' as const,
          metrics: [],
        },
      };

      const result = blueprintToSlides(emptyArrayBlueprint);

      expect(result).toBeDefined();
      expect(result.slides.length).toBeGreaterThan(0);
    });

    it('should collect warnings for problematic sections', () => {
      const result = blueprintToSlides(sampleBlueprint);

      expect(result.metadata.warnings).toBeInstanceOf(Array);
    });
  });

  describe('Slide Structure Validation', () => {
    it('should generate slides with unique IDs', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const ids = result.slides.map((slide) => slide.id);
      const uniqueIds = new Set(ids);

      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should generate slides with valid types', () => {
      const result = blueprintToSlides(sampleBlueprint);
      const validTypes = [
        'cover',
        'section',
        'content',
        'metrics',
        'module',
        'timeline',
        'resources',
        'chart',
      ];

      result.slides.forEach((slide) => {
        expect(validTypes).toContain(slide.type);
      });
    });

    it('should generate slides with titles', () => {
      const result = blueprintToSlides(sampleBlueprint);

      result.slides.forEach((slide) => {
        expect(slide.title).toBeDefined();
        expect(slide.title.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Performance', () => {
    it('should parse blueprint in reasonable time (<1s for typical blueprint)', () => {
      const startTime = performance.now();
      blueprintToSlides(sampleBlueprint);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(1000); // Less than 1 second
    });

    it('should handle large blueprints efficiently', () => {
      // Create a large blueprint with many modules
      const largeBlueprint = {
        ...sampleBlueprint,
        modules: {
          displayType: 'timeline' as const,
          modules: Array.from({ length: 50 }, (_, i) => ({
            title: `Module ${i + 1}`,
            duration: '1 week',
            topics: ['Topic 1', 'Topic 2', 'Topic 3'],
            learning_outcomes: ['Outcome 1', 'Outcome 2'],
          })),
          total_duration: '50 weeks',
        },
      };

      const startTime = performance.now();
      const result = blueprintToSlides(largeBlueprint);
      const endTime = performance.now();
      const duration = endTime - startTime;

      expect(result).toBeDefined();
      expect(duration).toBeLessThan(5000); // Less than 5 seconds even for large blueprints
    });
  });
});
