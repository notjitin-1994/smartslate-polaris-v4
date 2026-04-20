'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { GlassCard } from '@/components/ui/GlassCard';
import {
  MoreHorizontal,
  Edit,
  Trash2,
  Eye,
  UserPlus,
  Download,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  X,
  Mail,
  Shield,
  Crown,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  FileText,
  Ban,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { UserEditModal } from './UserEditModal';
import { UserDetailsModal } from './UserDetailsModal';
import { BulkActionsBar } from './BulkActionsBar';
import { AdvancedFilters } from './AdvancedFilters';
import { ExportDialog } from './ExportDialog';

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
  created_at: string;
  last_sign_in_at: string | null;
  updated_at: string;
  deleted_at: string | null;
  usage_metadata?: {
    last_active?: string;
    total_sessions?: number;
    avg_session_duration?: number;
  };
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface SortConfig {
  field: string;
  order: 'asc' | 'desc';
}

interface FilterConfig {
  search: string;
  role: string;
  tier: string;
  status: 'all' | 'active' | 'inactive' | 'deleted';
  dateRange: { start: string; end: string } | null;
  usageRange: { min: number; max: number } | null;
}

export function UserManagementTable() {
  const router = useRouter();

  // State management
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  // Modal states
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [showExportDialog, setShowExportDialog] = useState(false);

  // Filter and sort states
  const [showFilters, setShowFilters] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    field: 'created_at',
    order: 'desc',
  });
  const [filters, setFilters] = useState<FilterConfig>({
    search: '',
    role: '',
    tier: '',
    status: 'all',
    dateRange: null,
    usageRange: null,
  });

  // Debounced search
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch users with all filters and sorting
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: sortConfig.field,
        sortOrder: sortConfig.order,
        ...(filters.search && { search: filters.search }),
        ...(filters.role && { role: filters.role }),
        ...(filters.tier && { tier: filters.tier }),
        ...(filters.status !== 'all' && { status: filters.status }),
      });

      console.log('[UserManagementTable] Fetching users with params:', Object.fromEntries(params));

      const response = await fetch(`/api/admin/users?${params}`);
      const data = await response.json();

      console.log('[UserManagementTable] API response:', {
        usersCount: data.users?.length || 0,
        pagination: data.pagination,
        filters: data.filters,
        hasError: !!data.error,
      });

      if (data.users) {
        setUsers(data.users);
        setPagination(data.pagination);
      } else if (data.error) {
        console.error('[UserManagementTable] API returned error:', data.error);
      }
    } catch (error) {
      console.error('[UserManagementTable] Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, sortConfig, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchQuery }));
      setPagination((prev) => ({ ...prev, page: 1 })); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Refresh data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  };

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedUsers(new Set(users.map((u) => u.user_id)));
    } else {
      setSelectedUsers(new Set());
    }
  };

  const handleSelectUser = (userId: string, checked: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked) {
      newSelected.add(userId);
    } else {
      newSelected.delete(userId);
    }
    setSelectedUsers(newSelected);
  };

  // Sort handler
  const handleSort = (field: string) => {
    setSortConfig((prev) => ({
      field,
      order: prev.field === field && prev.order === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Delete handler
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
        // Show success notification
      } else {
        // Show error notification
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      // Show error notification
    }
  };

  // Badge variants
  const getRoleBadgeVariant = (
    role: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      developer: 'destructive',
      admin: 'default',
      user: 'outline',
    };
    return variants[role] || 'outline';
  };

  const getTierBadgeVariant = (
    tier: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      armada_member: 'destructive',
      fleet_member: 'default',
      crew_member: 'default',
      voyager: 'secondary',
      navigator: 'secondary',
      explorer: 'outline',
      free: 'outline',
    };
    return variants[tier] || 'outline';
  };

  // Get user status indicator
  const getUserStatus = (user: User) => {
    if (user.deleted_at) {
      return { label: 'Deleted', color: 'bg-red-500', icon: Ban };
    }

    const lastActive = user.usage_metadata?.last_active
      ? new Date(user.usage_metadata.last_active)
      : user.last_sign_in_at
        ? new Date(user.last_sign_in_at)
        : null;

    if (!lastActive) {
      return { label: 'Never Logged In', color: 'bg-gray-500', icon: AlertCircle };
    }

    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceActive < 1) {
      return { label: 'Active Now', color: 'bg-green-500', icon: Activity };
    } else if (daysSinceActive < 7) {
      return { label: 'Active', color: 'bg-green-400', icon: CheckCircle2 };
    } else if (daysSinceActive < 30) {
      return { label: 'Inactive', color: 'bg-yellow-500', icon: Clock };
    } else {
      return { label: 'Dormant', color: 'bg-orange-500', icon: AlertCircle };
    }
  };

  // Usage percentage calculation
  const getUsagePercentage = (user: User) => {
    const creationPercent =
      user.blueprint_creation_limit > 0
        ? (user.blueprint_creation_count / user.blueprint_creation_limit) * 100
        : 0;
    return Math.round(creationPercent);
  };

  // Sort icon component
  const SortIcon = ({ field }: { field: string }) => {
    if (sortConfig.field !== field) {
      return <ArrowUpDown className="ml-1 h-3 w-3 text-white/40" />;
    }
    return sortConfig.order === 'asc' ? (
      <ArrowUp className="ml-1 h-3 w-3 text-cyan-400" />
    ) : (
      <ArrowDown className="ml-1 h-3 w-3 text-cyan-400" />
    );
  };

  // Clear all selections
  const clearSelections = () => setSelectedUsers(new Set());

  if (loading && users.length === 0) {
    return (
      <GlassCard className="p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-cyan-400" />
          <p className="text-white/60">Loading users...</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions Bar */}
      <GlassCard>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search users by name, email..."
              className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pr-10 pl-10 text-white placeholder-white/40 transition-all focus:border-cyan-500/50 focus:bg-white/10 focus:ring-2 focus:ring-cyan-500/20 focus:outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-white/40 hover:text-white/60"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
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

            <Button
              variant="outline"
              size="small"
              onClick={() => setShowFilters(!showFilters)}
              className={`border-white/10 text-white hover:bg-white/10 ${
                showFilters ? 'border-cyan-500/50 bg-cyan-500/20' : 'bg-white/5'
              }`}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filters
              {(filters.role || filters.tier || filters.status !== 'all') && (
                <Badge className="ml-2 bg-cyan-500 text-white" variant="default">
                  Active
                </Badge>
              )}
            </Button>

            <Button
              variant="outline"
              size="small"
              onClick={() => setShowExportDialog(true)}
              className="border-white/10 bg-white/5 text-white hover:bg-white/10"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>

            <Button
              size="small"
              className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white hover:from-cyan-600 hover:to-blue-600"
              onClick={() => {
                // Handle add user
                router.push('/admin/users/new');
              }}
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <AdvancedFilters filters={filters} onFiltersChange={setFilters} />
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedUsers.size > 0 && (
          <BulkActionsBar
            selectedCount={selectedUsers.size}
            onClear={clearSelections}
            onRefresh={fetchUsers}
            selectedUserIds={Array.from(selectedUsers)}
          />
        )}
      </AnimatePresence>

      {/* Users Table */}
      <GlassCard className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-white/10 hover:bg-transparent">
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === users.length && users.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="border-white/20"
                  />
                </TableHead>

                <TableHead
                  className="cursor-pointer text-white/80 select-none"
                  onClick={() => handleSort('full_name')}
                >
                  <div className="flex items-center">
                    User
                    <SortIcon field="full_name" />
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer text-white/80 select-none"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email
                    <SortIcon field="email" />
                  </div>
                </TableHead>

                <TableHead className="text-white/80">Status</TableHead>

                <TableHead
                  className="cursor-pointer text-white/80 select-none"
                  onClick={() => handleSort('user_role')}
                >
                  <div className="flex items-center">
                    Role
                    <SortIcon field="user_role" />
                  </div>
                </TableHead>

                <TableHead
                  className="cursor-pointer text-white/80 select-none"
                  onClick={() => handleSort('subscription_tier')}
                >
                  <div className="flex items-center">
                    Tier
                    <SortIcon field="subscription_tier" />
                  </div>
                </TableHead>

                <TableHead className="text-white/80">Usage</TableHead>

                <TableHead
                  className="cursor-pointer text-white/80 select-none"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Joined
                    <SortIcon field="created_at" />
                  </div>
                </TableHead>

                <TableHead className="text-white/80">Last Active</TableHead>

                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {users.map((user, index) => {
                const status = getUserStatus(user);
                const usagePercent = getUsagePercentage(user);
                const StatusIcon = status.icon;

                return (
                  <motion.tr
                    key={user.user_id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className="group border-b border-white/5 transition-colors hover:bg-white/5"
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedUsers.has(user.user_id)}
                        onCheckedChange={(checked: boolean) =>
                          handleSelectUser(user.user_id, checked)
                        }
                        className="border-white/20"
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/20 to-blue-500/20 text-sm font-semibold text-cyan-400">
                          {(user.full_name || user.email || 'A')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-white">
                            {user.full_name || 'Anonymous User'}
                          </div>
                          <div className="text-xs text-white/40">
                            ID: {user.user_id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center text-white/60">
                        <Mail className="mr-2 h-4 w-4 text-white/40" />
                        {user.email}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className={`h-2 w-2 rounded-full ${status.color}`} />
                        <span className="text-sm text-white/70">{status.label}</span>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={getRoleBadgeVariant(user.user_role)} className="capitalize">
                        {user.user_role === 'developer' && <Shield className="mr-1 h-3 w-3" />}
                        {user.user_role === 'admin' && <Crown className="mr-1 h-3 w-3" />}
                        {user.user_role.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getTierBadgeVariant(user.subscription_tier)}
                        className="capitalize"
                      >
                        {user.subscription_tier.replace('_', ' ')}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-white/60">
                            {user.blueprint_creation_count} / {user.blueprint_creation_limit}
                          </span>
                          <span className="text-white/40">{usagePercent}%</span>
                        </div>
                        <div className="h-1.5 w-32 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full transition-all ${
                              usagePercent >= 90
                                ? 'bg-red-500'
                                : usagePercent >= 70
                                  ? 'bg-yellow-500'
                                  : 'bg-green-500'
                            }`}
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-sm text-white/60">
                      {new Date(user.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </TableCell>

                    <TableCell className="text-sm text-white/60">
                      {user.last_sign_in_at
                        ? new Date(user.last_sign_in_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })
                        : 'Never'}
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="small"
                            className="opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />

                          <DropdownMenuItem onClick={() => setViewingUser(user)}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => setEditingUser(user)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit User
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${user.user_id}/activity`)}
                          >
                            <Activity className="mr-2 h-4 w-4" />
                            Activity Log
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => router.push(`/admin/users/${user.user_id}/blueprints`)}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            View Blueprints
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => handleDeleteUser(user.user_id)}
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </motion.tr>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="rounded-full bg-white/5 p-6">
              <Search className="h-12 w-12 text-white/40" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-white">No users found</h3>
            <p className="mt-2 text-sm text-white/60">
              {searchQuery || filters.role || filters.tier
                ? 'Try adjusting your filters or search query'
                : 'Get started by adding your first user'}
            </p>
          </div>
        )}
      </GlassCard>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <GlassCard>
          <div className="flex items-center justify-between">
            <div className="text-sm text-white/60">
              Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
              {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}{' '}
              users
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="small"
                disabled={pagination.page === 1}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page - 1 }))}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {[...Array(Math.min(pagination.totalPages, 5))].map((_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={pagination.page === pageNum ? 'primary' : 'outline'}
                      size="small"
                      onClick={() => setPagination((prev) => ({ ...prev, page: pageNum }))}
                      className={
                        pagination.page === pageNum
                          ? 'bg-cyan-500 text-white'
                          : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                      }
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="small"
                disabled={pagination.page === pagination.totalPages}
                onClick={() => setPagination((prev) => ({ ...prev, page: prev.page + 1 }))}
                className="border-white/10 bg-white/5 text-white hover:bg-white/10 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Modals */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            fetchUsers();
          }}
        />
      )}

      {viewingUser && (
        <UserDetailsModal
          user={viewingUser}
          onClose={() => setViewingUser(null)}
          onEdit={() => {
            setEditingUser(viewingUser);
            setViewingUser(null);
          }}
        />
      )}

      {showExportDialog && (
        <ExportDialog
          filters={filters}
          sortConfig={sortConfig}
          onClose={() => setShowExportDialog(false)}
        />
      )}
    </div>
  );
}
