/**
 * Component tests for Dynamic Questionnaire Page
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DynamicQuestionnairePage from '@/app/(auth)/dynamic-questionnaire/[blueprintId]/page';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useSearchParams: () => ({
    get: vi.fn(),
  }),
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'test-user-123' },
    isLoading: false,
  }),
}));

vi.mock('@/components/auth/ProtectedRoute', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/layout/StandardHeader', () => ({
  StandardHeader: ({ title }: { title?: string }) => <header>{title}</header>,
}));

vi.mock('@/components/demo-dynamicv2/DynamicQuestionRenderer', () => ({
  DynamicQuestionRenderer: ({ question, value, onChange }: any) => (
    <input
      data-testid={`question-${question.id}`}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      required={question.required}
    />
  ),
}));

vi.mock('@/components/demo-v2-questionnaire/QuestionnaireProgress', () => ({
  QuestionnaireProgress: () => <div>Progress Component</div>,
}));

vi.mock('@/components/demo-v2-questionnaire/QuestionnaireButton', () => ({
  QuestionnaireButton: ({ children, onClick, disabled, type, ...props }: any) => (
    <button onClick={onClick} disabled={disabled} type={type} {...props}>
      {children}
    </button>
  ),
}));

// Mock fetch
global.fetch = vi.fn();

describe('DynamicQuestionnairePage', () => {
  const mockBlueprintId = '550e8400-e29b-41d4-a716-446655440000';
  const mockSections = [
    {
      id: 's1',
      title: 'Learning Objectives',
      description: 'Define your learning goals',
      order: 1,
      questions: [
        {
          id: 's1_q1',
          label: 'What is your primary learning objective?',
          type: 'text',
          required: true,
          helpText: 'Be specific and measurable',
        },
        {
          id: 's1_q2',
          label: 'Select priority level',
          type: 'radio_pills',
          required: true,
          options: [
            { value: 'high', label: 'High' },
            { value: 'medium', label: 'Medium' },
            { value: 'low', label: 'Low' },
          ],
        },
      ],
    },
    {
      id: 's2',
      title: 'Target Audience',
      description: 'Define your learners',
      order: 2,
      questions: [
        {
          id: 's2_q1',
          label: 'Describe your audience',
          type: 'textarea',
          required: true,
        },
      ],
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        blueprintId: mockBlueprintId,
        sections: mockSections,
        existingAnswers: {},
        metadata: {
          totalQuestions: 3,
          sectionCount: 2,
        },
      }),
    });
  });

  it('should render loading state initially', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    expect(screen.getByText('Loading questionnaire...')).toBeInTheDocument();
  });

  it('should fetch and render dynamic questions', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    expect(screen.getByText('What is your primary learning objective?')).toBeInTheDocument();
    expect(screen.getByText('Be specific and measurable')).toBeInTheDocument();
  });

  it('should navigate to next section', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Target Audience')).toBeInTheDocument();
    });
  });

  it('should navigate to previous section', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    // Go to next section
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Target Audience')).toBeInTheDocument();
    });

    // Go back
    const previousButton = screen.getByText('← Previous');
    fireEvent.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });
  });

  it('should show submit button on last section', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    // Navigate to last section
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText('Submit Questionnaire →')).toBeInTheDocument();
    });
  });

  it('should have proper ARIA attributes', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    // Check progress bar ARIA
    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuenow');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');

    // Check navigation ARIA
    const nav = screen.getByRole('navigation', { name: 'Section navigation' });
    expect(nav).toBeInTheDocument();

    // Check required field markers
    const requiredMarkers = screen.getAllByLabelText('required');
    expect(requiredMarkers.length).toBeGreaterThan(0);
  });

  it('should update progress bar as sections are completed', async () => {
    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(screen.getByText('Learning Objectives')).toBeInTheDocument();
    });

    // Initial progress (section 1 of 2 = 50%)
    expect(screen.getByText('50%')).toBeInTheDocument();

    // Navigate to next section
    const nextButton = screen.getByText('Next →');
    fireEvent.click(nextButton);

    await waitFor(() => {
      // Second section progress (section 2 of 2 = 100%)
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('should handle fetch errors gracefully', async () => {
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Blueprint not found' }),
    });

    render(<DynamicQuestionnairePage params={Promise.resolve({ blueprintId: mockBlueprintId })} />);

    await waitFor(() => {
      expect(
        screen.getByText('Blueprint not found. Please start from the beginning.')
      ).toBeInTheDocument();
    });
  });
});
