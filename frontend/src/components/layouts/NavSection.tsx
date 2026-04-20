'use client';

import { memo, useState } from 'react';

export type NavItem =
  | string
  | {
      label: string;
      tagText?: string;
      tagTone?: 'preview' | 'soon' | 'info';
    };

export interface NavSectionProps {
  title: string;
  items: NavItem[];
  defaultOpen?: boolean;
  onItemClick?: (item: NavItem) => void;
}

export const NavSection = memo(function NavSection({
  title,
  items,
  defaultOpen = false,
  onItemClick,
}: NavSectionProps) {
  const [open, setOpen] = useState<boolean>(defaultOpen);

  return (
    <div className="space-y-1 select-none">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="group text-text-disabled hover:text-foreground hover:bg-foreground/5 active:bg-foreground/10 focus-visible:ring-secondary/50 flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-bold tracking-wider uppercase transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-1"
        aria-expanded={open}
        aria-controls={`section-${title.replace(/\s+/g, '-')}`}
      >
        <span>{title}</span>
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-300 ${open ? 'rotate-90' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        id={`section-${title.replace(/\s+/g, '-')}`}
        className={`overflow-hidden transition-all duration-300 ease-out ${open ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'} `}
      >
        <ul className="space-y-0.5 py-1">
          {items.map((item) => {
            const { label, tagText, tagTone } =
              typeof item === 'string'
                ? { label: item, tagText: undefined, tagTone: undefined }
                : item;
            return (
              <li key={label}>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onItemClick?.(item);
                  }}
                  className="group text-text-secondary hover:text-foreground hover:bg-foreground/5 focus-visible:ring-secondary/50 flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-1 active:scale-[0.98]"
                >
                  <span className="flex-1 truncate text-left">{label}</span>
                  {tagText && (
                    <span
                      className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase transition-all duration-200 ${
                        tagTone === 'preview'
                          ? 'border-secondary/30 bg-secondary/10 text-secondary'
                          : tagTone === 'soon'
                            ? 'border-primary/30 bg-primary/10 text-primary'
                            : 'text-text-disabled border-neutral-300 bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-800'
                      } `}
                    >
                      {tagText}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
});
