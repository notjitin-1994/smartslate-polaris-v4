/**
 * Tests for Blueprint Utility Functions
 */

import { describe, it, expect } from 'vitest';
import {
  formatSectionTitle,
  calculateProgress,
  getPriorityColor,
  formatDate,
  formatNumber,
  formatCurrency,
} from '@/components/blueprint/utils';

describe('Blueprint Utils', () => {
  describe('formatSectionTitle', () => {
    it('should format snake_case to Title Case', () => {
      expect(formatSectionTitle('learning_objectives')).toBe('Learning Objectives');
      expect(formatSectionTitle('executive_summary')).toBe('Executive Summary');
      expect(formatSectionTitle('risk_mitigation')).toBe('Risk Mitigation');
    });

    it('should handle single word', () => {
      expect(formatSectionTitle('metadata')).toBe('Metadata');
    });

    it('should handle already capitalized', () => {
      expect(formatSectionTitle('Already_Capitalized')).toBe('Already Capitalized');
    });
  });

  describe('calculateProgress', () => {
    it('should calculate percentage correctly', () => {
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(75, 100)).toBe(75);
    });

    it('should handle string numbers', () => {
      expect(calculateProgress('50', '100')).toBe(50);
      expect(calculateProgress('25', 100)).toBe(25);
    });

    it('should cap at 100%', () => {
      expect(calculateProgress(150, 100)).toBe(100);
    });

    it('should floor at 0%', () => {
      expect(calculateProgress(-10, 100)).toBe(0);
    });

    it('should handle zero target', () => {
      expect(calculateProgress(50, 0)).toBe(0);
    });

    it('should handle invalid numbers', () => {
      expect(calculateProgress('invalid', 100)).toBe(0);
      expect(calculateProgress(50, 'invalid')).toBe(0);
    });
  });

  describe('getPriorityColor', () => {
    it('should return error color for high priority', () => {
      const color = getPriorityColor('high');
      expect(color).toContain('text-error');
    });

    it('should return warning color for medium priority', () => {
      const color = getPriorityColor('medium');
      expect(color).toContain('text-warning');
    });

    it('should return success color for low priority', () => {
      const color = getPriorityColor('low');
      expect(color).toContain('text-success');
    });

    it('should be case insensitive', () => {
      expect(getPriorityColor('HIGH')).toContain('text-error');
      expect(getPriorityColor('Medium')).toContain('text-warning');
    });
  });

  describe('formatDate', () => {
    it('should format ISO date string', () => {
      const result = formatDate('2025-10-01T12:00:00Z');
      expect(result).toContain('Oct');
      expect(result).toContain('2025');
    });

    it('should handle invalid date', () => {
      const result = formatDate('invalid-date');
      // Invalid dates return "Invalid Date" from toLocaleDateString
      expect(result).toContain('Invalid');
    });
  });

  describe('formatNumber', () => {
    it('should format number with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(1000000)).toBe('1,000,000');
    });

    it('should handle small numbers', () => {
      expect(formatNumber(10)).toBe('10');
    });
  });

  describe('formatCurrency', () => {
    it('should format USD currency', () => {
      const result = formatCurrency(50000, 'USD');
      expect(result).toContain('$50,000');
    });

    it('should use default USD', () => {
      const result = formatCurrency(10000);
      expect(result).toContain('$10,000');
    });

    it('should not show decimals', () => {
      const result = formatCurrency(1234.56, 'USD');
      expect(result).toContain('$1,235'); // Rounded
    });
  });
});
