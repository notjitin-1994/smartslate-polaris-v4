import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';
import { DarkModeToggle } from '@/components/theme/DarkModeToggle';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock component to test useTheme hook
function TestComponent() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <button data-testid="set-light" onClick={() => setTheme('light')}>
        Set Light
      </button>
      <button data-testid="set-dark" onClick={() => setTheme('dark')}>
        Set Dark
      </button>
    </div>
  );
}

describe('Theme System', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear document classes
    document.documentElement.className = '';
  });

  describe('ThemeProvider', () => {
    it('should provide dark theme as default', () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should load theme from localStorage if available', () => {
      localStorageMock.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });

    it('should ignore invalid theme values from localStorage', () => {
      localStorageMock.getItem.mockReturnValue('system');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should fallback to default dark theme
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
    });

    it('should apply correct CSS class to document element', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Wait for theme to be applied
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });
    });

    it('should switch themes correctly', async () => {
      localStorageMock.getItem.mockReturnValue(null);

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Initially dark
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('dark');
      });

      // Switch to light
      fireEvent.click(screen.getByTestId('set-light'));

      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('smartslate-theme', 'light');

      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('dark');
        expect(document.documentElement).toHaveClass('light');
      });

      // Switch back to dark
      fireEvent.click(screen.getByTestId('set-dark'));

      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      expect(localStorageMock.setItem).toHaveBeenCalledWith('smartslate-theme', 'dark');

      await waitFor(() => {
        expect(document.documentElement).not.toHaveClass('light');
        expect(document.documentElement).toHaveClass('dark');
      });
    });

    it('should throw error when useTheme is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        render(<TestComponent />);
      }).toThrow('useTheme must be used within ThemeProvider');

      consoleSpy.mockRestore();
    });
  });

  describe('DarkModeToggle', () => {
    it('should render correctly for dark theme', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <DarkModeToggle />
        </ThemeProvider>
      );

      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle theme.*dark/i)).toBeInTheDocument();
    });

    it('should render correctly for light theme', () => {
      localStorageMock.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <DarkModeToggle />
        </ThemeProvider>
      );

      expect(screen.getByText('Light')).toBeInTheDocument();
      expect(screen.getByLabelText(/toggle theme.*light/i)).toBeInTheDocument();
    });

    it('should toggle theme when clicked', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <DarkModeToggle />
          <TestComponent />
        </ThemeProvider>
      );

      // Initially dark
      expect(screen.getByText('Dark')).toBeInTheDocument();
      expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');

      // Click to toggle to light
      fireEvent.click(screen.getByRole('button', { name: /toggle theme.*dark/i }));

      await waitFor(() => {
        expect(screen.getByText('Light')).toBeInTheDocument();
        expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
      });

      // Click to toggle back to dark
      fireEvent.click(screen.getByRole('button', { name: /toggle theme.*light/i }));

      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument();
        expect(screen.getByTestId('current-theme')).toHaveTextContent('dark');
      });
    });

    it('should handle hydration correctly', async () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <DarkModeToggle />
        </ThemeProvider>
      );

      // The component should eventually show the correct theme after mounting
      await waitFor(() => {
        expect(screen.getByText('Dark')).toBeInTheDocument();
      });

      expect(screen.getByRole('button')).toBeInTheDocument();
    });

    it('should apply correct classes', () => {
      localStorageMock.getItem.mockReturnValue('dark');

      render(
        <ThemeProvider>
          <DarkModeToggle className="custom-class" />
        </ThemeProvider>
      );

      const button = screen.getByRole('button');
      expect(button).toHaveClass('glass', 'custom-class');
      expect(button).toHaveClass('hover:glass-strong');
      expect(button).toHaveClass('focus-visible:ring-primary/50');
    });
  });

  describe('CSS Variables and Classes', () => {
    it('should not interfere with system preferences', () => {
      // Our implementation should not rely on system preferences
      const mockMatchMedia = vi.fn(() => ({
        matches: true, // System prefers dark
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: mockMatchMedia,
      });

      localStorageMock.getItem.mockReturnValue('light');

      render(
        <ThemeProvider>
          <TestComponent />
        </ThemeProvider>
      );

      // Should still use light theme despite system preference for dark
      expect(screen.getByTestId('current-theme')).toHaveTextContent('light');
    });
  });
});
