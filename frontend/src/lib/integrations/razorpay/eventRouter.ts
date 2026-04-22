/**
 * Razorpay Webhook Event Router
 *
 * @description Event routing system for directing webhook events to appropriate handlers
 * @version 1.0.0
 * @date 2025-10-29
 *
 * This router provides a centralized mechanism for routing webhook events
 * to their respective handlers based on event type and category.
 *
 * @see docs/RAZORPAY_INTEGRATION_GUIDE.md
 * @see https://razorpay.com/docs/webhooks/
 */

import type { ParsedWebhookEvent, WebhookSecurityResult } from './webhookSecurity';
import type { WebhookEventRecord } from './idempotency';

// ============================================================================
// Types and Interfaces
// ============================================================================

/**
 * Event handler function signature
 */
export type EventHandler = (
  event: ParsedWebhookEvent,
  webhookRecord?: WebhookEventRecord
) => Promise<EventHandlerResult>;

/**
 * Event handler execution result
 */
export interface EventHandlerResult {
  success: boolean;
  processed: boolean;
  error?: string;
  details?: {
    subscriptionId?: string;
    paymentId?: string;
    status?: string;
    action?: string;
    metadata?: Record<string, any>;
  };
  retryable?: boolean;
}

/**
 * Event routing configuration
 */
export interface EventRoute {
  eventType: string;
  handler: EventHandler;
  description: string;
  enabled: boolean;
  required?: string[]; // Required fields in payload
}

/**
 * Router configuration
 */
export interface RouterConfig {
  enableUnknownEventLogging: boolean;
  enableEventValidation: boolean;
  maxRetries: number;
  retryDelay: number;
  timeoutMs: number;
}

/**
 * Routing result
 */
export interface RoutingResult {
  success: boolean;
  routed: boolean;
  eventType: string;
  handler?: string;
  result?: EventHandlerResult;
  error?: string;
  routingTime: number;
}

// ============================================================================
// Default Configuration
// ============================================================================

/**
 * Default router configuration
 */
export const DEFAULT_ROUTER_CONFIG: RouterConfig = {
  enableUnknownEventLogging: true,
  enableEventValidation: true,
  maxRetries: 3,
  retryDelay: 1000,
  timeoutMs: 30000,
};

// ============================================================================
// Event Registry
// ============================================================================

/**
 * Event registry for storing event handlers
 */
class EventRegistry {
  private routes = new Map<string, EventRoute>();
  private categories = new Map<string, string[]>(); // category -> event types

  /**
   * Register an event handler
   */
  register(route: EventRoute): void {
    this.routes.set(route.eventType, route);

    // Extract category from event type (format: "category.action")
    const [category] = route.eventType.split('.');
    if (!this.categories.has(category)) {
      this.categories.set(category, []);
    }
    this.categories.get(category)!.push(route.eventType);
  }

  /**
   * Get route for specific event type
   */
  getRoute(eventType: string): EventRoute | undefined {
    return this.routes.get(eventType);
  }

  /**
   * Get all routes for a category
   */
  getRoutesByCategory(category: string): EventRoute[] {
    const eventTypes = this.categories.get(category) || [];
    return eventTypes
      .map((type) => this.routes.get(type))
      .filter((route): route is EventRoute => route !== undefined);
  }

  /**
   * Get all registered event types
   */
  getAllEventTypes(): string[] {
    return Array.from(this.routes.keys());
  }

  /**
   * Get all categories
   */
  getAllCategories(): string[] {
    return Array.from(this.categories.keys());
  }

  /**
   * Check if event type is registered
   */
  isRegistered(eventType: string): boolean {
    return this.routes.has(eventType);
  }

  /**
   * Get registered routes count
   */
  getRouteCount(): number {
    return this.routes.size;
  }

  /**
   * Enable/disable a route
   */
  setRouteEnabled(eventType: string, enabled: boolean): boolean {
    const route = this.routes.get(eventType);
    if (route) {
      route.enabled = enabled;
      return true;
    }
    return false;
  }

