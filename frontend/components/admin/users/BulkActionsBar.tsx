'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Shield, Crown, X, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';

interface BulkActionsBarProps {
  selectedCount: number;
  onClear: () => void;
  onRefresh: () => void;
  selectedUserIds: string[];
}

const USER_ROLES = [
  { value: 'user', label: 'User', icon: null },
  { value: 'developer', label: 'Developer', icon: Shield },
  { value: 'admin', label: 'Admin', icon: Crown },
];

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free' },
  { value: 'explorer', label: 'Explorer' },
  { value: 'navigator', label: 'Navigator' },
  { value: 'voyager', label: 'Voyager' },
  { value: 'crew_member', label: 'Crew Member' },
  { value: 'fleet_member', label: 'Fleet Member' },
  { value: 'armada_member', label: 'Armada Member' },
];

export function BulkActionsBar({
  selectedCount,
  onClear,
  onRefresh,
  selectedUserIds,
}: BulkActionsBarProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  const handleBulkAction = async (action: string, data?: { role?: string; tier?: string }) => {
    setIsProcessing(true);

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          userIds: selectedUserIds,
          data,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        // Show success notification
        console.log('Bulk action successful:', result);
        onClear();
        await onRefresh();
      } else {
        const error = await response.json();
        // Show error notification
        console.error('Bulk action failed:', error);
      }
    } catch (error) {
      console.error('Bulk action error:', error);
      // Show error notification
    } finally {
      setIsProcessing(false);
      setShowConfirmDelete(false);
    }
  };

  const handleBulkDelete = () => {
    if (!showConfirmDelete) {
      setShowConfirmDelete(true);
      return;
    }
    handleBulkAction('bulk_delete');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <GlassCard className="border-l-4 border-cyan-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-cyan-500/20">
              <Check className="h-5 w-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {selectedCount} user{selectedCount !== 1 ? 's' : ''} selected
              </p>
              <p className="text-xs text-white/60">Choose an action to perform</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Bulk Change Role */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="small"
                  disabled={isProcessing}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Shield className="mr-2 h-4 w-4" />
                  Change Role
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Select New Role</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {USER_ROLES.map((role) => {
                  const Icon = role.icon;
                  return (
                    <DropdownMenuItem
                      key={role.value}
                      onClick={() => handleBulkAction('bulk_update_role', { role: role.value })}
                    >
                      {Icon && <Icon className="mr-2 h-4 w-4" />}
                      {role.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Change Tier */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="small"
                  disabled={isProcessing}
                  className="border-white/10 bg-white/5 text-white hover:bg-white/10"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Change Tier
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Select New Tier</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {SUBSCRIPTION_TIERS.map((tier) => (
                  <DropdownMenuItem
                    key={tier.value}
                    onClick={() => handleBulkAction('bulk_update_tier', { tier: tier.value })}
                  >
                    {tier.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Bulk Delete */}
            <Button
              variant={showConfirmDelete ? 'destructive' : 'outline'}
              size="small"
              onClick={handleBulkDelete}
              disabled={isProcessing}
              className={
                showConfirmDelete
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'border-white/10 bg-white/5 text-red-400 hover:bg-red-500/10'
              }
            >
              {showConfirmDelete ? (
                <>
                  <AlertCircle className="mr-2 h-4 w-4" />
                  Confirm Delete
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </>
              )}
            </Button>

            {/* Cancel/Clear Selection */}
            <Button
              variant="ghost"
              size="small"
              onClick={onClear}
              disabled={isProcessing}
              className="text-white/60 hover:text-white"
            >
              <X className="mr-2 h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>

        {/* Confirmation Warning */}
        {showConfirmDelete && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 flex items-start space-x-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3"
          >
            <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Warning: Irreversible Action</p>
              <p className="mt-1 text-xs text-red-300/80">
                You are about to delete {selectedCount} user{selectedCount !== 1 ? 's' : ''}. This
                action cannot be undone. Click "Confirm Delete" again to proceed or "Clear" to
                cancel.
              </p>
            </div>
          </motion.div>
        )}

        {/* Processing State */}
        {isProcessing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 flex items-center space-x-3 rounded-lg bg-cyan-500/10 p-3"
          >
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
            <p className="text-sm text-cyan-400">Processing bulk action...</p>
          </motion.div>
        )}
      </GlassCard>
    </motion.div>
  );
}
