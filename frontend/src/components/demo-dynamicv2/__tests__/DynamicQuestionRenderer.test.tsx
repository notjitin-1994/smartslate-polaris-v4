/**
 * Component Tests: DynamicQuestionRenderer
 *
 * Focused test coverage for the dynamic question renderer component:
 * - All 15 input types render correctly
 * - onChange callbacks fire with correct values
 * - Core validation logic works
 * - Error handling for malformed questions
 * - Legacy data format compatibility
 *
 * Note: These tests focus on user-visible behavior rather than implementation details
 * to maintain test stability across refactoring.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { DynamicQuestionRenderer } from '../DynamicQuestionRenderer';

// Define Question type locally
interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

interface ScaleConfig {
  min: number;
  max: number;
  minLabel?: string;
  maxLabel?: string;
  labels?: string[];
  step?: number;
}

interface SliderConfig {
  min: number;
  max: number;
  step: number;
  unit: string;
}

interface ValidationRule {
  rule: string;
  value?: string | number | boolean;
  message: string;
}

interface CurrencyConfig {
  symbol?: string;
  placeholder?: string;
}

interface NumberConfig {
  min?: number;
  max?: number;
  step?: number;
}

interface Question {
  id: string;
  label: string;
  type: string;
  required?: boolean;
  helpText?: string;
  placeholder?: string;
  options?: QuestionOption[];
  scaleConfig?: ScaleConfig;
  sliderConfig?: SliderConfig;
  validation?: ValidationRule[];
  currencyConfig?: CurrencyConfig;
  numberConfig?: NumberConfig;
}

describe('DynamicQuestionRenderer', () => {
  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // INPUT TYPE RENDERING TESTS
  // ============================================================================

  describe('Input Type Rendering', () => {
    it('should render radio_pills input type', () => {
      const question: Question = {
        id: 'radio-1',
        label: 'Select option',
        type: 'radio_pills',
        options: [
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={undefined}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Select option')).toBeInTheDocument();
      expect(screen.getByText('Option A')).toBeInTheDocument();
      expect(screen.getByText('Option B')).toBeInTheDocument();
    });

    it('should render checkbox_pills input type', () => {
      const question: Question = {
        id: 'checkbox-1',
        label: 'Select multiple',
        type: 'checkbox_pills',
        options: [
          { label: 'Item 1', value: '1' },
          { label: 'Item 2', value: '2' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={[]}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Select multiple')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('should render radio_cards input type', () => {
      const question: Question = {
        id: 'radio-cards-1',
        label: 'Choose card',
        type: 'radio_cards',
        options: [
          { label: 'Card A', value: 'a', description: 'Description A' },
          { label: 'Card B', value: 'b', description: 'Description B' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={undefined}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Choose card')).toBeInTheDocument();
      expect(screen.getByText('Card A')).toBeInTheDocument();
      expect(screen.getByText('Description A')).toBeInTheDocument();
    });

    it('should render checkbox_cards input type', () => {
      const question: Question = {
        id: 'checkbox-cards-1',
        label: 'Select cards',
        type: 'checkbox_cards',
        options: [{ label: 'Feature 1', value: '1', description: 'Desc 1' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={[]}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Select cards')).toBeInTheDocument();
      expect(screen.getByText('Feature 1')).toBeInTheDocument();
    });

    it('should render toggle_switch input type', () => {
      const question: Question = {
        id: 'toggle-1',
        label: 'Enable feature',
        type: 'toggle_switch',
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={undefined}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enable feature')).toBeInTheDocument();
    });

    it('should render scale input type', () => {
      const question: Question = {
        id: 'scale-1',
        label: 'Rate experience',
        type: 'scale',
        scaleConfig: {
          min: 1,
          max: 5,
          step: 1,
          minLabel: 'Poor',
          maxLabel: 'Excellent',
        },
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={3}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Rate experience')).toBeInTheDocument();
      expect(screen.getByText('Poor')).toBeInTheDocument();
      expect(screen.getByText('Excellent')).toBeInTheDocument();
    });

    it('should render enhanced_scale input type', () => {
      const question: Question = {
        id: 'enhanced-scale-1',
        label: 'Satisfaction',
        type: 'enhanced_scale',
        scaleConfig: {
          min: 1,
          max: 5,
          step: 1,
          labels: ['😞', '😕', '😐', '🙂', '😄'],
        },
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={3}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Satisfaction')).toBeInTheDocument();
      // Shows current value emoji (value=3 corresponds to middle emoji)
      expect(screen.getByText('😐')).toBeInTheDocument();
    });

    it('should render labeled_slider input type', () => {
      const question: Question = {
        id: 'slider-1',
        label: 'Set budget',
        type: 'labeled_slider',
        sliderConfig: {
          min: 0,
          max: 10000,
          step: 100,
          unit: '$',
        },
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={5000}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Set budget')).toBeInTheDocument();
    });

    it('should render textarea input type', () => {
      const question: Question = {
        id: 'textarea-1',
        label: 'Enter description',
        type: 'textarea',
        placeholder: 'Type here...',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enter description')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Type here...')).toBeInTheDocument();
    });

    it('should render text input type', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Enter name',
        type: 'text',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enter name')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'text');
    });

    it('should render email input type', () => {
      const question: Question = {
        id: 'email-1',
        label: 'Enter email',
        type: 'email',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enter email')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'email');
    });

    it('should render url input type', () => {
      const question: Question = {
        id: 'url-1',
        label: 'Enter URL',
        type: 'url',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enter URL')).toBeInTheDocument();
      const input = screen.getByRole('textbox');
      expect(input).toHaveAttribute('type', 'url');
    });

    it('should render currency input type', () => {
      const question: Question = {
        id: 'currency-1',
        label: 'Enter amount',
        type: 'currency',
        currencyConfig: {
          symbol: '$',
          placeholder: '0.00',
        },
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Enter amount')).toBeInTheDocument();
      expect(screen.getByText('$')).toBeInTheDocument();
    });

    it('should render number_spinner input type', () => {
      const question: Question = {
        id: 'number-1',
        label: 'Select quantity',
        type: 'number_spinner',
        numberConfig: {
          min: 1,
          max: 10,
          step: 1,
        },
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={5}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Select quantity')).toBeInTheDocument();
      const input = screen.getByDisplayValue('5');
      expect(input).toHaveAttribute('type', 'number');
    });

    it('should render date input type', () => {
      const question: Question = {
        id: 'date-1',
        label: 'Select date',
        type: 'date',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText('Select date')).toBeInTheDocument();
      // Date inputs are rendered but don't have explicit labels in the HTML
      const input = document.querySelector('input[type="date"]');
      expect(input).toBeInTheDocument();
    });
  });

  // ============================================================================
  // ONCHANGE CALLBACK TESTS
  // ============================================================================

  describe('onChange Callbacks', () => {
    it('should fire onChange for radio_pills selection', async () => {
      const user = userEvent.setup();
      const question: Question = {
        id: 'radio-1',
        label: 'Select',
        type: 'radio_pills',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={undefined}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      await user.click(screen.getByText('A'));
      expect(mockOnChange).toHaveBeenCalledWith('a');
    });

    it('should fire onChange for checkbox_pills selection', async () => {
      const user = userEvent.setup();
      const question: Question = {
        id: 'checkbox-1',
        label: 'Select',
        type: 'checkbox_pills',
        options: [{ label: 'A', value: 'a' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={[]}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      await user.click(screen.getByText('A'));
      expect(mockOnChange).toHaveBeenCalledWith(['a']);
    });

    it('should fire onChange for text input', async () => {
      const user = userEvent.setup();
      const question: Question = {
        id: 'text-1',
        label: 'Name',
        type: 'text',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByRole('textbox');
      await user.type(input, 'John');
      expect(mockOnChange).toHaveBeenCalled();
    });

    it('should allow checkbox deselection', async () => {
      const user = userEvent.setup();
      const question: Question = {
        id: 'checkbox-1',
        label: 'Select',
        type: 'checkbox_pills',
        options: [
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' },
        ],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={['a', 'b']}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      await user.click(screen.getByText('A'));
      expect(mockOnChange).toHaveBeenCalledWith(['b']);
    });
  });

  // ============================================================================
  // VALIDATION TESTS
  // ============================================================================

  describe('Validation', () => {
    it('should show required field error when touched', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Required field',
        type: 'text',
        required: true,
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={true}
        />
      );

      expect(screen.getByText('This field is required')).toBeInTheDocument();
    });

    it('should not show validation error before field is touched', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Required field',
        type: 'text',
        required: true,
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={false}
        />
      );

      expect(screen.queryByText('This field is required')).not.toBeInTheDocument();
    });

    it('should validate minLength rule', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Text',
        type: 'text',
        validation: [{ rule: 'minLength', value: 5, message: 'Min 5 chars' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value="abc"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={true}
        />
      );

      expect(screen.getByText('Min 5 chars')).toBeInTheDocument();
    });

    it('should validate maxLength rule', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Text',
        type: 'text',
        validation: [{ rule: 'maxLength', value: 5, message: 'Max 5 chars' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value="toolong"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={true}
        />
      );

      expect(screen.getByText('Max 5 chars')).toBeInTheDocument();
    });

    it('should validate email format', () => {
      const question: Question = {
        id: 'email-1',
        label: 'Email',
        type: 'email',
        validation: [{ rule: 'email', message: 'Invalid email' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value="not-an-email"
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={true}
        />
      );

      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });

    it('should call onBlur when field loses focus', async () => {
      const user = userEvent.setup();
      const question: Question = {
        id: 'text-1',
        label: 'Text',
        type: 'text',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByRole('textbox');
      await user.click(input);
      await user.tab();

      expect(mockOnBlur).toHaveBeenCalled();
    });
  });

  // ============================================================================
  // ERROR HANDLING TESTS
  // ============================================================================

  describe('Error Handling', () => {
    it('should show error for missing question ID', () => {
      const invalidQuestion = {
        label: 'Question',
        type: 'text',
      } as Question;

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText(/Unable to render this question/i)).toBeInTheDocument();
    });

    it('should show error for missing options in selection type', () => {
      const invalidQuestion: Question = {
        id: 'radio-1',
        label: 'Select',
        type: 'radio_pills',
        // Missing options
      };

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText(/Unable to render this question/i)).toBeInTheDocument();
    });

    it('should show error for toggle_switch without exactly 2 options', () => {
      const invalidQuestion: Question = {
        id: 'toggle-1',
        label: 'Toggle',
        type: 'toggle_switch',
        options: [{ label: 'Yes', value: 'yes' }], // Only 1 option
      };

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText(/Unable to render this question/i)).toBeInTheDocument();
    });

    it('should show error for scale without scaleConfig', () => {
      const invalidQuestion: Question = {
        id: 'scale-1',
        label: 'Scale',
        type: 'scale',
        // Missing scaleConfig
      };

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion as any}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText(/Unable to render this question/i)).toBeInTheDocument();
    });

    it('should show error for labeled_slider without sliderConfig', () => {
      const invalidQuestion: Question = {
        id: 'slider-1',
        label: 'Slider',
        type: 'labeled_slider',
        // Missing sliderConfig
      };

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion as any}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      expect(screen.getByText(/Unable to render this question/i)).toBeInTheDocument();
    });

    it('should show error for unsupported question type', () => {
      const invalidQuestion = {
        id: 'unknown-1',
        label: 'Question',
        type: 'unsupported_type',
      } as Question;

      render(
        <DynamicQuestionRenderer
          question={invalidQuestion}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      // Component shows inline error for unsupported types
      expect(screen.getByText(/Unsupported question type/i)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle null value gracefully', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Text',
        type: 'text',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={null as any}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should handle undefined value gracefully', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Text',
        type: 'text',
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value={undefined}
          onChange={mockOnChange}
          onBlur={mockOnBlur}
        />
      );

      const input = screen.getByRole('textbox');
      expect(input).toHaveValue('');
    });

    it('should skip validation for empty optional fields', () => {
      const question: Question = {
        id: 'text-1',
        label: 'Optional',
        type: 'text',
        required: false,
        validation: [{ rule: 'minLength', value: 5, message: 'Min 5 chars' }],
      };

      render(
        <DynamicQuestionRenderer
          question={question}
          value=""
          onChange={mockOnChange}
          onBlur={mockOnBlur}
          touched={true}
        />
      );

      // Should not show minLength error for empty optional field
      expect(screen.queryByText('Min 5 chars')).not.toBeInTheDocument();
    });
  });
});
