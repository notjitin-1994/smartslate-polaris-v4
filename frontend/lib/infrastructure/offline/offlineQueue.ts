/**
 * Offline Queue Manager
 * Detects offline status and queues saves for automatic retry when connectivity is restored
 */

'use client';

import { clientErrorTracker } from '@/lib/logging/clientErrorTracker';

// Defensive check to ensure the module is properly loaded
if (!clientErrorTracker || typeof clientErrorTracker.captureInfo !== 'function') {
  console.warn('[Offline Queue] clientErrorTracker not properly initialized');
}

interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  body: unknown;
  headers: Record<string, string>;
  timestamp: number;
  retries: number;
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 seconds
const QUEUE_STORAGE_KEY = 'offline_queue';

class OfflineQueueManager {
  private queue: QueuedRequest[] = [];
  private isOnline: boolean = true;
  private isProcessing: boolean = false;
  private listeners: Set<(isOnline: boolean) => void> = new Set();

  constructor() {
    try {
      if (typeof window !== 'undefined') {
        // Initialize online status
        this.isOnline = navigator.onLine;

        // Load persisted queue from localStorage
        this.loadQueue();

        // Set up event listeners
        window.addEventListener('online', this.handleOnline);
        window.addEventListener('offline', this.handleOffline);

        // Check connectivity periodically (fallback for unreliable events)
        setInterval(() => this.checkConnectivity(), 30000); // Every 30 seconds
      }
    } catch (error) {
      console.warn('[Offline Queue] Constructor error:', error);
      // Ensure basic functionality even if setup fails
      this.isOnline = true;
    }
  }

