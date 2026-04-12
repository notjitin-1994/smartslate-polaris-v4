import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DiscoveryClient } from '../DiscoveryClient';
import { useDiscovery } from '@/hooks/useDiscovery';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';

// Mock hooks
vi.mock('@/hooks/useDiscovery', () => ({
  useDiscovery: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQuery: vi.fn(),
  useQueryClient: vi.fn(() => ({
    invalidateQueries: vi.fn(),
  })),
}));

vi.mock('next/navigation', () => ({
  useParams: vi.fn(),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    channel: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn(),
    })),
    removeChannel: vi.fn(),
  })),
}));

describe('DiscoveryClient', () => {
  const mockStarmap = {
    id: 's1',
    title: 'Test Starmap',
    status: 'draft',
    context: {},
    blueprint: null,
    starmapResponses: [],
  };

  it('renders initial messages correctly', () => {
    const mockMessages = [
      { id: 'm1', role: 'user', parts: [{ type: 'text', text: 'Hello Polaris' }] },
      { id: 'm2', role: 'assistant', parts: [{ type: 'text', text: 'Hello User' }] },
    ];

    (useDiscovery as any).mockReturnValue({
      messages: mockMessages,
      sendMessage: vi.fn(),
      isLoading: false,
      currentStage: 1,
    });

    (useQuery as any).mockReturnValue({ data: mockStarmap });
    (useParams as any).mockReturnValue({ id: 's1' });

    render(<DiscoveryClient initialStarmap={mockStarmap as any} initialMessages={mockMessages as any} />);

    expect(screen.getByText('Hello Polaris')).toBeDefined();
    expect(screen.getByText('Hello User')).toBeDefined();
  });

  it('shows empty state when no messages', () => {
    (useDiscovery as any).mockReturnValue({
      messages: [],
      sendMessage: vi.fn(),
      isLoading: false,
      currentStage: 1,
    });

    (useQuery as any).mockReturnValue({ data: mockStarmap });
    (useParams as any).mockReturnValue({ id: 's1' });

    render(<DiscoveryClient initialStarmap={mockStarmap as any} initialMessages={[]} />);

    expect(screen.getByText('Initiate Discovery')).toBeDefined();
  });
});
