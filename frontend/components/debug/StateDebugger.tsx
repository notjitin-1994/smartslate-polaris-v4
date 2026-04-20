'use client';

import { useState, useEffect } from 'react';
import { StateDebugger, TimeTravelDebugger, devToolsIntegration } from '@/lib/stores/debugging';
import { useBlueprintStore } from '@/lib/stores/blueprintStore';
import { useUIStore } from '@/lib/stores/uiStore';
import { useAuthStore } from '@/lib/stores/authStore';

interface StateDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StateDebuggerComponent({ isOpen, onClose }: StateDebuggerProps) {
  const [activeTab, setActiveTab] = useState<'state' | 'history' | 'performance' | 'time-travel'>(
    'state'
  );
  const [stateHistory, setStateHistory] = useState<unknown[]>([]);
  const [memoryUsage, setMemoryUsage] = useState<unknown>(null);
  const [snapshots, setSnapshots] = useState<unknown[]>([]);

  const blueprintStore = useBlueprintStore();
  const uiStore = useUIStore();
  const authStore = useAuthStore();

  // Update state history
  useEffect(() => {
    if (isOpen) {
      const history = StateDebugger.getStateHistory();
      setStateHistory(history);
    }
  }, [isOpen]);

  // Update memory usage
  useEffect(() => {
    if (isOpen && activeTab === 'performance') {
      const usage = StateDebugger.getMemoryUsage();
      setMemoryUsage(usage);
    }
  }, [isOpen, activeTab]);

  // Update snapshots
  useEffect(() => {
    if (isOpen && activeTab === 'time-travel') {
      const snapshots = TimeTravelDebugger.getSnapshots();
      setSnapshots(snapshots);
    }
  }, [isOpen, activeTab]);

  // Connect to Redux DevTools
  useEffect(() => {
    if (!isOpen) return;

    const stores = {
      blueprint: blueprintStore,
      ui: uiStore,
      auth: authStore,
    };
    devToolsIntegration.connect(stores);

    return () => {
      devToolsIntegration.disconnect();
    };
  }, [isOpen, blueprintStore, uiStore, authStore]);

  if (!isOpen) return null;

  const exportState = () => {
    const stores = {
      blueprint: blueprintStore,
      ui: uiStore,
      auth: authStore,
    };
    const stateJson = StateDebugger.exportState(stores);

    // Download as file
    const blob = new Blob([stateJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `state-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importState = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const stores = {
        blueprint: blueprintStore,
        ui: uiStore,
        auth: authStore,
      };
      StateDebugger.importState(content, stores);
    };
    reader.readAsText(file);
  };

  const restoreSnapshot = (index: number) => {
    const stores = {
      blueprint: blueprintStore,
      ui: uiStore,
      auth: authStore,
    };
    TimeTravelDebugger.restoreSnapshot(index, stores);
  };

  const takeSnapshot = () => {
    // The hooks already return the current state
    TimeTravelDebugger.takeSnapshot('blueprint', blueprintStore);
    TimeTravelDebugger.takeSnapshot('ui', uiStore);
    TimeTravelDebugger.takeSnapshot('auth', authStore);

    // Update snapshots
    const snapshots = TimeTravelDebugger.getSnapshots();
    setSnapshots(snapshots);
  };

  return (
    <div className="bg-opacity-50 fixed inset-0 z-50 flex items-center justify-center bg-black">
      <div className="max-h-modal mx-4 w-full max-w-4xl overflow-hidden rounded-lg bg-white shadow-xl">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">State Debugger</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              ✕
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Tabs */}
          <div className="mb-6 flex space-x-1">
            {[
              { id: 'state', label: 'State' },
              { id: 'history', label: 'History' },
              { id: 'performance', label: 'Performance' },
              { id: 'time-travel', label: 'Time Travel' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as 'state' | 'history' | 'performance' | 'time-travel')
                }
                className={`rounded-md px-4 py-2 text-sm font-medium ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="max-h-96 overflow-y-auto">
            {activeTab === 'state' && (
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <button
                    onClick={exportState}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Export State
                  </button>
                  <label className="cursor-pointer rounded-md bg-gray-200 px-4 py-2 text-gray-700 hover:bg-gray-300">
                    Import State
                    <input type="file" accept=".json" onChange={importState} className="hidden" />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">Blueprint Store</h3>
                    <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-3 text-xs">
                      {JSON.stringify(blueprintStore, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">UI Store</h3>
                    <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-3 text-xs">
                      {JSON.stringify(uiStore, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <h3 className="mb-2 font-semibold text-gray-900">Auth Store</h3>
                    <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-3 text-xs">
                      {JSON.stringify(authStore, null, 2)}
                    </pre>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">State Change History</h3>
                  <button
                    onClick={() => StateDebugger.clearStateHistory()}
                    className="rounded bg-red-200 px-3 py-1 text-sm text-red-700 hover:bg-red-300"
                  >
                    Clear History
                  </button>
                </div>

                <div className="space-y-2">
                  {stateHistory.map((entry: any, index) => (
                    <div key={index} className="rounded border border-gray-200 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {entry.store} - {entry.action}
                          </div>
                          <div className="text-sm text-gray-500">
                            {entry.timestamp.toISOString()}
                          </div>
                        </div>
                        <button
                          onClick={() => console.log('State:', entry.state)}
                          className="rounded bg-gray-200 px-2 py-1 text-xs text-gray-700 hover:bg-gray-300"
                        >
                          Log
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 'performance' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-900">Performance Metrics</h3>

                {(memoryUsage as any) && (
                  <div className="rounded bg-gray-50 p-4">
                    <h4 className="mb-2 font-medium text-gray-900">Memory Usage</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{((memoryUsage as any).used / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total:</span>
                        <span>{((memoryUsage as any).total / 1024 / 1024).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Percentage:</span>
                        <span>{(memoryUsage as any).percentage.toFixed(2)}%</span>
                      </div>
                    </div>
                  </div>
                )}

                <div className="rounded bg-gray-50 p-4">
                  <h4 className="mb-2 font-medium text-gray-900">Performance Monitoring</h4>
                  <p className="text-sm text-gray-600">
                    Performance monitoring is active. Check the console for warnings.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'time-travel' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">Time Travel Debugging</h3>
                  <button
                    onClick={takeSnapshot}
                    className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
                  >
                    Take Snapshot
                  </button>
                </div>

                <div className="space-y-2">
                  {snapshots.map((snapshot: any, index) => (
                    <div key={index} className="rounded border border-gray-200 p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="font-medium text-gray-900">
                            {snapshot.store} - {snapshot.timestamp.toISOString()}
                          </div>
                        </div>
                        <button
                          onClick={() => restoreSnapshot(index)}
                          className="rounded bg-blue-200 px-3 py-1 text-sm text-blue-700 hover:bg-blue-300"
                        >
                          Restore
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
