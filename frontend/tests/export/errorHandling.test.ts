import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  ExportError,
  ExportValidationError,
  ExportTimeoutError,
  ExportSizeError,
  ExportFormatError,
  ExportServiceError,
  DefaultErrorHandler,
  withErrorHandling,
  validateExportData,
  validateFileSize,
  validateExportFormat,
  withTimeout,
} from '@/lib/export/errorHandling';

describe('ExportError', () => {
  it('should create error with message and code', () => {
    const error = new ExportError('Test error', 'TEST_ERROR');

    expect(error.message).toBe('Test error');
    expect(error.code).toBe('TEST_ERROR');
    expect(error.name).toBe('ExportError');
  });

  it('should create error with context', () => {
    const context = { field: 'test', value: 123 };
    const error = new ExportError('Test error', 'TEST_ERROR', context);

    expect(error.context).toEqual(context);
  });
});

describe('ExportValidationError', () => {
  it('should create validation error with field and value', () => {
    const error = new ExportValidationError('Invalid value', 'testField', 'invalidValue');

    expect(error.message).toBe('Invalid value');
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.name).toBe('ExportValidationError');
    expect(error.context?.field).toBe('testField');
    expect(error.context?.value).toBe('invalidValue');
  });
});

describe('ExportTimeoutError', () => {
  it('should create timeout error with timeout value', () => {
    const error = new ExportTimeoutError(5000);

    expect(error.message).toBe('Export operation timed out after 5000ms');
    expect(error.code).toBe('TIMEOUT_ERROR');
    expect(error.name).toBe('ExportTimeoutError');
    expect(error.context?.timeoutMs).toBe(5000);
  });
});

describe('ExportSizeError', () => {
  it('should create size error with actual and max size', () => {
    const error = new ExportSizeError(1000, 500);

    expect(error.message).toBe('Export size 1000 bytes exceeds maximum 500 bytes');
    expect(error.code).toBe('SIZE_ERROR');
    expect(error.name).toBe('ExportSizeError');
    expect(error.context?.actualSize).toBe(1000);
    expect(error.context?.maxSize).toBe(500);
  });
});

describe('ExportFormatError', () => {
  it('should create format error with format and supported formats', () => {
    const supportedFormats = ['pdf', 'markdown', 'json'];
    const error = new ExportFormatError('xml', supportedFormats);

    expect(error.message).toBe('Unsupported export format: xml');
    expect(error.code).toBe('FORMAT_ERROR');
    expect(error.name).toBe('ExportFormatError');
    expect(error.context?.format).toBe('xml');
    expect(error.context?.supportedFormats).toEqual(supportedFormats);
  });
});

describe('ExportServiceError', () => {
  it('should create service error with service name and original error', () => {
    const originalError = new Error('Original error');
    const error = new ExportServiceError('PDFService', originalError);

    expect(error.message).toBe('Export service PDFService failed: Original error');
    expect(error.code).toBe('SERVICE_ERROR');
    expect(error.name).toBe('ExportServiceError');
    expect(error.context?.service).toBe('PDFService');
    expect(error.context?.originalError).toBe('Original error');
  });
});

