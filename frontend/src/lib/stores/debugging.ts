// State debugging tools for development
export class StateDebugger {
  private static isDevelopment = process.env.NODE_ENV === 'development';
  private static logHistory: Array<{
    timestamp: Date;
    store: string;
    action: string;
    state: any;
  }> = [];

  // Log state changes
  static logStateChange(store: string, action: string, state: any): void {
    if (!this.isDevelopment) return;

    const logEntry = {
      timestamp: new Date(),
      store,
      action,
      state: this.sanitizeState(state),
    };

    this.logHistory.push(logEntry);

    // Keep only last 100 entries
    if (this.logHistory.length > 100) {
      this.logHistory.shift();
    }

    console.group(`🔄 ${store} - ${action}`);
    console.log('Timestamp:', logEntry.timestamp.toISOString());
    console.log('State:', logEntry.state);
    console.groupEnd();
  }

  // Get state history
  static getStateHistory(): typeof this.logHistory {
    return [...this.logHistory];
  }

  // Clear state history
  static clearStateHistory(): void {
    this.logHistory = [];
  }

  // Export state for debugging
  static exportState(stores: Record<string, any>): string {
    const stateData = {
      timestamp: new Date().toISOString(),
      stores: {},
      history: this.logHistory,
    };

    Object.keys(stores).forEach((storeName) => {
      stateData.stores[storeName] = this.sanitizeState(stores[storeName].getState());
    });

    return JSON.stringify(stateData, null, 2);
  }

  // Import state for debugging
  static importState(stateJson: string, stores: Record<string, any>): boolean {
    try {
      const stateData = JSON.parse(stateJson);

      Object.keys(stateData.stores).forEach((storeName) => {
        if (stores[storeName]) {
          // This would need to be implemented based on store structure
          console.log(`Importing state for ${storeName}:`, stateData.stores[storeName]);
        }
      });

      return true;
    } catch (error) {
      console.error('Error importing state:', error);
      return false;
    }
  }

  // Validate state integrity
  static validateState(
    state: any,
    storeName: string
  ): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!state || typeof state !== 'object') {
      errors.push('State is not an object');
      return { isValid: false, errors };
    }

    // Store-specific validation
    switch (storeName) {
      case 'auth':
        this.validateAuthState(state, errors);
        break;
      case 'blueprint':
        this.validateBlueprintState(state, errors);
        break;
      case 'ui':
        this.validateUIState(state, errors);
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Performance monitoring
  static startPerformanceMonitoring(): void {
    if (!this.isDevelopment) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const measurePerformance = () => {
      const currentTime = performance.now();
      const deltaTime = currentTime - lastTime;

      if (deltaTime > 16.67) {
        // More than 60fps threshold
        console.warn(`Performance warning: Frame took ${deltaTime.toFixed(2)}ms`);
      }

      frameCount++;
      lastTime = currentTime;
      requestAnimationFrame(measurePerformance);
    };

    requestAnimationFrame(measurePerformance);
  }

  // Memory usage monitoring
  static getMemoryUsage(): {
    used: number;
    total: number;
    percentage: number;
  } | null {
    if (!this.isDevelopment || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      percentage: (memory.usedJSHeapSize / memory.totalJSHeapSize) * 100,
    };
  }

  // Sanitize state for logging (remove sensitive data)
  private static sanitizeState(state: any): any {
    if (!state || typeof state !== 'object') {
      return state;
    }

    const sanitized = { ...state };

    // Remove sensitive fields
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'auth'];
    Object.keys(sanitized).forEach((key) => {
      if (sensitiveFields.some((field) => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      }
    });

    return sanitized;
  }

  // Validate auth state
  private static validateAuthState(state: any, errors: string[]): void {
    if (state.user && !state.session) {
      errors.push('User exists but no session');
    }

    if (state.session && !state.user) {
      errors.push('Session exists but no user');
    }

    if (state.session) {
      const expiresAt = new Date(state.session.expires_at! * 1000);
      if (expiresAt < new Date()) {
        errors.push('Session has expired');
      }
    }
  }

  // Validate blueprint state
  private static validateBlueprintState(state: any, errors: string[]): void {
    if (state.currentBlueprint && !state.currentBlueprint.id) {
      errors.push('Current blueprint missing ID');
    }

    if (state.version && typeof state.version !== 'number') {
      errors.push('Version must be a number');
    }

    if (state.hasUnsavedChanges && !state.currentBlueprint) {
      errors.push('Has unsaved changes but no current blueprint');
    }
  }

  // Validate UI state
  private static validateUIState(state: any, errors: string[]): void {
    if (state.currentStep < 0) {
      errors.push('Current step cannot be negative');
    }

    if (state.totalSteps < 1) {
      errors.push('Total steps must be at least 1');
    }

    if (state.currentStep >= state.totalSteps) {
      errors.push('Current step cannot be greater than or equal to total steps');
    }
  }
}

// Redux DevTools integration
export const devToolsIntegration = {
  // Connect to Redux DevTools
  connect: (stores: Record<string, any>): void => {
    if (!StateDebugger.isDevelopment || typeof window === 'undefined') return;

    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (!devTools) return;

    Object.keys(stores).forEach((storeName) => {
      const store = stores[storeName];
      const devToolsConnection = devTools.connect({
        name: `${storeName} Store`,
        trace: true,
      });

      // Subscribe to store changes
      store.subscribe((state: any) => {
        devToolsConnection.send(`${storeName} Action`, state);
      });
    });
  },

  // Disconnect from Redux DevTools
  disconnect: (): void => {
    if (typeof window === 'undefined') return;

    const devTools = (window as any).__REDUX_DEVTOOLS_EXTENSION__;
    if (devTools && devTools.disconnect) {
      devTools.disconnect();
    }
  },
};

// Time-travel debugging
export class TimeTravelDebugger {
  private static snapshots: Array<{
    timestamp: Date;
    store: string;
    state: any;
  }> = [];

  // Take snapshot
  static takeSnapshot(store: string, state: any): void {
    if (!StateDebugger.isDevelopment) return;

    this.snapshots.push({
      timestamp: new Date(),
      store,
      state: JSON.parse(JSON.stringify(state)), // Deep clone
    });

    // Keep only last 50 snapshots
    if (this.snapshots.length > 50) {
      this.snapshots.shift();
    }
  }

  // Get snapshots
  static getSnapshots(): typeof this.snapshots {
    return [...this.snapshots];
  }

  // Restore snapshot
  static restoreSnapshot(index: number, stores: Record<string, any>): boolean {
    if (index < 0 || index >= this.snapshots.length) {
      return false;
    }

    const snapshot = this.snapshots[index];
    const store = stores[snapshot.store];

    if (store) {
      store.setState(snapshot.state);
      return true;
    }

    return false;
  }

  // Clear snapshots
  static clearSnapshots(): void {
    this.snapshots = [];
  }
}
