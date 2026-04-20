/**
 * Logging Types and Interfaces
 * Structured logging for the Perplexity Dynamic Questionnaire System
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type LogService =
  | 'perplexity'
  | 'ollama'
  | 'dynamic-questions'
  | 'database'
  | 'auth'
  | 'validation'
  | 'api'
  | 'ui'
  | 'system';

export type LogEvent =
  // Perplexity events
  | 'perplexity.request'
  | 'perplexity.success'
  | 'perplexity.failure'
  | 'perplexity.timeout'
  | 'perplexity.retry'
  // Ollama events
  | 'ollama.fallback.activated'
  | 'ollama.fallback.success'
  | 'ollama.fallback.failure'
  | 'ollama.request'
  | 'ollama.success'
  | 'ollama.memory_error'
  // Dynamic questions events
  | 'dynamic_questions.generation.start'
  | 'dynamic_questions.generation.complete'
  | 'dynamic_questions.generation.error'
  | 'dynamic_questions.validation.success'
  | 'dynamic_questions.validation.failure'
  | 'dynamic_questions.input_type.unknown'
  | 'dynamic_questions.input_type.mapped'
  // Database events
  | 'database.save.start'
  | 'database.save.success'
  | 'database.save.failure'
  | 'database.query.start'
  | 'database.query.success'
  | 'database.query.failure'
  // API events
  | 'api.request'
  | 'api.response'
  | 'api.error'
  | 'api.auth.failure'
  // System events
  | 'system.startup'
  | 'system.shutdown'
  | 'system.error'
  | string; // Allow custom events

export interface LogMetadata {
  // Core metadata
  duration?: number;
  model?: string;

  // Request/Response
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;

  // User context
  userId?: string;
  blueprintId?: string;
  sessionId?: string;

  // Perplexity/Ollama specific
  tokens?: {
    input?: number;
    output?: number;
    total?: number;
  };
  temperature?: number;
  maxTokens?: number;

  // Question generation
  sectionCount?: number;
  questionCount?: number;
  inputType?: string;
  mappedType?: string;

  // Error details
  error?: string;
  errorStack?: string;
  errorCode?: string;

  // Performance
  memoryUsage?: number;
  cpuUsage?: number;

  // Fallback info
  fallbackActivated?: boolean;
  fallbackReason?: string;
  attemptNumber?: number;

  // Custom metadata
  [key: string]: unknown;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  service: LogService;
  event: LogEvent;
  message: string;
  metadata: LogMetadata;
}

export interface LogQuery {
  level?: LogLevel | LogLevel[];
  service?: LogService | LogService[];
  event?: LogEvent | LogEvent[];
  userId?: string;
  blueprintId?: string;
  from?: string; // ISO timestamp
  to?: string; // ISO timestamp
  search?: string; // Search in message or metadata
  limit?: number;
  offset?: number;
}

export interface LogStats {
  total: number;
  byLevel: Record<LogLevel, number>;
  byService: Record<LogService, number>;
  errorRate: number;
  avgDuration: number;
}

export interface LogExportOptions {
  format: 'json' | 'csv' | 'txt';
  query?: LogQuery;
  includeMetadata?: boolean;
}

export interface SensitiveField {
  field: string;
  replacement: string;
}

export const SENSITIVE_FIELDS: SensitiveField[] = [
  { field: 'api_key', replacement: '[REDACTED]' },
  { field: 'apiKey', replacement: '[REDACTED]' },
  { field: 'token', replacement: '[REDACTED]' },
  { field: 'password', replacement: '[REDACTED]' },
  { field: 'secret', replacement: '[REDACTED]' },
  { field: 'authorization', replacement: '[REDACTED]' },
  { field: 'cookie', replacement: '[REDACTED]' },
  { field: 'session', replacement: '[REDACTED]' },
];

export const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export const LOG_COLORS: Record<LogLevel, string> = {
  debug: 'text-text-secondary',
  info: 'text-primary',
  warn: 'text-yellow-500',
  error: 'text-error',
};

export const SERVICE_COLORS: Record<LogService, string> = {
  perplexity: 'bg-primary/10 text-primary-dark dark:bg-primary/20 dark:text-primary-light',
  ollama: 'bg-secondary/10 text-secondary-dark dark:bg-secondary/20 dark:text-secondary-light',
  'dynamic-questions': 'bg-success/10 text-success dark:bg-success/20 dark:text-success',
  database: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
  auth: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
  validation: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  api: 'bg-secondary/10 text-secondary-dark dark:bg-secondary/20 dark:text-secondary-light',
  ui: 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300',
  system: 'bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300',
};
