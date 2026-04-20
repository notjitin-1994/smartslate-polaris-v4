/**
 * Tests for Data Integrity Validation
 * Focusing on V2 static answers format
 */

import { describe, it, expect } from 'vitest';
import { validateStaticAnswers, validateDynamicAnswers } from '../dataIntegrity';

describe('Data Integrity Validation', () => {
  describe('Static Answers Validation (V2 Format)', () => {
    it('should accept minimal V2 static answers', () => {
      const minimalAnswers = {
        role: 'Learning Manager',
        organization: {
          name: 'Acme Corp',
          industry: 'Technology',
        },
        learningGap: {
          description: 'Need to improve team productivity through better project management skills',
        },
      };

      const result = validateStaticAnswers(minimalAnswers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Should have warnings about optional fields
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should accept complete V2 static answers', () => {
      const completeAnswers = {
        role: 'Chief Learning Officer',
        organization: {
          name: 'Global Tech Solutions',
          industry: 'Technology',
          size: '1000-5000',
          regions: ['North America', 'Europe'],
        },
        learnerProfile: {
          audienceSize: '100-500',
          priorKnowledge: 3,
          motivation: ['Career Advancement', 'Performance Improvement'],
          environment: ['Office/Workplace', 'Home'],
          devices: ['Laptop', 'Mobile Phone'],
          timeAvailable: 5,
          accessibility: [],
        },
        learningGap: {
          description:
            'Our sales team needs comprehensive training on the new CRM system to improve customer relationship management and increase sales efficiency',
          gapType: 'knowledge',
          urgency: 4,
          impact: 5,
          impactAreas: ['Revenue', 'Efficiency', 'Customer Satisfaction'],
          bloomsLevel: 'apply',
          objectives: 'Enable sales team to effectively use all CRM features within 30 days',
        },
        resources: {
          budget: { amount: 50000, flexibility: 'flexible' },
          timeline: { targetDate: '2025-03-01', flexibility: 'strict', duration: 12 },
          team: {
            instructionalDesigners: 2,
            contentDevelopers: 3,
            multimediaSpecialists: 1,
            smeAvailability: 4,
            experienceLevel: 'advanced',
          },
          technology: {
            lms: 'Moodle',
            authoringTools: ['Articulate 360', 'Camtasia'],
            otherTools: ['Zoom', 'Slack'],
          },
          contentStrategy: {
            source: 'combination',
            existingMaterials: ['Product documentation', 'Previous training materials'],
          },
        },
        deliveryStrategy: {
          modality: 'blended',
          interactivityLevel: 4,
          practiceOpportunities: ['Simulations', 'Role-playing', 'Case studies'],
          socialLearning: ['Discussion forums', 'Peer review'],
          reinforcement: 'microlearning',
        },
        constraints: [
          'Must be completed within Q1',
          'Cannot disrupt daily operations',
          'Must support mobile devices',
        ],
        evaluation: {
          level1: { methods: ['Survey', 'Feedback forms'], satisfactionTarget: 85 },
          level2: { assessmentMethods: ['Quiz', 'Practical exam'], passingRequired: true },
          level3: { measureBehavior: true },
          level4: { measureROI: true },
          certification: 'internal',
        },
      };

      const result = validateStaticAnswers(completeAnswers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Should have no or very few warnings
      expect(result.warnings.length).toBeLessThanOrEqual(2);
    });

    it('should accept empty optional fields', () => {
      const sparseAnswers = {
        role: '',
        organization: {},
        learningGap: {},
        resources: {},
      };

      const result = validateStaticAnswers(sparseAnswers);
      expect(result.isValid).toBe(true); // Should not fail with errors
      expect(result.errors).toHaveLength(0);
      // Should have many warnings about recommended fields
      expect(result.warnings.length).toBeGreaterThan(5);
    });

    it('should handle null or undefined gracefully', () => {
      const nullAnswers = {
        role: null,
        organization: {
          name: undefined,
          industry: null,
        },
        learningGap: {
          description: '',
          urgency: null,
        },
      };

      const result = validateStaticAnswers(nullAnswers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // Should have warnings about missing recommended fields
      expect(result.warnings.length).toBeGreaterThan(3);
    });

    it('should warn about short learning gap description', () => {
      const answers = {
        learningGap: {
          description: 'Too short',
        },
      };

      const result = validateStaticAnswers(answers);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContain(
        'Learning gap description seems too short. Consider providing more detail.'
      );
    });

    it('should handle completely empty object', () => {
      const emptyAnswers = {};

      const result = validateStaticAnswers(emptyAnswers);
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0]).toBe('Static answers must contain at least some data');
    });

    it('should handle null input', () => {
      const result = validateStaticAnswers(null);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Static answers is not a valid object');
    });

    it('should handle undefined input', () => {
      const result = validateStaticAnswers(undefined);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Static answers is not a valid object');
    });

    it('should handle non-object input', () => {
      const result = validateStaticAnswers('invalid');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Static answers is not a valid object');
    });

    it('should warn about large data size', () => {
      const largeAnswers = {
        role: 'Test',
        learningGap: {
          description: 'x'.repeat(51000), // Very large description
        },
      };

      const result = validateStaticAnswers(largeAnswers);
      expect(result.isValid).toBe(true);
      expect(result.warnings.some((w) => w.includes('very large'))).toBe(true);
    });
  });

  describe('Dynamic Answers Validation', () => {
    it('should validate dynamic answers with good completion rate', () => {
      const answers = {
        q1: 'Answer 1',
        q2: 'Answer 2',
        q3: ['Option 1', 'Option 2'],
        q4: 5,
        q5: 'Answer 5',
        q6: true,
        q7: 'Answer 7',
        q8: 100,
        q9: 'Answer 9',
        q10: ['Option A', 'Option B', 'Option C'],
      };

      const result = validateDynamicAnswers(answers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      // May have warnings about important questions patterns
      expect(result.warnings.length).toBeGreaterThanOrEqual(0);
    });

    it('should fail validation with low completion rate', () => {
      const answers = {
        q1: 'Answer 1',
        q2: '',
        q3: [],
        q4: null,
        q5: undefined,
        q6: '',
        q7: null,
        q8: undefined,
        q9: '',
        q10: [],
      };

      const result = validateDynamicAnswers(answers);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Only 10.0% of questions answered');
    });

    it('should warn about missing important questions', () => {
      const answers = {
        q1: 'Some answer',
        q2: 'Another answer',
        learning_goal: '', // Important question not answered
        project_timeline: null,
        target_audience: undefined,
      };

      const result = validateDynamicAnswers(answers);
      expect(result.warnings.some((w) => w.includes('goal'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('timeline'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('audience'))).toBe(true);
    });

    it('should handle empty dynamic answers', () => {
      const result = validateDynamicAnswers({});
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No dynamic answers provided');
    });
  });
});
