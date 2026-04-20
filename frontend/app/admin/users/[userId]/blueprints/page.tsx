'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
  Download,
  Trash2,
  Filter,
  TrendingUp,
  FileCheck,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useToast } from '@/src/components/ui/Toast';

type BlueprintStatus = 'draft' | 'generating' | 'completed' | 'error';

interface Blueprint {
  id: string;
  user_id: string;
  status: BlueprintStatus;
  static_answers: any;
  dynamic_questions: any;
  dynamic_answers: any;
  blueprint_json: any;
  blueprint_markdown: string | null;
  created_at: string;
  updated_at: string;
}

interface UserInfo {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface BlueprintData {
  user: UserInfo;
  blueprints: Blueprint[];
  stats: {
    draft: number;
    generating: number;
    completed: number;
    error: number;
  };
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

const STATUS_CONFIG: Record<
  BlueprintStatus,
  { label: string; icon: typeof FileText; color: string; bgColor: string }
> = {
  draft: {
    label: 'Draft',
    icon: FileText,
    color: 'text-gray-400',
    bgColor: 'bg-gray-500/10',
  },
  generating: {
    label: 'Generating',
    icon: Loader2,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/10',
  },
  completed: {
    label: 'Completed',
    icon: CheckCircle2,
    color: 'text-green-400',
    bgColor: 'bg-green-500/10',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    color: 'text-red-400',
    bgColor: 'bg-red-500/10',
  },
};

export default function UserBlueprintsPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.userId as string;
  const { showSuccess, showError } = useToast();

  const [data, setData] = useState<BlueprintData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BlueprintStatus | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    blueprintId: string | null;
    blueprintTitle: string;
  }>({
    isOpen: false,
    blueprintId: null,
    blueprintTitle: '',
  });

