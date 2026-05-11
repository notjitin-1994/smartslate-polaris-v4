'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RenameDialog } from '@/components/ui/RenameDialog';
import { ConfirmationDialog } from '@/components/ui/ConfirmationDialog';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { createBrowserBlueprintService } from '@/lib/db/blueprints.client';
import { BlueprintRow } from '@/lib/db/blueprints';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { BlueprintCard } from '@/components/dashboard/BlueprintCard';
import { BlueprintFilters } from '@/components/dashboard/BlueprintFilters';
import { BlueprintUsageDisplay } from '@/components/dashboard/BlueprintUsageDisplay';
import { BlueprintUsageService } from '@/lib/services/blueprintUsageService';
import { useBlueprintLimits } from '@/lib/hooks/useBlueprintLimits';
import { useDeviceDetection } from '@/lib/hooks/useDeviceDetection';
import { UpgradePromptModal } from '@/components/modals/UpgradePromptModal';
import { DesktopOnlyModal } from '@/components/modals/DesktopOnlyModal';
import { cn } from '@/lib/utils';

// Force dynamic rendering to avoid static generation issues with auth
export const dynamic = 'force-dynamic';

function StarmapsContent() {
  const { user } = useAuth();
  const router = useRouter();
  const [blueprints, setBlueprints] = useState<BlueprintRow[]>([]);
  const [filteredBlueprints, setFilteredBlueprints] = useState<BlueprintRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [questionnaireCompletion, setQuestionnaireCompletion] = useState<Record<string, boolean>>(
    {}
  );
  const [creating, setCreating] = useState(false);
  const [renamingBlueprint, setRenamingBlueprint] = useState<BlueprintRow | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageInput, setPageInput] = useState('');
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedBlueprints, setSelectedBlueprints] = useState<Set<string>>(new Set());
  const [deletionDialog, setDeletionDialog] = useState<{
    isOpen: boolean;
    type: 'single' | 'bulk';
    blueprintId?: string;
    blueprintName?: string;
  }>({ isOpen: false, type: 'single' });
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const [showDesktopOnlyModal, setShowDesktopOnlyModal] = useState(false);
  const { isAtCreationLimit, limits } = useBlueprintLimits();
  const { isNonDesktop, isMounted } = useDeviceDetection();

  const BLUEPRINTS_PER_PAGE = 4;
  const totalPages = Math.ceil(filteredBlueprints.length / BLUEPRINTS_PER_PAGE);
  const startIndex = (currentPage - 1) * BLUEPRINTS_PER_PAGE;
  const endIndex = startIndex + BLUEPRINTS_PER_PAGE;
  const paginatedBlueprints = filteredBlueprints.slice(startIndex, endIndex);

  const checkQuestionnaireCompletion = useCallback(async (blueprintId: string) => {
    try {
      const isComplete =
        await createBrowserBlueprintService().isStaticQuestionnaireComplete(blueprintId);
      setQuestionnaireCompletion((prev) => ({
        ...prev,
        [blueprintId]: isComplete,
      }));
    } catch (error) {
      console.error('Error checking questionnaire completion:', error);
    }
  }, []);

  const loadBlueprints = useCallback(async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const data = await createBrowserBlueprintService().getBlueprintsByUser(user.id);
      setBlueprints(data);

      // Check questionnaire completion for each draft blueprint
      const draftBlueprints = data.filter((bp) => bp.status === 'draft');
      for (const blueprint of draftBlueprints) {
        await checkQuestionnaireCompletion(blueprint.id);
      }
    } catch (error) {
      console.error('Error loading blueprints:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, checkQuestionnaireCompletion]);

  useEffect(() => {
    if (user?.id) {
      loadBlueprints();
    }
  }, [user?.id, loadBlueprints]);

  // Reset to page 1 when blueprints change
  useEffect(() => {
    setCurrentPage(1);
    setFilteredBlueprints(blueprints);
  }, [blueprints]);

  const handleCreateBlueprint = useCallback(async () => {
    if (!user?.id || creating) return;

    // Check if user is on mobile/tablet - show desktop-only modal
    if (isNonDesktop && isMounted) {
      setShowDesktopOnlyModal(true);
      return;
    }

    // Check if at limit - show upgrade modal immediately
    if (isAtCreationLimit) {
      setShowUpgradePrompt(true);
      return;
    }

    setCreating(true);
    const supabase = getSupabaseBrowserClient();

    // Double-check authentication status
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();
    if (!currentUser?.id) {
      console.error('User not authenticated when creating blueprint');
      alert('You must be logged in to create a blueprint. Please refresh the page and try again.');
      setCreating(false);
      return;
    }

    // Check blueprint creation limits
    try {
      const canCreate = await BlueprintUsageService.canCreateBlueprint(supabase, currentUser.id);
      if (!canCreate.canCreate) {
        alert(canCreate.reason || 'You cannot create more blueprints at this time.');
        setCreating(false);
        return;
      }
    } catch (error) {
      console.error('Error checking blueprint creation limits:', error);
    }

    try {
      const { count } = await supabase
        .from('blueprint_generator')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id);

      const nextIndex = (count ?? 0) + 1;

      const blueprintData = {
        user_id: currentUser.id,
        status: 'draft' as const,
        static_answers: {},
        questionnaire_version: 2,
        completed_steps: [],
        title: `New Blueprint (${nextIndex})`,
      };

      const { data, error } = await supabase
        .from('blueprint_generator')
        .insert(blueprintData)
        .select()
        .single();

      if (error) {
        console.error('Insert error:', error);
        alert(`Failed to create blueprint: ${error.message || 'Unknown error'}. Please try again.`);
        setCreating(false);
        return;
      }

      router.push(`/static-wizard?bid=${data.id}`);
    } catch (err) {
      console.error('Error creating blueprint:', err);
      alert('Failed to create blueprint. Please check your connection and try again.');
      router.push('/static-wizard');
    } finally {
      setCreating(false);
    }
  }, [user?.id, creating, router, isAtCreationLimit, isNonDesktop, isMounted]);

  const handleRenameBlueprint = useCallback(
    async (newTitle: string) => {
      if (!user?.id || !renamingBlueprint) return;

      try {
        const updatedBlueprint = await createBrowserBlueprintService().updateBlueprintTitle(
          renamingBlueprint.id,
          newTitle,
          user.id
        );

        setBlueprints((prev) =>
          prev.map((bp) =>
            bp.id === renamingBlueprint.id
              ? { ...bp, title: updatedBlueprint.title || newTitle.trim() }
              : bp
          )
        );
      } catch (error) {
        console.error('Error renaming blueprint:', error);
        setBlueprints((prev) =>
          prev.map((bp) =>
            bp.id === renamingBlueprint.id ? { ...bp, title: newTitle.trim() } : bp
          )
        );
      }
    },
    [user?.id, renamingBlueprint]
  );

  const handleDeleteBlueprint = useCallback(
    async (blueprintId: string) => {
      if (!user?.id) return;

      const blueprint = blueprints.find((bp) => bp.id === blueprintId);
      if (!blueprint) return;

      setDeletionDialog({
        isOpen: true,
        type: 'single',
        blueprintId,
        blueprintName: blueprint.title || `Blueprint #${blueprintId.slice(0, 8)}`,
      });
    },
    [user?.id, blueprints]
  );

  const handleConfirmDelete = useCallback(async () => {
    if (!user?.id) return;

    const { type, blueprintId } = deletionDialog;
    let blueprintIdsToDelete: string[] = [];

    if (type === 'single' && blueprintId) {
      blueprintIdsToDelete = [blueprintId];
    } else if (type === 'bulk') {
      blueprintIdsToDelete = Array.from(selectedBlueprints);
    }

    if (blueprintIdsToDelete.length === 0) return;

    try {
      const deletePromises = blueprintIdsToDelete.map(async (id) => {
        const response = await fetch(`/api/starmaps/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Failed to delete blueprint');
        }

        return await response.json();
      });

      await Promise.all(deletePromises);

      setBlueprints((prev) => prev.filter((bp) => !blueprintIdsToDelete.includes(bp.id)));

      if (type === 'bulk') {
        setSelectedBlueprints(new Set());
        setIsSelectionMode(false);
      }
    } catch (err) {
      console.error('Error deleting blueprint(s):', err);
      alert(`Failed to delete blueprint(s): ${(err as Error).message}. Please try again.`);
    }
  }, [user?.id, deletionDialog, selectedBlueprints]);

  const handleToggleSelectionMode = useCallback(() => {
    setIsSelectionMode((prev) => !prev);
    setSelectedBlueprints(new Set());
  }, []);

  const handleSelectBlueprint = useCallback((blueprintId: string) => {
    setSelectedBlueprints((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(blueprintId)) {
        newSet.delete(blueprintId);
      } else {
        newSet.add(blueprintId);
      }
      return newSet;
    });
  }, []);

  const handleSelectAll = useCallback(() => {
    if (selectedBlueprints.size === filteredBlueprints.length) {
      setSelectedBlueprints(new Set());
    } else {
      setSelectedBlueprints(new Set(filteredBlueprints.map((bp) => bp.id)));
    }
  }, [filteredBlueprints, selectedBlueprints.size]);

  const handleBulkDelete = useCallback(async () => {
    if (!user?.id || selectedBlueprints.size === 0) return;

    setDeletionDialog({
      isOpen: true,
      type: 'bulk',
    });
  }, [user?.id, selectedBlueprints]);

  const [resumingBlueprintId, setResumingBlueprintId] = useState<string | null>(null);

  const handleResumeBlueprint = useCallback(
    async (blueprintId: string) => {
      if (resumingBlueprintId) return;

      try {
        setResumingBlueprintId(blueprintId);
        const svc = createBrowserBlueprintService();
        const path = await svc.getNextRouteForBlueprint(blueprintId);

        await new Promise((resolve) => setTimeout(resolve, 300));
        router.push(path);
      } catch (error) {
        console.error('Error determining next route:', error);
        setResumingBlueprintId(null);
        alert('Unable to resume blueprint. Starting from the beginning.');
        router.push(`/static-wizard?bid=${blueprintId}`);
      }
    },
    [router, resumingBlueprintId]
  );

  const getFirstName = () => {
    const rawName =
      (user?.user_metadata?.first_name as string) ||
      (user?.user_metadata?.name as string) ||
      (user?.user_metadata?.full_name as string) ||
      (user?.email as string) ||
      '';
    return rawName.toString().trim().split(' ')[0] || 'User';
  };

  const handleUpgradeCancel = () => {
    setShowUpgradePrompt(false);
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col bg-[#020C1B] text-[rgb(224,224,224)]">
      <div className="flex-1">
        <section className="relative overflow-hidden">
          <div className="relative mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-12">
            <div className="max-w-6xl text-left">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mb-6 sm:mb-8"
              >
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl lg:text-8xl xl:text-9xl">
                  <span>Welcome back, </span>
                  <span className="text-primary">{getFirstName()}</span>
                  <span className="text-white/80">.</span>
                </h1>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mb-8 sm:mb-12"
              >
                <p className="text-base leading-relaxed text-white/70 sm:text-lg md:text-xl lg:text-2xl xl:text-3xl">
                  Your mission control — <span className="text-primary font-medium">chart</span>{' '}
                  learning starmaps, <span className="text-primary font-medium">orchestrate</span>{' '}
                  your constellations,
                  <br className="hidden sm:block" />
                  <span className="sm:hidden"> </span>
                  and <span className="text-primary font-medium">discover</span> insights that
                  illuminate your training universe.
                </p>
              </motion.div>

              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, delay: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="mt-8 h-px w-16 sm:mt-12 sm:w-20 lg:mt-16 lg:w-24"
                style={{
                  background: 'linear-gradient(to right, transparent, #a7dadb, transparent)',
                }}
              />
            </div>
          </div>
        </section>

        <div className="page-enter animate-fade-in-up animate-delay-75 relative z-10 mx-auto max-w-7xl px-4 py-6 pb-32 sm:px-6 lg:px-8">
          <section id="blueprints" className="mb-16 space-y-6">
            <div className="flex flex-col gap-6 lg:flex-row">
              <div className="flex-1 space-y-6">
                <div className="flex flex-col gap-4 sm:gap-6">
                  <div className="flex flex-col gap-3 sm:row sm:items-center sm:justify-between">
                    <h2 className="font-heading text-xl font-bold text-white sm:text-2xl">
                      Your Starmaps
                    </h2>
                    <div className="sm:hidden">
                      <BlueprintUsageDisplay />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="hidden sm:block">
                      <BlueprintUsageDisplay />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <BlueprintFilters
                        blueprints={blueprints}
                        onFilteredBlueprintsChange={setFilteredBlueprints}
                        variant="header"
                      />

                      {isSelectionMode ? (
                        <>
                          <motion.button
                            onClick={handleSelectAll}
                            className="btn-secondary pressable flex min-w-[100px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:min-w-[140px] sm:flex-none sm:px-5"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CheckSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">
                              {selectedBlueprints.size === filteredBlueprints.length
                                ? 'Deselect All'
                                : 'Select All'}
                            </span>
                            <span className="sm:hidden">
                              {selectedBlueprints.size === filteredBlueprints.length
                                ? 'Deselect'
                                : 'All'}
                            </span>
                          </motion.button>

                          {selectedBlueprints.size > 0 && (
                            <motion.button
                              onClick={handleBulkDelete}
                              className="btn-secondary pressable bg-error/10 text-error hover:bg-error/20 border-error/30 flex min-w-[80px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:flex-none sm:px-5"
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete ({selectedBlueprints.size})</span>
                            </motion.button>
                          )}

                          <motion.button
                            onClick={handleToggleSelectionMode}
                            className="btn-secondary pressable flex min-w-[80px] items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:min-w-[100px] sm:px-5"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <span>Cancel</span>
                          </motion.button>
                        </>
                      ) : (
                        <>
                          <motion.button
                            onClick={handleToggleSelectionMode}
                            className="btn-secondary pressable flex min-w-[120px] flex-1 items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm sm:min-w-[140px] sm:flex-none sm:px-5"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <CheckSquare className="h-4 w-4" />
                            <span className="hidden sm:inline">Select & Delete</span>
                            <span className="sm:hidden">Select</span>
                          </motion.button>

                          <Button
                            onClick={handleCreateBlueprint}
                            disabled={creating || isAtCreationLimit}
                            className={cn(
                              'btn-primary pressable min-w-[120px] flex-1 sm:flex-none',
                              isAtCreationLimit && 'cursor-not-allowed opacity-50'
                            )}
                            title={
                              isAtCreationLimit
                                ? "You've reached your limit. Click to upgrade."
                                : undefined
                            }
                          >
                            <Plus className="h-4 w-4" aria-hidden="true" />
                            <span className="hidden sm:inline">
                              {creating
                                ? 'Creating…'
                                : isAtCreationLimit
                                  ? 'Limit Reached'
                                  : 'New Starmap'}
                            </span>
                            <span className="sm:hidden">
                              {creating ? 'Creating…' : isAtCreationLimit ? 'Limit' : 'New'}
                            </span>
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="glass-card animate-fade-in-up p-6"
                        style={{ animationDelay: `${i * 75}ms` }}
                      >
                        <div className="space-y-3">
                          <div className="skeleton-brand h-5 w-1/3 rounded"></div>
                          <div className="skeleton-brand h-4 w-1/2 rounded"></div>
                          <div className="skeleton-brand h-4 w-2/3 rounded"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : blueprints.length === 0 ? (
                  <div className="glass-card animate-fade-in-up p-12 text-center">
                    <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <FileText className="h-8 w-8 text-white/60" />
                    </div>
                    <h3 className="font-heading mb-3 text-lg font-bold text-white">
                      No starmaps yet
                    </h3>
                    <p className="mx-auto mb-8 max-w-md text-sm text-[rgb(176,197,198)]">
                      Get started by creating your first personalized learning starmap with our
                      intelligent wizard.
                    </p>
                    <Button
                      onClick={handleCreateBlueprint}
                      disabled={creating || isAtCreationLimit}
                      className={cn(
                        'btn-primary pressable',
                        isAtCreationLimit && 'cursor-not-allowed opacity-50'
                      )}
                      title={
                        isAtCreationLimit
                          ? "You've reached your limit. Click to upgrade."
                          : undefined
                      }
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                      <span>
                        {creating
                          ? 'Creating…'
                          : isAtCreationLimit
                            ? 'Limit Reached - Upgrade'
                            : 'Create Your First Starmap'}
                      </span>
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:grid-cols-2">
                      {paginatedBlueprints.map((blueprint, idx) => (
                        <BlueprintCard
                          key={blueprint.id}
                          blueprint={blueprint}
                          index={idx}
                          onRename={(bp) => {
                            setRenamingBlueprint(bp);
                          }}
                          onResume={handleResumeBlueprint}
                          onDelete={handleDeleteBlueprint}
                          questionnaireComplete={!!questionnaireCompletion[blueprint.id]}
                          isResuming={resumingBlueprintId === blueprint.id}
                          isSelectionMode={isSelectionMode}
                          isSelected={selectedBlueprints.has(blueprint.id)}
                          onSelect={handleSelectBlueprint}
                        />
                      ))}
                    </div>

                    {totalPages > 1 && (
                      <div className="mt-6 flex flex-col items-center gap-4 border-t border-white/10 pt-6 sm:mt-8">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            className="pressable flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                            aria-label="Previous page"
                          >
                            <ChevronLeft className="h-5 w-5 sm:h-5 sm:w-5" />
                          </button>

                          <div className="flex items-center gap-1 sm:gap-1">
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                              <button
                                key={pageNum}
                                type="button"
                                onClick={() => setCurrentPage(pageNum)}
                                className={`pressable h-12 w-12 rounded-lg text-sm font-medium transition sm:h-10 sm:w-10 ${
                                  currentPage === pageNum
                                    ? 'bg-secondary text-white'
                                    : 'text-white/70 hover:bg-white/10 hover:text-white'
                                }`}
                                aria-label={`Go to page ${pageNum}`}
                              >
                                {pageNum}
                              </button>
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            className="pressable flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 sm:h-10 sm:w-10"
                            aria-label="Next page"
                          >
                            <ChevronRight className="h-5 w-5 sm:h-5 sm:w-5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </section>

          <RenameDialog
            isOpen={!!renamingBlueprint}
            onClose={() => setRenamingBlueprint(null)}
            onConfirm={handleRenameBlueprint}
            currentName={
              renamingBlueprint?.title || `Starmap #${renamingBlueprint?.id.slice(0, 8)}`
            }
            title="Rename Starmap"
            description="Enter a new name for your starmap"
            placeholder="Starmap name"
            maxLength={80}
          />

          <ConfirmationDialog
            isOpen={deletionDialog.isOpen}
            onClose={() => setDeletionDialog({ isOpen: false, type: 'single' })}
            onConfirm={handleConfirmDelete}
            title="Confirm Deletion"
            description="This action cannot be undone."
            variant="destructive"
            itemName="starmap"
            itemCount={deletionDialog.type === 'bulk' ? selectedBlueprints.size : 1}
          />

          <DesktopOnlyModal
            open={showDesktopOnlyModal}
            onOpenChange={setShowDesktopOnlyModal}
            featureName="Starmap Creation"
          />

          <UpgradePromptModal
            open={showUpgradePrompt}
            onOpenChange={(open) => {
              if (!open) {
                handleUpgradeCancel();
              }
            }}
            currentTier={'explorer'}
          />
        </div>
      </div>
    </div>
  );
}

export default function StarmapsPage() {
  return (
    <ProtectedRoute>
      <StarmapsContent />
    </ProtectedRoute>
  );
}
