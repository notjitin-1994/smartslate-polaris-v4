import { StateStorage } from 'zustand/middleware';
import type { PersistenceConfig } from './types';

// Custom storage implementation with compression and versioning
export class CompressedStorage implements StateStorage {
  private storage: Storage;
  private compressionEnabled: boolean;

  constructor(storage: Storage, compressionEnabled = true) {
    this.storage = storage;
    this.compressionEnabled = compressionEnabled;
  }

  getItem(name: string): string | null {
    try {
      const item = this.storage.getItem(name);
      if (!item) return null;

      const parsed = JSON.parse(item);

      // Check if data is compressed
      if (parsed.compressed) {
        // In a real implementation, you would decompress here
        // For now, we'll just return the data as-is
        return parsed.data;
      }

      return item;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  setItem(name: string, value: string): void {
    try {
      const data = {
        compressed: this.compressionEnabled,
        data: value,
        timestamp: Date.now(),
        version: 1,
      };

      this.storage.setItem(name, JSON.stringify(data));
    } catch (error) {
      console.error('Error writing to storage:', error);

      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleQuotaExceeded();
      }
    }
  }

  removeItem(name: string): void {
    this.storage.removeItem(name);
  }

  private handleQuotaExceeded(): void {
    // Clear old data to make space
    const keys = Object.keys(this.storage);
    const sortedKeys = keys
      .filter((key) => key.startsWith('blueprint-storage') || key.startsWith('ui-storage'))
      .map((key) => ({
        key,
        timestamp: this.getTimestamp(key),
      }))
      .sort((a, b) => a.timestamp - b.timestamp);

    // Remove oldest 25% of items
    const itemsToRemove = Math.ceil(sortedKeys.length * 0.25);
    for (let i = 0; i < itemsToRemove; i++) {
      this.storage.removeItem(sortedKeys[i].key);
    }
  }

  private getTimestamp(key: string): number {
    try {
      const item = this.storage.getItem(key);
      if (!item) return 0;

      const parsed = JSON.parse(item);
      return parsed.timestamp || 0;
    } catch {
      return 0;
    }
  }
}

// Storage versioning and migration
export const createVersionedStorage = (config: PersistenceConfig): StateStorage => {
  const storage = new CompressedStorage(localStorage);

  return {
    getItem: (name: string) => {
      const item = storage.getItem(name);
      if (!item) return null;

      try {
        const parsed = JSON.parse(item);

        // Check version and migrate if needed
        if (parsed.version && parsed.version < config.version) {
          const migrated = config.migrate ? config.migrate(parsed, parsed.version) : parsed;
          storage.setItem(name, JSON.stringify(migrated));
          return JSON.stringify(migrated);
        }

        return item;
      } catch (error) {
        console.error('Error parsing stored data:', error);
        return null;
      }
    },

    setItem: (name: string, value: string) => {
      storage.setItem(name, value);
    },

    removeItem: (name: string) => {
      storage.removeItem(name);
    },
  };
};

// Selective persistence configuration
export const persistenceConfigs = {
  auth: {
    name: 'auth-storage',
    version: 1,
    partialize: (state: any) => ({
      user: state.user,
      session: state.session,
    }),
    onRehydrateStorage: () => (state: any, error: any) => {
      if (error) {
        console.error('Auth store rehydration error:', error);
        return;
      }

      // Validate session on rehydration
      if (state?.session) {
        const now = new Date();
        const expiresAt = new Date(state.session.expires_at! * 1000);

        if (now > expiresAt) {
          // Session expired, clear auth
          state.clearAuth?.();
        }
      }
    },
  },

  blueprint: {
    name: 'blueprint-storage',
    version: 1,
    partialize: (state: any) => ({
      currentBlueprint: state.currentBlueprint,
      blueprints: state.blueprints,
      lastSaved: state.lastSaved,
      hasUnsavedChanges: state.hasUnsavedChanges,
      version: state.version,
    }),
    onRehydrateStorage: () => (state: any, error: any) => {
      if (error) {
        console.error('Blueprint store rehydration error:', error);
        return;
      }

      // Validate blueprint data on rehydration
      if (state?.currentBlueprint) {
        const now = new Date();
        const updatedAt = new Date(state.currentBlueprint.updatedAt);
        const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);

        // If blueprint is older than 30 days, mark as potentially stale
        if (daysSinceUpdate > 30) {
          state.setError?.('Blueprint data may be outdated. Please refresh.');
        }
      }
    },
  },

  ui: {
    name: 'ui-storage',
    version: 1,
    partialize: (state: any) => ({
      currentStep: state.currentStep,
      totalSteps: state.totalSteps,
      modals: {
        settingsDialog: state.modals.settingsDialog, // Only persist settings modal
      },
    }),
  },
};

// Storage cleanup utilities
export const storageUtils = {
  // Clear all application storage
  clearAll: () => {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.includes('storage')) {
        localStorage.removeItem(key);
      }
    });
  },

  // Clear old storage data
  clearOldData: (maxAge: number = 30 * 24 * 60 * 60 * 1000) => {
    // 30 days
    const now = Date.now();
    const keys = Object.keys(localStorage);

    keys.forEach((key) => {
      if (key.includes('storage')) {
        try {
          const item = localStorage.getItem(key);
          if (item) {
            const parsed = JSON.parse(item);
            if (parsed.timestamp && now - parsed.timestamp > maxAge) {
              localStorage.removeItem(key);
            }
          }
        } catch {
          // If we can't parse the item, remove it
          localStorage.removeItem(key);
        }
      }
    });
  },

  // Get storage usage information
  getStorageInfo: () => {
    let totalSize = 0;
    const items: Array<{ key: string; size: number }> = [];

    Object.keys(localStorage).forEach((key) => {
      if (key.includes('storage')) {
        const item = localStorage.getItem(key);
        if (item) {
          const size = new Blob([item]).size;
          totalSize += size;
          items.push({ key, size });
        }
      }
    });

    return {
      totalSize,
      itemCount: items.length,
      items: items.sort((a, b) => b.size - a.size),
    };
  },
};