  const fetchBlueprints = async (page: number) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });

      console.log('[Blueprints Page] Fetching blueprints for user:', userId);
      const response = await fetch(`/api/admin/users/${userId}/blueprints?${params}`);

      console.log('[Blueprints Page] Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[Blueprints Page] API error:', errorData);
        throw new Error(errorData.error || `Failed to fetch blueprints (${response.status})`);
      }

      const blueprintData = await response.json();
      console.log('[Blueprints Page] Blueprint data received:', {
        total: blueprintData.pagination?.total || 0,
        blueprints: blueprintData.blueprints?.length || 0,
      });
      setData(blueprintData);
    } catch (err) {
      console.error('[Blueprints Page] Failed to fetch blueprints:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blueprints');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprints(currentPage);
  }, [userId, statusFilter, currentPage]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchBlueprints(currentPage);
    setRefreshing(false);
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getBlueprintTitle = (blueprint: Blueprint): string => {
    // Try to extract title from static_answers or dynamic_answers
    const staticAnswers = blueprint.static_answers as any;
    if (staticAnswers?.learningGoal) {
      return (
        staticAnswers.learningGoal.slice(0, 60) +
        (staticAnswers.learningGoal.length > 60 ? '...' : '')
      );
    }
    return `Blueprint ${blueprint.id.slice(0, 8)}`;
  };

  const handleDownload = async (blueprint: Blueprint) => {
    if (!blueprint.blueprint_markdown) {
      showError('No markdown content available for download');
      return;
    }

    setDownloadingIds((prev) => new Set(prev).add(blueprint.id));

    try {
      const blob = new Blob([blueprint.blueprint_markdown], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `blueprint-${blueprint.id}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showSuccess('Blueprint downloaded successfully');
    } catch (err) {
      console.error('Failed to download blueprint:', err);
      showError('Failed to download blueprint');
    } finally {
      setDownloadingIds((prev) => {
        const next = new Set(prev);
        next.delete(blueprint.id);
        return next;
      });
    }
  };

  const handleDeleteClick = (blueprint: Blueprint) => {
    setConfirmDialog({
      isOpen: true,
      blueprintId: blueprint.id,
      blueprintTitle: getBlueprintTitle(blueprint),
    });
  };

  const handleDeleteConfirm = async () => {
    const blueprintId = confirmDialog.blueprintId;
    if (!blueprintId) return;

    setDeletingIds((prev) => new Set(prev).add(blueprintId));

    try {
      const response = await fetch(`/api/admin/blueprints/${blueprintId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Failed to delete blueprint');
      }

      showSuccess('Blueprint deleted successfully');

      // Close dialog
      setConfirmDialog({
        isOpen: false,
        blueprintId: null,
        blueprintTitle: '',
      });

      // Refresh the blueprints list
      await fetchBlueprints(currentPage);
    } catch (err) {
      console.error('Failed to delete blueprint:', err);
      showError(err instanceof Error ? err.message : 'Failed to delete blueprint');
    } finally {
      setDeletingIds((prev) => {
        const next = new Set(prev);
        next.delete(blueprintId);
        return next;
      });
    }
  };

  if (loading && !data) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-white/60">Loading blueprints...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-6">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Failed to Load Blueprints</h3>
              <p className="text-white/60">{error || 'An unexpected error occurred'}</p>
              <div className="flex items-center gap-4">
                <Button
                  variant="outline"
                  onClick={() => router.back()}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>
                <Button
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center space-x-4">
              <Link href="/admin/users">
                <Button variant="ghost" size="icon" className="text-white/60 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                <FileText className="h-8 w-8 text-purple-400" />
              </div>
              <div>
                <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                  User <span className="text-primary">Blueprints</span>
                </h1>
                <p className="mt-2 text-lg text-white/70">
                  {data.user.full_name || data.user.email}
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="small"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-4"
          >
            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Total Blueprints</p>
                  <p className="mt-2 text-3xl font-bold text-white">{data.pagination.total}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-600/20">
                  <TrendingUp className="h-6 w-6 text-cyan-400" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Completed</p>
                  <p className="mt-2 text-3xl font-bold text-green-400">{data.stats.completed}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500/20 to-green-600/20">
                  <FileCheck className="h-6 w-6 text-green-400" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Draft</p>
                  <p className="mt-2 text-3xl font-bold text-gray-400">{data.stats.draft}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-gray-500/20 to-gray-600/20">
                  <FileText className="h-6 w-6 text-gray-400" />
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Error</p>
                  <p className="mt-2 text-3xl font-bold text-red-400">{data.stats.error}</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20">
                  <AlertCircle className="h-6 w-6 text-red-400" />
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <GlassCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-white/40" />
                  <span className="text-sm text-white/60">Filter by status:</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant={statusFilter === 'all' ? 'primary' : 'outline'}
                    size="small"
                    onClick={() => {
                      setStatusFilter('all');
                      setCurrentPage(1);
                    }}
                    className={
                      statusFilter === 'all'
                        ? 'bg-cyan-500 text-white'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                    }
                  >
                    All
                  </Button>
                  {(['completed', 'draft', 'generating', 'error'] as BlueprintStatus[]).map(
                    (status) => (
                      <Button
                        key={status}
                        variant={statusFilter === status ? 'primary' : 'outline'}
                        size="small"
                        onClick={() => {
                          setStatusFilter(status);
                          setCurrentPage(1);
                        }}
                        className={
                          statusFilter === status
                            ? 'bg-cyan-500 text-white'
                            : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                        }
                      >
                        {STATUS_CONFIG[status].label}
                      </Button>
                    )
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Blueprints List */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard className="p-6">
              <div className="space-y-4">
                {data.blueprints && data.blueprints.length > 0 ? (
                  data.blueprints.map((blueprint, index) => {
                    const statusConfig = STATUS_CONFIG[blueprint.status];
                    const StatusIcon = statusConfig.icon;
                    const title = getBlueprintTitle(blueprint);

                    return (
                      <motion.div
                        key={blueprint.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className="group relative flex items-start justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-all hover:border-cyan-500/20 hover:bg-white/5"
                      >
                        {/* Left side - Content */}
                        <div className="flex flex-1 items-start space-x-4">
                          {/* Status Icon */}
                          <div
                            className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg ${statusConfig.bgColor}`}
                          >
                            <StatusIcon
                              className={`h-6 w-6 ${statusConfig.color} ${blueprint.status === 'generating' ? 'animate-spin' : ''}`}
                            />
                          </div>

                          {/* Content */}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-semibold text-white">{title}</h4>
                              <Badge
                                variant="outline"
                                className={`${statusConfig.bgColor} ${statusConfig.color} border-transparent`}
                              >
                                {statusConfig.label}
                              </Badge>
                            </div>
                            <div className="mt-2 flex items-center gap-4 text-xs text-white/40">
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                <span>Created {formatTimestamp(blueprint.created_at)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                <span>Updated {formatTimestamp(blueprint.updated_at)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right side - Actions */}
                        <div className="flex items-center gap-2">
                          {blueprint.status === 'completed' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-white/60 hover:text-white"
                                onClick={() => handleDownload(blueprint)}
                                disabled={downloadingIds.has(blueprint.id)}
                                title="Download Markdown"
                              >
                                <Download
                                  className={`h-4 w-4 ${downloadingIds.has(blueprint.id) ? 'animate-pulse' : ''}`}
                                />
                              </Button>
                            </>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-cyan-400/60 hover:text-cyan-400"
                            onClick={() =>
                              router.push(`/admin/users/${userId}/blueprints/${blueprint.id}`)
                            }
                            title="View Blueprint Details"
                          >
                            <Info className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-400/60 hover:text-red-400"
                            onClick={() => handleDeleteClick(blueprint)}
                            disabled={deletingIds.has(blueprint.id)}
                            title="Delete Blueprint"
                          >
                            <Trash2
                              className={`h-4 w-4 ${deletingIds.has(blueprint.id) ? 'animate-spin' : ''}`}
                            />
                          </Button>
                        </div>
                      </motion.div>
                    );
                  })
                ) : (
                  <div className="flex flex-col items-center justify-center py-16">
                    <div className="rounded-full bg-white/5 p-6">
                      <FileText className="h-12 w-12 text-white/40" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-white">No Blueprints Found</h3>
                    <p className="mt-2 text-sm text-white/60">
                      {statusFilter !== 'all'
                        ? `This user has no ${statusFilter} blueprints`
                        : "This user hasn't created any blueprints yet"}
                    </p>
                  </div>
                )}
              </div>

              {/* Pagination */}
              {data.pagination.totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4">
                  <div className="text-sm text-white/60">
                    Page {currentPage} of {data.pagination.totalPages}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="small"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1 || loading}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="small"
                      onClick={() =>
                        setCurrentPage((p) => Math.min(data.pagination.totalPages, p + 1))
                      }
                      disabled={currentPage === data.pagination.totalPages || loading}
                      className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </GlassCard>
          </motion.div>
        </div>
      </div>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({
            isOpen: false,
            blueprintId: null,
            blueprintTitle: '',
          })
        }
        onConfirm={handleDeleteConfirm}
        title="Delete Blueprint"
        message={`Are you sure you want to delete "${confirmDialog.blueprintTitle}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        isLoading={confirmDialog.blueprintId ? deletingIds.has(confirmDialog.blueprintId) : false}
      />
    </div>
  );
}
