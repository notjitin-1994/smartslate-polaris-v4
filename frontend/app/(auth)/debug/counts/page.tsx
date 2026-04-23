'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import ProtectedRoute from '@/components/auth/ProtectedRoute';

interface DebugData {
  [key: string]: any;
}

export default function CountsDebugPage() {
  const [loading, setLoading] = useState(false);
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [fixResult, setFixResult] = useState<DebugData | null>(null);
  const [blueprintFixResult, setBlueprintFixResult] = useState<DebugData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchDebugData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/debug/user-limits');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDebugData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch debug data');
    } finally {
      setLoading(false);
    }
  };

  const fixCounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/admin/fix-my-counts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setFixResult(data);
      // Refresh debug data after fix
      await fetchDebugData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix counts');
    } finally {
      setLoading(false);
    }
  };

  const fixStuckBlueprint = async (blueprintId: string) => {
    setLoading(true);
    setError(null);
    setBlueprintFixResult(null);
    try {
      const response = await fetch('/api/admin/fix-stuck-blueprint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ blueprintId }),
      });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setBlueprintFixResult(data);
      // Refresh debug data after fix
      await fetchDebugData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fix blueprint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto max-w-6xl space-y-8 p-6">
        <div>
          <h1 className="text-3xl font-bold">Blueprint Counts Debug Tool</h1>
          <p className="text-muted-foreground mt-2">View and fix blueprint counting issues</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Button onClick={fetchDebugData} disabled={loading}>
            {loading ? 'Loading...' : 'Check My Counts'}
          </Button>
          <Button onClick={fixCounts} disabled={loading} variant="default">
            {loading ? 'Fixing...' : 'Fix My Counts'}
          </Button>
        </div>

        {/* Error Display */}
        {error && (
          <Card className="border-destructive bg-destructive/10 p-4">
            <h3 className="text-destructive font-semibold">Error</h3>
            <p className="text-sm">{error}</p>
          </Card>
        )}

        {/* Fix Result */}
        {fixResult && (
          <Card className="border-success bg-success/10 p-6">
            <h2 className="text-success mb-4 text-xl font-bold">
              {fixResult.success ? '✓ Counts Fixed Successfully!' : '✗ Fix Failed'}
            </h2>

            {fixResult.wasFixed && (
              <div className="mb-4 rounded-lg bg-yellow-500/10 p-4">
                <p className="font-semibold text-yellow-600 dark:text-yellow-400">
                  ⚠️ Counts were out of sync and have been corrected
                </p>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h3 className="mb-2 font-semibold">Before Fix</h3>
                <div className="space-y-1 text-sm">
                  <p>Creation Count: {fixResult.before?.stored?.creation} (stored)</p>
                  <p>Saving Count: {fixResult.before?.stored?.saving} (stored)</p>
                  <p className="text-muted-foreground">
                    Actual: {fixResult.before?.actual?.creation} /{' '}
                    {fixResult.before?.actual?.saving}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 font-semibold">After Fix</h3>
                <div className="space-y-1 text-sm">
                  <p>Creation Count: {fixResult.after?.stored?.creation}</p>
                  <p>Saving Count: {fixResult.after?.stored?.saving}</p>
                  <p className="text-success">
                    Can Save More: {fixResult.after?.canSave?.can_save ? 'Yes ✓' : 'No ✗'}
                  </p>
                </div>
              </div>
            </div>

            {fixResult.after?.effectiveLimits && (
              <div className="mt-4 rounded-lg border p-4">
                <h3 className="mb-2 font-semibold">Current Limits</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Creation</p>
                    <p className="text-lg font-bold">
                      {fixResult.after.effectiveLimits.creation_used} /{' '}
                      {fixResult.after.effectiveLimits.creation_limit}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Saving</p>
                    <p className="text-lg font-bold">
                      {fixResult.after.effectiveLimits.saving_used} /{' '}
                      {fixResult.after.effectiveLimits.saving_limit}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* Blueprint Fix Result */}
        {blueprintFixResult && (
          <Card className="border-success bg-success/10 p-6">
            <h2 className="text-success mb-4 text-xl font-bold">
              {blueprintFixResult.success
                ? '✓ Blueprint Fixed Successfully!'
                : '✗ Blueprint Fix Failed'}
            </h2>

            <div className="space-y-4">
              <div className="rounded-lg bg-white/50 p-4 dark:bg-black/20">
                <h3 className="mb-2 font-semibold">Blueprint Details</h3>
                <div className="space-y-2 text-sm">
                  <p>
                    <span className="text-muted-foreground">ID:</span>{' '}
                    <code className="bg-muted rounded px-1 py-0.5 text-xs">
                      {blueprintFixResult.blueprint?.id}
                    </code>
                  </p>
                  {blueprintFixResult.blueprint?.title && (
                    <p>
                      <span className="text-muted-foreground">Title:</span>{' '}
                      {blueprintFixResult.blueprint.title}
                    </p>
                  )}
                  <p>
                    <span className="text-muted-foreground">Old Status:</span>{' '}
                    <span className="text-destructive font-semibold">
                      {blueprintFixResult.blueprint?.oldStatus}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">New Status:</span>{' '}
                    <span className="text-success font-semibold">
                      {blueprintFixResult.blueprint?.newStatus}
                    </span>
                  </p>
                  <p>
                    <span className="text-muted-foreground">Has Data:</span>{' '}
                    {blueprintFixResult.blueprint?.hasData ? 'Yes ✓' : 'No ✗'}
                  </p>
                </div>
              </div>

              <p className="text-muted-foreground text-sm">{blueprintFixResult.message}</p>

              {blueprintFixResult.blueprint?.newStatus === 'completed' && (
                <Button
                  onClick={() =>
                    (window.location.href = `/starmaps/${blueprintFixResult.blueprint?.id}`)
                  }
                  className="w-full"
                >
                  View Blueprint
                </Button>
              )}
            </div>
          </Card>
        )}

        {/* Debug Data Display */}
        {debugData && (
          <div className="space-y-4">
            <Card className="p-6">
              <h2 className="mb-4 text-xl font-bold">Current Status</h2>

              {/* Discrepancies Alert */}
              {(debugData.discrepancies?.creation_count_mismatch ||
                debugData.discrepancies?.saving_count_mismatch) && (
                <div className="bg-destructive/10 mb-4 rounded-lg p-4">
                  <p className="text-destructive font-semibold">
                    ⚠️ Counts are out of sync! Click "Fix My Counts" to resolve.
                  </p>
                  <div className="mt-2 space-y-1 text-sm">
                    {debugData.discrepancies.creation_count_mismatch && (
                      <p>
                        Creation count mismatch: {debugData.discrepancies.stored_vs_actual_creation}
                      </p>
                    )}
                    {debugData.discrepancies.saving_count_mismatch && (
                      <p>
                        Saving count mismatch: {debugData.discrepancies.stored_vs_actual_saving}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-3">
                {/* Profile Info */}
                <div>
                  <h3 className="mb-3 font-semibold">Profile</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Tier:</span>{' '}
                      {debugData.profile?.subscription_tier}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Role:</span>{' '}
                      {debugData.profile?.user_role}
                    </p>
                  </div>
                </div>

                {/* Stored Counts */}
                <div>
                  <h3 className="mb-3 font-semibold">Stored Counts</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Creation:</span>{' '}
                      {debugData.profile?.blueprint_creation_count} /{' '}
                      {debugData.profile?.blueprint_creation_limit}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Saving:</span>{' '}
                      {debugData.profile?.blueprint_saving_count} /{' '}
                      {debugData.profile?.blueprint_saving_limit}
                    </p>
                  </div>
                </div>

                {/* Actual Counts */}
                <div>
                  <h3 className="mb-3 font-semibold">Actual Counts</h3>
                  <div className="space-y-2 text-sm">
                    <p>
                      <span className="text-muted-foreground">Total Blueprints:</span>{' '}
                      {debugData.actualCounts?.totalBlueprints}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Completed:</span>{' '}
                      {debugData.actualCounts?.completedBlueprints}
                    </p>
                    <p>
                      <span className="text-muted-foreground">Draft:</span>{' '}
                      {debugData.actualCounts?.draftBlueprints}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Can Save Check */}
            {debugData.checks?.canSave && (
              <Card className="p-6">
                <h3 className="mb-3 font-semibold">Can Save Blueprint?</h3>
                <div
                  className={`rounded-lg p-4 ${
                    debugData.checks.canSave.can_save
                      ? 'bg-success/10 text-success'
                      : 'bg-destructive/10 text-destructive'
                  }`}
                >
                  <p className="font-semibold">
                    {debugData.checks.canSave.can_save ? '✓ YES' : '✗ NO'}
                  </p>
                  <p className="mt-1 text-sm">{debugData.checks.canSave.reason}</p>
                  <div className="mt-2 text-sm">
                    <p>
                      Current: {debugData.checks.canSave.current_count} / Limit:{' '}
                      {debugData.checks.canSave.limit_count}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Blueprints List */}
            {debugData.blueprintsList && debugData.blueprintsList.length > 0 && (
              <Card className="p-6">
                <h3 className="mb-3 font-semibold">Your Blueprints</h3>
                <div className="space-y-2">
                  {debugData.blueprintsList.map((blueprint: any, index: number) => {
                    const isStuck =
                      (blueprint.has_blueprint_json && blueprint.status !== 'completed') ||
                      (!blueprint.has_blueprint_json && blueprint.status === 'completed');

                    return (
                      <div
                        key={blueprint.id}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm ${
                          isStuck ? 'border-yellow-500 bg-yellow-500/5' : ''
                        }`}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">Blueprint #{index + 1}</p>
                            {isStuck && (
                              <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-xs text-yellow-600 dark:text-yellow-400">
                                ⚠️ Stuck
                              </span>
                            )}
                          </div>
                          <p className="text-muted-foreground text-xs">{blueprint.id}</p>
                          {isStuck && (
                            <p className="mt-1 text-xs text-yellow-600 dark:text-yellow-400">
                              Status: {blueprint.status}, Has data:{' '}
                              {blueprint.has_blueprint_json ? 'Yes' : 'No'}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p
                              className={`font-semibold ${
                                blueprint.status === 'completed'
                                  ? 'text-success'
                                  : blueprint.status === 'error'
                                    ? 'text-destructive'
                                    : 'text-muted-foreground'
                              }`}
                            >
                              {blueprint.status}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {blueprint.has_blueprint_json ? 'Has data' : 'No data'}
                            </p>
                          </div>
                          {isStuck && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => fixStuckBlueprint(blueprint.id)}
                              disabled={loading}
                            >
                              Fix
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Raw Data */}
            <details className="rounded-lg border">
              <summary className="hover:bg-accent cursor-pointer p-4 font-semibold">
                View Raw JSON Data
              </summary>
              <pre className="overflow-auto p-4 text-xs">{JSON.stringify(debugData, null, 2)}</pre>
            </details>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

