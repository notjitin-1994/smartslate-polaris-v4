'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Clock, Eye, Trash2, Calendar } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useBlueprintLimits } from '@/lib/hooks/useBlueprintLimits';
import { UpgradePromptModal } from '@/components/modals/UpgradePromptModal';
import { cn } from '@/lib/utils';

interface Blueprint {
  id: string;
  title: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export function RecentBlueprintsCard() {
  const { user } = useAuth();
  const router = useRouter();
  const [blueprints, setBlueprints] = useState<Blueprint[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);
  const { canCreate, isAtCreationLimit } = useBlueprintLimits();

  useEffect(() => {
    async function fetchBlueprints() {
      if (!user?.id) return;

      const supabase = getSupabaseBrowserClient();
      const { data, error } = await supabase
        .from('blueprint_generator')
        .select('id, title, status, created_at, updated_at')
        .eq('user_id', user.id)
        .is('deleted_at', null) // Exclude soft-deleted blueprints
        .order('updated_at', { ascending: false })
        .limit(5);

      if (!error && data) {
        setBlueprints(data);
      }
      setLoading(false);
    }

    fetchBlueprints();
  }, [user?.id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'generating':
        return 'text-primary bg-primary/10 border-primary/20';
      case 'error':
        return 'text-primary bg-primary/10 border-primary/20';
      default:
        return 'text-text-secondary bg-neutral-200/50 border-neutral-300';
    }
  };

  const handleCreateClick = () => {
    if (isAtCreationLimit) {
      setShowUpgradePrompt(true);
      return;
    }
    router.push('/static-wizard');
  };

  const handleUpgradeClick = () => {
    router.push('/pricing');
  };

  const handleUpgradeCancel = () => {
    setShowUpgradePrompt(false);
  };

  return (
    <GlassCard className="p-6 sm:p-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="from-primary to-primary flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br">
            <FileText className="h-5 w-5 text-black" />
          </div>
          <div>
            <h3 className="text-title text-foreground font-bold">Recent Starmaps</h3>
            <p className="text-caption text-text-secondary">Your latest blueprints</p>
          </div>
        </div>
        <Link href="/my-starmaps">
          <Button className="bg-primary hover:bg-primary/90 text-xs text-black">View All</Button>
        </Link>
      </div>

      {/* Blueprints List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-lg bg-neutral-200/50" />
          ))}
        </div>
      ) : blueprints.length === 0 ? (
        <div className="py-12 text-center">
          <FileText className="text-text-secondary mx-auto mb-3 h-12 w-12 opacity-50" />
          <p className="text-body text-text-secondary mb-4">No starmaps yet</p>
          <Button
            className={cn('btn-primary', isAtCreationLimit && 'cursor-not-allowed opacity-50')}
            onClick={handleCreateClick}
            disabled={isAtCreationLimit}
            title={
              isAtCreationLimit ? "You've reached your limit. Upgrade to create more." : undefined
            }
          >
            {isAtCreationLimit ? 'Limit Reached - Upgrade' : 'Create Your First Starmap'}
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {blueprints.map((blueprint, index) => (
            <motion.div
              key={blueprint.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blueprint/${blueprint.id}`}>
                <div className="group hover:border-primary/50 bg-paper hover:bg-primary/5 cursor-pointer rounded-xl border border-neutral-200 p-4 transition-all duration-200">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <h4 className="text-body text-foreground group-hover:text-primary mb-1 truncate font-semibold transition-colors">
                        {blueprint.title || 'Untitled Blueprint'}
                      </h4>
                      <div className="text-caption text-text-secondary flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>{formatDate(blueprint.updated_at)}</span>
                        </div>
                        <div
                          className={`rounded-full border px-2 py-0.5 text-xs ${getStatusColor(blueprint.status)}`}
                        >
                          {blueprint.status}
                        </div>
                      </div>
                    </div>
                    <Eye className="text-text-secondary group-hover:text-primary h-4 w-4 flex-shrink-0 transition-colors" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        isOpen={showUpgradePrompt}
        onClose={handleUpgradeCancel}
        onUpgrade={handleUpgradeClick}
        userId={user?.id}
      />
    </GlassCard>
  );
}
