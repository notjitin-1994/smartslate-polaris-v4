'use client';

import React from 'react';
import * as Accordion from '@radix-ui/react-accordion';
import { SectionNavigatorProps } from '@/lib/dynamic-form';
import { cn } from '@/lib/utils';

export const SectionNavigator: React.FC<SectionNavigatorProps> = ({
  sections,
  currentSection,
  onSectionChange,
  completedSections,
  className,
  collapsible = true,
}) => {
  const handleValueChange = (value: string | string[]) => {
    if (typeof value === 'string') {
      onSectionChange(value);
    } else if (value.length > 0) {
      onSectionChange(value[value.length - 1]);
    }
  };

  if (!collapsible) {
    return (
      <nav className={cn('space-y-2', className)}>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Sections</h3>
        <div className="space-y-1">
          {sections.map((section, index) => {
            const isCompleted = completedSections.includes(section.id);
            const isCurrent = currentSection === section.id;

            return (
              <button
                key={section.id}
                onClick={() => onSectionChange(section.id)}
                className={cn(
                  'w-full rounded-lg border px-4 py-3 text-left transition-colors',
                  isCurrent
                    ? 'border-secondary bg-secondary/10 text-secondary-dark dark:bg-secondary/20 dark:text-secondary-light'
                    : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
                  isCompleted &&
                    !isCurrent &&
                    'border-success/30 bg-success/10 text-success dark:border-success dark:bg-success/20 dark:text-success'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                        isCompleted
                          ? 'bg-success text-white'
                          : isCurrent
                            ? 'bg-secondary text-white'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      )}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                  {isCompleted && (
                    <div className="text-success">
                      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </nav>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Form Sections</h3>

      <Accordion.Root
        type="single"
        value={currentSection}
        onValueChange={handleValueChange}
        className="space-y-2"
      >
        {sections.map((section, index) => {
          const isCompleted = completedSections.includes(section.id);
          const isCurrent = currentSection === section.id;

          return (
            <Accordion.Item
              key={section.id}
              value={section.id}
              className={cn(
                'overflow-hidden rounded-lg border',
                isCurrent
                  ? 'border-secondary bg-secondary/10 dark:bg-secondary/20'
                  : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800',
                isCompleted &&
                  !isCurrent &&
                  'border-success/30 bg-success/10 dark:border-success dark:bg-success/20'
              )}
            >
              <Accordion.Trigger
                className={cn(
                  'w-full px-4 py-3 text-left hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:hover:bg-gray-700',
                  isCurrent && 'bg-secondary/10 dark:bg-secondary/20'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={cn(
                        'flex h-6 w-6 items-center justify-center rounded-full text-sm font-medium',
                        isCompleted
                          ? 'bg-success text-white'
                          : isCurrent
                            ? 'bg-secondary text-white'
                            : 'bg-gray-200 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                      )}
                    >
                      {isCompleted ? '✓' : index + 1}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">{section.title}</h4>
                      {section.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {section.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isCompleted && (
                      <div className="text-success">
                        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </div>
                    )}
                    <svg
                      className={cn(
                        'h-5 w-5 text-gray-400 transition-transform',
                        isCurrent && 'rotate-180'
                      )}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
              </Accordion.Trigger>

              <Accordion.Content className="px-4 pb-3">
                <div className="border-t border-gray-200 pt-2 dark:border-gray-600">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {section.questions.length} question{section.questions.length !== 1 ? 's' : ''}
                  </p>
                  {section.questions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {section.questions.slice(0, 3).map((question) => (
                        <div key={question.id} className="text-xs text-gray-500 dark:text-gray-400">
                          • {question.label}
                        </div>
                      ))}
                      {section.questions.length > 3 && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          • +{section.questions.length - 3} more...
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </Accordion.Content>
            </Accordion.Item>
          );
        })}
      </Accordion.Root>
    </div>
  );
};

export default SectionNavigator;
