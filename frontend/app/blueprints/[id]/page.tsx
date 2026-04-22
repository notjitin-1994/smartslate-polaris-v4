'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Eye,
  Code,
  RefreshCw,
  Download,
  User,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { InteractiveBlueprintDashboard } from '@/components/blueprint/InteractiveBlueprintDashboard';
import type { BlueprintJSON } from '@/components/blueprint/types';

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
  user: {
    user_id: string;
    email: string;
    full_name: string | null;
  };
}

const STATUS_CONFIG: Record<
  BlueprintStatus,
  { label: string; icon: any; color: string; bgColor: string }
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

export default function BlueprintViewPage() {
  const router = useRouter();
  const params = useParams();
  const blueprintId = params.id as string;

  const [blueprint, setBlueprint] = useState<Blueprint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'report' | 'markdown'>('report');

  const fetchBlueprint = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/admin/blueprints/${blueprintId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Failed to fetch blueprint (${response.status})`);
      }

      const data = await response.json();
      setBlueprint(data.blueprint);
    } catch (err) {
      console.error('Failed to fetch blueprint:', err);
      setError(err instanceof Error ? err.message : 'Failed to load blueprint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlueprint();
  }, [blueprintId]);

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadMarkdown = () => {
    if (!blueprint?.blueprint_markdown) return;

    const blob = new Blob([blueprint.blueprint_markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${blueprintId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
              <p className="text-white/60">Loading blueprint...</p>
            </div>
          </GlassCard>
        </div>
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <GlassCard className="p-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="rounded-full bg-red-500/10 p-6">
                <FileText className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-semibold text-white">Failed to Load Blueprint</h3>
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
                  onClick={fetchBlueprint}
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

  const statusConfig = STATUS_CONFIG[blueprint.status];
  const StatusIcon = statusConfig.icon;

  return (
    <div className="relative min-h-screen w-full bg-[#020C1B] text-[rgb(224,224,224)]">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => router.back()}
                  className="text-white/60 hover:text-white"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20">
                  <FileText className="h-8 w-8 text-cyan-400" />
                </div>
                <div>
                  <h1 className="font-heading text-4xl font-bold tracking-tight text-white sm:text-5xl">
                    Blueprint <span className="text-primary">Viewer</span>
                  </h1>
                  <p className="mt-2 text-lg text-white/70">
                    {blueprint.user.full_name || blueprint.user.email}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                size="small"
                onClick={downloadMarkdown}
                disabled={!blueprint.blueprint_markdown}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10"
              >
                <Download className="mr-2 h-4 w-4" />
                Download
              </Button>
            </div>
          </motion.div>

          {/* Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="grid gap-6 md:grid-cols-3"
          >
            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Status</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${statusConfig.bgColor}`}
                    >
                      <StatusIcon
                        className={`h-4 w-4 ${statusConfig.color} ${blueprint.status === 'generating' ? 'animate-spin' : ''}`}
                      />
                    </div>
                    <span className="text-lg font-semibold text-white">{statusConfig.label}</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Owner</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                      <User className="h-4 w-4 text-purple-400" />
                    </div>
                    <span className="truncate text-lg font-semibold text-white">
                      {blueprint.user.full_name || blueprint.user.email}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-white/60">Created</p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                      <Calendar className="h-4 w-4 text-cyan-400" />
                    </div>
                    <span className="text-lg font-semibold text-white">
                      {new Date(blueprint.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <GlassCard className="p-0">
              {/* Tab Headers */}
              <div className="flex border-b border-white/10">
                <button
                  onClick={() => setActiveTab('report')}
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                    activeTab === 'report'
                      ? 'border-b-2 border-cyan-500 bg-cyan-500/5 text-cyan-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Report View
                </button>
                <button
                  onClick={() => setActiveTab('markdown')}
                  className={`flex flex-1 items-center justify-center gap-2 px-6 py-4 font-medium transition-all ${
                    activeTab === 'markdown'
                      ? 'border-b-2 border-cyan-500 bg-cyan-500/5 text-cyan-400'
                      : 'text-white/60 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  Markdown View
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'report' ? (
                  <div>
                    {blueprint.status === 'completed' && blueprint.blueprint_json ? (
                      <div className="space-y-8">
                        {/* Executive Summary */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2, duration: 0.4 }}
                          className="relative"
                        >
                          <h2 className="mb-4 text-xl font-semibold text-white">
                            Executive Summary
                          </h2>
                          <div className="space-y-4">
                            {(() => {
                              const blueprintData = blueprint.blueprint_json as any;
                              const executiveSummary =
                                blueprintData?.executive_summary?.content ||
                                blueprintData?.executive_summary ||
                                'No executive summary available.';

                              return executiveSummary
                                .split(/\.\s+/)
                                .filter(Boolean)
                                .map((sentence: string, index: number) => (
                                  <p
                                    key={index}
                                    className="text-lg leading-relaxed text-white/90 sm:text-xl"
                                  >
                                    {sentence.trim()}
                                    {sentence.trim().endsWith('.') ? '' : '.'}
                                  </p>
                                ));
                            })()}
                          </div>
                        </motion.div>

                        {/* Blueprint Dashboard */}
                        <InteractiveBlueprintDashboard
                          blueprint={blueprint.blueprint_json as BlueprintJSON}
                          blueprintId={blueprint.id}
                          isPublicView={true}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="rounded-full bg-white/5 p-6">
                          {blueprint.status === 'generating' ? (
                            <Loader2 className="h-12 w-12 animate-spin text-blue-400" />
                          ) : blueprint.status === 'error' ? (
                            <AlertCircle className="h-12 w-12 text-red-400" />
                          ) : (
                            <FileText className="h-12 w-12 text-white/40" />
                          )}
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-white">
                          {blueprint.status === 'generating'
                            ? 'Blueprint is being generated...'
                            : blueprint.status === 'error'
                              ? 'Blueprint generation failed'
                              : 'Blueprint not yet completed'}
                        </h3>
                        <p className="mt-2 text-sm text-white/60">
                          {blueprint.status === 'generating'
                            ? 'Please check back in a few moments'
                            : blueprint.status === 'error'
                              ? 'An error occurred during generation'
                              : 'The blueprint has not been generated yet'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {blueprint.blueprint_markdown ? (
                      <div className="rounded-lg border border-white/10 bg-black/20 p-6">
                        <pre className="overflow-x-auto text-sm text-white/90">
                          <code>{blueprint.blueprint_markdown}</code>
                        </pre>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-16">
                        <div className="rounded-full bg-white/5 p-6">
                          <Code className="h-12 w-12 text-white/40" />
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-white">
                          No Markdown Available
                        </h3>
                        <p className="mt-2 text-sm text-white/60">
                          The markdown version of this blueprint has not been generated yet
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
