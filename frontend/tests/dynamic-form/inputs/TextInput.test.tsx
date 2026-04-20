import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TextInput } from '@/components/dynamic-form/inputs/TextInput';
import { TextQuestion } from '@/lib/dynamic-form/schema';

describe('TextInput', () => {
  const mockQuestion: TextQuestion = {
    id: 'test-text',
    label: 'Test Text Input',
    type: 'text',
    required: true,
    placeholder: 'Enter some text',
    helpText: 'This is a test input field',
  };

  const mockOnChange = vi.fn();
  const mockOnBlur = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with correct label and attributes', () => {
    render(
      <TextInput question={mockQuestion} value="" onChange={mockOnChange} onBlur={mockOnBlur} />
    );

    expect(screen.getByLabelText('Test Text Input')).toBeInTheDocument();
    expect(screen.getByText('This is a test input field')).toBeInTheDocument();
    expect(screen.getByText('*')).toBeInTheDocument(); // Required indicator
  });

  it('handles value changes correctly', () => {
    render(
      <TextInput question={mockQuestion} value="" onChange={mockOnChange} onBlur={mockOnBlur} />
    );

    const input = screen.getByLabelText('Test Text Input');
    fireEvent.change(input, { target: { value: 'Hello World' } });

    expect(mockOnChange).toHaveBeenCalledWith('Hello World');
  });

  it('handles blur events correctly', () => {
    render(
      <TextInput question={mockQuestion} value="" onChange={mockOnChange} onBlur={mockOnBlur} />
    );

    const input = screen.getByLabelText('Test Text Input');
    fireEvent.blur(input);

    expect(mockOnBlur).toHaveBeenCalled();
  });

  it('shows error message when provided', () => {
    render(
      <TextInput
        question={mockQuestion}
        value=""
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        error="This field is required"
      />
    );

    expect(screen.getByText('This field is required')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Text Input')).toHaveAttribute('aria-invalid', 'true');
  });

  it('disables input when disabled prop is true', () => {
    render(
      <TextInput
        question={mockQuestion}
        value=""
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        disabled={true}
      />
    );

    const input = screen.getByLabelText('Test Text Input');
    expect(input).toBeDisabled();
  });

  it('shows character count when maxLength is provided', () => {
    const questionWithMaxLength: TextQuestion = {
      ...mockQuestion,
      maxLength: 50,
    };

    render(
      <TextInput
        question={questionWithMaxLength}
        value="Hello"
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(screen.getByText('5 / 50 characters')).toBeInTheDocument();
  });

  it('handles non-text question gracefully', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    const nonTextQuestion = {
      ...mockQuestion,
      type: 'select' as const,
    };

    render(
      <TextInput
        question={nonTextQuestion as unknown}
        value=""
        onChange={mockOnChange}
        onBlur={mockOnBlur}
      />
    );

    expect(consoleSpy).toHaveBeenCalledWith(
      'TextInput received non-text question:',
      nonTextQuestion
    );
    expect(screen.queryByLabelText('Test Text Input')).not.toBeInTheDocument();

    consoleSpy.mockRestore();
  });

  it('applies custom className correctly', () => {
    render(
      <TextInput
        question={mockQuestion}
        value=""
        onChange={mockOnChange}
        onBlur={mockOnBlur}
        className="custom-class"
      />
    );

    const wrapper = screen.getByLabelText('Test Text Input').closest('.space-y-2');
    expect(wrapper).toHaveClass('custom-class');
  });

  it('shows placeholder text correctly', () => {
    render(
      <TextInput question={mockQuestion} value="" onChange={mockOnChange} onBlur={mockOnBlur} />
    );

    const input = screen.getByLabelText('Test Text Input');
    expect(input).toHaveAttribute('placeholder', 'Enter some text');
  });

  it('handles empty value correctly', () => {
    render(
      <TextInput question={mockQuestion} value={null} onChange={mockOnChange} onBlur={mockOnBlur} />
    );

    const input = screen.getByLabelText('Test Text Input');
    expect(input).toHaveValue('');
  });
});
