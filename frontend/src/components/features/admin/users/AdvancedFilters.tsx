'use client';

import { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import * as Popover from '@radix-ui/react-popover';
import { DayPicker } from 'react-day-picker';
import { format } from 'date-fns';
import 'react-day-picker/dist/style.css';

interface FilterConfig {
  search: string;
  role: string;
  tier: string;
  status: 'all' | 'active' | 'inactive' | 'deleted';
  dateRange: { start: string; end: string } | null;
  usageRange: { min: number; max: number } | null;
}

interface AdvancedFiltersProps {
  filters: FilterConfig;
  onFiltersChange: (filters: FilterConfig) => void;
}

const USER_ROLES = [
  { value: 'user', label: 'User' },
  { value: 'developer', label: 'Developer' },
  { value: 'admin', label: 'Admin' },
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

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Users' },
  { value: 'active', label: 'Active (last 30 days)' },
  { value: 'inactive', label: 'Inactive (30+ days)' },
  { value: 'deleted', label: 'Deleted' },
];

export function AdvancedFilters({ filters, onFiltersChange }: AdvancedFiltersProps) {
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedRange, setSelectedRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: filters.dateRange?.start ? new Date(filters.dateRange.start) : undefined,
    to: filters.dateRange?.end ? new Date(filters.dateRange.end) : undefined,
  });

  // Local state for usage range inputs
  const [usageMin, setUsageMin] = useState<string>(filters.usageRange?.min.toString() || '');
  const [usageMax, setUsageMax] = useState<string>(filters.usageRange?.max.toString() || '');

  const hasActiveFilters =
    filters.role ||
    filters.tier ||
    filters.status !== 'all' ||
    filters.dateRange ||
    filters.usageRange;

  const clearAllFilters = () => {
    setSelectedRange({ from: undefined, to: undefined });
    setUsageMin('');
    setUsageMax('');
    onFiltersChange({
      search: filters.search,
      role: '',
      tier: '',
      status: 'all',
      dateRange: null,
      usageRange: null,
    });
  };

  const clearFilter = (filterKey: keyof FilterConfig) => {
    if (filterKey === 'role' || filterKey === 'tier') {
      onFiltersChange({ ...filters, [filterKey]: '' });
    } else if (filterKey === 'status') {
      onFiltersChange({ ...filters, status: 'all' });
    } else if (filterKey === 'dateRange') {
      setSelectedRange({ from: undefined, to: undefined });
      onFiltersChange({ ...filters, dateRange: null });
    } else if (filterKey === 'usageRange') {
      setUsageMin('');
      setUsageMax('');
      onFiltersChange({ ...filters, usageRange: null });
    } else {
      onFiltersChange({ ...filters, [filterKey]: null });
    }
  };

  // Apply date range when selection is complete
  useEffect(() => {
    if (selectedRange.from && selectedRange.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          start: selectedRange.from.toISOString(),
          end: selectedRange.to.toISOString(),
        },
      });
    }
  }, [selectedRange]);

  // Apply usage range with debouncing
  useEffect(() => {
    const timer = setTimeout(() => {
      const min = parseInt(usageMin);
      const max = parseInt(usageMax);

      if (!isNaN(min) || !isNaN(max)) {
        onFiltersChange({
          ...filters,
          usageRange: {
            min: isNaN(min) ? 0 : min,
            max: isNaN(max) ? 100 : max,
          },
        });
      } else if (usageMin === '' && usageMax === '') {
        onFiltersChange({
          ...filters,
          usageRange: null,
        });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [usageMin, usageMax]);

  return (
    <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
      {/* Filter Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Filter Options</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="small"
            onClick={clearAllFilters}
            className="text-xs text-white/60 hover:text-white"
          >
            Clear All
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-white/60">Active filters:</span>

          {filters.role && (
            <Badge
              variant="secondary"
              className="group flex items-center gap-1 bg-[#06B6D4]/20 text-[#06B6D4]"
            >
              Role: {filters.role}
              <button
                onClick={() => clearFilter('role')}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.tier && (
            <Badge
              variant="secondary"
              className="group flex items-center gap-1 bg-purple-500/20 text-purple-400"
            >
              Tier: {filters.tier}
              <button
                onClick={() => clearFilter('tier')}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.status !== 'all' && (
            <Badge
              variant="secondary"
              className="group flex items-center gap-1 bg-green-500/20 text-green-400"
            >
              Status: {filters.status}
              <button
                onClick={() => clearFilter('status')}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.dateRange && (
            <Badge
              variant="secondary"
              className="group flex items-center gap-1 bg-blue-500/20 text-blue-400"
            >
              {format(new Date(filters.dateRange.start), 'MMM dd')} -{' '}
              {format(new Date(filters.dateRange.end), 'MMM dd, yyyy')}
              <button
                onClick={() => clearFilter('dateRange')}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.usageRange && (
            <Badge
              variant="secondary"
              className="group flex items-center gap-1 bg-orange-500/20 text-orange-400"
            >
              Usage: {filters.usageRange.min}% - {filters.usageRange.max}%
              <button
                onClick={() => clearFilter('usageRange')}
                className="ml-1 rounded-full opacity-60 hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Role Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/70">User Role</label>
          <Select
            value={filters.role}
            onValueChange={(value) => onFiltersChange({ ...filters, role: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Roles" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Roles</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tier Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/70">Subscription Tier</label>
          <Select
            value={filters.tier}
            onValueChange={(value) => onFiltersChange({ ...filters, tier: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Tiers" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Tiers</SelectItem>
              {SUBSCRIPTION_TIERS.map((tier) => (
                <SelectItem key={tier.value} value={tier.value}>
                  {tier.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-white/70">User Status</label>
          <Select
            value={filters.status}
            onValueChange={(value) =>
              onFiltersChange({
                ...filters,
                status: value as 'all' | 'active' | 'inactive' | 'deleted',
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Users" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Advanced Filters */}
      <div className="border-t border-white/5 pt-4">
        <h4 className="mb-3 text-xs font-semibold text-white/70">Advanced Filters</h4>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Date Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">Date Range (Joined)</label>
            <Popover.Root open={dateRangeOpen} onOpenChange={setDateRangeOpen}>
              <Popover.Trigger asChild>
                <button className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white transition-all hover:border-[#06B6D4]/50 hover:bg-white/10 focus:border-[#06B6D4]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#06B6D4]/20 focus:outline-none">
                  {selectedRange.from && selectedRange.to ? (
                    <span>
                      {format(selectedRange.from, 'MMM dd, yyyy')} -{' '}
                      {format(selectedRange.to, 'MMM dd, yyyy')}
                    </span>
                  ) : (
                    <span className="text-white/40">Select date range</span>
                  )}
                  <CalendarIcon className="ml-2 h-4 w-4 text-white/40" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  className="z-50 rounded-lg border border-white/10 bg-[#0f1729] p-4 shadow-xl"
                  align="start"
                  sideOffset={8}
                >
                  <style jsx global>{`
                    .rdp {
                      --rdp-cell-size: 40px;
                      --rdp-accent-color: rgb(6, 182, 212);
                      --rdp-background-color: rgba(6, 182, 212, 0.1);
                      --rdp-outline: 2px solid rgba(6, 182, 212, 0.3);
                      margin: 0;
                    }
                    .rdp-months {
                      display: flex;
                    }
                    .rdp-month {
                      margin: 0;
                    }
                    .rdp-caption {
                      display: flex;
                      justify-content: center;
                      padding: 8px 0;
                      position: relative;
                    }
                    .rdp-caption_label {
                      font-size: 14px;
                      font-weight: 600;
                      color: rgb(224, 224, 224);
                    }
                    .rdp-nav {
                      display: flex;
                      gap: 4px;
                      position: absolute;
                      right: 0;
                      top: 50%;
                      transform: translateY(-50%);
                    }
                    .rdp-nav_button {
                      width: 32px;
                      height: 32px;
                      border-radius: 6px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      background: rgba(255, 255, 255, 0.05);
                      border: 1px solid rgba(255, 255, 255, 0.1);
                      color: rgb(224, 224, 224);
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .rdp-nav_button:hover {
                      background: rgba(6, 182, 212, 0.2);
                      border-color: rgba(6, 182, 212, 0.3);
                    }
                    .rdp-nav_button:disabled {
                      opacity: 0.3;
                      cursor: not-allowed;
                    }
                    .rdp-head_cell {
                      color: rgba(224, 224, 224, 0.6);
                      font-size: 12px;
                      font-weight: 600;
                      text-transform: uppercase;
                      padding: 8px 0;
                    }
                    .rdp-cell {
                      padding: 2px;
                    }
                    .rdp-day {
                      width: 100%;
                      height: 100%;
                      border-radius: 6px;
                      font-size: 13px;
                      color: rgb(224, 224, 224);
                      background: transparent;
                      border: none;
                      cursor: pointer;
                      transition: all 0.2s;
                    }
                    .rdp-day:hover:not(.rdp-day_disabled):not(.rdp-day_selected) {
                      background: rgba(255, 255, 255, 0.1);
                    }
                    .rdp-day_selected {
                      background: rgb(6, 182, 212) !important;
                      color: white !important;
                      font-weight: 600;
                    }
                    .rdp-day_disabled {
                      color: rgba(224, 224, 224, 0.3);
                      cursor: not-allowed;
                    }
                    .rdp-day_range_middle {
                      background: rgba(6, 182, 212, 0.2);
                      color: rgb(224, 224, 224);
                    }
                    .rdp-day_range_start,
                    .rdp-day_range_end {
                      background: rgb(6, 182, 212) !important;
                      color: white !important;
                    }
                    .rdp-day_today {
                      font-weight: 700;
                      position: relative;
                    }
                    .rdp-day_today:after {
                      content: '';
                      position: absolute;
                      bottom: 2px;
                      left: 50%;
                      transform: translateX(-50%);
                      width: 4px;
                      height: 4px;
                      border-radius: 50%;
                      background: rgb(6, 182, 212);
                    }
                  `}</style>
                  <DayPicker
                    mode="range"
                    selected={selectedRange}
                    onSelect={(range: any) => {
                      setSelectedRange(range || { from: undefined, to: undefined });
                      if (range?.from && range?.to) {
                        setDateRangeOpen(false);
                      }
                    }}
                    numberOfMonths={2}
                    disabled={{ after: new Date() }}
                  />
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          </div>

          {/* Usage Range Filter */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-white/70">
              Usage Range (Blueprint Creation %)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Min %"
                  value={usageMin}
                  onChange={(e) => setUsageMin(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 transition-all focus:border-[#06B6D4]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#06B6D4]/20 focus:outline-none"
                />
              </div>
              <span className="text-xs text-white/40">to</span>
              <div className="flex-1">
                <input
                  type="number"
                  min="0"
                  max="100"
                  placeholder="Max %"
                  value={usageMax}
                  onChange={(e) => setUsageMax(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-white/40 transition-all focus:border-[#06B6D4]/50 focus:bg-white/10 focus:ring-2 focus:ring-[#06B6D4]/20 focus:outline-none"
                />
              </div>
            </div>
            <p className="text-xs text-white/40">
              Filter users by their blueprint usage percentage
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
