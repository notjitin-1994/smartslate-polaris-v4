/**
 * Input Type Registry Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { InputTypeRegistry } from '@/lib/dynamic-form/inputRegistry';

describe('InputTypeRegistry', () => {
  let registry: InputTypeRegistry;

  beforeEach(() => {
    registry = new InputTypeRegistry();

    // Register mock components
    const MockTextComponent = () => null;
    const MockSelectComponent = () => null;
    const MockScaleComponent = () => null;

    registry.registerBatch([
      { type: 'text', component: MockTextComponent },
      { type: 'select', component: MockSelectComponent },
      { type: 'scale', component: MockScaleComponent },
    ]);

    registry.setFallback('text');
  });

  describe('Basic Registration', () => {
    it('should register input types', () => {
      expect(registry.has('text')).toBe(true);
      expect(registry.has('select')).toBe(true);
      expect(registry.has('scale')).toBe(true);
    });

    it('should retrieve registered components', () => {
      const component = registry.get('text');
      expect(component).toBeDefined();
    });

    it('should return null for unregistered types', () => {
      const component = registry.get('unknown_type');
      expect(component).toBeNull();
    });

    it('should list all registered types', () => {
      const types = registry.getAll();
      expect(types).toContain('text');
      expect(types).toContain('select');
      expect(types).toContain('scale');
      expect(types.length).toBe(3);
    });
  });

  describe('Intelligent Type Mapping', () => {
    it('should map datetime to date', () => {
      const result = registry.getWithFallback('datetime');
      expect(result.mapped).toBe(true);
      expect(result.mappedTo).toBe('date');
    });

    it('should map dropdown to select', () => {
      const result = registry.getWithFallback('dropdown');
      expect(result.mapped).toBe(true);
      expect(result.mappedTo).toBe('select');
    });

    it('should map rich_text to textarea', () => {
      const result = registry.getWithFallback('rich_text');
      expect(result.mapped).toBe(true);
      expect(result.mappedTo).toBe('textarea');
    });

    it('should map rating to scale', () => {
      const result = registry.getWithFallback('rating');
      expect(result.mapped).toBe(true);
      expect(result.mappedTo).toBe('scale');
    });

    it('should use fallback for completely unknown types', () => {
      const result = registry.getWithFallback('totally_unknown_type_xyz');
      expect(result.mapped).toBe(true);
      expect(result.mappedTo).toBe('text');
      expect(result.component).toBeDefined();
    });
  });

  describe('Pattern-Based Mapping', () => {
    it('should map types containing "text"', () => {
      const result1 = registry.getWithFallback('short_text_input');
      expect(result1.mappedTo).toBe('text');

      const result2 = registry.getWithFallback('long_text_area');
      expect(result2.mappedTo).toBe('textarea');
    });

    it('should map types containing "select"', () => {
      const result1 = registry.getWithFallback('multi_select_dropdown');
      expect(result1.mappedTo).toBe('checkbox_pills');

      const result2 = registry.getWithFallback('single_select_menu');
      expect(result2.mappedTo).toBe('radio_pills');
    });

    it('should map types containing "number"', () => {
      const result1 = registry.getWithFallback('integer');
      expect(result1.mappedTo).toBe('number');

      const result2 = registry.getWithFallback('quantity');
      expect(result2.mappedTo).toBe('number_spinner');
    });
  });

  describe('Fallback Behavior', () => {
    it('should use fallback type for unknown types', () => {
      const result = registry.getWithFallback('completely_new_type');
      expect(result.component).toBeDefined();
      expect(result.mapped).toBe(true);
    });

    it('should allow setting custom fallback', () => {
      registry.setFallback('select');
      const result = registry.getWithFallback('unknown');
      expect(result.mappedTo).toBe('select');
    });

    it('should throw error if fallback type is not registered', () => {
      expect(() => {
        registry.setFallback('unregistered_type');
      }).toThrow();
    });
  });

  describe('Registry Management', () => {
    it('should get registry statistics', () => {
      const stats = registry.getStats();

      expect(stats.totalTypes).toBe(3);
      expect(stats.registeredTypes).toContain('text');
      expect(stats.fallbackType).toBe('text');
    });

    it('should clear registry', () => {
      expect(registry.getAll().length).toBe(3);

      registry.clear();

      expect(registry.getAll().length).toBe(0);
    });
  });

  describe('Known Type Retrieval', () => {
    it('should return known type without mapping', () => {
      const result = registry.getWithFallback('text');

      expect(result.mapped).toBe(false);
      expect(result.component).toBeDefined();
      expect(result.mappedFrom).toBeUndefined();
      expect(result.mappedTo).toBeUndefined();
    });
  });
});
