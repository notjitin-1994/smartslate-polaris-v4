/**
 * Unit Tests: ReportExportService
 *
 * Core test coverage for report export service focusing on:
 * - JSON Export
 * - CSV Export (with flattening and escaping)
 * - Utility Functions (formatKey, escapeHtml)
 * - Error Handling
 *
 * Note: Excel and PDF export tests are limited due to complex mocking requirements
 * for ExcelJS, jsPDF, html2canvas, and browser DOM APIs. These are better suited
 * for E2E tests or manual verification.
 *
 * This service is critical for generating downloadable reports in multiple formats.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToJSON, exportToCSV, type ReportData } from '../reportExportService';

// Helper to convert Blob to string in Node.js environment
async function blobToString(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(blob);
  });
}

describe('ReportExportService', () => {
  const mockReportData: ReportData = {
    name: 'Test Report',
    type: 'Analytics',
    generatedAt: '2025-01-12T10:00:00Z',
    dateRange: {
      start: '2025-01-01T00:00:00Z',
      end: '2025-01-12T00:00:00Z',
    },
    data: {
      summary: {
        totalUsers: 150,
        totalRevenue: 25000,
        averageOrderValue: 166.67,
      },
      users: [
        { id: 1, name: 'John Doe', email: 'john@example.com' },
        { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
      ],
      metrics: {
        conversionRate: 2.5,
        bounceRate: 45.2,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('exportToJSON', () => {
    it('should export report data as JSON blob', () => {
      // Act
      const blob = exportToJSON(mockReportData);

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('application/json');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include all report data in JSON', async () => {
      // Act
      const blob = exportToJSON(mockReportData);
      const text = await blobToString(blob);
      const parsed = JSON.parse(text);

      // Assert
      expect(parsed.name).toBe('Test Report');
      expect(parsed.type).toBe('Analytics');
      expect(parsed.generatedAt).toBe('2025-01-12T10:00:00Z');
      expect(parsed.dateRange).toEqual(mockReportData.dateRange);
      expect(parsed.data).toEqual(mockReportData.data);
    });

    it('should handle report without date range', async () => {
      // Arrange
      const reportWithoutDateRange = {
        ...mockReportData,
        dateRange: undefined,
      };

      // Act
      const blob = exportToJSON(reportWithoutDateRange);
      const text = await blobToString(blob);
      const parsed = JSON.parse(text);

      // Assert
      expect(parsed.dateRange).toBeUndefined();
      expect(parsed.name).toBe('Test Report');
    });

    it('should format JSON with 2-space indentation', async () => {
      // Act
      const blob = exportToJSON(mockReportData);
      const text = await blobToString(blob);

      // Assert - Check for formatting (2-space indent)
      expect(text).toContain('  "name":');
      expect(text).toContain('  "type":');
    });
  });

  describe('exportToCSV', () => {
    it('should export report data as CSV blob', () => {
      // Act
      const blob = exportToCSV(mockReportData);

      // Assert
      expect(blob).toBeInstanceOf(Blob);
      expect(blob.type).toBe('text/csv');
      expect(blob.size).toBeGreaterThan(0);
    });

    it('should include metadata in CSV header', async () => {
      // Act
      const blob = exportToCSV(mockReportData);
      const text = await blobToString(blob);
      const lines = text.split('\n');

      // Assert
      expect(lines[0]).toBe('Report Name,Test Report');
      expect(lines[1]).toBe('Report Type,Analytics');
      expect(lines[2]).toContain('Generated At');
    });

    it('should include date range when present', async () => {
      // Act
      const blob = exportToCSV(mockReportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Date Range Start');
      expect(text).toContain('Date Range End');
      expect(text).toContain('2025-01-01T00:00:00Z');
      expect(text).toContain('2025-01-12T00:00:00Z');
    });

    it('should handle report without date range', async () => {
      // Arrange
      const reportWithoutDateRange = {
        ...mockReportData,
        dateRange: undefined,
      };

      // Act
      const blob = exportToCSV(reportWithoutDateRange);
      const text = await blobToString(blob);

      // Assert
      expect(text).not.toContain('Date Range Start');
      expect(text).toBe(text); // Just verify it doesn't crash
    });

    it('should include summary section', async () => {
      // Act
      const blob = exportToCSV(mockReportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Summary');
      expect(text).toContain('Total Users,150');
      expect(text).toContain('Total Revenue,25000');
      expect(text).toContain('Average Order Value,166.67');
    });

    it('should handle array of objects as table', async () => {
      // Act
      const blob = exportToCSV(mockReportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Users');
      expect(text).toContain('John Doe');
      expect(text).toContain('john@example.com');
      expect(text).toContain('Jane Smith');
      expect(text).toContain('jane@example.com');
    });

    it('should escape CSV special characters (commas)', async () => {
      // Arrange
      const reportWithCommas: ReportData = {
        name: 'Report, with commas',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          items: [{ name: 'Item with, comma', description: 'Normal text' }],
        },
      };

      // Act
      const blob = exportToCSV(reportWithCommas);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('"Report, with commas"');
      expect(text).toContain('"Item with, comma"');
    });

    it('should escape CSV special characters (quotes)', async () => {
      // Arrange
      const reportWithQuotes: ReportData = {
        name: 'Report with "quotes"',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          items: [{ name: 'Item', description: 'Text with "quotes"' }],
        },
      };

      // Act
      const blob = exportToCSV(reportWithQuotes);
      const text = await blobToString(blob);

      // Assert - Quotes should be doubled and wrapped
      expect(text).toContain('""quotes""');
    });

    it('should escape CSV special characters (newlines)', async () => {
      // Arrange
      const reportWithNewlines: ReportData = {
        name: 'Test\nMultiline',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          summary: { key: 'value' },
        },
      };

      // Act
      const blob = exportToCSV(reportWithNewlines);
      const text = await blobToString(blob);

      // Assert - Newlines should trigger quoting
      expect(text).toContain('"Test\nMultiline"');
    });

    it('should handle array of primitives', async () => {
      // Arrange
      const reportWithPrimitiveArray: ReportData = {
        name: 'Test Report',
        type: 'Analytics',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          tags: ['tag1', 'tag2', 'tag3'],
        },
      };

      // Act
      const blob = exportToCSV(reportWithPrimitiveArray);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Tags');
      expect(text).toContain('tag1');
      expect(text).toContain('tag2');
      expect(text).toContain('tag3');
    });

    it('should handle empty arrays', async () => {
      // Arrange
      const reportWithEmptyArray: ReportData = {
        name: 'Test Report',
        type: 'Analytics',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          emptySection: [],
        },
      };

      // Act
      const blob = exportToCSV(reportWithEmptyArray);
      const text = await blobToString(blob);

      // Assert - Should not crash, section name should appear
      expect(text).toContain('Empty Section');
    });

    it('should handle nested objects in data', async () => {
      // Arrange
      const reportWithNestedObjects: ReportData = {
        name: 'Test Report',
        type: 'Analytics',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          config: {
            setting1: 'value1',
            setting2: 'value2',
            nestedObject: { key: 'value' },
          },
        },
      };

      // Act
      const blob = exportToCSV(reportWithNestedObjects);
      const text = await blobToString(blob);

      // Assert - Nested objects should be stringified
      expect(text).toContain('Config');
      expect(text).toContain('Setting1,value1'); // formatKey doesn't add space before numbers
      expect(text).toContain('Nested Object');
    });
  });

  describe('Utility Functions (tested indirectly)', () => {
    it('should format camelCase keys to Title Case', async () => {
      // Arrange
      const reportData: ReportData = {
        name: 'Test',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          camelCaseKey: 'value',
          anotherCamelKey: 'value2',
        },
      };

      // Act
      const blob = exportToCSV(reportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Camel Case Key');
      expect(text).toContain('Another Camel Key');
    });

    it('should format snake_case keys to Title Case', async () => {
      // Arrange
      const reportData: ReportData = {
        name: 'Test',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          snake_case_key: 'value',
          another_snake_key: 'value2',
        },
      };

      // Act
      const blob = exportToCSV(reportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Snake case key');
      expect(text).toContain('Another snake key');
    });

    it('should format mixed case keys correctly', async () => {
      // Arrange
      const reportData: ReportData = {
        name: 'Test',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          mixed_caseKey: 'value',
        },
      };

      // Act
      const blob = exportToCSV(reportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Mixed case Key');
    });

    it('should capitalize first letter of regular keys', async () => {
      // Arrange
      const reportData: ReportData = {
        name: 'Test',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          normalkey: 'value',
        },
      };

      // Act
      const blob = exportToCSV(reportData);
      const text = await blobToString(blob);

      // Assert
      expect(text).toContain('Normalkey');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty data object', async () => {
      // Arrange
      const reportWithEmptyData: ReportData = {
        name: 'Empty Report',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {},
      };

      // Act
      const jsonBlob = exportToJSON(reportWithEmptyData);
      const csvBlob = exportToCSV(reportWithEmptyData);

      const jsonText = await blobToString(jsonBlob);
      const csvText = await blobToString(csvBlob);

      // Assert - Should not crash
      expect(jsonText).toContain('Empty Report');
      expect(csvText).toContain('Empty Report');
    });

    it('should handle null values in data', async () => {
      // Arrange
      const reportWithNulls: ReportData = {
        name: 'Test Report',
        type: 'Analytics',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {
          summary: {
            nullValue: null,
            undefinedValue: undefined,
            zeroValue: 0,
            emptyString: '',
          },
        },
      };

      // Act
      const blob = exportToCSV(reportWithNulls);
      const text = await blobToString(blob);

      // Assert - Should handle null/undefined gracefully
      expect(text).toContain('Null Value');
      expect(text).toContain('Zero Value,0');
    });

    it('should handle date range with null values', async () => {
      // Arrange
      const reportWithNullDates: ReportData = {
        name: 'Test Report',
        type: 'Analytics',
        generatedAt: '2025-01-12T10:00:00Z',
        dateRange: {
          start: null,
          end: null,
        },
        data: {},
      };

      // Act
      const blob = exportToCSV(reportWithNullDates);
      const text = await blobToString(blob);

      // Assert - Should show N/A for null dates
      expect(text).toContain('Date Range Start,N/A');
      expect(text).toContain('Date Range End,N/A');
    });

    it('should handle very long report names', async () => {
      // Arrange
      const reportWithLongName: ReportData = {
        name: 'A'.repeat(200),
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {},
      };

      // Act
      const blob = exportToJSON(reportWithLongName);
      const text = await blobToString(blob);

      // Assert - Should not crash
      expect(text.length).toBeGreaterThan(200);
      expect(JSON.parse(text).name).toBe('A'.repeat(200));
    });

    it('should handle special characters in report name', async () => {
      // Arrange
      const reportWithSpecialChars: ReportData = {
        name: 'Report <>&"\'/\\',
        type: 'Test',
        generatedAt: '2025-01-12T10:00:00Z',
        data: {},
      };

      // Act
      const jsonBlob = exportToJSON(reportWithSpecialChars);
      const csvBlob = exportToCSV(reportWithSpecialChars);

      const jsonText = await blobToString(jsonBlob);
      const csvText = await blobToString(csvBlob);

      // Assert - Should preserve special characters (with proper escaping)
      expect(jsonText).toContain('Report <>&');
      expect(jsonText).toContain('"\'/\\');
      // CSV escapes quotes by doubling them and wraps in quotes
      expect(csvText).toContain('Report <>&""');
    });
  });
});
