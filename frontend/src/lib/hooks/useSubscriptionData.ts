'use client';

import { useState, useEffect, useCallback } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client-fixed';
import type { SubscriptionInfo, UserProfile, Payment } from '@/types/subscription';

interface UseSubscriptionDataOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface UseSubscriptionDataReturn {
  subscription: SubscriptionInfo | null;
  userProfile: UserProfile | null;
  payments: Payment[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  updateSubscription: (data: Partial<SubscriptionInfo>) => void;
}

/**
 * Custom hook for managing subscription data with real-time updates
 */
export function useSubscriptionData(
  options: UseSubscriptionDataOptions = {}
): UseSubscriptionDataReturn {
  const { autoRefresh = true, refreshInterval = 30000 } = options;

  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = getSupabaseBrowserClient();

  const fetchSubscriptionData = useCallback(async () => {
    try {
      setError(null);
      setIsLoading(true);

      // Get user session
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (!session) throw new Error('No active session');

      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      // Fetch active subscription
      const { data: subscriptions, error: subscriptionError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['created', 'authenticated', 'active', 'trialing'])
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (subscriptionError) throw subscriptionError;

      // Transform subscription data
      let subscriptionInfo: SubscriptionInfo | null = null;
      if (subscriptions && subscriptions.length > 0) {
        const activeSubscription = subscriptions[0];
        subscriptionInfo = {
          currentTier: activeSubscription.subscription_tier,
          status: activeSubscription.status,
          nextBillingDate: activeSubscription.next_billing_date,
          planAmount: activeSubscription.plan_amount,
          planCurrency: activeSubscription.plan_currency,
          planName: activeSubscription.plan_name,
          paymentMethod: activeSubscription.payment_method,
          isCancelled: activeSubscription.status === 'cancelled',
          accessUntilDate: activeSubscription.cancellation_date,
          renewalAmount: activeSubscription.plan_amount,
          billingCycle: activeSubscription.plan_period,
          remainingCount: activeSubscription.remaining_count,
        };
      }

      // Fetch payment history using RPC function
      let paymentHistory: Payment[] = [];
      try {
        const { data: paymentData, error: paymentError } = await supabase.rpc(
          'get_user_payment_history',
          {
            p_user_id: session.user.id,
            p_limit: 10,
            p_offset: 0,
          }
        );

        if (paymentError) {
          console.warn('Payment history fetch failed:', paymentError);
          // Don't fail the entire operation if payment history fails
        } else if (paymentData) {
          paymentHistory = paymentData.map((payment: any) => ({
            payment_id: payment.payment_id,
            subscription_id: payment.subscription_id,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_order_id: payment.razorpay_order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            description: payment.description,
            invoice_id: payment.invoice_id,
            invoice_url: payment.invoice_url,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
          }));
        }
      } catch (paymentErr) {
        console.warn('Error fetching payment history:', paymentErr);
        // Don't fail the entire operation
      }

      setUserProfile(profile);
      setSubscription(subscriptionInfo);
      setPayments(paymentHistory);
    } catch (err: any) {
      console.error('Error fetching subscription data:', err);
      setError(err.message || 'Failed to fetch subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const refresh = useCallback(async () => {
    await fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  const updateSubscription = useCallback((data: Partial<SubscriptionInfo>) => {
    setSubscription((prev) => (prev ? { ...prev, ...data } : null));
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchSubscriptionData();
  }, [fetchSubscriptionData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchSubscriptionData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchSubscriptionData]);

  // Real-time subscription updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('subscription_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'subscriptions',
          filter: `user_id=eq.${userProfile?.user_id}`,
        },
        (payload) => {
          console.log('Subscription change detected:', payload);
          fetchSubscriptionData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_profiles',
          filter: `user_id=eq.${userProfile?.user_id}`,
        },
        (payload) => {
          console.log('User profile change detected:', payload);
          fetchSubscriptionData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, userProfile?.user_id, fetchSubscriptionData]);

  return {
    subscription,
    userProfile,
    payments,
    isLoading,
    error,
    refresh,
    updateSubscription,
  };
}

/**
 * Hook for payment history with pagination
 */
export function usePaymentHistory(initialPage = 1, perPage = 10) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const supabase = getSupabaseBrowserClient();

  const fetchPaymentHistory = useCallback(
    async (page: number = currentPage) => {
      try {
        setError(null);
        setIsLoading(true);

        const offset = (page - 1) * perPage;

        const { data: paymentData, error: paymentError } = await supabase.rpc(
          'get_user_payment_history',
          {
            p_limit: perPage,
            p_offset: offset,
          }
        );

        if (paymentError) {
          throw paymentError;
        }

        if (paymentData && paymentData.length > 0) {
          // Transform the data and extract total count from first row
          const totalCount = paymentData[0]?.total_count || 0;

          const transformedPayments = paymentData.map((payment: any) => ({
            payment_id: payment.payment_id,
            subscription_id: payment.subscription_id,
            razorpay_payment_id: payment.razorpay_payment_id,
            razorpay_order_id: payment.razorpay_order_id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            payment_method: payment.payment_method,
            description: payment.description,
            invoice_id: payment.invoice_id,
            invoice_url: payment.invoice_url,
            created_at: payment.created_at,
            updated_at: payment.updated_at,
          }));

          setPayments(transformedPayments);
          setTotal(totalCount);
          setTotalPages(Math.ceil(totalCount / perPage));
        } else {
          setPayments([]);
          setTotal(0);
          setTotalPages(0);
        }
      } catch (err: any) {
        console.error('Error fetching payment history:', err);
        setError(err.message || 'Failed to fetch payment history');
        setPayments([]);
        setTotal(0);
        setTotalPages(0);
      } finally {
        setIsLoading(false);
      }
    },
    [currentPage, perPage, supabase]
  );

  useEffect(() => {
    fetchPaymentHistory();
  }, [fetchPaymentHistory]);

  const onPageChange = useCallback(
    (page: number) => {
      setCurrentPage(page);
      fetchPaymentHistory(page);
    },
    [fetchPaymentHistory]
  );

  return {
    payments,
    isLoading,
    error,
    currentPage,
    totalPages,
    total,
    onPageChange,
    refresh: () => fetchPaymentHistory(currentPage),
  };
}

/**
 * Hook for subscription cancellation
 */
export function useSubscriptionCancellation() {
  const [isCancelling, setIsCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelSubscription = useCallback(async (cancelAtCycleEnd: boolean, reason?: string) => {
    try {
      setIsCancelling(true);
      setError(null);

      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cancelAtCycleEnd,
          reason: reason?.trim(),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || 'Failed to cancel subscription');
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsCancelling(false);
    }
  }, []);

  return {
    cancelSubscription,
    isCancelling,
    error,
    clearError: () => setError(null),
  };
}