  /**
   * Get all enabled routes
   */
  getEnabledRoutes(): EventRoute[] {
    return Array.from(this.routes.values()).filter((route) => route.enabled);
  }
}

// ============================================================================
// Event Router
// ============================================================================

/**
 * Webhook event router
 */
export class WebhookEventRouter {
  private registry = new EventRegistry();
  private config: RouterConfig;

  constructor(config: RouterConfig = DEFAULT_ROUTER_CONFIG) {
    this.config = config;
  }

  /**
   * Register an event handler
   *
   * @param route - Event route configuration
   *
   * @example
   * router.register({
   *   eventType: 'subscription.activated',
   *   handler: handleSubscriptionActivated,
   *   description: 'Handle subscription activation',
   *   enabled: true
   * });
   */
  register(route: EventRoute): void {
    // Validate route configuration
    this.validateRoute(route);

    this.registry.register(route);
  }

  /**
   * Route a webhook event to its handler
   *
   * @param event - Parsed webhook event
   * @param webhookRecord - Webhook event record
   * @returns Routing result
   *
   * @example
   * const result = await router.routeEvent(webhookEvent, webhookRecord);
   * if (result.success && result.result?.processed) {
   *   console.log('Event processed successfully');
   * }
   */
  async routeEvent(
    event: ParsedWebhookEvent,
    webhookRecord?: WebhookEventRecord
  ): Promise<RoutingResult> {
    const startTime = Date.now();

    try {
      // Validate event if enabled
      if (this.config.enableEventValidation) {
        this.validateEvent(event);
      }

      // Find matching route
      const route = this.registry.getRoute(event.eventType);

      if (!route) {
        const error = `No handler registered for event type: ${event.eventType}`;

        if (this.config.enableUnknownEventLogging) {
          console.warn(`Unknown event type: ${event.eventType}`, {
            eventId: event.eventId,
            eventType: event.eventType,
            accountId: event.accountId,
            timestamp: new Date().toISOString(),
          });
        }

        return {
          success: false,
          routed: false,
          eventType: event.eventType,
          error,
          routingTime: Date.now() - startTime,
        };
      }

      // Check if route is enabled
      if (!route.enabled) {
        return {
          success: false,
          routed: false,
          eventType: event.eventType,
          handler: route.description,
          error: `Handler for ${event.eventType} is disabled`,
          routingTime: Date.now() - startTime,
        };
      }

      // Validate required fields
      if (route.required) {
        this.validateRequiredFields(event, route.required);
      }

      // Execute handler with timeout
      const result = await this.executeHandlerWithTimeout(route.handler, event, webhookRecord);

      return {
        success: true,
        routed: true,
        eventType: event.eventType,
        handler: route.description,
        result,
        routingTime: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        routed: false,
        eventType: event.eventType,
        error: `Routing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        routingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Execute handler with timeout
   */
  private async executeHandlerWithTimeout(
    handler: EventHandler,
    event: ParsedWebhookEvent,
    webhookRecord?: WebhookEventRecord
  ): Promise<EventHandlerResult> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`Handler timeout after ${this.config.timeoutMs}ms`));
      }, this.config.timeoutMs);

      handler(event, webhookRecord)
        .then((result) => {
          clearTimeout(timeout);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timeout);
          reject(error);
        });
    });
  }

  /**
   * Validate event structure
   */
  private validateEvent(event: ParsedWebhookEvent): void {
    if (!event.eventType) {
      throw new Error('Event type is required');
    }

    if (!event.eventId) {
      throw new Error('Event ID is required');
    }

    if (!event.accountId) {
      throw new Error('Account ID is required');
    }

    if (!event.payload?.entity) {
      throw new Error('Event payload entity is required');
    }

    // Validate event type format
    const parts = event.eventType.split('.');
    if (parts.length !== 2) {
      throw new Error(`Invalid event type format: ${event.eventType}`);
    }

    const [category] = parts;
    const validCategories = ['payment', 'subscription', 'order', 'refund', 'invoice'];

    if (!validCategories.includes(category)) {
      throw new Error(`Invalid event category: ${category}`);
    }
  }

  /**
   * Validate required fields for event
   */
  private validateRequiredFields(event: ParsedWebhookEvent, required: string[]): void {
    const entity = event.payload.entity;

    for (const field of required) {
      if (!(field in entity) || entity[field] === null || entity[field] === undefined) {
        throw new Error(`Required field missing: ${field}`);
      }
    }
  }

  /**
   * Validate route configuration
   */
  private validateRoute(route: EventRoute): void {
    if (!route.eventType) {
      throw new Error('Event type is required');
    }

    if (!route.handler || typeof route.handler !== 'function') {
      throw new Error('Handler function is required');
    }

    if (!route.description) {
      throw new Error('Description is required');
    }

    // Validate event type format
    const parts = route.eventType.split('.');
    if (parts.length !== 2) {
      throw new Error(
        `Invalid event type format: ${route.eventType}. Expected format: "category.action"`
      );
    }
  }

  /**
   * Get router statistics
   */
  getStatistics(): {
    totalRoutes: number;
    enabledRoutes: number;
    categories: string[];
    eventTypes: string[];
  } {
    const allRoutes = this.registry.getAllEventTypes();
    const enabledRoutes = this.registry.getEnabledRoutes();

    return {
      totalRoutes: allRoutes.length,
      enabledRoutes: enabledRoutes.length,
      categories: this.registry.getAllCategories(),
      eventTypes: allRoutes,
    };
  }

  /**
   * Get route information
   */
  getRouteInfo(): Array<{
    eventType: string;
    description: string;
    enabled: boolean;
    category: string;
  }> {
    return this.registry.getAllEventTypes().map((eventType) => {
      const route = this.registry.getRoute(eventType);
      const [category] = eventType.split('.');

      return {
        eventType,
        description: route?.description || 'No description',
        enabled: route?.enabled ?? false,
        category,
      };
    });
  }

  /**
   * Enable/disable all routes for a category
   */
  setCategoryEnabled(category: string, enabled: boolean): number {
    const routes = this.registry.getRoutesByCategory(category);
    let updated = 0;

    for (const route of routes) {
      if (route.enabled !== enabled) {
        route.enabled = enabled;
        updated++;
      }
    }

    return updated;
  }

  /**
   * Get configuration
   */
  getConfig(): RouterConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(updates: Partial<RouterConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// ============================================================================
// Placeholder Event Handlers (to be implemented in next subtasks)
// ============================================================================

/**
 * Placeholder subscription event handler
 */
export const placeholderSubscriptionHandler: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  console.log(`Placeholder: Handling subscription event ${event.eventType}`, {
    eventId: event.eventId,
    subscriptionId: event.payload.entity.id,
  });

  return {
    success: true,
    processed: false, // Not actually processed, just acknowledged
    details: {
      subscriptionId: event.payload.entity.id,
      action: 'placeholder_handler',
    },
  };
};

/**
 * Placeholder payment event handler
 */
export const placeholderPaymentHandler: EventHandler = async (
  event: ParsedWebhookEvent
): Promise<EventHandlerResult> => {
  console.log(`Placeholder: Handling payment event ${event.eventType}`, {
    eventId: event.eventId,
    paymentId: event.payload.entity.id,
  });

  return {
    success: true,
    processed: false, // Not actually processed, just acknowledged
    details: {
      paymentId: event.payload.entity.id,
      action: 'placeholder_handler',
    },
  };
};

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Create a configured webhook event router
 *
 * @param config - Optional router configuration
 * @returns Configured event router
 *
 * @example
 * const router = createWebhookEventRouter({
 *   enableUnknownEventLogging: true,
 *   timeoutMs: 45000
 * });
 */
export function createWebhookEventRouter(config?: Partial<RouterConfig>): WebhookEventRouter {
  const finalConfig = { ...DEFAULT_ROUTER_CONFIG, ...config };
  return new WebhookEventRouter(finalConfig);
}

// ============================================================================
// Default Export
// ============================================================================

// Remove module-level instantiation to avoid cookies context error
// export const webhookEventRouter = createWebhookEventRouter();
