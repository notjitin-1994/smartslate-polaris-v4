import { FormState } from './types';

export interface AnswerConflict {
  fieldId: string;
  currentValue: unknown;
  incomingValue: unknown;
  timestamp: string;
  conflictType: 'value' | 'structure' | 'validation';
  severity: 'low' | 'medium' | 'high';
  resolution?: 'current' | 'incoming' | 'merge' | 'manual';
}

export interface ConflictResolution {
  fieldId: string;
  resolvedValue: unknown;
  resolution: 'current' | 'incoming' | 'merge' | 'manual';
  timestamp: string;
  resolvedBy?: string;
}

export interface AnswerAggregatorOptions {
  conflictResolutionStrategy: 'timestamp' | 'priority' | 'manual' | 'merge';
  autoResolveConflicts: boolean;
  conflictThreshold: number; // milliseconds
  mergeStrategy: 'last-write-wins' | 'first-write-wins' | 'value-based';
}

export class AnswerAggregator {
  private options: AnswerAggregatorOptions;
  private conflictHistory: AnswerConflict[] = [];
  private resolutionHistory: ConflictResolution[] = [];

  constructor(options: Partial<AnswerAggregatorOptions> = {}) {
    this.options = {
      conflictResolutionStrategy: 'timestamp',
      autoResolveConflicts: true,
      conflictThreshold: 5000, // 5 seconds
      mergeStrategy: 'last-write-wins',
      ...options,
    };
  }

  /**
   * Aggregate multiple form states into a single result
   */
  aggregateAnswers(formStates: FormState[]): {
    aggregatedData: Record<string, unknown>;
    conflicts: AnswerConflict[];
    resolution: ConflictResolution[];
  } {
    if (formStates.length === 0) {
      return {
        aggregatedData: {},
        conflicts: [],
        resolution: [],
      };
    }

    if (formStates.length === 1) {
      return {
        aggregatedData: formStates[0].answers,
        conflicts: [],
        resolution: [],
      };
    }

    const conflicts: AnswerConflict[] = [];
    const resolution: ConflictResolution[] = [];
    const aggregatedData: Record<string, unknown> = {};

    // Get all unique field IDs
    const allFieldIds = new Set<string>();
    formStates.forEach((state) => {
      Object.keys(state.answers).forEach((fieldId) => allFieldIds.add(fieldId));
    });

    // Process each field
    for (const fieldId of allFieldIds) {
      const fieldValues = formStates
        .map((state) => ({
          value: state.answers[fieldId],
          timestamp: state.lastSaved || new Date().toISOString(),
          formId: state.formId,
        }))
        .filter((item) => item.value !== undefined && item.value !== null);

      if (fieldValues.length === 0) continue;

      if (fieldValues.length === 1) {
        aggregatedData[fieldId] = fieldValues[0].value;
        continue;
      }

      // Check for conflicts
      const fieldConflicts = this.detectFieldConflicts(fieldId, fieldValues);
      if (fieldConflicts.length > 0) {
        conflicts.push(...fieldConflicts);
        this.conflictHistory.push(...fieldConflicts);

        // Resolve conflicts
        const resolvedValue = this.resolveFieldConflicts(fieldId, fieldValues, fieldConflicts);
        aggregatedData[fieldId] = resolvedValue;

        // Record resolution
        const resolutionEntry = {
          fieldId,
          resolvedValue,
          resolution: this.determineResolutionStrategy(fieldConflicts),
          timestamp: new Date().toISOString(),
        };
        resolution.push(resolutionEntry);
        this.resolutionHistory.push(resolutionEntry);
      } else {
        // No conflicts, use the most recent value
        const mostRecent = fieldValues.reduce((latest, current) =>
          new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
        );
        aggregatedData[fieldId] = mostRecent.value;
      }
    }

    return {
      aggregatedData,
      conflicts,
      resolution,
    };
  }

  /**
   * Detect conflicts for a specific field
   */
  private detectFieldConflicts(
    fieldId: string,
    fieldValues: Array<{ value: unknown; timestamp: string; formId: string }>
  ): AnswerConflict[] {
    const conflicts: AnswerConflict[] = [];

    // Sort by timestamp
    const sortedValues = fieldValues.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    for (let i = 0; i < sortedValues.length - 1; i++) {
      const current = sortedValues[i];
      const next = sortedValues[i + 1];

      const timeDiff = new Date(next.timestamp).getTime() - new Date(current.timestamp).getTime();

      // Check if values are different and within conflict threshold
      if (
        this.valuesAreDifferent(current.value, next.value) &&
        timeDiff <= this.options.conflictThreshold
      ) {
        conflicts.push({
          fieldId,
          currentValue: current.value,
          incomingValue: next.value,
          timestamp: next.timestamp,
          conflictType: this.determineConflictType(current.value, next.value),
          severity: this.determineConflictSeverity(current.value, next.value),
        });
      }
    }

    return conflicts;
  }

