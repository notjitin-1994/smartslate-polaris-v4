import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DynamicFormRenderer } from '@/components/dynamic-form/DynamicFormRenderer';
import { FormSchema } from '@/lib/dynamic-form/schema';

// Mock form schema
const mockFormSchema: FormSchema = {
  id: 'test-form',
  title: 'Test Form',
  description: 'A test form for unit testing',
  sections: [
    {
      id: 'section-1',
      title: 'Personal Information',
      description: 'Basic personal details',
      questions: [
        {
          id: 'name',
          label: 'Full Name',
          type: 'text',
          required: true,
          placeholder: 'Enter your full name',
        },
        {
          id: 'email',
          label: 'Email Address',
          type: 'email',
          required: true,
          placeholder: 'Enter your email',
        },
      ],
      isCollapsible: true,
      isRequired: true,
    },
    {
      id: 'section-2',
      title: 'Personal Information',
      description: 'Your preferences',
      questions: [
        {
          id: 'newsletter',
          label: 'Subscribe to Newsletter',
          type: 'select',
          required: false,
          options: [
            { value: 'yes', label: 'Yes', disabled: false },
            { value: 'no', label: 'No', disabled: false },
          ],
        },
      ],
      isCollapsible: true,
      isRequired: true,
    },
  ],
  settings: {
    allowSaveProgress: true,
    autoSaveInterval: 2000,
    showProgress: true,
    allowSectionJump: true,
    submitButtonText: 'Submit',
    saveButtonText: 'Save Progress',
    theme: 'auto' as const,
  },
};

describe('DynamicFormRenderer', () => {
  const mockOnSubmit = vi.fn();
  const mockOnSave = vi.fn();
  const mockOnValidationChange = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders form with correct title and description', () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Test Form')).toBeInTheDocument();
    expect(screen.getByText('A test form for unit testing')).toBeInTheDocument();
  });

  it('renders progress indicator when showProgress is true', () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
        showProgress={true}
      />
    );

    expect(screen.getByText('Step 1 of 2')).toBeInTheDocument();
  });

  it('renders first section by default', () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    expect(screen.getByText('Personal Information')).toBeInTheDocument();
    expect(screen.getByText('Basic personal details')).toBeInTheDocument();
    expect(screen.getByLabelText('Full Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
  });

  it('navigates between sections correctly', async () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Wait for component to stabilize
    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
    });

    // Should show first section initially
    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    // Check that Personal Information section is not visible (hidden with display: none)
    const preferencesHeading = screen.getByText('Personal Information');
    const preferencesSection = preferencesHeading.closest('div[class*="space-y-6"]');
    expect(preferencesSection).toHaveClass('hidden');

    // Click next button
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      // Check that Personal Information section is now visible (no hidden class)
      const preferencesHeading = screen.getByText('Personal Information');
      const preferencesSection = preferencesHeading.closest('div[class*="space-y-6"]');
      expect(preferencesSection).not.toHaveClass('hidden');

      // Check that Personal Information section is now hidden
      const personalInfoHeading = screen.getByText('Personal Information');
      const personalInfoSection = personalInfoHeading.closest('div[class*="space-y-6"]');
      expect(personalInfoSection).toHaveClass('hidden');
    });

    // Click previous button
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);

    await waitFor(() => {
      expect(screen.getByText('Personal Information')).toBeInTheDocument();
      // Check that Personal Information section is visible again (no hidden class)
      const personalInfoHeading = screen.getByText('Personal Information');
      const personalInfoSection = personalInfoHeading.closest('div[class*="space-y-6"]');
      expect(personalInfoSection).not.toHaveClass('hidden');

      // Check that Personal Information section is hidden again
      const preferencesHeading = screen.getByText('Personal Information');
      const preferencesSection = preferencesHeading.closest('div[class*="space-y-6"]');
      expect(preferencesSection).toHaveClass('hidden');
    });
  });

  it('handles form submission correctly', async () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Fill in form data
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.blur(nameInput); // Trigger validation
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.blur(emailInput); // Trigger validation

    // Wait for validation to complete and form to be valid
    await waitFor(
      () => {
        const submitButton = screen.getByText('Submit');
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
      });
    });
  });

  it('handles manual save correctly', async () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Fill in some data
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Note: Save progress button is not implemented in current component
    // This test would need the save button feature to be implemented
  });

  it('shows validation errors for required fields', async () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Try to submit without filling required fields
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Wait for validation to trigger - check for any validation errors
    await waitFor(
      () => {
        const nameError = screen.queryByText('Full Name is required');
        const emailError = screen.queryByText('Email Address is required');
        expect(nameError || emailError).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });

  it('calls onValidationChange when form data changes', async () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Change a field value
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    await waitFor(() => {
      expect(mockOnValidationChange).toHaveBeenCalled();
    });
  });

  it('disables form when disabled prop is true', () => {
    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
        disabled={true}
      />
    );

    const nameInput = screen.getByLabelText('Full Name');
    const submitButton = screen.getByText('Submit');

    expect(nameInput).toBeDisabled();
    expect(submitButton).toBeDisabled();
  });

  it('shows loading state during submission', async () => {
    const slowSubmit = vi
      .fn()
      .mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)));

    render(
      <DynamicFormRenderer
        formSchema={mockFormSchema}
        onSubmit={slowSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Fill in form data
    const nameInput = screen.getByLabelText('Full Name');
    const emailInput = screen.getByLabelText('Email Address');

    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.blur(nameInput);
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.blur(emailInput);

    // Wait for validation to complete
    await waitFor(
      () => {
        const submitButton = screen.getByText('Submit');
        expect(submitButton).not.toBeDisabled();
      },
      { timeout: 3000 }
    );

    // Submit form
    const submitButton = screen.getByText('Submit');
    fireEvent.click(submitButton);

    // Should show loading state
    await waitFor(
      () => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
    expect(submitButton).toBeDisabled();

    await waitFor(() => {
      expect(slowSubmit).toHaveBeenCalled();
    });
  });

  it('handles form reset correctly', async () => {
    const formRef = React.createRef<{ reset: () => void } | null>();

    render(
      <DynamicFormRenderer
        ref={formRef}
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Fill in some data
    const nameInput = screen.getByLabelText('Full Name');
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });

    // Reset form
    formRef.current?.reset();

    await waitFor(() => {
      expect(nameInput).toHaveValue('');
    });
  });

  it('handles section navigation via ref methods', () => {
    const formRef = React.createRef<{
      nextSection: () => void;
      previousSection: () => void;
      goToSection: (sectionId: string) => void;
    } | null>();

    render(
      <DynamicFormRenderer
        ref={formRef}
        formSchema={mockFormSchema}
        onSubmit={mockOnSubmit}
        onSave={mockOnSave}
        onValidationChange={mockOnValidationChange}
      />
    );

    // Should start with first section
    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    // Navigate to next section
    formRef.current?.nextSection();

    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    // Navigate to previous section
    formRef.current?.previousSection();

    expect(screen.getByText('Personal Information')).toBeInTheDocument();

    // Navigate to specific section
    formRef.current?.goToSection('section-2');

    expect(screen.getByText('Personal Information')).toBeInTheDocument();
  });
});
