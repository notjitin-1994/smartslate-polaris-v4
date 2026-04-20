/**
 * Dynamic Input Type Registry
 * Extensible registry for form input components with intelligent type mapping
 */

import { ComponentType } from 'react';
import { createServiceLogger } from '@/lib/logging';
import type { Question, InputType } from './schema';

const logger = createServiceLogger('validation');

export interface BaseInputProps {
  question: Question;
  value: any;
  onChange: (value: any) => void;
  onBlur?: () => void;
  error?: string;
  disabled?: boolean;
}

/**
 * Input Type Registry
 * Manages mapping between input types and their React components
 */
class InputTypeRegistry {
  private registry = new Map<string, ComponentType<BaseInputProps>>();
  private fallbackType: string = 'text';

  /**
   * Register an input type component
   */
  register(type: string, component: ComponentType<BaseInputProps>): void {
    this.registry.set(type, component);

    logger.debug('dynamic_questions.input_type.registered' as any, 'Registered input type', {
      type,
    });
  }

  /**
   * Get component for input type
   */
  get(type: string): ComponentType<BaseInputProps> | null {
    return this.registry.get(type) || null;
  }

  /**
   * Check if type is registered
   */
  has(type: string): boolean {
    return this.registry.has(type);
  }

  /**
   * Get all registered types
   */
  getAll(): string[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Set fallback type for unknown types
   */
  setFallback(type: string): void {
    if (!this.registry.has(type)) {
      throw new Error(`Fallback type "${type}" is not registered`);
    }
    this.fallbackType = type;
  }

  /**
   * Get fallback component
   */
  getFallback(): ComponentType<BaseInputProps> {
    const component = this.registry.get(this.fallbackType);
    if (!component) {
      throw new Error(`Fallback type "${this.fallbackType}" not found in registry`);
    }
    return component;
  }

  /**
   * Get component with intelligent fallback
   */
  getWithFallback(type: string): {
    component: ComponentType<BaseInputProps>;
    mapped: boolean;
    mappedFrom?: string;
    mappedTo?: string;
  } {
    // Type is known
    if (this.registry.has(type)) {
      return {
        component: this.registry.get(type)!,
        mapped: false,
      };
    }

    // Type is unknown - attempt intelligent mapping
    logger.warn('dynamic_questions.input_type.unknown', 'Unknown input type encountered', {
      type,
    });

    const mappedType = this.intelligentTypeMapper(type);
    const component = this.registry.get(mappedType) || this.getFallback();

    logger.info('dynamic_questions.input_type.mapped', 'Mapped unknown type to known type', {
      originalType: type,
      mappedType,
      usedFallback: !this.registry.has(mappedType),
    });

    return {
      component,
      mapped: true,
      mappedFrom: type,
      mappedTo: mappedType,
    };
  }

  /**
   * Intelligent type mapping for unknown types
   * Maps similar type names to known types
   */
  private intelligentTypeMapper(unknownType: string): string {
    const lowerType = unknownType.toLowerCase().replace(/[-_\s]/g, '');

    // Exact mappings
    const exactMappings: Record<string, string> = {
      datetime: 'date',
      time: 'text',
      file: 'text',
      upload: 'text',
      richtext: 'textarea',
      wysiwyg: 'textarea',
      longtext: 'textarea',
      dropdown: 'select',
      combobox: 'select',
      autocomplete: 'select',
      checklist: 'checkbox_pills',
      checkboxes: 'checkbox_pills',
      checkboxgroup: 'checkbox_pills',
      radiogroup: 'radio_pills',
      radios: 'radio_pills',
      radiooptions: 'radio_pills',
      rating: 'scale',
      stars: 'scale',
      range: 'labeled_slider',
      boolean: 'toggle_switch',
      switch: 'toggle_switch',
      yesno: 'toggle_switch',
      money: 'currency',
      price: 'currency',
      amount: 'currency',
      count: 'number_spinner',
      quantity: 'number_spinner',
      spinner: 'number_spinner',
      integer: 'number',
      decimal: 'number',
      float: 'number',
      emailaddress: 'email',
      mail: 'email',
      link: 'url',
      website: 'url',
      datepicker: 'date',
      calendar: 'date',
    };

    if (exactMappings[lowerType]) {
      return exactMappings[lowerType];
    }

    // Pattern-based mappings
    if (lowerType.includes('text') || lowerType.includes('input')) {
      return lowerType.includes('long') ||
        lowerType.includes('multi') ||
        lowerType.includes('paragraph')
        ? 'textarea'
        : 'text';
    }

    if (
      lowerType.includes('select') ||
      lowerType.includes('choose') ||
      lowerType.includes('pick')
    ) {
      return lowerType.includes('multi') || lowerType.includes('multiple')
        ? 'checkbox_pills'
        : 'radio_pills';
    }

    if (
      lowerType.includes('scale') ||
      lowerType.includes('rating') ||
      lowerType.includes('score')
    ) {
      return lowerType.includes('enhanced') || lowerType.includes('labeled')
        ? 'enhanced_scale'
        : 'scale';
    }

    if (lowerType.includes('slide') || lowerType.includes('range')) {
      return 'labeled_slider';
    }

    if (lowerType.includes('number') || lowerType.includes('numeric')) {
      return lowerType.includes('spin') || lowerType.includes('step') ? 'number_spinner' : 'number';
    }

    if (
      lowerType.includes('date') ||
      lowerType.includes('time') ||
      lowerType.includes('calendar')
    ) {
      return 'date';
    }

    if (
      lowerType.includes('currency') ||
      lowerType.includes('money') ||
      lowerType.includes('price')
    ) {
      return 'currency';
    }

    if (lowerType.includes('email') || lowerType.includes('mail')) {
      return 'email';
    }

    if (lowerType.includes('url') || lowerType.includes('link') || lowerType.includes('web')) {
      return 'url';
    }

    if (
      lowerType.includes('toggle') ||
      lowerType.includes('switch') ||
      lowerType.includes('boolean')
    ) {
      return 'toggle_switch';
    }

    if (lowerType.includes('radio')) {
      return lowerType.includes('card') ? 'radio_cards' : 'radio_pills';
    }

    if (lowerType.includes('check')) {
      return lowerType.includes('card') ? 'checkbox_cards' : 'checkbox_pills';
    }

    // Ultimate fallback
    logger.warn(
      'dynamic_questions.input_type.unknown',
      'No intelligent mapping found, using fallback',
      {
        unknownType,
        fallbackType: this.fallbackType,
      }
    );

    return this.fallbackType;
  }

  /**
   * Batch register multiple types
   */
  registerBatch(types: Array<{ type: string; component: ComponentType<BaseInputProps> }>): void {
    for (const { type, component } of types) {
      this.register(type, component);
    }
  }

  /**
   * Clear all registrations
   */
  clear(): void {
    this.registry.clear();
  }

  /**
   * Get registry statistics
   */
  getStats(): {
    totalTypes: number;
    registeredTypes: string[];
    fallbackType: string;
  } {
    return {
      totalTypes: this.registry.size,
      registeredTypes: this.getAll(),
      fallbackType: this.fallbackType,
    };
  }
}

// Singleton instance
export const inputRegistry = new InputTypeRegistry();

// Export for testing
export { InputTypeRegistry };
