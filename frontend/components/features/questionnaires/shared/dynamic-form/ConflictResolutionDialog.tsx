'use client';

import React, { useState } from 'react';
import { AnswerConflict, ConflictResolution } from '@/lib/dynamic-form/answerAggregator';
import { cn } from '@/lib/utils';

interface ConflictResolutionDialogProps {
  conflicts: AnswerConflict[];
  onResolve: (resolutions: ConflictResolution[]) => void;
  onCancel: () => void;
  isOpen: boolean;
  className?: string;
}

export const ConflictResolutionDialog: React.FC<ConflictResolutionDialogProps> = ({
  conflicts,
  onResolve,
  onCancel,
  isOpen,
  className,
}) => {
  const [resolutions, setResolutions] = useState<Record<string, ConflictResolution['resolution']>>(
    {}
  );
  const [customValues, setCustomValues] = useState<Record<string, unknown>>({});

  if (!isOpen || conflicts.length === 0) {
    return null;
  }

  const handleResolutionChange = (
    conflictId: string,
    resolution: ConflictResolution['resolution']
  ) => {
    setResolutions((prev) => ({ ...prev, [conflictId]: resolution }));
  };

  const handleCustomValueChange = (conflictId: string, value: unknown) => {
    setCustomValues((prev) => ({ ...prev, [conflictId]: value }));
  };

  const handleResolve = () => {
    const resolvedConflicts: ConflictResolution[] = conflicts.map((conflict) => {
      const resolution = resolutions[conflict.fieldId] || 'current';
      let resolvedValue = conflict.currentValue;

      switch (resolution) {
        case 'incoming':
          resolvedValue = conflict.incomingValue;
          break;
        case 'merge':
          resolvedValue = mergeValues(conflict.currentValue, conflict.incomingValue);
          break;
        case 'manual':
          resolvedValue = customValues[conflict.fieldId] || conflict.currentValue;
          break;
        default:
          resolvedValue = conflict.currentValue;
      }

      return {
        fieldId: conflict.fieldId,
        resolvedValue,
        resolution,
        timestamp: new Date().toISOString(),
      };
    });

    onResolve(resolvedConflicts);
  };

  const mergeValues = (value1: unknown, value2: unknown): unknown => {
    if (Array.isArray(value1) && Array.isArray(value2)) {
      return [...new Set([...value1, ...value2])];
    }

    if (
      typeof value1 === 'object' &&
      typeof value2 === 'object' &&
      value1 !== null &&
      value2 !== null
    ) {
      return { ...value1, ...value2 };
    }

    return value1; // Fallback to current value
  };

  const getSeverityColor = (severity: AnswerConflict['severity']) => {
    switch (severity) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="bg-opacity-25 fixed inset-0 bg-black" onClick={onCancel} />

        <div
          className={cn(
            'relative w-full max-w-4xl rounded-lg bg-white shadow-xl dark:bg-gray-800',
            className
          )}
        >
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-700">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Resolve Form Conflicts
            </h2>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {conflicts.length} conflict{conflicts.length !== 1 ? 's' : ''} detected. Please choose
              how to resolve each one.
            </p>
          </div>

          {/* Content */}
          <div className="max-h-96 overflow-y-auto px-6 py-4">
            <div className="space-y-6">
              {conflicts.map((conflict, index) => (
                <div
                  key={`${conflict.fieldId}-${index}`}
                  className={cn('rounded-lg border p-4', getSeverityColor(conflict.severity))}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        Field: {conflict.fieldId}
                      </h3>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Conflict Type: {conflict.conflictType} | Severity: {conflict.severity}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(conflict.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {/* Current vs Incoming Values */}
                  <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Current Value
                      </label>
                      <div className="rounded-md border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-700">
                        <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
                          {JSON.stringify(conflict.currentValue, null, 2)}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Incoming Value
                      </label>
                      <div className="rounded-md border border-gray-300 bg-white p-3 dark:border-gray-600 dark:bg-gray-700">
                        <pre className="text-sm whitespace-pre-wrap text-gray-900 dark:text-white">
                          {JSON.stringify(conflict.incomingValue, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>

                  {/* Resolution Options */}
                  <div className="mt-4">
                    <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Resolution Strategy
                    </label>
                    <div className="space-y-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`resolution-${conflict.fieldId}`}
                          value="current"
                          checked={resolutions[conflict.fieldId] === 'current'}
                          onChange={(e) =>
                            handleResolutionChange(
                              conflict.fieldId,
                              e.target.value as ConflictResolution['resolution']
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Keep current value
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`resolution-${conflict.fieldId}`}
                          value="incoming"
                          checked={resolutions[conflict.fieldId] === 'incoming'}
                          onChange={(e) =>
                            handleResolutionChange(
                              conflict.fieldId,
                              e.target.value as ConflictResolution['resolution']
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Use incoming value
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`resolution-${conflict.fieldId}`}
                          value="merge"
                          checked={resolutions[conflict.fieldId] === 'merge'}
                          onChange={(e) =>
                            handleResolutionChange(
                              conflict.fieldId,
                              e.target.value as ConflictResolution['resolution']
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Merge values
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="radio"
                          name={`resolution-${conflict.fieldId}`}
                          value="manual"
                          checked={resolutions[conflict.fieldId] === 'manual'}
                          onChange={(e) =>
                            handleResolutionChange(
                              conflict.fieldId,
                              e.target.value as ConflictResolution['resolution']
                            )
                          }
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Enter custom value
                        </span>
                      </label>
                    </div>

                    {/* Custom value input */}
                    {resolutions[conflict.fieldId] === 'manual' && (
                      <div className="mt-3">
                        <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                          Custom Value
                        </label>
                        <textarea
                          value={(customValues[conflict.fieldId] as string) || ''}
                          onChange={(e) =>
                            handleCustomValueChange(conflict.fieldId, e.target.value)
                          }
                          className="w-full rounded-md border border-gray-300 p-2 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                          rows={3}
                          placeholder="Enter custom value..."
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end space-x-3 border-t border-gray-200 px-6 py-4 dark:border-gray-700">
            <button
              onClick={onCancel}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={handleResolve}
              className="rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              Resolve Conflicts
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConflictResolutionDialog;
