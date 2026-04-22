'use client';

import { useState } from 'react';
import { ConflictResolutionStrategy, conflictUIHelpers } from '@/lib/stores/conflictResolution';
import type { ConflictData } from '@/lib/stores/types';

interface ConflictResolutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResolve: (strategy: ConflictResolutionStrategy) => void;
  conflict: ConflictData | null;
}

export function ConflictResolutionDialog({
  isOpen,
  onClose,
  onResolve,
  conflict,
}: ConflictResolutionDialogProps) {
  const [selectedStrategy, setSelectedStrategy] = useState<ConflictResolutionStrategy | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  if (!isOpen || !conflict) return null;

  const description = conflictUIHelpers.getConflictDescription(conflict);
  const options = conflictUIHelpers.getResolutionOptions(conflict);
  const severity = conflictUIHelpers.getConflictSeverity(conflict);

  const handleResolve = async () => {
    if (!selectedStrategy) return;

    setIsResolving(true);
    try {
      onResolve(selectedStrategy);
      onClose();
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
    } finally {
      setIsResolving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="glass-strong max-h-modal mx-4 w-full max-w-2xl overflow-hidden rounded-2xl">
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center space-x-3">
            <div
              className={`h-3 w-3 rounded-full ${
                severity === 'high'
                  ? 'bg-red-500'
                  : severity === 'medium'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
              }`}
            />
            <h2 className="text-foreground text-2xl font-bold">Conflict Resolution</h2>
          </div>
          <p className="text-foreground/70 mt-2">{description}</p>
        </div>

        <div className="max-h-96 overflow-y-auto p-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-foreground mb-2 font-semibold">Resolution Options</h3>
              <div className="space-y-4">
                {options.map((option) => (
                  <label
                    key={option.value}
                    className={`glass-hover flex cursor-pointer items-start space-x-3 rounded-lg border p-3 ${
                      selectedStrategy === option.value
                        ? 'border-primary bg-primary/10'
                        : 'border-white/10'
                    }`}
                  >
                    <input
                      type="radio"
                      name="resolution-strategy"
                      value={option.value}
                      checked={selectedStrategy === option.value}
                      onChange={(e) =>
                        setSelectedStrategy(e.target.value as ConflictResolutionStrategy)
                      }
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="text-foreground font-medium">{option.label}</div>
                      <div className="text-foreground/70 mt-1 text-sm">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {conflict.type === 'concurrent_edit' && (
              <div className="border-t pt-4">
                <h4 className="text-foreground mb-2 font-semibold">Change Comparison</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h5 className="text-foreground/80 mb-2 text-sm font-medium">Local Changes</h5>
                    <div className="glass rounded p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(conflict.localChanges, null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div>
                    <h5 className="text-foreground/80 mb-2 text-sm font-medium">Remote Changes</h5>
                    <div className="glass rounded p-3 text-sm">
                      <pre className="whitespace-pre-wrap">
                        {JSON.stringify(conflict.remoteChanges, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 border-t border-white/10 p-6">
          <button
            onClick={onClose}
            disabled={isResolving}
            className="text-foreground hover:glass focus-visible:ring-primary/50 rounded-lg px-6 py-2.5 transition-all duration-200 focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleResolve}
            disabled={!selectedStrategy || isResolving}
            className="glass bg-secondary hover:bg-secondary-dark focus-visible:ring-secondary/50 focus-visible:ring-offset-background rounded-lg px-6 py-2.5 text-white transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            {isResolving ? 'Resolving...' : 'Resolve Conflict'}
          </button>
        </div>
      </div>
    </div>
  );
}