  /**
   * Subscribe to online/offline status changes
   */
  subscribe(callback: (isOnline: boolean) => void): () => void {
    this.listeners.add(callback);
    // Immediately call with current status
    callback(this.isOnline);

    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Get current online status
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Get queued requests count
   */
  getQueuedCount(): number {
    return this.queue.length;
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    console.log('[Offline Queue] Connection restored');
    this.isOnline = true;
    this.notifyListeners();
    this.processQueue();

    if (clientErrorTracker && typeof clientErrorTracker.captureInfo === 'function') {
      clientErrorTracker.captureInfo('Connection restored', {
        queuedRequests: this.queue.length,
      });
    }
  }

  /**
   * Handle offline event
   */
  private handleOffline = (): void => {
    console.log('[Offline Queue] Connection lost');
    this.isOnline = false;
    this.notifyListeners();

    if (clientErrorTracker && typeof clientErrorTracker.captureWarning === 'function') {
      clientErrorTracker.captureWarning('Connection lost', {
        queuedRequests: this.queue.length,
      });
    }
  };

  /**
   * Check connectivity with a real request
   */
  private async checkConnectivity(): Promise<void> {
    if (!navigator.onLine) {
      if (this.isOnline) {
        this.handleOffline();
      }
      return;
    }

    try {
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-store',
      });

      const isConnected = response.ok;
      if (isConnected !== this.isOnline) {
        if (isConnected) {
          this.handleOnline();
        } else {
          this.handleOffline();
        }
      }
    } catch {
      if (this.isOnline) {
        this.handleOffline();
      }
    }
  }

  /**
   * Notify all listeners of status change
   */
  private notifyListeners(): void {
    this.listeners.forEach((callback) => callback(this.isOnline));
  }

  /**
   * Queue a request for later execution
   */
  async queueRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<{ queued: true; queueId: string } | Response> {
    // If online, try to execute immediately
    if (this.isOnline) {
      try {
        const response = await fetch(url, options);
        if (response.ok) {
          return response;
        }
        // If request fails, fall through to queue it
      } catch (error) {
        // Network error, fall through to queue it
        console.log('[Offline Queue] Request failed, queueing...', error);
      }
    }

    // Queue the request
    const queueId = this.generateId();
    const queuedRequest: QueuedRequest = {
      id: queueId,
      url,
      method: options.method || 'GET',
      body: options.body,
      headers: (options.headers as Record<string, string>) || {},
      timestamp: Date.now(),
      retries: 0,
    };

    this.queue.push(queuedRequest);
    this.persistQueue();

    console.log('[Offline Queue] Request queued:', queueId);
    if (clientErrorTracker && typeof clientErrorTracker.captureInfo === 'function') {
      clientErrorTracker.captureInfo('Request queued for offline retry', {
        queueId,
        url,
        method: queuedRequest.method,
      });
    }

    return { queued: true, queueId };
  }

  /**
   * Process queued requests
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !this.isOnline || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    console.log(`[Offline Queue] Processing ${this.queue.length} queued requests...`);

    const processedIds: string[] = [];

    for (const request of [...this.queue]) {
      try {
        const response = await fetch(request.url, {
          method: request.method,
          headers: request.headers,
          body: request.body ? JSON.stringify(request.body) : undefined,
        });

        if (response.ok) {
          console.log('[Offline Queue] Request succeeded:', request.id);
          processedIds.push(request.id);

          if (clientErrorTracker && typeof clientErrorTracker.captureInfo === 'function') {
            clientErrorTracker.captureInfo('Queued request succeeded', {
              queueId: request.id,
              url: request.url,
            });
          }
        } else {
          // Non-2xx response, retry if under limit
          request.retries++;
          if (request.retries >= MAX_RETRIES) {
            console.error('[Offline Queue] Request failed after max retries:', request.id);
            processedIds.push(request.id);

            if (clientErrorTracker && typeof clientErrorTracker.captureError === 'function') {
              clientErrorTracker.captureError(
                new Error(`Failed to sync queued request after ${MAX_RETRIES} retries`),
                {
                  queueId: request.id,
                  url: request.url,
                  statusCode: response.status,
                }
              );
            }
          } else {
            console.log(
              `[Offline Queue] Request failed, will retry (${request.retries}/${MAX_RETRIES}):`,
              request.id
            );
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
          }
        }
      } catch (error) {
        request.retries++;
        if (request.retries >= MAX_RETRIES) {
          console.error('[Offline Queue] Request error after max retries:', request.id, error);
          processedIds.push(request.id);

          if (clientErrorTracker && typeof clientErrorTracker.captureError === 'function') {
            clientErrorTracker.captureError(error as Error, {
              queueId: request.id,
              url: request.url,
            });
          }
        } else {
          console.log(
            `[Offline Queue] Request error, will retry (${request.retries}/${MAX_RETRIES}):`,
            request.id
          );
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }
    }

    // Remove processed requests from queue
    this.queue = this.queue.filter((req) => !processedIds.includes(req.id));
    this.persistQueue();

    this.isProcessing = false;

    if (this.queue.length > 0) {
      console.log(`[Offline Queue] ${this.queue.length} requests still pending`);
    } else {
      console.log('[Offline Queue] All requests processed successfully');
    }
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Persist queue to localStorage
   */
  private persistQueue(): void {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[Offline Queue] Failed to persist queue:', error);
    }
  }

  /**
   * Load queue from localStorage
   */
  private loadQueue(): void {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        this.queue = JSON.parse(stored);
        console.log(`[Offline Queue] Loaded ${this.queue.length} queued requests from storage`);

        // Process queue if online
        if (this.isOnline) {
          setTimeout(() => this.processQueue(), 1000);
        }
      }
    } catch (error) {
      console.error('[Offline Queue] Failed to load queue:', error);
      this.queue = [];
    }
  }

  /**
   * Clear all queued requests
   */
  clearQueue(): void {
    this.queue = [];
    this.persistQueue();
    console.log('[Offline Queue] Queue cleared');
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    this.listeners.clear();
  }
}

// Singleton instance with lazy initialization
let offlineQueueInstance: OfflineQueueManager | null = null;

export const offlineQueue = new Proxy({} as OfflineQueueManager, {
  get(target, prop) {
    if (!offlineQueueInstance) {
      offlineQueueInstance = new OfflineQueueManager();
    }
    return offlineQueueInstance[prop as keyof OfflineQueueManager];
  },
});
