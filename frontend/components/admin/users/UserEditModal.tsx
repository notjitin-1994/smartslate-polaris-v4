'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Save, AlertCircle, Shield, Crown, ChevronDown, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GlassCard } from '@/components/ui/GlassCard';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface User {
  user_id: string;
  email: string;
  full_name: string | null;
  user_role: string;
  subscription_tier: string;
  blueprint_creation_count: number;
  blueprint_creation_limit: number;
  blueprint_saving_count: number;
  blueprint_saving_limit: number;
}

interface UserEditModalProps {
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

const USER_ROLES = [
  { value: 'user', label: 'User', description: 'Standard user access', icon: null },
  {
    value: 'developer',
    label: 'Developer',
    description: 'Development and admin access',
    icon: Shield,
  },
  { value: 'admin', label: 'Admin', description: 'Full system administrative access', icon: Crown },
];

const SUBSCRIPTION_TIERS = [
  { value: 'free', label: 'Free', description: '2 generations, 2 saved blueprints' },
  { value: 'explorer', label: 'Explorer', description: '5 generations, 5 saved blueprints' },
  { value: 'navigator', label: 'Navigator', description: '25 generations, 25 saved blueprints' },
  { value: 'voyager', label: 'Voyager', description: '50 generations, 50 saved blueprints' },
  {
    value: 'crew',
    label: 'Crew Member',
    description: '10 generations, 10 saved blueprints',
  },
  {
    value: 'fleet',
    label: 'Fleet Member',
    description: '30 generations, 30 saved blueprints',
  },
  {
    value: 'armada',
    label: 'Armada Member',
    description: '60 generations, 60 saved blueprints',
  },
];

interface FormErrors {
  full_name?: string;
}

export function UserEditModal({ user, onClose, onSuccess }: UserEditModalProps) {
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    user_role: user.user_role,
    subscription_tier: user.subscription_tier,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasChanges, setHasChanges] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        // Get response text first to check if it's JSON
        const text = await response.text();
        let errorMessage = 'Failed to update user';

        try {
          // Try to parse as JSON
          const data = JSON.parse(text);
          errorMessage = data.error || data.message || errorMessage;
        } catch (parseError) {
          // Not JSON - likely HTML error page
          console.error('Non-JSON response from API:', {
            status: response.status,
            statusText: response.statusText,
            contentType: response.headers.get('content-type'),
            responsePreview: text.substring(0, 200),
          });
          errorMessage = `API error (${response.status}): ${response.statusText}. Check console for details.`;
        }

        throw new Error(errorMessage);
      }

      onSuccess();
    } catch (err) {
      console.error('User update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value });
    setHasChanges(true);
    // Clear field-specific error when user starts typing
    if (formErrors[field as keyof FormErrors]) {
      setFormErrors({ ...formErrors, [field]: undefined });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl bg-[#020C1B] shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-white/10 bg-[#020C1B]/95 p-6 backdrop-blur-sm">
          <div>
            <h2 className="text-2xl font-bold text-white">Edit User</h2>
            <p className="mt-1 text-sm text-white/60">{user.email}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-white/60 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <form
          onSubmit={handleSubmit}
          className="overflow-y-auto p-6"
          style={{ maxHeight: 'calc(90vh - 160px)' }}
        >
          <div className="space-y-6">
            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start space-x-3 rounded-lg border border-red-500/30 bg-red-500/10 p-4"
              >
                <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
                <div>
                  <p className="text-sm font-medium text-red-400">Error updating user</p>
                  <p className="mt-1 text-xs text-red-300/80">{error}</p>
                </div>
              </motion.div>
            )}

            {/* Basic Info */}
            <GlassCard>
              <h3 className="mb-4 text-sm font-semibold text-white">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Email (Read-only)
                  </label>
                  <input
                    type="text"
                    value={user.email}
                    disabled
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">Full Name</label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-white transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
                    placeholder="Enter full name"
                  />
                </div>
              </div>
            </GlassCard>

            {/* Role & Tier */}
            <GlassCard>
              <h3 className="mb-4 text-sm font-semibold text-white">Role & Subscription</h3>

              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">User Role</label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-white/10"
                      >
                        <div className="flex items-center">
                          {(() => {
                            const selectedRole = USER_ROLES.find(
                              (r) => r.value === formData.user_role
                            );
                            const Icon = selectedRole?.icon;
                            return (
                              <>
                                {Icon && <Icon className="mr-2 h-4 w-4" />}
                                <span>{selectedRole?.label || 'Select Role'}</span>
                              </>
                            );
                          })()}
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[300px] border-white/10 bg-[#020C1B]/95 backdrop-blur-sm">
                      {USER_ROLES.map((role) => {
                        const Icon = role.icon;
                        const isSelected = formData.user_role === role.value;
                        return (
                          <DropdownMenuItem
                            key={role.value}
                            onClick={() => handleChange('user_role', role.value)}
                            className={`flex cursor-pointer items-center text-white hover:bg-white/10 focus:bg-white/10 ${
                              isSelected ? 'bg-cyan-500/20 text-cyan-400' : ''
                            }`}
                          >
                            <div className="flex flex-1 items-center">
                              {Icon && <Icon className="mr-3 h-4 w-4" />}
                              <div className="flex flex-col">
                                <span className="font-medium">{role.label}</span>
                                <span className="text-xs text-white/60">{role.description}</span>
                              </div>
                            </div>
                            {isSelected && <Check className="ml-2 h-4 w-4 text-cyan-400" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="mt-2 text-xs text-white/40">
                    User role determines access level and permissions
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-white/70">
                    Subscription Tier
                  </label>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-between border-white/10 bg-white/5 text-white hover:border-cyan-500/50 hover:bg-white/10"
                      >
                        <div className="flex items-center">
                          <span>
                            {SUBSCRIPTION_TIERS.find((t) => t.value === formData.subscription_tier)
                              ?.label || 'Select Tier'}
                          </span>
                        </div>
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-full min-w-[300px] border-white/10 bg-[#020C1B]/95 backdrop-blur-sm">
                      {SUBSCRIPTION_TIERS.map((tier) => {
                        const isSelected = formData.subscription_tier === tier.value;
                        return (
                          <DropdownMenuItem
                            key={tier.value}
                            onClick={() => handleChange('subscription_tier', tier.value)}
                            className={`flex cursor-pointer items-center text-white hover:bg-white/10 focus:bg-white/10 ${
                              isSelected ? 'bg-cyan-500/20 text-cyan-400' : ''
                            }`}
                          >
                            <div className="flex flex-1 flex-col">
                              <span className="font-medium">{tier.label}</span>
                              <span className="text-xs text-white/60">{tier.description}</span>
                            </div>
                            {isSelected && <Check className="ml-2 h-4 w-4 text-cyan-400" />}
                          </DropdownMenuItem>
                        );
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <p className="mt-2 text-xs text-white/40">
                    Subscription tier controls usage limits and features. Limits will be
                    automatically updated based on tier.
                  </p>
                </div>
              </div>
            </GlassCard>
          </div>
        </form>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-between border-t border-white/10 bg-[#020C1B]/95 p-6 backdrop-blur-sm">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-white/10 bg-white/5 text-white hover:bg-white/10"
          >
            Cancel
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={saving || !hasChanges}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600 disabled:opacity-50"
          >
            {saving ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
