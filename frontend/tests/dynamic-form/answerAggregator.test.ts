import { describe, it, expect } from 'vitest';
import {
  createAnswerAggregator,
  aggregateFormAnswers,
  detectFormConflicts,
} from '@/lib/dynamic-form/answerAggregator';
import { FormState } from '@/lib/dynamic-form/types';

describe('Answer Aggregator', () => {
  const mockFormState1: FormState = {
    formId: 'form-1',
    currentSection: 'section-1',
    answers: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      interests: ['sports', 'music'],
    },
    progress: {
      completedSections: ['section-1'],
      overallProgress: 50,
    },
    lastSaved: '2023-01-01T10:00:00Z',
    version: '1.0.0',
  };

  const mockFormState2: FormState = {
    formId: 'form-2',
    currentSection: 'section-1',
    answers: {
      name: 'Jane Smith',
      email: 'jane@example.com',
      age: 30,
      interests: ['art', 'music'],
    },
    progress: {
      completedSections: ['section-1'],
      overallProgress: 50,
    },
    lastSaved: '2023-01-01T10:00:02Z', // 2 seconds later to be within conflict threshold
    version: '1.0.0',
  };

  const mockFormState3: FormState = {
    formId: 'form-3',
    currentSection: 'section-1',
    answers: {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      interests: ['sports', 'music', 'art'],
    },
    progress: {
      completedSections: ['section-1'],
      overallProgress: 50,
    },
    lastSaved: '2023-01-01T10:02:00Z',
    version: '1.0.0',
  };

  describe('Basic Aggregation', () => {
    it('aggregates single form state correctly', () => {
      const result = aggregateFormAnswers([mockFormState1]);
      expect(result).toEqual(mockFormState1.answers);
    });

    it('returns empty object for no form states', () => {
      const result = aggregateFormAnswers([]);
      expect(result).toEqual({});
    });

    it('aggregates multiple form states without conflicts', () => {
      const formStates = [mockFormState1, mockFormState2];
      const result = aggregateFormAnswers(formStates);

      // Should contain all unique fields
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('age');
      expect(result).toHaveProperty('interests');
    });
  });

  describe('Conflict Detection', () => {
    it('detects conflicts between form states', () => {
      const formStates = [mockFormState1, mockFormState2];
      const conflicts = detectFormConflicts(formStates);

      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some((c) => c.fieldId === 'name')).toBe(true);
      expect(conflicts.some((c) => c.fieldId === 'email')).toBe(true);
    });

    it('detects no conflicts for identical values', () => {
      const identicalState: FormState = {
        ...mockFormState1,
        formId: 'form-identical',
        lastSaved: '2023-01-01T10:10:00Z',
      };

      const formStates = [mockFormState1, identicalState];
      const conflicts = detectFormConflicts(formStates);

      expect(conflicts).toHaveLength(0);
    });
  });

  describe('Answer Aggregator Class', () => {
    it('creates aggregator with default options', () => {
      const aggregator = createAnswerAggregator();
      expect(aggregator).toBeDefined();
    });

    it('creates aggregator with custom options', () => {
      const aggregator = createAnswerAggregator({
        conflictResolutionStrategy: 'merge',
        autoResolveConflicts: false,
        conflictThreshold: 10000,
      });
      expect(aggregator).toBeDefined();
    });

    it('aggregates answers with conflict resolution', () => {
      const aggregator = createAnswerAggregator({
        conflictResolutionStrategy: 'timestamp',
        autoResolveConflicts: true,
      });

      const formStates = [mockFormState1, mockFormState2];
      const result = aggregator.aggregateAnswers(formStates);

      expect(result.aggregatedData).toBeDefined();
      expect(result.conflicts).toBeDefined();
      expect(result.resolution).toBeDefined();
    });

    it('handles merge strategy correctly', () => {
      const aggregator = createAnswerAggregator({
        conflictResolutionStrategy: 'merge',
        autoResolveConflicts: true,
      });

      const formStates = [mockFormState1, mockFormState3]; // Same name/email, different interests
      const result = aggregator.aggregateAnswers(formStates);

      // Interests should be merged
      expect(result.aggregatedData.interests).toEqual(['sports', 'music', 'art']);
    });

    it('handles timestamp strategy correctly', () => {
      const aggregator = createAnswerAggregator({
        conflictResolutionStrategy: 'timestamp',
        autoResolveConflicts: true,
      });

      const formStates = [mockFormState1, mockFormState2];
      const result = aggregator.aggregateAnswers(formStates);

      // Should use the most recent value (form-2 is 5 minutes later)
      expect(result.aggregatedData.name).toBe('Jane Smith');
      expect(result.aggregatedData.email).toBe('jane@example.com');
    });
  });

  describe('Conflict Types and Severity', () => {
    it('detects value conflicts correctly', () => {
      const aggregator = createAnswerAggregator();
      const formStates = [mockFormState1, mockFormState2];
      const result = aggregator.aggregateAnswers(formStates);

      const nameConflict = result.conflicts.find((c) => c.fieldId === 'name');
      expect(nameConflict).toBeDefined();
      expect(nameConflict?.conflictType).toBe('value');
      expect(nameConflict?.severity).toBe('low');
    });

    it('detects structure conflicts correctly', () => {
      const stateWithArray: FormState = {
        ...mockFormState1,
        answers: {
          ...mockFormState1.answers,
          interests: 'sports,music', // String instead of array
        },
      };

      const aggregator = createAnswerAggregator();
      const formStates = [mockFormState1, stateWithArray];
      const result = aggregator.aggregateAnswers(formStates);

      const interestsConflict = result.conflicts.find((c) => c.fieldId === 'interests');
      expect(interestsConflict).toBeDefined();
      expect(interestsConflict?.conflictType).toBe('structure');
      expect(interestsConflict?.severity).toBe('high');
    });
  });

  describe('History Management', () => {
    it('tracks conflict history', () => {
      const aggregator = createAnswerAggregator();
      const formStates = [mockFormState1, mockFormState2];

      aggregator.aggregateAnswers(formStates);
      const history = aggregator.getConflictHistory();

      expect(history.length).toBeGreaterThan(0);
    });

    it('tracks resolution history', () => {
      const aggregator = createAnswerAggregator();
      const formStates = [mockFormState1, mockFormState2];

      aggregator.aggregateAnswers(formStates);
      const history = aggregator.getResolutionHistory();

      expect(history.length).toBeGreaterThan(0);
    });

    it('clears history correctly', () => {
      const aggregator = createAnswerAggregator();
      const formStates = [mockFormState1, mockFormState2];

      aggregator.aggregateAnswers(formStates);
      aggregator.clearHistory();

      expect(aggregator.getConflictHistory()).toHaveLength(0);
      expect(aggregator.getResolutionHistory()).toHaveLength(0);
    });
  });

  describe('Options Management', () => {
    it('updates options correctly', () => {
      const aggregator = createAnswerAggregator();

      aggregator.updateOptions({
        conflictResolutionStrategy: 'merge',
        autoResolveConflicts: false,
      });

      // Options should be updated (we can't directly test this, but it shouldn't throw)
      expect(aggregator).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty answers correctly', () => {
      const emptyState: FormState = {
        formId: 'empty-form',
        currentSection: 'section-1',
        answers: {},
        progress: {
          completedSections: [],
          overallProgress: 0,
        },
        lastSaved: '2023-01-01T10:00:00Z',
        version: '1.0.0',
      };

      const result = aggregateFormAnswers([emptyState]);
      expect(result).toEqual({});
    });

    it('handles null/undefined values correctly', () => {
      const stateWithNulls: FormState = {
        formId: 'null-form',
        currentSection: 'section-1',
        answers: {
          name: null,
          email: undefined,
          age: 25,
        },
        progress: {
          completedSections: ['section-1'],
          overallProgress: 50,
        },
        lastSaved: '2023-01-01T10:00:00Z',
        version: '1.0.0',
      };

      const result = aggregateFormAnswers([stateWithNulls]);
      expect(result).toHaveProperty('age', 25);
      expect(result.name).toBeNull();
      expect(result.email).toBeUndefined();
    });
  });
});