  /**
   * Resolve conflicts for a specific field
   */
  private resolveFieldConflicts(
    fieldId: string,
    fieldValues: Array<{ value: unknown; timestamp: string; formId: string }>,
    _conflicts: AnswerConflict[]
  ): unknown {
    if (this.options.autoResolveConflicts) {
      switch (this.options.conflictResolutionStrategy) {
        case 'timestamp':
          return this.resolveByTimestamp(fieldValues);
        case 'priority':
          return this.resolveByPriority(fieldValues);
        case 'merge':
          return this.resolveByMerge(fieldValues);
        default:
          return this.resolveByTimestamp(fieldValues);
      }
    }

    // Manual resolution required
    return fieldValues[fieldValues.length - 1].value; // Use most recent as fallback
  }

  /**
   * Resolve by timestamp (most recent wins)
   */
  private resolveByTimestamp(
    fieldValues: Array<{ value: unknown; timestamp: string; formId: string }>
  ): unknown {
    const mostRecent = fieldValues.reduce((latest, current) =>
      new Date(current.timestamp) > new Date(latest.timestamp) ? current : latest
    );
    return mostRecent.value;
  }

  /**
   * Resolve by priority (custom priority logic)
   */
  private resolveByPriority(
    fieldValues: Array<{ value: unknown; timestamp: string; formId: string }>
  ): unknown {
    // For now, use timestamp as priority
    // In a real implementation, you might have user roles, form versions, etc.
    return this.resolveByTimestamp(fieldValues);
  }

  /**
   * Resolve by merging values
   */
  private resolveByMerge(
    fieldValues: Array<{ value: unknown; timestamp: string; formId: string }>
  ): unknown {
    const values = fieldValues.map((v) => v.value);

    // Handle array values
    if (values.every((v) => Array.isArray(v))) {
      const merged = new Set();
      values.forEach((arr) => arr.forEach((item) => merged.add(item)));
      return Array.from(merged);
    }

    // Handle object values
    if (values.every((v) => typeof v === 'object' && v !== null && !Array.isArray(v))) {
      return Object.assign({}, ...values);
    }

    // For primitive values, use most recent
    return this.resolveByTimestamp(fieldValues);
  }

  /**
   * Check if two values are different
   */
  private valuesAreDifferent(value1: unknown, value2: unknown): boolean {
    if (value1 === value2) return false;

    // Deep comparison for objects and arrays
    if (typeof value1 === 'object' && typeof value2 === 'object') {
      return JSON.stringify(value1) !== JSON.stringify(value2);
    }

    return true;
  }

  /**
   * Determine conflict type
   */
  private determineConflictType(value1: unknown, value2: unknown): AnswerConflict['conflictType'] {
    if (typeof value1 !== typeof value2) {
      return 'structure';
    }

    if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
      return 'structure';
    }

    return 'value';
  }

  /**
   * Determine conflict severity
   */
  private determineConflictSeverity(value1: unknown, value2: unknown): AnswerConflict['severity'] {
    if (typeof value1 !== typeof value2) {
      return 'high';
    }

    if (typeof value1 === 'object' && value1 !== null && value2 !== null) {
      return 'medium';
    }

    return 'low';
  }

  /**
   * Determine resolution strategy
   */
  private determineResolutionStrategy(
    _conflicts: AnswerConflict[]
  ): ConflictResolution['resolution'] {
    if (this.options.autoResolveConflicts) {
      return this.options.conflictResolutionStrategy as ConflictResolution['resolution'];
    }

    return 'manual';
  }

  /**
   * Get conflict history
   */
  getConflictHistory(): AnswerConflict[] {
    return [...this.conflictHistory];
  }

  /**
   * Get resolution history
   */
  getResolutionHistory(): ConflictResolution[] {
    return [...this.resolutionHistory];
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.conflictHistory = [];
    this.resolutionHistory = [];
  }

  /**
   * Update options
   */
  updateOptions(newOptions: Partial<AnswerAggregatorOptions>): void {
    this.options = { ...this.options, ...newOptions };
  }
}

/**
 * Create an answer aggregator instance
 */
export const createAnswerAggregator = (
  options?: Partial<AnswerAggregatorOptions>
): AnswerAggregator => {
  return new AnswerAggregator(options);
};

/**
 * Simple aggregation function for basic use cases
 */
export const aggregateFormAnswers = (formStates: FormState[]): Record<string, unknown> => {
  const aggregator = createAnswerAggregator();
  const result = aggregator.aggregateAnswers(formStates);
  return result.aggregatedData;
};

/**
 * Detect conflicts between form states
 */
export const detectFormConflicts = (formStates: FormState[]): AnswerConflict[] => {
  const aggregator = createAnswerAggregator();
  const result = aggregator.aggregateAnswers(formStates);
  return result.conflicts;
};
