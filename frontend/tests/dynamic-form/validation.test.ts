import { describe, it, expect } from 'vitest';
import {
  createValidationEngine,
  validateFormData,
  validateField,
} from '@/lib/dynamic-form/validation';
import { FormSchema } from '@/lib/dynamic-form/schema';

describe('Validation Engine', () => {
  const mockFormSchema: FormSchema = {
    id: 'test-form',
    title: 'Test Form',
    sections: [
      {
        id: 'section-1',
        title: 'Test Section',
        questions: [
          {
            id: 'required-text',
            label: 'Required Text',
            type: 'text',
            required: true,
            validation: [
              { type: 'minLength', value: 3, message: 'Minimum 3 characters' },
              { type: 'maxLength', value: 50, message: 'Maximum 50 characters' },
            ],
          },
          {
            id: 'email-field',
            label: 'Email',
            type: 'email',
            required: true,
          },
          {
            id: 'optional-number',
            label: 'Age',
            type: 'number',
            required: false,
            validation: [
              { type: 'min', value: 0, message: 'Age must be positive' },
              { type: 'max', value: 120, message: 'Age must be realistic' },
            ],
          },
          {
            id: 'select-field',
            label: 'Country',
            type: 'select',
            required: true,
            options: [
              { value: 'us', label: 'United States' },
              { value: 'ca', label: 'Canada' },
              { value: 'uk', label: 'United Kingdom' },
            ],
          },
          {
            id: 'multiselect-field',
            label: 'Interests',
            type: 'multiselect',
            required: false,
            options: [
              { value: 'sports', label: 'Sports' },
              { value: 'music', label: 'Music' },
              { value: 'art', label: 'Art' },
            ],
            maxSelections: 2,
          },
          {
            id: 'scale-field',
            label: 'Rating',
            type: 'scale',
            required: true,
            scaleConfig: {
              min: 1,
              max: 5,
              minLabel: 'Poor',
              maxLabel: 'Excellent',
            },
          },
        ],
      },
    ],
  };

  describe('Field Validation', () => {
    it('validates required fields correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Empty required field
      expect(engine.validateField('required-text', '', {})).toBe('This field is required');

      // Filled required field
      expect(engine.validateField('required-text', 'Hello', {})).toBeNull();
    });

    it('validates min/max length correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Too short
      expect(engine.validateField('required-text', 'Hi', {})).toBe('Minimum 3 characters');

      // Too long
      expect(engine.validateField('required-text', 'A'.repeat(51), {})).toBe(
        'Maximum 50 characters'
      );

      // Valid length
      expect(engine.validateField('required-text', 'Hello World', {})).toBeNull();
    });

    it('validates email format correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Invalid email
      expect(engine.validateField('email-field', 'invalid-email', {})).toBe('Invalid email format');

      // Valid email
      expect(engine.validateField('email-field', 'test@example.com', {})).toBeNull();
    });

    it('validates number ranges correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Too low
      expect(engine.validateField('optional-number', -1, {})).toBe('Age must be positive');

      // Too high
      expect(engine.validateField('optional-number', 150, {})).toBe('Age must be realistic');

      // Valid number
      expect(engine.validateField('optional-number', 25, {})).toBeNull();
    });

    it('validates select options correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Invalid option
      expect(engine.validateField('select-field', 'invalid', {})).toBe('Invalid selection');

      // Valid option
      expect(engine.validateField('select-field', 'us', {})).toBeNull();
    });

    it('validates multiselect correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Too many selections
      expect(engine.validateField('multiselect-field', ['sports', 'music', 'art'], {})).toBe(
        'Maximum 2 selections allowed'
      );

      // Valid selections
      expect(engine.validateField('multiselect-field', ['sports', 'music'], {})).toBeNull();
    });

    it('validates scale values correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      // Out of range
      expect(engine.validateField('scale-field', 0, {})).toBe('Value must be between 1 and 5');
      expect(engine.validateField('scale-field', 6, {})).toBe('Value must be between 1 and 5');

      // Valid scale value
      expect(engine.validateField('scale-field', 3, {})).toBeNull();
    });
  });

  describe('Section Validation', () => {
    it('validates entire section correctly', () => {
      const engine = createValidationEngine(mockFormSchema);

      const formData = {
        'required-text': 'Hello',
        'email-field': 'test@example.com',
        'optional-number': 25,
        'select-field': 'us',
        'multiselect-field': ['sports'],
        'scale-field': 4,
      };

      const result = engine.validateSection('section-1', formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for invalid section data', () => {
      const engine = createValidationEngine(mockFormSchema);

      const formData = {
        'required-text': 'Hi', // Too short
        'email-field': 'invalid-email', // Invalid email
        'optional-number': -5, // Too low
        'select-field': 'invalid', // Invalid option
        'multiselect-field': ['sports', 'music', 'art'], // Too many
        'scale-field': 0, // Out of range
      };

      const result = engine.validateSection('section-1', formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Form Validation', () => {
    it('validates entire form correctly', () => {
      const formData = {
        'required-text': 'Hello World',
        'email-field': 'test@example.com',
        'optional-number': 25,
        'select-field': 'us',
        'multiselect-field': ['sports'],
        'scale-field': 4,
      };

      const result = validateFormData(mockFormSchema, formData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('returns errors for invalid form data', () => {
      const formData = {
        'required-text': 'Hi', // Too short
        'email-field': 'invalid-email', // Invalid email
        'optional-number': -5, // Too low
        'select-field': 'invalid', // Invalid option
        'multiselect-field': ['sports', 'music', 'art'], // Too many
        'scale-field': 0, // Out of range
      };

      const result = validateFormData(mockFormSchema, formData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Conditional Validation', () => {
    const conditionalFormSchema: FormSchema = {
      id: 'conditional-form',
      title: 'Conditional Form',
      sections: [
        {
          id: 'section-1',
          title: 'Test Section',
          questions: [
            {
              id: 'has-pet',
              label: 'Do you have a pet?',
              type: 'select',
              required: true,
              options: [
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ],
            },
            {
              id: 'pet-name',
              label: 'Pet Name',
              type: 'text',
              required: true,
              conditional: {
                field: 'has-pet',
                operator: 'equals',
                value: 'yes',
              },
            },
          ],
        },
      ],
    };

    it('validates conditional fields correctly', () => {
      const engine = createValidationEngine(conditionalFormSchema);

      // When condition is not met, field should not be validated
      const formData1 = { 'has-pet': 'no', 'pet-name': '' };
      expect(engine.validateField('pet-name', '', formData1)).toBeNull();

      // When condition is met, field should be validated
      const formData2 = { 'has-pet': 'yes', 'pet-name': '' };
      expect(engine.validateField('pet-name', '', formData2)).toBe('This field is required');
    });
  });

  describe('Utility Functions', () => {
    it('validates single field using utility function', () => {
      const formData = { 'required-text': 'Hello' };

      // Valid field
      expect(validateField(mockFormSchema, 'required-text', 'Hello', formData)).toBeNull();

      // Invalid field
      expect(validateField(mockFormSchema, 'required-text', 'Hi', formData)).toBe(
        'Minimum 3 characters'
      );
    });
  });
});
