import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FinalizationPanel } from '../FinalizationPanel';
import { experimental_useObject as useObject } from '@ai-sdk/react';

// Mock the AI SDK useObject hook
vi.mock('@ai-sdk/react', () => ({
  experimental_useObject: vi.fn(),
}));

// Mock Lucide icons to avoid rendering issues in tests
vi.mock('lucide-react', () => ({
  Check: () => <div data-testid="check-icon" />,
  Edit2: () => <div data-testid="edit-icon" />,
  Sparkles: () => <div data-testid="sparkles-icon" />,
  AlertTriangle: () => <div data-testid="alert-icon" />,
  FileText: () => <div data-testid="file-icon" />,
  Download: () => <div data-testid="download-icon" />,
  Loader2: () => <div data-testid="loader-icon" />,
}));

describe('FinalizationPanel Workflow', () => {
  const mockSubmitAssumptions = vi.fn();
  const mockSubmitBlueprint = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementation for useObject
    (useObject as any).mockImplementation(({ api }: { api: string }) => {
      if (api.includes('assumptions')) {
        return {
          object: null,
          submit: mockSubmitAssumptions,
          isLoading: false,
        };
      }
      if (api.includes('blueprint')) {
        return {
          object: null,
          submit: mockSubmitBlueprint,
          isLoading: false,
        };
      }
      return { object: null, submit: vi.fn(), isLoading: false };
    });
  });

  it('starts by triggering assumptions generation', async () => {
    render(<FinalizationPanel starmapId="test-id" />);
    
    // It should call submit for assumptions on mount
    expect(mockSubmitAssumptions).toHaveBeenCalled();
  });

  it('displays assumptions when generated', async () => {
    const mockAssumptions = {
      assumptions: [
        { category: 'Tech', statement: 'Use React', riskLevel: 'low' },
        { category: 'Audience', statement: 'Beginners', riskLevel: 'medium' }
      ]
    };

    (useObject as any).mockImplementation(({ api }: { api: string }) => {
      if (api.includes('assumptions')) {
        return {
          object: mockAssumptions,
          submit: mockSubmitAssumptions,
          isLoading: false,
        };
      }
      return { object: null, submit: mockSubmitBlueprint, isLoading: false };
    });

    render(<FinalizationPanel starmapId="test-id" />);

    expect(screen.getByText(/Critical Assumptions Review/i)).toBeDefined();
    expect(screen.getByText('Use React')).toBeDefined();
    expect(screen.getByText('Beginners')).toBeDefined();
  });

  it('transitions to blueprint generation after approving assumptions', async () => {
    const mockAssumptions = {
      assumptions: [{ category: 'Tech', statement: 'Use React', riskLevel: 'low' }]
    };

    (useObject as any).mockImplementation(({ api }: { api: string }) => {
      if (api.includes('assumptions')) {
        return {
          object: mockAssumptions,
          submit: mockSubmitAssumptions,
          isLoading: false,
        };
      }
      return {
        object: null,
        submit: mockSubmitBlueprint,
        isLoading: false,
      };
    });

    render(<FinalizationPanel starmapId="test-id" />);

    const approveButton = screen.getByText(/Verify & Generate Blueprint/i);
    fireEvent.click(approveButton);

    expect(mockSubmitBlueprint).toHaveBeenCalledWith({
      approvedAssumptions: ['Use React']
    });
  });

  it('displays the final blueprint once generated', async () => {
    const mockBlueprint = {
      title: 'Test Strategy',
      executiveSummary: 'This is a summary',
      targetAudience: ['Developers'],
      learningObjectives: ['Learn Testing'],
      curriculumPath: [{ moduleName: 'Intro', description: 'Desc', deliveryFormat: 'Video' }],
      techStack: ['Vitest'],
      successMetrics: ['Pass rate'],
      risksAndMitigations: [{ risk: 'Bugs', mitigation: 'Tests' }]
    };

    (useObject as any).mockImplementation(({ api }: { api: string }) => {
      // Direct jump to blueprint step for this test
      return {
        object: mockBlueprint,
        submit: mockSubmitBlueprint,
        isLoading: false,
      };
    });

    // We pass initialBlueprint to simulate the final state
    render(<FinalizationPanel starmapId="test-id" initialBlueprint={mockBlueprint} />);

    // Check for title in the main content area (use getAllByText since it might appear in header and body)
    const titles = screen.getAllByText('Test Strategy');
    expect(titles.length).toBeGreaterThan(0);
    
    expect(screen.getByText('This is a summary')).toBeDefined();
    expect(screen.getByText('Vitest')).toBeDefined();
  });
});
