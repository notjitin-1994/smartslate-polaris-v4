'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentHistoryProps } from '@/types/subscription';
import { formatCurrency, formatDateTime, getStatusColor } from '@/types/subscription';

/**
 * PaymentHistory Component
 *
 * Displays paginated payment history with download links for invoices
 * and comprehensive payment status information.
 */
export function PaymentHistory({
  payments,
  isLoading = false,
  error = null,
}: PaymentHistoryProps): React.JSX.Element {
  const [downloadingInvoice, setDownloadingInvoice] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = 1; // For now, we'll assume 1 page since we're using mock data

  const handleDownloadInvoice = async (paymentId: string, invoiceUrl: string) => {
    setDownloadingInvoice(paymentId);
    try {
      // In a real implementation, this would download the invoice
      console.log('Downloading invoice for payment:', paymentId);
      // For now, we'll just open the URL in a new tab
      window.open(invoiceUrl, '_blank');
    } catch (error) {
      console.error('Failed to download invoice:', error);
    } finally {
      setDownloadingInvoice(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'captured':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'authorized':
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'created':
        return 'Created';
      case 'authorized':
        return 'Authorized';
      case 'captured':
        return 'Paid';
      case 'refunded':
        return 'Refunded';
      case 'failed':
        return 'Failed';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  // Pagination controls
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = Array.from({ length: totalPages }, (_, i) => i + 1);
    const showPages = pages.filter(
      (page) =>
        page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)
    );

    return (
      <div className="flex items-center justify-between border-t border-gray-200 bg-gray-50 px-6 py-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={cn(
              'rounded-lg border p-2 transition-colors',
              currentPage === 1
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <div className="flex items-center space-x-1">
            {showPages.map((page, index) => {
              const prevPage = showPages[index - 1];
              const showDots = prevPage && page - prevPage > 1;

              return (
                <React.Fragment key={page}>
                  {showDots && <span className="px-2 text-gray-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      'rounded-md px-3 py-1 text-sm font-medium transition-colors',
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-700 hover:bg-gray-100'
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={cn(
              'rounded-lg border p-2 transition-colors',
              currentPage === totalPages
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
            )}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="text-sm text-gray-600">
          Page {currentPage} of {totalPages}
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-gray-200 bg-white shadow-lg"
      >
        <div className="p-6">
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center space-y-4">
              <Loader2 className="text-primary-600 h-8 w-8 animate-spin" />
              <p className="text-gray-600">Loading payment history...</p>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="rounded-xl border border-red-200 bg-white p-6 shadow-lg"
      >
        <div className="flex items-center space-x-3 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <h3 className="font-semibold">Error Loading Payment History</h3>
        </div>
        <p className="mt-2 text-gray-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
        >
          Try Again
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg"
    >
      {/* Header */}
      <div className="border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
          </div>
          {payments.length > 0 && (
            <div className="text-sm text-gray-600">
              {payments.length} payment{payments.length !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Payment List */}
      <div className="divide-y divide-gray-200">
        <AnimatePresence>
          {payments.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-12 text-center"
            >
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <CreditCard className="h-8 w-8 text-gray-400" />
              </div>
              <h4 className="mb-2 text-lg font-medium text-gray-900">No payments found</h4>
              <p className="text-gray-600">
                Your payment history will appear here once you make your first payment.
              </p>
            </motion.div>
          ) : (
            payments.map((payment, index) => (
              <motion.div
                key={payment.payment_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  {/* Payment Details */}
                  <div className="flex items-start space-x-4">
                    <div
                      className={cn(
                        'mt-1 rounded-full border p-2',
                        payment.status === 'captured'
                          ? 'border-green-200 bg-green-50'
                          : payment.status === 'failed'
                            ? 'border-red-200 bg-red-50'
                            : 'border-blue-200 bg-blue-50'
                      )}
                    >
                      {getStatusIcon(payment.status)}
                    </div>

                    <div className="flex-1">
                      <div className="mb-1 flex items-center space-x-3">
                        <h4 className="font-medium text-gray-900">
                          {formatCurrency(payment.amount, payment.currency)}
                        </h4>
                        <span
                          className={cn(
                            'rounded-full border px-2 py-1 text-xs font-medium',
                            getStatusColor(payment.status as any)
                          )}
                        >
                          {getStatusLabel(payment.status)}
                        </span>
                      </div>

                      <p className="mb-2 text-sm text-gray-600">
                        {payment.description || 'Subscription Payment'}
                      </p>

                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-4 w-4" />
                          <span>{formatDateTime(payment.created_at)}</span>
                        </div>

                        <div className="flex items-center space-x-1">
                          <CreditCard className="h-4 w-4" />
                          <span>•••• {payment.razorpay_payment_id?.slice(-4) || 'Unknown'}</span>
                        </div>

                        {payment.invoice_id && (
                          <div className="flex items-center space-x-1">
                            <FileText className="h-4 w-4" />
                            <span>Invoice: {payment.invoice_id}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="ml-4 flex items-center space-x-2">
                    {payment.invoice_url && (
                      <button
                        onClick={() =>
                          handleDownloadInvoice(payment.payment_id, payment.invoice_url!)
                        }
                        disabled={downloadingInvoice === payment.payment_id}
                        className={cn(
                          'flex items-center space-x-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors',
                          downloadingInvoice === payment.payment_id
                            ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                            : 'text-primary-600 border-primary-200 hover:bg-primary-50'
                        )}
                      >
                        {downloadingInvoice === payment.payment_id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        <span>
                          {downloadingInvoice === payment.payment_id ? 'Downloading...' : 'Invoice'}
                        </span>
                      </button>
                    )}

                    <button
                      className="rounded-lg border border-gray-200 p-2 text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-900"
                      title="View Details"
                    >
                      <FileText className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Additional Details for Failed/Refunded Payments */}
                {(payment.status === 'failed' || payment.status === 'refunded') && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3"
                  >
                    <p className="text-sm text-gray-600">
                      {payment.status === 'failed'
                        ? 'This payment failed. Please check your payment method and try again.'
                        : 'This payment was refunded. The amount has been credited back to your account.'}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Pagination */}
      {renderPagination()}
    </motion.div>
  );
}

export default PaymentHistory;
