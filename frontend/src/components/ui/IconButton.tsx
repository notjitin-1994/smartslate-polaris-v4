import type { ButtonHTMLAttributes, ReactNode } from 'react';

type IconButtonProps = {
  ariaLabel: string;
  title?: string;
  variant?: 'ghost' | 'primary' | 'danger';
  size?: 'sm' | 'md';
  className?: string;
  children: ReactNode;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'children' | 'aria-label'>;

/**
* Renders an accessible icon-only button with configurable variant, size, and additional HTML button props.
* @example
* IconButton({ ariaLabel: 'Close', title: 'Close', variant: 'ghost', size: 'md', className: 'my-btn', children: <CloseIcon /> })
* <button aria-label="Close" title="Close" className="icon-btn icon-btn-ghost icon-btn-md my-btn">...</button>
* @param {{IconButtonProps}} {{props}} - Props object containing ariaLabel, title, variant, size, className, children and other button attributes.
* @returns {{JSX.Element}} Rendered button element.
**/
export function IconButton({
  ariaLabel,
  title,
  variant = 'ghost',
  size = 'md',
  className = '',
  children,
  ...rest
}: IconButtonProps) {
  const variantClass = variant ? ` icon-btn-${variant}` : '';
  const sizeClass = size === 'sm' ? ' icon-btn-sm' : '';
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`icon-btn${variantClass}${sizeClass} ${className}`.trim()}
      {...rest}
    >
      {children}
    </button>
  );
}
