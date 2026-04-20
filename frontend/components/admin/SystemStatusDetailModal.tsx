'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  XCircle,
  Clock,
  Activity,
  TrendingUp,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { useState } from 'react';
import { useMediaQuery } from '@/lib/hooks/useMediaQuery';

export interface SystemStatusDetails {
  name: string;
  status: 'Operational' | 'Degraded Performance' | 'Partial Outage' | 'Major Outage';
  responseTime?: number;
  lastChecked: string;
  details?: string;
  // Additional detailed information
  metrics?: Array<{
    label: string;
    value: string;
    status?: 'success' | 'warning' | 'error';
  }>;
  recentEvents?: Array<{
    timestamp: string;
    message: string;
    severity: 'info' | 'warning' | 'error';
  }>;
  recommendations?: string[];
}

interface SystemStatusDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  statusData: SystemStatusDetails;
  onRetry?: () => Promise<void>;
}

export function SystemStatusDetailModal({
  isOpen,
  onClose,
  statusData,
  onRetry,
}: SystemStatusDetailModalProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const { isMobile } = useMediaQuery();

  const handleRetry = async () => {
    if (!onRetry) return;
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  // Status configuration
  const getStatusConfig = (status: SystemStatusDetails['status']) => {
    switch (status) {
      case 'Operational':
        return {
          icon: CheckCircle2,
          color: 'text-emerald-400',
          bgColor: 'bg-emerald-500/10',
          borderColor: 'border-emerald-500/20',
          glowColor: 'shadow-emerald-400/20',
        };
      case 'Degraded Performance':
        return {
          icon: AlertTriangle,
          color: 'text-yellow-400',
          bgColor: 'bg-yellow-500/10',
          borderColor: 'border-yellow-500/20',
          glowColor: 'shadow-yellow-400/20',
        };
      case 'Partial Outage':
        return {
          icon: AlertCircle,
          color: 'text-orange-400',
          bgColor: 'bg-orange-500/10',
          borderColor: 'border-orange-500/20',
          glowColor: 'shadow-orange-400/20',
        };
      case 'Major Outage':
        return {
          icon: XCircle,
          color: 'text-red-400',
          bgColor: 'bg-red-500/10',
          borderColor: 'border-red-500/20',
          glowColor: 'shadow-red-400/20',
        };
    }
  };

  const statusConfig = getStatusConfig(statusData.status);
  const StatusIcon = statusConfig.icon;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Modal */}
          <div
            className={`fixed inset-0 z-50 flex items-center justify-center ${isMobile ? 'p-0' : 'p-4'}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="modal-title"
          >
            <motion.div
              initial={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: isMobile ? 1 : 0.95, y: isMobile ? '100%' : 20 }}
              transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              className={`relative w-full overflow-hidden border border-white/10 bg-[#0d1b2a]/95 shadow-2xl backdrop-blur-xl ${
                isMobile ? 'h-full rounded-none' : 'max-h-[90vh] max-w-2xl rounded-2xl'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div
                className={`border-b ${statusConfig.borderColor} ${statusConfig.bgColor} px-4 py-4 sm:px-6 sm:py-5`}
              >
                <div className="flex items-start justify-between gap-3 sm:gap-4">
                  <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
                    {/* Status Icon */}
                    <div
                      className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg sm:h-12 sm:w-12 sm:rounded-xl ${statusConfig.bgColor} border ${statusConfig.borderColor} shadow-lg ${statusConfig.glowColor}`}
                    >
                      <StatusIcon className={`h-5 w-5 sm:h-6 sm:w-6 ${statusConfig.color}`} />
                    </div>

                    {/* Title and Status */}
                    <div className="min-w-0 flex-1">
                      <h2
                        id="modal-title"
                        className="font-heading truncate text-lg font-bold text-white sm:text-2xl"
                      >
                        {statusData.name}
                      </h2>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-xs font-semibold ${statusConfig.color} sm:text-sm`}>
                          {statusData.status}
                        </span>
                        {statusData.responseTime !== undefined && (
                          <>
                            <span className="text-xs text-white/40 sm:text-sm">•</span>
                            <span className="text-xs text-[#b0c5c6] sm:text-sm">
                              {statusData.responseTime}ms
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Close Button */}
                  <button
                    onClick={onClose}
                    className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/70 transition-all duration-200 hover:border-white/20 hover:bg-white/10 hover:text-white focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div
                className={`custom-scrollbar overflow-y-auto ${isMobile ? 'max-h-[calc(100vh-120px)]' : 'max-h-[calc(90vh-200px)]'}`}
              >
                <div className="space-y-4 px-4 py-4 sm:space-y-6 sm:px-6 sm:py-6">
                  {/* Details Section */}
                  {statusData.details && (
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#a7dadb] uppercase">
                        <Activity className="h-4 w-4" />
                        Status Details
                      </h3>
                      <div className="rounded-xl border border-white/10 bg-[#142433]/40 p-4">
                        <p className="text-sm leading-relaxed text-[#b0c5c6]">
                          {statusData.details}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Metrics Grid */}
                  {statusData.metrics && statusData.metrics.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#a7dadb] uppercase">
                        <TrendingUp className="h-4 w-4" />
                        Performance Metrics
                      </h3>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {statusData.metrics.map((metric, index) => {
                          const metricStatusConfig = metric.status
                            ? {
                                success: 'border-emerald-500/20 bg-emerald-500/5',
                                warning: 'border-yellow-500/20 bg-yellow-500/5',
                                error: 'border-red-500/20 bg-red-500/5',
                              }[metric.status]
                            : 'border-white/10 bg-[#142433]/40';

                          return (
                            <div
                              key={index}
                              className={`rounded-xl border p-4 ${metricStatusConfig}`}
                            >
                              <p className="text-xs font-medium tracking-wider text-[#7a8a8b] uppercase">
                                {metric.label}
                              </p>
                              <p className="font-heading mt-1 text-xl font-bold text-white">
                                {metric.value}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recent Events */}
                  {statusData.recentEvents && statusData.recentEvents.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#a7dadb] uppercase">
                        <Clock className="h-4 w-4" />
                        Recent Events
                      </h3>
                      <div className="space-y-2">
                        {statusData.recentEvents.map((event, index) => {
                          const eventConfig = {
                            info: {
                              dotColor: 'bg-blue-400',
                              textColor: 'text-blue-400/80',
                            },
                            warning: {
                              dotColor: 'bg-yellow-400',
                              textColor: 'text-yellow-400/80',
                            },
                            error: {
                              dotColor: 'bg-red-400',
                              textColor: 'text-red-400/80',
                            },
                          }[event.severity];

                          return (
                            <div
                              key={index}
                              className="flex items-start gap-3 rounded-lg border border-white/5 bg-[#142433]/40 p-3"
                            >
                              <div
                                className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${eventConfig.dotColor}`}
                              />
                              <div className="min-w-0 flex-1">
                                <p className="text-sm text-[#b0c5c6]">{event.message}</p>
                                <p className="mt-1 text-xs text-[#7a8a8b]">
                                  {new Date(event.timestamp).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Recommendations */}
                  {statusData.recommendations && statusData.recommendations.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="flex items-center gap-2 text-sm font-semibold tracking-wider text-[#a7dadb] uppercase">
                        <AlertTriangle className="h-4 w-4" />
                        Recommendations
                      </h3>
                      <ul className="space-y-2">
                        {statusData.recommendations.map((recommendation, index) => (
                          <li
                            key={index}
                            className="flex items-start gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3"
                          >
                            <div className="mt-0.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-yellow-400" />
                            <p className="text-sm text-[#b0c5c6]">{recommendation}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Last Checked */}
                  <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-[#142433]/40 px-4 py-3">
                    <Clock className="h-4 w-4 text-[#a7dadb]" />
                    <span className="text-sm text-[#b0c5c6]">
                      Last checked: {new Date(statusData.lastChecked).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer Actions */}
              <div className="border-t border-white/10 bg-[#142433]/40 px-6 py-4">
                <div className="flex items-center justify-between gap-4">
                  <a
                    href="https://status.smartslatepolaris.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-[#a7dadb] transition-colors hover:text-[#d0edf0]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View Status Page
                  </a>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={onClose}
                      className="rounded-xl border border-white/10 bg-white/5 px-6 py-2.5 text-sm font-medium text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10 focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none"
                    >
                      Close
                    </button>
                    {onRetry && (
                      <button
                        onClick={handleRetry}
                        disabled={isRetrying}
                        className="flex items-center gap-2 rounded-xl border border-[#a7dadb]/20 bg-[#a7dadb]/10 px-6 py-2.5 text-sm font-medium text-[#a7dadb] transition-all duration-200 hover:border-[#a7dadb]/40 hover:bg-[#a7dadb]/20 focus:ring-2 focus:ring-[#a7dadb]/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
                        {isRetrying ? 'Checking...' : 'Retry Check'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
