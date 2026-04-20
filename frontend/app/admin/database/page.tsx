'use client';

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database,
  Table2,
  FileJson,
  Download,
  ChevronDown,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Activity,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertCircle,
  CheckCircle2,
  Info,
  RefreshCw,
  Sparkles,
  Zap,
  HardDrive,
  Clock,
  TrendingUp,
  Shield,
  Server,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TableInfo {
  tableName: string;
  schema: string;
  rowCount: number;
  estimatedSize?: string | null;
}

interface DatabaseStats {
  tables: TableInfo[];
  totalTables?: number;
  totalRows?: number;
  databaseHealth?: string;
}

interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
}

interface SchemaInfo {
  tableName: string;
  columns: ColumnInfo[];
  primaryKeys?: string[];
  foreignKeys?: any[];
  indexes?: any[];
}

interface TableData {
  data: Record<string, any>[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export default function DatabaseExplorerPage() {
  // State management
  const [stats, setStats] = useState<DatabaseStats | null>(null);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [schemaInfo, setSchemaInfo] = useState<SchemaInfo | null>(null);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showSchema, setShowSchema] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const rowsPerPage = 10;

  // Fetch database statistics
  const fetchDatabaseStats = async () => {
    try {
      setIsLoadingStats(true);
      setError(null);

      const response = await fetch('/api/admin/database');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch database stats');
      }

      const data = await response.json();
      setStats(data);
      setLastUpdated(new Date());

      // Auto-select first table if available
      if (data.tables && data.tables.length > 0 && !selectedTable) {
        setSelectedTable(data.tables[0].tableName);
      }
    } catch (err) {
      console.error('Error fetching database stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch database stats');
    } finally {
      setIsLoadingStats(false);
    }
  };

  // Fetch table data
  const fetchTableData = async () => {
    if (!selectedTable) return;

    try {
      setIsLoadingData(true);
      setError(null);

      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: rowsPerPage.toString(),
      });

      if (sortBy) {
        params.append('sortBy', sortBy);
        params.append('sortOrder', sortOrder);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/admin/database/${selectedTable}?${params}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch table data');
      }

