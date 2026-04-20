import type { ConflictData } from './types';

// Conflict resolution strategies
export enum ConflictResolutionStrategy {
  LOCAL = 'local',
  REMOTE = 'remote',
  MERGE = 'merge',
  MANUAL = 'manual',
}

// Conflict detection and resolution
export class ConflictResolver {
  // Detect conflicts between local and remote versions
  static detectConflict(
    localVersion: number,
    remoteVersion: number,
    localData: any,
    remoteData: any
  ): ConflictData | null {
    // Version conflict
    if (localVersion !== remoteVersion) {
      return {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'version',
        localVersion,
        remoteVersion,
        localChanges: localData,
        remoteChanges: remoteData,
        resolution: 'manual',
      };
    }

    // Data corruption check
    if (this.isDataCorrupted(localData) || this.isDataCorrupted(remoteData)) {
      return {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'data_corruption',
        localVersion,
        remoteVersion,
        localChanges: localData,
        remoteChanges: remoteData,
        resolution: 'manual',
      };
    }

    // Concurrent edit detection (simplified)
    if (this.hasConcurrentEdits(localData, remoteData)) {
      return {
        id: `conflict-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: 'concurrent_edit',
        localVersion,
        remoteVersion,
        localChanges: localData,
        remoteChanges: remoteData,
        resolution: 'merge',
      };
    }

    return null;
  }

  // Resolve conflict using specified strategy
  static resolveConflict(conflict: ConflictData, strategy: ConflictResolutionStrategy): any {
    switch (strategy) {
      case ConflictResolutionStrategy.LOCAL:
        return this.resolveWithLocal(conflict);

      case ConflictResolutionStrategy.REMOTE:
        return this.resolveWithRemote(conflict);

      case ConflictResolutionStrategy.MERGE:
        return this.resolveWithMerge(conflict);

      case ConflictResolutionStrategy.MANUAL:
        return this.resolveManually(conflict);

      default:
        throw new Error(`Unknown conflict resolution strategy: ${strategy}`);
    }
  }

  // Resolve using local changes
  private static resolveWithLocal(conflict: ConflictData): any {
    return {
      ...conflict.localChanges,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      resolvedAt: new Date(),
    };
  }

  // Resolve using remote changes
  private static resolveWithRemote(conflict: ConflictData): any {
    return {
      ...conflict.remoteChanges,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      resolvedAt: new Date(),
    };
  }

  // Resolve by merging changes
  private static resolveWithMerge(conflict: ConflictData): any {
    const local = conflict.localChanges;
    const remote = conflict.remoteChanges;

    // Simple merge strategy - prefer non-null values, local takes precedence for conflicts
    const merged = { ...remote };

    Object.keys(local).forEach((key) => {
      if (local[key] !== null && local[key] !== undefined) {
        if (typeof local[key] === 'object' && typeof remote[key] === 'object') {
          // Deep merge for objects
          merged[key] = { ...remote[key], ...local[key] };
        } else {
          // Local takes precedence for primitive values
          merged[key] = local[key];
        }
      }
    });

    return {
      ...merged,
      version: Math.max(conflict.localVersion, conflict.remoteVersion) + 1,
      resolvedAt: new Date(),
      mergeMetadata: {
        localVersion: conflict.localVersion,
        remoteVersion: conflict.remoteVersion,
        mergedAt: new Date(),
      },
    };
  }

  // Manual resolution (requires user input)
  private static resolveManually(conflict: ConflictData): any {
    // This would typically trigger a UI for manual resolution
    // For now, we'll return the conflict data for the UI to handle
    return {
      ...conflict,
      requiresManualResolution: true,
    };
  }

  // Check if data is corrupted
  private static isDataCorrupted(data: any): boolean {
    if (!data || typeof data !== 'object') {
      return true;
    }

    // Check for required fields
    const requiredFields = ['id', 'version', 'updatedAt'];
    for (const field of requiredFields) {
      if (!(field in data)) {
        return true;
      }
    }

    // Check for valid version number
    if (typeof data.version !== 'number' || data.version < 1) {
      return true;
    }

    // Check for valid date
    if (!(data.updatedAt instanceof Date) && isNaN(Date.parse(data.updatedAt))) {
      return true;
    }

    return false;
  }

  // Check for concurrent edits (simplified)
  private static hasConcurrentEdits(localData: any, remoteData: any): boolean {
    if (!localData || !remoteData) {
      return false;
    }

    // Check if both have been modified recently
    const localTime = new Date(localData.updatedAt).getTime();
    const remoteTime = new Date(remoteData.updatedAt).getTime();
    const timeDiff = Math.abs(localTime - remoteTime);

    // If both were modified within 5 minutes, consider it concurrent
    return timeDiff < 5 * 60 * 1000;
  }
}

// Conflict resolution UI helpers
export const conflictUIHelpers = {
  // Get conflict description for UI
  getConflictDescription: (conflict: ConflictData): string => {
    switch (conflict.type) {
      case 'version':
        return `Version conflict: Local version ${conflict.localVersion} vs Remote version ${conflict.remoteVersion}`;

      case 'concurrent_edit':
        return 'Concurrent edits detected. Both local and remote versions have been modified.';

      case 'data_corruption':
        return 'Data corruption detected. Manual review required.';

      default:
        return 'Unknown conflict type detected.';
    }
  },

  // Get resolution options for UI
  getResolutionOptions: (
    conflict: ConflictData
  ): Array<{
    value: ConflictResolutionStrategy;
    label: string;
    description: string;
  }> => {
    const options = [
      {
        value: ConflictResolutionStrategy.LOCAL,
        label: 'Use Local Changes',
        description: 'Keep your local changes and discard remote changes.',
      },
      {
        value: ConflictResolutionStrategy.REMOTE,
        label: 'Use Remote Changes',
        description: 'Discard your local changes and use remote changes.',
      },
    ];

    // Add merge option for concurrent edits
    if (conflict.type === 'concurrent_edit') {
      options.push({
        value: ConflictResolutionStrategy.MERGE,
        label: 'Merge Changes',
        description: 'Automatically merge local and remote changes.',
      });
    }

    // Always add manual option
    options.push({
      value: ConflictResolutionStrategy.MANUAL,
      label: 'Manual Resolution',
      description: 'Review and resolve conflicts manually.',
    });

    return options;
  },

  // Get conflict severity for UI styling
  getConflictSeverity: (conflict: ConflictData): 'low' | 'medium' | 'high' => {
    switch (conflict.type) {
      case 'version':
        return 'medium';
      case 'concurrent_edit':
        return 'low';
      case 'data_corruption':
        return 'high';
      default:
        return 'medium';
    }
  },
};
