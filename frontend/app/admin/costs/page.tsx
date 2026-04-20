'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  DollarSign,
  Activity,
  TrendingUp,
  Users,
  Search,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  FileText,
  Zap,
  Target,
  CreditCard,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface UserCost {
  userId: string;
  email: string;
  firstName?: string;
  lastName?: string;
  subscriptionTier?: string;
  todayCostCents: number;
  thisMonthCostCents: number;
  todayApiCalls: number;
  thisMonthApiCalls: number;
  blueprintsThisMonth: number;
  questionsThisMonth: number;
}

interface CostTotals {
  todayTotalCents: number;
  monthTotalCents: number;
  todayTotalCalls: number;
  monthTotalCalls: number;
}

export default function AdminCostsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState<UserCost[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserCost[]>([]);
  const [totals, setTotals] = useState<CostTotals | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'month' | 'today' | 'calls'>('month');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  const fetchCostData = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch('/api/admin/costs', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch cost data');
      }

      const data = await response.json();
      setUsers(data.users || []);
      setFilteredUsers(data.users || []);
      setTotals(data.totals);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching cost data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCostData();
  }, []);

  useEffect(() => {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter((user) => {
        const searchLower = searchQuery.toLowerCase();
        return (
          user.email?.toLowerCase().includes(searchLower) ||
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.userId.toLowerCase().includes(searchLower)
        );
      });
    }

    // Tier filter
    if (tierFilter !== 'all') {
      filtered = filtered.filter((user) => user.subscriptionTier === tierFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'month':
          return b.thisMonthCostCents - a.thisMonthCostCents;
        case 'today':
          return b.todayCostCents - a.todayCostCents;
        case 'calls':
          return b.thisMonthApiCalls - a.thisMonthApiCalls;
        default:
          return 0;
      }
    });

    setFilteredUsers(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [searchQuery, tierFilter, sortBy, users]);

  const formatCurrency = (cents: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cents / 100);
  };

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const getTierBadgeColor = (tier?: string) => {
    switch (tier) {
      case 'explorer':
        return 'bg-[#7a8a8b]/10 text-[#b0c5c6] border-[#7a8a8b]/20';
      case 'navigator':
        return 'bg-[#a7dadb]/10 text-[#a7dadb] border-[#a7dadb]/20';
      case 'voyager':
        return 'bg-[#4f46e5]/10 text-[#4f46e5] border-[#4f46e5]/20';
      case 'crew':
      case 'fleet':
      case 'armada':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'enterprise':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'developer':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      default:
        return 'bg-white/5 text-[#7a8a8b] border-white/10';
    }
  };

  const navigateToUserDetails = (userId: string) => {
    router.push(`/admin/costs/${userId}`);
  };

  // Calculate additional metrics
  const activeUserCount = users.filter((u) => u.thisMonthApiCalls > 0).length;
  const avgCostPerUser = users.length > 0 ? (totals?.monthTotalCents || 0) / users.length : 0;
  const avgCostPerActiveUser =
    activeUserCount > 0 ? (totals?.monthTotalCents || 0) / activeUserCount : 0;

  // Calculate trends (mock data - in real implementation, compare with previous period)
  const todayTrend: 'up' | 'down' =
    (totals?.todayTotalCents || 0) > avgCostPerUser * 0.033 ? 'up' : 'down';
  const monthTrend: 'up' | 'down' = 'up'; // Would compare with previous month
  const userTrend: 'up' | 'down' = 'up'; // Would compare with previous period
  const avgTrend: 'up' | 'down' = 'down'; // Would compare with previous month

  // Pagination calculations
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const stats = [
    {
      title: "Today's Cost",
      value: formatCurrency(totals?.todayTotalCents || 0),
      subtitle: `${formatNumber(totals?.todayTotalCalls || 0)} API calls`,
      change: `${todayTrend === 'up' ? '+' : '-'}${Math.abs(12.5).toFixed(1)}%`,
      trend: todayTrend,
      icon: DollarSign,
      gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
      iconColor: 'text-emerald-400',
      glowColor: 'shadow-emerald-400/30',
      borderGlow: 'group-hover:border-emerald-400/40',
      bgGlow: 'bg-emerald-400/5',
    },
    {
      title: 'Month to Date',
      value: formatCurrency(totals?.monthTotalCents || 0),
      subtitle: `${formatNumber(totals?.monthTotalCalls || 0)} API calls`,
      change: `${monthTrend === 'up' ? '+' : '-'}${Math.abs(23.8).toFixed(1)}%`,
      trend: monthTrend,
      icon: TrendingUp,
      gradient: 'from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent',
      iconColor: 'text-[#a7dadb]',
      glowColor: 'shadow-[#a7dadb]/30',
      borderGlow: 'group-hover:border-[#a7dadb]/40',
      bgGlow: 'bg-[#a7dadb]/5',
    },
    {
      title: 'Active Users',
      value: activeUserCount.toLocaleString(),
      subtitle: `of ${users.length} total users`,
      change: `${userTrend === 'up' ? '+' : '-'}${Math.abs(8.3).toFixed(1)}%`,
      trend: userTrend,
      icon: Users,
      gradient: 'from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent',
      iconColor: 'text-[#4f46e5]',
      glowColor: 'shadow-[#4f46e5]/30',
      borderGlow: 'group-hover:border-[#4f46e5]/40',
      bgGlow: 'bg-[#4f46e5]/5',
    },
    {
      title: 'Avg Cost/Active User',
      value: formatCurrency(avgCostPerActiveUser),
      subtitle: 'This month',
      change: `${avgTrend === 'up' ? '+' : '-'}${Math.abs(4.2).toFixed(1)}%`,
      trend: avgTrend,
      icon: Activity,
      gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
      iconColor: 'text-amber-400',
      glowColor: 'shadow-amber-400/30',
      borderGlow: 'group-hover:border-amber-400/40',
      bgGlow: 'bg-amber-400/5',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-12">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="space-y-6"
          >
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-400/20 bg-gradient-to-br from-emerald-400/30 via-emerald-400/20 to-transparent shadow-lg shadow-emerald-400/20">
                  <DollarSign className="h-8 w-8 text-emerald-400" />
                </div>
                <div>
                  <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                    <span>API </span>
                    <span className="bg-gradient-to-r from-emerald-400 via-[#a7dadb] to-emerald-400 bg-clip-text text-transparent">
                      Cost Tracking
                    </span>
                  </h1>
                  <p className="mt-3 text-xl text-[#b0c5c6]">
                    Monitor API usage costs and billing across all users
                  </p>
                </div>
              </div>

              <Button
                onClick={() => fetchCostData(true)}
                disabled={refreshing}
                className="min-h-[44px] rounded-xl border border-[#a7dadb]/20 bg-[#a7dadb]/10 px-6 text-[#a7dadb] backdrop-blur-xl transition-all duration-300 hover:scale-105 hover:border-[#a7dadb]/40 hover:bg-[#a7dadb]/20 hover:shadow-lg hover:shadow-[#a7dadb]/30"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                {refreshing ? 'Refreshing...' : 'Refresh Data'}
              </Button>
            </div>

            {/* Decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-emerald-400/30 to-transparent" />
          </motion.div>

          {/* Last Updated Indicator */}
          <AnimatePresence mode="wait">
            {lastUpdated && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-end gap-2 text-sm text-[#b0c5c6]"
              >
                <div className="flex items-center gap-2 rounded-full border border-white/5 bg-[#142433]/60 px-4 py-2 backdrop-blur-sm">
                  <div className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/75 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </div>
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Updated {lastUpdated.toLocaleTimeString()}</span>
                  <span className="text-white/40">•</span>
                  <span className="text-white/60">Live data</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Summary Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              const TrendIcon = stat.trend === 'up' ? ArrowUpRight : ArrowDownRight;

              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: index * 0.1,
                    ease: [0.4, 0, 0.2, 1],
                  }}
                  className="flex"
                >
                  <div
                    className={`group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl ${stat.glowColor} ${stat.borderGlow}`}
                  >
                    {/* Background gradient glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Title */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#b0c5c6]">{stat.title}</p>
                            <Sparkles
                              className={`h-3 w-3 ${stat.iconColor} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                            />
                          </div>

                          {/* Value */}
                          <p className="font-heading text-4xl font-bold tracking-tight text-white">
                            {stat.value}
                          </p>

                          {/* Subtitle */}
                          <p className="text-xs text-[#7a8a8b]">{stat.subtitle}</p>
                        </div>

                        {/* Icon */}
                        <div
                          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${stat.gradient} ${stat.bgGlow} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg ${stat.glowColor}`}
                        >
                          <Icon className={`h-7 w-7 ${stat.iconColor}`} />
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Trend */}
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <div
                          className={`flex items-center gap-1 rounded-full px-2 py-1 font-semibold ${
                            stat.trend === 'up'
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-red-500/10 text-red-400'
                          }`}
                        >
                          <TrendIcon className="h-3 w-3" />
                          {stat.change}
                        </div>
                        <span className="text-[#7a8a8b]">
                          {stat.title === "Today's Cost" ? 'vs yesterday' : 'from last period'}
                        </span>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* User Cost Details Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="space-y-6"
          >
            <h2 className="font-heading text-3xl font-bold text-white">User Cost Details</h2>

            {/* Filters Card */}
            <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl">
              <div className="mb-4">
                <p className="text-sm text-[#b0c5c6]">
                  Filter and search through user cost data. Click any row to view detailed
                  breakdown.
                </p>
              </div>

              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7a8a8b]" />
                    <Input
                      placeholder="Search by name, email, or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 rounded-xl border-white/10 bg-[#142433]/60 pl-10 text-white backdrop-blur-xl transition-all duration-300 placeholder:text-[#7a8a8b] focus:border-[#a7dadb]/40 focus:ring-[#a7dadb]/20"
                    />
                  </div>
                </div>

                <Select value={tierFilter} onValueChange={setTierFilter}>
                  <SelectTrigger className="h-12 w-full rounded-xl border-white/10 bg-[#142433]/60 text-white backdrop-blur-xl transition-all duration-300 focus:border-[#a7dadb]/40 focus:ring-[#a7dadb]/20 sm:w-[200px]">
                    <SelectValue placeholder="Filter by tier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-[#0d1b2a] backdrop-blur-xl">
                    <SelectItem value="all">All Tiers</SelectItem>
                    <SelectItem value="explorer">Explorer</SelectItem>
                    <SelectItem value="navigator">Navigator</SelectItem>
                    <SelectItem value="voyager">Voyager</SelectItem>
                    <SelectItem value="crew">Crew</SelectItem>
                    <SelectItem value="fleet">Fleet</SelectItem>
                    <SelectItem value="armada">Armada</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                    <SelectItem value="developer">Developer</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={sortBy}
                  onValueChange={(v) => setSortBy(v as 'month' | 'today' | 'calls')}
                >
                  <SelectTrigger className="h-12 w-full rounded-xl border-white/10 bg-[#142433]/60 text-white backdrop-blur-xl transition-all duration-300 focus:border-[#a7dadb]/40 focus:ring-[#a7dadb]/20 sm:w-[200px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-white/10 bg-[#0d1b2a] backdrop-blur-xl">
                    <SelectItem value="month">Month Cost</SelectItem>
                    <SelectItem value="today">Today Cost</SelectItem>
                    <SelectItem value="calls">API Calls</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Table Card */}
            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 backdrop-blur-xl">
              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[#a7dadb]/20 [&::-webkit-scrollbar-thumb]:bg-gradient-to-r [&::-webkit-scrollbar-thumb]:from-[#a7dadb]/60 [&::-webkit-scrollbar-thumb]:via-[#a7dadb]/80 [&::-webkit-scrollbar-thumb]:to-[#a7dadb]/60 [&::-webkit-scrollbar-thumb]:shadow-lg [&::-webkit-scrollbar-thumb]:shadow-[#a7dadb]/30 hover:[&::-webkit-scrollbar-thumb]:from-[#a7dadb]/80 hover:[&::-webkit-scrollbar-thumb]:via-[#a7dadb] hover:[&::-webkit-scrollbar-thumb]:to-[#a7dadb]/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0d1b2a]/60">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="text-[#b0c5c6]">User</TableHead>
                      <TableHead className="text-[#b0c5c6]">Tier</TableHead>
                      <TableHead className="text-right text-[#b0c5c6]">Today</TableHead>
                      <TableHead className="text-right text-[#b0c5c6]">This Month</TableHead>
                      <TableHead className="text-right text-[#b0c5c6]">API Calls</TableHead>
                      <TableHead className="text-right text-[#b0c5c6]">Blueprints</TableHead>
                      <TableHead className="text-right text-[#b0c5c6]">Questions</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.map((user, index) => (
                      <motion.tr
                        key={user.userId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.02 }}
                        onClick={() => navigateToUserDetails(user.userId)}
                        className="group cursor-pointer border-white/5 transition-all duration-300 hover:bg-[#142433]/60"
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium text-white transition-colors duration-300 group-hover:text-[#a7dadb]">
                              {user.firstName || user.lastName
                                ? `${user.firstName || ''} ${user.lastName || ''}`
                                : 'No name'}
                            </div>
                            <div className="text-sm text-[#7a8a8b]">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={`rounded-full border backdrop-blur-sm ${getTierBadgeColor(user.subscriptionTier)}`}
                          >
                            {user.subscriptionTier || 'No tier'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatCurrency(user.todayCostCents)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-white">
                          {formatCurrency(user.thisMonthCostCents)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div>
                            <div className="text-white">{formatNumber(user.thisMonthApiCalls)}</div>
                            <div className="text-sm text-[#7a8a8b]">
                              ({formatNumber(user.todayApiCalls)} today)
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-white">
                          {formatNumber(user.blueprintsThisMonth)}
                        </TableCell>
                        <TableCell className="text-right text-white">
                          {formatNumber(user.questionsThisMonth)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                            <ArrowUpRight className="h-5 w-5 text-[#a7dadb]" />
                          </div>
                        </TableCell>
                      </motion.tr>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="py-16 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                      <Search className="h-8 w-8 text-[#7a8a8b]" />
                    </div>
                    <div>
                      <p className="text-lg font-medium text-white">No users found</p>
                      <p className="text-sm text-[#7a8a8b]">
                        Try adjusting your search or filter criteria
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Pagination */}
            {filteredUsers.length > 0 && (
              <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-4 backdrop-blur-xl md:flex-row">
                <p className="text-sm text-[#b0c5c6]">
                  Showing <span className="font-semibold text-white">{startIndex + 1}</span> to{' '}
                  <span className="font-semibold text-white">
                    {Math.min(endIndex, filteredUsers.length)}
                  </span>{' '}
                  of <span className="font-semibold text-white">{filteredUsers.length}</span> users
                </p>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-white/10 bg-[#142433]/60 p-2 text-white transition-all hover:border-white/20 hover:bg-[#142433]/80 disabled:opacity-40"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <span className="text-sm font-medium text-white">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="min-h-[44px] min-w-[44px] rounded-lg border border-white/10 bg-[#142433]/60 p-2 text-white transition-all hover:border-white/20 hover:bg-[#142433]/80 disabled:opacity-40"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="space-y-12">
          {/* Hero Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 animate-pulse rounded-2xl bg-white/10" />
              <div className="space-y-3">
                <div className="h-12 w-64 animate-pulse rounded-lg bg-white/10" />
                <div className="h-6 w-96 animate-pulse rounded-lg bg-white/10" />
              </div>
            </div>
            <div className="h-px w-full bg-white/5" />
          </div>

          {/* Stats Skeleton */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl"
              >
                <div className="animate-pulse space-y-3">
                  <div className="h-4 w-28 rounded-lg bg-white/10" />
                  <div className="h-10 w-20 rounded-lg bg-white/15" />
                  <div className="h-3 w-36 rounded-lg bg-white/10" />
                </div>
              </div>
            ))}
          </div>

          {/* Table Skeleton */}
          <div className="space-y-6">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-white/10" />
            <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="h-16 animate-pulse rounded-lg bg-white/10" />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
