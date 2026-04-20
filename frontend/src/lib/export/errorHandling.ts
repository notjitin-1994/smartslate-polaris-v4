export class ExportError extends Error {
  public readonly code: string;
  public readonly context?: Record<string, unknown>;

  constructor(message: string, code: string, context?: Record<string, unknown>) {
    super(message);
    this.name = 'ExportError';
    this.code = code;
    this.context = context;
  }
}

export class ExportValidationError extends ExportError {
  constructor(message: string, field: string, value: unknown) {
    super(message, 'VALIDATION_ERROR', { field, value });
    this.name = 'ExportValidationError';
  }
}

export class ExportTimeoutError extends ExportError {
  constructor(timeoutMs: number) {
    super(`Export operation timed out after ${timeoutMs}ms`, 'TIMEOUT_ERROR', { timeoutMs });
    this.name = 'ExportTimeoutError';
  }
}

export class ExportSizeError extends ExportError {
  constructor(actualSize: number, maxSize: number) {
    super(`Export size ${actualSize} bytes exceeds maximum ${maxSize} bytes`, 'SIZE_ERROR', {
      actualSize,
      maxSize,
    });
    this.name = 'ExportSizeError';
  }
}

export class ExportFormatError extends ExportError {
  constructor(format: string, supportedFormats: string[]) {
    super(`Unsupported export format: ${format}`, 'FORMAT_ERROR', {
      format,
      supportedFormats,
    });
    this.name = 'ExportFormatError';
  }
}

export class ExportServiceError extends ExportError {
  constructor(service: string, originalError: Error) {
    super(`Export service ${service} failed: ${originalError.message}`, 'SERVICE_ERROR', {
      service,
      originalError: originalError.message,
    });
    this.name = 'ExportServiceError';
  }
}

export interface ErrorHandler {
  handle(error: Error, context?: Record<string, unknown>): void;
  log(error: Error, context?: Record<string, unknown>): void;
  report(error: Error, context?: Record<string, unknown>): void;
}

export class DefaultErrorHandler implements ErrorHandler {
  handle(error: Error, context?: Record<string, unknown>): void {
    console.error('Export error:', error, context);

    // Show user-friendly error message
    if (error instanceof ExportError) {
      this.showUserError(error);
    } else {
      this.showGenericError(error);
    }
  }

  log(error: Error, context?: Record<string, unknown>): void {
    console.error('Export error logged:', {
      message: error.message,
      name: error.name,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }

  report(error: Error, context?: Record<string, unknown>): void {
    // In a real application, this would send to an error reporting service
    console.error('Export error reported:', error, context);
  }

  private showUserError(error: ExportError): void {
    let message = 'Export failed: ';

    switch (error.code) {
      case 'VALIDATION_ERROR':
        message += 'Invalid data provided. Please check your input.';
        break;
      case 'TIMEOUT_ERROR':
        message += 'Export is taking too long. Please try again.';
        break;
      case 'SIZE_ERROR':
        message += 'Export file is too large. Please reduce the data size.';
        break;
      case 'FORMAT_ERROR':
        message += 'Unsupported export format.';
        break;
      case 'SERVICE_ERROR':
        message += 'Export service unavailable. Please try again later.';
        break;
      default:
        message += error.message;
    }

    alert(message);
  }

  private showGenericError(error: Error): void {
    alert('Export failed. Please try again or contact support if the issue persists.');
  }
}

export const defaultErrorHandler = new DefaultErrorHandler();

export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler: ErrorHandler = defaultErrorHandler
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      errorHandler.handle(error as Error);
      throw error;
    }
  };
}

export function validateExportData(data: unknown): void {
  if (!data) {
    throw new ExportValidationError('Export data is required', 'data', data);
  }

  if (typeof data !== 'object') {
    throw new ExportValidationError('Export data must be an object', 'data', typeof data);
  }

  const dataObj = data as Record<string, unknown>;

  if (!dataObj.blueprint) {
    throw new ExportValidationError('Blueprint data is required', 'blueprint', dataObj.blueprint);
  }

  if (!dataObj.metadata) {
    throw new ExportValidationError('Metadata is required', 'metadata', dataObj.metadata);
  }
}

export function validateFileSize(size: number, maxSize: number): void {
  if (size > maxSize) {
    throw new ExportSizeError(size, maxSize);
  }
}

export function validateExportFormat(format: string, supportedFormats: string[]): void {
  if (!supportedFormats.includes(format)) {
    throw new ExportFormatError(format, supportedFormats);
  }
}

export function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => {
      setTimeout(() => reject(new ExportTimeoutError(timeoutMs)), timeoutMs);
    }),
  ]);
}