      const data = await response.json();
      setTableData(data);
    } catch (err) {
      console.error('Error fetching table data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch table data');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Fetch table schema
  const fetchTableSchema = async () => {
    if (!selectedTable) return;

    try {
      setIsLoadingSchema(true);

      const response = await fetch(`/api/admin/database/${selectedTable}/schema`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch schema');
      }

      const data = await response.json();
      setSchemaInfo(data);
    } catch (err) {
      console.error('Error fetching schema:', err);
    } finally {
      setIsLoadingSchema(false);
    }
  };

  // Export table data
  const exportData = (format: 'csv' | 'json') => {
    if (!tableData?.data || tableData.data.length === 0) return;

    let content = '';
    let filename = '';

    if (format === 'json') {
      content = JSON.stringify(tableData.data, null, 2);
      filename = `${selectedTable}_export.json`;
    } else if (format === 'csv') {
      const headers = Object.keys(tableData.data[0]);
      const csvRows = [
        headers.join(','),
        ...tableData.data.map((row) => headers.map((h) => JSON.stringify(row[h] ?? '')).join(',')),
      ];
      content = csvRows.join('\n');
      filename = `${selectedTable}_export.csv`;
    }

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle sort order
  const toggleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
    setCurrentPage(1);
  };

  // Effects
  useEffect(() => {
    fetchDatabaseStats();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData();
      if (showSchema) {
        fetchTableSchema();
      }
    }
  }, [selectedTable, currentPage, sortBy, sortOrder, searchTerm]);

  useEffect(() => {
    if (selectedTable && showSchema && !schemaInfo) {
      fetchTableSchema();
    }
  }, [showSchema, selectedTable]);

  // Get columns from first row of data
  const columns = useMemo(() => {
    if (!tableData?.data || tableData.data.length === 0) return [];
    return Object.keys(tableData.data[0]);
  }, [tableData]);

  // Get health status color and display
  const getHealthDisplay = () => {
    const health = stats?.databaseHealth?.toLowerCase() || 'healthy';
    if (health.includes('healthy') || health.includes('operational')) {
      return {
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glowColor: 'shadow-emerald-400/50',
        icon: CheckCircle2,
        gradient: 'from-emerald-400/30 via-emerald-400/20 to-transparent',
      };
    } else if (health.includes('warning') || health.includes('degraded')) {
      return {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glowColor: 'shadow-amber-400/50',
        icon: AlertCircle,
        gradient: 'from-amber-400/30 via-amber-400/20 to-transparent',
      };
    } else {
      return {
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        glowColor: 'shadow-red-400/50',
        icon: AlertCircle,
        gradient: 'from-red-400/30 via-red-400/20 to-transparent',
      };
    }
  };

  const healthDisplay = getHealthDisplay();
  const HealthIcon = healthDisplay.icon;

  if (error && !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#020c1b] via-[#0d1b2a] to-[#020c1b] px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex min-h-screen items-center justify-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md text-center"
          >
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/10 shadow-lg shadow-red-500/20">
              <AlertCircle className="h-10 w-10 text-red-400" />
            </div>
            <h2 className="font-heading mb-3 text-3xl font-bold text-white">
              Error Loading Database
            </h2>
            <p className="mb-8 text-lg text-[#b0c5c6]">{error}</p>
            <Button
              onClick={fetchDatabaseStats}
              className="min-h-[48px] bg-gradient-to-r from-[#a7dadb] to-[#7bc5c7] px-8 text-[#020c1b] hover:shadow-lg hover:shadow-[#a7dadb]/30"
            >
              <RefreshCw className="mr-2 h-5 w-5" />
              Try Again
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center gap-3">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[#4f46e5]/20 bg-gradient-to-br from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent shadow-lg shadow-[#4f46e5]/20">
                <Database className="h-8 w-8 text-[#4f46e5]" />
              </div>
              <div>
                <h1 className="font-heading text-5xl font-bold tracking-tight text-white sm:text-6xl md:text-7xl">
                  <span>Database </span>
                  <span className="bg-gradient-to-r from-[#4f46e5] via-[#7c69f5] to-[#4f46e5] bg-clip-text text-transparent">
                    Explorer
                  </span>
                </h1>
                <p className="mt-3 text-xl text-[#b0c5c6]">
                  Explore, analyze, and monitor your database tables and schemas
                </p>
              </div>
            </div>

            {/* Decorative line */}
            <div className="h-px w-full bg-gradient-to-r from-transparent via-[#4f46e5]/30 to-transparent" />
          </motion.div>

          {/* Last Updated & Refresh */}
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
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4f46e5]/75 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#4f46e5]" />
                  </div>
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">Updated {lastUpdated.toLocaleTimeString()}</span>
                </div>
                <Button
                  onClick={fetchDatabaseStats}
                  disabled={isLoadingStats}
                  className="min-h-[44px] rounded-full border border-white/10 bg-[#142433]/60 px-4 text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-[#142433]/80"
                >
                  <RefreshCw className={`mr-2 h-4 w-4 ${isLoadingStats ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Cards - Loading State */}
          {isLoadingStats ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl"
                >
                  <div className="flex-1 animate-pulse space-y-3">
                    <div className="h-4 w-28 rounded-lg bg-white/10" />
                    <div className="h-10 w-20 rounded-lg bg-white/15" />
                  </div>
                </div>
              ))}
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Total Tables */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
                  className="flex"
                >
                  <div className="group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-[#4f46e5]/40 hover:border-white/20 hover:shadow-xl hover:shadow-[#4f46e5]/30">
                    {/* Background gradient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Title */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#b0c5c6]">Total Tables</p>
                            <Sparkles className="h-3 w-3 text-[#4f46e5] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </div>

                          {/* Value */}
                          <p className="font-heading text-4xl font-bold tracking-tight text-white">
                            {stats.tables?.length || 0}
                          </p>
                        </div>

                        {/* Icon */}
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#4f46e5]/5 bg-gradient-to-br from-[#4f46e5]/30 via-[#4f46e5]/20 to-transparent shadow-[#4f46e5]/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                          <Table2 className="h-7 w-7 text-[#4f46e5]" />
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Footer */}
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Server className="h-3 w-3 text-[#7a8a8b]" />
                        <span className="text-[#7a8a8b]">Active in database</span>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </div>
                </motion.div>

                {/* Total Rows */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  className="flex"
                >
                  <div className="group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-[#a7dadb]/40 hover:border-white/20 hover:shadow-xl hover:shadow-[#a7dadb]/30">
                    {/* Background gradient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />

                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Title */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#b0c5c6]">Total Rows</p>
                            <Sparkles className="h-3 w-3 text-[#a7dadb] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                          </div>

                          {/* Value */}
                          <p className="font-heading text-4xl font-bold tracking-tight text-white">
                            {stats.tables
                              ?.reduce((sum, t) => sum + t.rowCount, 0)
                              .toLocaleString() || 0}
                          </p>
                        </div>

                        {/* Icon */}
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-[#a7dadb]/5 bg-gradient-to-br from-[#a7dadb]/30 via-[#a7dadb]/20 to-transparent shadow-[#a7dadb]/30 transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg">
                          <FileText className="h-7 w-7 text-[#a7dadb]" />
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Footer */}
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <TrendingUp className="h-3 w-3 text-[#7a8a8b]" />
                        <span className="text-[#7a8a8b]">Across all tables</span>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </div>
                </motion.div>

                {/* Database Health */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="flex"
                >
                  <div
                    className={`group relative flex flex-1 flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl transition-all duration-300 hover:scale-[1.02] hover:border-white/20 hover:shadow-xl ${healthDisplay.glowColor} hover:${healthDisplay.borderColor}`}
                  >
                    {/* Background gradient glow */}
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${healthDisplay.gradient} opacity-0 transition-opacity duration-500 group-hover:opacity-100`}
                    />

                    {/* Content */}
                    <div className="relative z-10 flex flex-1 flex-col">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-3">
                          {/* Title */}
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-[#b0c5c6]">Database Health</p>
                            <Sparkles
                              className={`h-3 w-3 ${healthDisplay.color} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
                            />
                          </div>

                          {/* Value */}
                          <div className="flex items-center gap-2">
                            <div className="relative flex h-2 w-2">
                              <span
                                className={`absolute inline-flex h-full w-full animate-ping rounded-full ${healthDisplay.color.replace('text-', 'bg-')}/75 opacity-75`}
                              />
                              <span
                                className={`relative inline-flex h-2 w-2 rounded-full ${healthDisplay.color.replace('text-', 'bg-')}`}
                              />
                            </div>
                            <p
                              className={`font-heading text-2xl font-bold tracking-tight ${healthDisplay.color} capitalize`}
                            >
                              {stats.databaseHealth || 'Healthy'}
                            </p>
                          </div>
                        </div>

                        {/* Icon */}
                        <div
                          className={`flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${healthDisplay.gradient} ${healthDisplay.bgColor} ${healthDisplay.glowColor} transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg`}
                        >
                          <HealthIcon className={`h-7 w-7 ${healthDisplay.color}`} />
                        </div>
                      </div>

                      {/* Spacer */}
                      <div className="flex-1" />

                      {/* Footer */}
                      <div className="mt-3 flex items-center gap-2 text-xs">
                        <Activity className="h-3 w-3 text-[#7a8a8b]" />
                        <span className="text-[#7a8a8b]">System status</span>
                      </div>
                    </div>

                    {/* Hover shine effect */}
                    <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
                      <div className="animate-shimmer absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Table Data Viewer Section */}
              <motion.section
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="space-y-6"
              >
                <h2 className="font-heading text-3xl font-bold text-white">Table Data Viewer</h2>

                {/* Table Selector Card */}
                <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/60 p-6 backdrop-blur-xl">
                  <div className="space-y-6">
                    {/* Controls Row */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      {/* Table Selector */}
                      <div className="flex-1">
                        <label className="mb-2 block text-sm font-medium text-[#b0c5c6]">
                          Select Table
                        </label>
                        <Select value={selectedTable} onValueChange={setSelectedTable}>
                          <SelectTrigger className="min-h-[48px] w-full rounded-xl border-white/10 bg-[#142433]/60 text-white backdrop-blur-sm md:w-[320px]">
                            <SelectValue placeholder="Choose a table to explore..." />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border border-white/10 bg-[#0d1b2a] backdrop-blur-xl">
                            {stats.tables?.map((table) => (
                              <SelectItem
                                key={table.tableName}
                                value={table.tableName}
                                className="cursor-pointer text-white hover:bg-white/5"
                              >
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-medium">{table.tableName}</span>
                                  <span className="rounded-full bg-[#a7dadb]/10 px-2 py-0.5 text-xs font-semibold text-[#a7dadb]">
                                    {table.rowCount.toLocaleString()} rows
                                  </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setShowSchema(!showSchema)}
                          className={`min-h-[48px] rounded-xl border transition-all ${
                            showSchema
                              ? 'border-[#4f46e5]/40 bg-[#4f46e5]/10 text-[#4f46e5] hover:bg-[#4f46e5]/20'
                              : 'border-white/10 bg-[#142433]/60 text-white hover:border-white/20 hover:bg-[#142433]/80'
                          }`}
                        >
                          <Info className="mr-2 h-4 w-4" />
                          {showSchema ? 'Hide' : 'Show'} Schema
                        </Button>
                        <Button
                          onClick={() => exportData('json')}
                          disabled={!tableData?.data || tableData.data.length === 0}
                          className="min-h-[48px] rounded-xl border border-white/10 bg-[#142433]/60 text-white transition-all hover:border-white/20 hover:bg-[#142433]/80 disabled:opacity-50"
                        >
                          <FileJson className="mr-2 h-4 w-4" />
                          Export JSON
                        </Button>
                        <Button
                          onClick={() => exportData('csv')}
                          disabled={!tableData?.data || tableData.data.length === 0}
                          className="min-h-[48px] rounded-xl border border-white/10 bg-[#142433]/60 text-white transition-all hover:border-white/20 hover:bg-[#142433]/80 disabled:opacity-50"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Export CSV
                        </Button>
                      </div>
                    </div>

                    {/* Schema Panel */}
                    <AnimatePresence>
                      {showSchema && selectedTable && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.3 }}
                          className="overflow-hidden"
                        >
                          <div className="rounded-xl border border-[#4f46e5]/20 bg-[#4f46e5]/5 p-6 backdrop-blur-sm">
                            <div className="mb-4 flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#4f46e5]/20">
                                <HardDrive className="h-5 w-5 text-[#4f46e5]" />
                              </div>
                              <div>
                                <h3 className="font-heading text-xl font-semibold text-white">
                                  Schema: {selectedTable}
                                </h3>
                                <p className="text-sm text-[#b0c5c6]">
                                  Column definitions and constraints
                                </p>
                              </div>
                            </div>

                            {isLoadingSchema ? (
                              <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-[#4f46e5]" />
                              </div>
                            ) : schemaInfo ? (
                              <div className="overflow-x-auto rounded-lg border border-white/5 bg-[#142433]/40">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-white/5">
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#b0c5c6]">
                                        Column
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#b0c5c6]">
                                        Type
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#b0c5c6]">
                                        Nullable
                                      </th>
                                      <th className="px-4 py-3 text-left text-sm font-semibold text-[#b0c5c6]">
                                        Default
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {schemaInfo.columns.map((col, idx) => (
                                      <tr
                                        key={col.column_name}
                                        className={`transition-colors hover:bg-white/5 ${
                                          idx !== schemaInfo.columns.length - 1
                                            ? 'border-b border-white/5'
                                            : ''
                                        }`}
                                      >
                                        <td className="px-4 py-3 font-mono text-sm font-medium text-[#a7dadb]">
                                          {col.column_name}
                                        </td>
                                        <td className="px-4 py-3 font-mono text-sm text-white/70">
                                          {col.data_type}
                                        </td>
                                        <td className="px-4 py-3">
                                          <span
                                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                                              col.is_nullable === 'YES'
                                                ? 'bg-amber-500/10 text-amber-400'
                                                : 'bg-emerald-500/10 text-emerald-400'
                                            }`}
                                          >
                                            {col.is_nullable === 'YES' ? 'Yes' : 'No'}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 font-mono text-xs text-white/50">
                                          {col.column_default || '-'}
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-white/5 bg-[#142433]/40 p-8 text-center">
                                <p className="text-white/60">No schema information available</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Table Data */}
                    {selectedTable && (
                      <div className="space-y-4">
                        {isLoadingData ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                              <Loader2 className="mx-auto mb-4 h-10 w-10 animate-spin text-[#4f46e5]" />
                              <p className="text-sm text-[#b0c5c6]">Loading table data...</p>
                            </div>
                          </div>
                        ) : tableData && tableData.data.length > 0 ? (
                          <>
                            {/* Data Table */}
                            <div className="overflow-hidden rounded-xl border border-white/10 bg-[#142433]/40 backdrop-blur-sm">
                              <div className="overflow-x-auto [&::-webkit-scrollbar]:h-3 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:border [&::-webkit-scrollbar-thumb]:border-[#a7dadb]/20 [&::-webkit-scrollbar-thumb]:bg-gradient-to-r [&::-webkit-scrollbar-thumb]:from-[#a7dadb]/60 [&::-webkit-scrollbar-thumb]:via-[#a7dadb]/80 [&::-webkit-scrollbar-thumb]:to-[#a7dadb]/60 [&::-webkit-scrollbar-thumb]:shadow-lg [&::-webkit-scrollbar-thumb]:shadow-[#a7dadb]/30 hover:[&::-webkit-scrollbar-thumb]:from-[#a7dadb]/80 hover:[&::-webkit-scrollbar-thumb]:via-[#a7dadb] hover:[&::-webkit-scrollbar-thumb]:to-[#a7dadb]/80 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-[#0d1b2a]/60">
                                <table className="w-full">
                                  <thead>
                                    <tr className="border-b border-white/10 bg-[#0d1b2a]/60">
                                      {columns.map((column) => (
                                        <th
                                          key={column}
                                          className="group cursor-pointer px-4 py-4 text-left text-sm font-semibold text-[#b0c5c6] transition-colors select-none hover:text-white"
                                          onClick={() => toggleSort(column)}
                                        >
                                          <div className="flex items-center gap-2">
                                            <span>{column}</span>
                                            {sortBy === column ? (
                                              sortOrder === 'asc' ? (
                                                <ArrowUp className="h-4 w-4 text-[#4f46e5]" />
                                              ) : (
                                                <ArrowDown className="h-4 w-4 text-[#4f46e5]" />
                                              )
                                            ) : (
                                              <ArrowUpDown className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-40" />
                                            )}
                                          </div>
                                        </th>
                                      ))}
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {tableData.data.map((row, idx) => (
                                      <tr
                                        key={idx}
                                        className={`transition-colors hover:bg-white/5 ${
                                          idx !== tableData.data.length - 1
                                            ? 'border-b border-white/5'
                                            : ''
                                        }`}
                                      >
                                        {columns.map((column) => (
                                          <td
                                            key={column}
                                            className="max-w-xs truncate px-4 py-3 font-mono text-sm text-white/70"
                                            title={
                                              typeof row[column] === 'object'
                                                ? JSON.stringify(row[column], null, 2)
                                                : String(row[column] ?? '')
                                            }
                                          >
                                            {typeof row[column] === 'object' ? (
                                              <span className="text-[#a7dadb]">
                                                {JSON.stringify(row[column])}
                                              </span>
                                            ) : row[column] === null ? (
                                              <span className="text-white/40 italic">null</span>
                                            ) : (
                                              String(row[column])
                                            )}
                                          </td>
                                        ))}
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>

                            {/* Pagination */}
                            <div className="flex flex-col items-center justify-between gap-4 rounded-xl border border-white/10 bg-[#0d1b2a]/40 p-4 backdrop-blur-sm md:flex-row">
                              <p className="text-sm text-[#b0c5c6]">
                                Showing{' '}
                                <span className="font-semibold text-white">
                                  {(currentPage - 1) * rowsPerPage + 1}
                                </span>{' '}
                                to{' '}
                                <span className="font-semibold text-white">
                                  {Math.min(currentPage * rowsPerPage, tableData.pagination.total)}
                                </span>{' '}
                                of{' '}
                                <span className="font-semibold text-white">
                                  {tableData.pagination.total}
                                </span>{' '}
                                rows
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
                                  Page {currentPage} of {tableData.pagination.totalPages}
                                </span>
                                <Button
                                  onClick={() =>
                                    setCurrentPage((p) =>
                                      Math.min(tableData.pagination.totalPages, p + 1)
                                    )
                                  }
                                  disabled={currentPage === tableData.pagination.totalPages}
                                  className="min-h-[44px] min-w-[44px] rounded-lg border border-white/10 bg-[#142433]/60 p-2 text-white transition-all hover:border-white/20 hover:bg-[#142433]/80 disabled:opacity-40"
                                  aria-label="Next page"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </Button>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-xl border border-white/10 bg-[#0d1b2a]/40 p-16 text-center backdrop-blur-sm">
                            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                              <FileText className="h-8 w-8 text-white/40" />
                            </div>
                            <h3 className="font-heading mb-2 text-xl font-semibold text-white">
                              No Data Found
                            </h3>
                            <p className="text-[#b0c5c6]">This table is currently empty</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
