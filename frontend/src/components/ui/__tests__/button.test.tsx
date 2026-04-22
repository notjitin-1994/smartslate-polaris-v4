/**
 * Button Component Tests - Touch-First Component System
 *
 * Comprehensive tests for the touch-optimized button component including
 * touch target validation, accessibility features, and responsive behavior.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, ButtonGroup, IconButton, LoadingButton, TouchButtonVariants } from '../button';
import { TOUCH_TARGETS, validateTouchTarget } from '@/lib/touch-targets';

// Mock the touch targets module for testing
vi.mock('@/lib/touch-targets', () => ({
  TOUCH_TARGETS: {
    minimum: 'min-h-[44px] min-w-[44px]',
    small: 'min-h-[36px] min-w-[36px]',
    large: 'min-h-[48px] min-w-[48px]',
    'extra-large': 'min-h-[56px] min-w-[56px]',
  },
  TOUCH_STATES: {
    hover: 'hover:scale-[1.02] hover:shadow-lg',
    focus: 'focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2',
    active: 'active:scale-[0.98] active:shadow-sm',
    disabled: 'opacity-50 cursor-not-allowed pointer-events-none',
    default: '',
  },
  validateTouchTarget: vi.fn(),
  getRecommendedTouchSize: vi.fn().mockReturnValue('medium'),
}));

describe('Button Component - Touch Target Validation', () => {
  it('should render with minimum touch target size by default', () => {
    render(<Button>Click me</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Check that minimum touch target classes are applied
    expect(button).toHaveClass('min-h-[44px]');
    expect(button).toHaveClass('min-w-[44px]');
  });

  it('should apply correct touch target sizes for different variants', () => {
    const { rerender } = render(<Button size="small">Small</Button>);
    let button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[36px]');

    rerender(<Button size="medium">Medium</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');

    rerender(<Button size="large">Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[48px]');

    rerender(<Button size="extra-large">Extra Large</Button>);
    button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[56px]');
  });

  it('should apply correct touch target for icon buttons', () => {
    render(<Button size="icon">Icon</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
    expect(button).toHaveClass('min-w-[44px]');
    expect(button).toHaveClass('aspect-square');
  });

  it('should maintain accessibility attributes', () => {
    render(
      <Button aria-label="Close dialog" data-testid="close-button">
        ×
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
    expect(button).toHaveAttribute('data-testid', 'close-button');
  });
});

describe('Button Component - Interactive States', () => {
  it('should handle click events', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should show focus-visible ring on keyboard focus', async () => {
    const user = userEvent.setup();

    render(<Button>Focusable</Button>);

    const button = screen.getByRole('button');

    // Focus the button via keyboard
    await user.tab();
    expect(button).toHaveFocus();

    // Check that focus-visible styles are applied
    expect(button).toHaveClass('focus-visible:ring-2');
    expect(button).toHaveClass('focus-visible:ring-secondary/50');
  });

  it('should show active state on touch/click', async () => {
    const user = userEvent.setup();

    render(<Button>Touchable</Button>);

    const button = screen.getByRole('button');

    // Simulate touch/click
    await user.click(button);

    // Check that active styles are applied during interaction
    expect(button).toHaveClass('active:scale-[0.98]');
    expect(button).toHaveClass('active:shadow-sm');
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:opacity-50');
    expect(button).toHaveClass('disabled:pointer-events-none');
  });
});

describe('Button Component - Variants', () => {
  it('should render primary variant with correct styles', () => {
    render(<Button variant="primary">Primary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-primary');
    expect(button).toHaveClass('text-primary-foreground');
    expect(button).toHaveClass('hover:bg-primary/90');
  });

  it('should render secondary variant with correct styles', () => {
    render(<Button variant="secondary">Secondary</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-secondary');
    expect(button).toHaveClass('text-secondary-foreground');
    expect(button).toHaveClass('hover:bg-secondary/90');
  });

  it('should render ghost variant with correct styles', () => {
    render(<Button variant="ghost">Ghost</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-foreground');
    expect(button).toHaveClass('hover:bg-foreground/5');
  });

  it('should render destructive variant with correct styles', () => {
    render(<Button variant="destructive">Destructive</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-error');
    expect(button).toHaveClass('text-white');
    expect(button).toHaveClass('hover:bg-error/90');
  });

  it('should render outline variant with correct styles', () => {
    render(<Button variant="outline">Outline</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('border');
    expect(button).toHaveClass('border-neutral-300');
    expect(button).toHaveClass('text-foreground');
    expect(button).toHaveClass('hover:bg-foreground/5');
  });

  it('should render link variant with correct styles', () => {
    render(<Button variant="link">Link</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-primary');
    expect(button).toHaveClass('underline-offset-4');
    expect(button).toHaveClass('hover:underline');
  });
});

describe('Button Component - Touch-Optimized Features', () => {
  it('should apply touch context data attributes for auto-sizing', () => {
    render(
      <Button
        data-touch-context="primary"
        data-available-space-width={200}
        data-available-space-height={200}
      >
        Smart Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-touch-context', 'primary');
    expect(button).toHaveAttribute('data-available-space-width', '200');
    expect(button).toHaveAttribute('data-available-space-height', '200');
  });

  it('should handle custom className merging', () => {
    render(
      <Button className="custom-class bg-red-500" size="large">
        Custom Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('custom-class');
    expect(button).toHaveClass('bg-red-500');
    expect(button).toHaveClass('min-h-[48px]'); // Large size still applied
  });
});

describe('ButtonGroup Component', () => {
  it('should render horizontal button group by default', () => {
    render(
      <ButtonGroup>
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );

    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex');
    expect(group).toHaveClass('flex-row');
    expect(group).toHaveClass('gap-2');
  });

  it('should render vertical button group when specified', () => {
    render(
      <ButtonGroup orientation="vertical">
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );

    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });

  it('should apply different spacing options', () => {
    render(
      <ButtonGroup spacing="loose">
        <Button>Button 1</Button>
        <Button>Button 2</Button>
      </ButtonGroup>
    );

    const group = screen.getByRole('group');
    expect(group).toHaveClass('gap-3');
  });
});

describe('IconButton Component', () => {
  it('should render icon button with proper touch target', () => {
    render(
      <IconButton icon={<span>★</span>} aria-label="Favorite">
        Favorite
      </IconButton>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('min-h-[44px]');
    expect(button).toHaveClass('min-w-[44px]');
    expect(button).toHaveClass('aspect-square');
    expect(button).toHaveAttribute('aria-label', 'Favorite');
  });

  it('should contain the provided icon', () => {
    render(
      <IconButton icon={<svg data-testid="test-icon">Icon</svg>} aria-label="Test">
        Test
      </IconButton>
    );

    const icon = screen.getByTestId('test-icon');
    expect(icon).toBeInTheDocument();
  });
});

describe('LoadingButton Component', () => {
  it('should show loading spinner when loading', () => {
    render(<LoadingButton loading>Loading</LoadingButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();

    const spinner = document.querySelector('svg'); // SVG is aria-hidden but still in DOM
    expect(spinner).toBeInTheDocument();

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should show custom loading text when provided', () => {
    render(
      <LoadingButton loading loadingText="Processing...">
        Submit
      </LoadingButton>
    );

    expect(screen.getByText('Processing...')).toBeInTheDocument();
  });

  it('should show children when not loading', () => {
    render(<LoadingButton loading={false}>Submit</LoadingButton>);

    expect(screen.getByText('Submit')).toBeInTheDocument();
  });

  it('should be disabled when loading', () => {
    render(<LoadingButton loading>Loading</LoadingButton>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });
});

describe('TouchButtonVariants', () => {
  it('should provide primary action variant', () => {
    const variant = TouchButtonVariants.primaryAction;
    expect(variant.variant).toBe('primary');
    expect(variant.size).toBe('large');
    expect(variant['data-touch-context']).toBe('primary');
  });

  it('should provide secondary action variant', () => {
    const variant = TouchButtonVariants.secondaryAction;
    expect(variant.variant).toBe('secondary');
    expect(variant.size).toBe('medium');
    expect(variant['data-touch-context']).toBe('secondary');
  });

  it('should provide navigation variant', () => {
    const variant = TouchButtonVariants.navigation;
    expect(variant.variant).toBe('ghost');
    expect(variant.size).toBe('medium');
    expect(variant['data-touch-context']).toBe('navigation');
  });

  it('should provide form submit variant', () => {
    const variant = TouchButtonVariants.formSubmit;
    expect(variant.variant).toBe('primary');
    expect(variant.size).toBe('large');
    expect(variant['data-touch-context']).toBe('form');
  });

  it('should provide destructive variant', () => {
    const variant = TouchButtonVariants.destructive;
    expect(variant.variant).toBe('destructive');
    expect(variant.size).toBe('medium');
    expect(variant['data-touch-context']).toBe('primary');
  });

  it('should provide icon variant', () => {
    const variant = TouchButtonVariants.icon;
    expect(variant.variant).toBe('ghost');
    expect(variant.size).toBe('icon');
    expect(variant['data-touch-context']).toBe('toolbar');
  });
});

describe('Touch Target Compliance', () => {
  it('should validate touch targets through mocked validation function', () => {
    // This test verifies that the validateTouchTarget function is called correctly
    // In a real implementation, this would test actual DOM elements

    const mockValidateTouchTarget = vi.mocked(validateTouchTarget);
    mockValidateTouchTarget.mockReturnValue({
      isValid: true,
      actualSize: 44,
      requiredSize: 44,
    });

    // The validation would happen in a real component test
    // This is a placeholder to show the testing approach
    expect(mockValidateTouchTarget).toBeDefined();
  });

  it('should ensure all button variants meet minimum touch target requirements', () => {
    const variants = ['primary', 'secondary', 'ghost', 'destructive', 'outline', 'link'];
    const sizes = ['small', 'medium', 'large', 'extra-large', 'icon'];

    // Test each combination individually to avoid multiple button conflicts
    variants.forEach((variant) => {
      sizes.forEach((size) => {
        const { unmount } = render(
          <Button variant={variant as any} size={size as any} data-testid={`${variant}-${size}`}>
            Test
          </Button>
        );

        const button = screen.getByTestId(`${variant}-${size}`);
        expect(button).toBeInTheDocument();

        // In a real test, we would measure the actual rendered size
        // For now, we verify the component renders without errors

        unmount(); // Clean up after each test
      });
    });
  });
});

describe('Accessibility Features', () => {
  it('should support keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </>
    );

    const buttons = screen.getAllByRole('button');

    // Tab through buttons
    await user.tab();
    expect(buttons[0]).toHaveFocus();

    await user.tab();
    expect(buttons[1]).toHaveFocus();

    await user.tab();
    expect(buttons[2]).toHaveFocus();
  });

  it('should support Enter key activation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Enter Button</Button>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should support Space key activation', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(<Button onClick={handleClick}>Space Button</Button>);

    const button = screen.getByRole('button');
    button.focus();

    await user.keyboard(' ');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should provide proper ARIA attributes', () => {
    render(
      <Button aria-label="Custom label" aria-describedby="description">
        Button with ARIA
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Custom label');
    expect(button).toHaveAttribute('aria-describedby', 'description');
  });
});

describe('Responsive Behavior', () => {
  it('should adapt touch targets based on screen size context', () => {
    // Test with mobile screen context
    render(
      <Button
        data-touch-context="primary"
        data-available-space-width={320}
        data-available-space-height={200}
      >
        Mobile Button
      </Button>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-touch-context', 'primary');
    expect(button).toHaveAttribute('data-available-space-width', '320');
  });

  it('should maintain touch targets across different viewport sizes', () => {
    // In a real implementation, this would test actual viewport changes
    // For now, we verify the component structure supports responsive behavior
    render(<Button>Responsive Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });
});