describe('DefaultErrorHandler', () => {
  let handler: DefaultErrorHandler;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let alertSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    handler = new DefaultErrorHandler();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    alertSpy.mockRestore();
  });

  describe('handle', () => {
    it('should handle ExportError and show user-friendly message', () => {
      const error = new ExportValidationError('Invalid data', 'field', 'value');
      const context = { additional: 'context' };

      handler.handle(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error:', error, context);
      expect(alertSpy).toHaveBeenCalledWith(
        'Export failed: Invalid data provided. Please check your input.'
      );
    });

    it('should handle generic Error and show generic message', () => {
      const error = new Error('Generic error');

      handler.handle(error);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error:', error, undefined);
      expect(alertSpy).toHaveBeenCalledWith(
        'Export failed. Please try again or contact support if the issue persists.'
      );
    });

    it('should show appropriate message for timeout error', () => {
      const error = new ExportTimeoutError(5000);

      handler.handle(error);

      expect(alertSpy).toHaveBeenCalledWith(
        'Export failed: Export is taking too long. Please try again.'
      );
    });

    it('should show appropriate message for size error', () => {
      const error = new ExportSizeError(1000, 500);

      handler.handle(error);

      expect(alertSpy).toHaveBeenCalledWith(
        'Export failed: Export file is too large. Please reduce the data size.'
      );
    });

    it('should show appropriate message for format error', () => {
      const error = new ExportFormatError('xml', ['pdf', 'markdown']);

      handler.handle(error);

      expect(alertSpy).toHaveBeenCalledWith('Export failed: Unsupported export format.');
    });

    it('should show appropriate message for service error', () => {
      const error = new ExportServiceError('PDFService', new Error('Service unavailable'));

      handler.handle(error);

      expect(alertSpy).toHaveBeenCalledWith(
        'Export failed: Export service unavailable. Please try again later.'
      );
    });
  });

  describe('log', () => {
    it('should log error with context', () => {
      const error = new Error('Test error');
      const context = { field: 'test' };

      handler.log(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error logged:', {
        message: 'Test error',
        name: 'Error',
        stack: error.stack,
        context,
        timestamp: expect.any(String),
      });
    });
  });

  describe('report', () => {
    it('should report error with context', () => {
      const error = new Error('Test error');
      const context = { field: 'test' };

      handler.report(error, context);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Export error reported:', error, context);
    });
  });
});

describe('withErrorHandling', () => {
  it('should wrap function with error handling', async () => {
    const mockFn = vi.fn().mockRejectedValue(new Error('Test error'));
    const mockErrorHandler = {
      handle: vi.fn(),
      log: vi.fn(),
      report: vi.fn(),
    };

    const wrappedFn = withErrorHandling(mockFn, mockErrorHandler);

    await expect(wrappedFn('arg1', 'arg2')).rejects.toThrow('Test error');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockErrorHandler.handle).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should not interfere with successful execution', async () => {
    const mockFn = vi.fn().mockResolvedValue('success');
    const mockErrorHandler = {
      handle: vi.fn(),
      log: vi.fn(),
      report: vi.fn(),
    };

    const wrappedFn = withErrorHandling(mockFn, mockErrorHandler);

    const result = await wrappedFn('arg1', 'arg2');
    expect(result).toBe('success');
    expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(mockErrorHandler.handle).not.toHaveBeenCalled();
  });
});

describe('validateExportData', () => {
  it('should validate correct export data', () => {
    const data = {
      blueprint: { title: 'Test', overview: 'Test overview' },
      metadata: { title: 'Test', exportedAt: '2024-01-01T00:00:00Z', version: '1.0.0' },
    };

    expect(() => validateExportData(data)).not.toThrow();
  });

  it('should throw error for null data', () => {
    expect(() => validateExportData(null)).toThrow(ExportValidationError);
  });

  it('should throw error for non-object data', () => {
    expect(() => validateExportData('string')).toThrow(ExportValidationError);
  });

  it('should throw error for missing blueprint', () => {
    const data = { metadata: {} };
    expect(() => validateExportData(data)).toThrow(ExportValidationError);
  });

  it('should throw error for missing metadata', () => {
    const data = { blueprint: {} };
    expect(() => validateExportData(data)).toThrow(ExportValidationError);
  });
});

describe('validateFileSize', () => {
  it('should validate correct file size', () => {
    expect(() => validateFileSize(1000, 2000)).not.toThrow();
  });

  it('should throw error for oversized file', () => {
    expect(() => validateFileSize(2000, 1000)).toThrow(ExportSizeError);
  });
});

describe('validateExportFormat', () => {
  it('should validate correct export format', () => {
    expect(() => validateExportFormat('pdf', ['pdf', 'markdown', 'json'])).not.toThrow();
  });

  it('should throw error for unsupported format', () => {
    expect(() => validateExportFormat('xml', ['pdf', 'markdown', 'json'])).toThrow(
      ExportFormatError
    );
  });
});

describe('withTimeout', () => {
  it('should resolve if promise completes within timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 100));
    const result = await withTimeout(promise, 500);
    expect(result).toBe('success');
  });

  it('should reject if promise exceeds timeout', async () => {
    const promise = new Promise((resolve) => setTimeout(() => resolve('success'), 1000));
    await expect(withTimeout(promise, 100)).rejects.toThrow(ExportTimeoutError);
  });
});
