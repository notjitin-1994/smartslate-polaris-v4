'use client';

export const dynamic = 'force-dynamic';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/hooks/useSession';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import SubscriptionManagementContent from '@/components/subscription/SubscriptionManagementContent';
import type { SubscriptionManagementPageProps } from '@/types/subscription';

/**
 * Main Subscription Management Page Component
 *
 * Client component that handles authentication, data fetching,
 * and renders the subscription management interface.
 */
export default function SubscriptionManagementPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useSession();
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionManagementPageProps>({
    userProfile: null,
    subscription: null,
    isLoading: true,
    error: null,
    user: null,
  });

  useEffect(() => {
    // Check authentication
    if (!authLoading && !user) {
      const returnUrl = encodeURIComponent('/subscription');
      router.push(`/login?redirect=${returnUrl}`);
      return;
    }

    if (!user) return;

    // Fetch subscription data
    const fetchSubscriptionData = async () => {
      try {
        const supabase = getSupabaseBrowserClient();
        setSubscriptionData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Get user profile
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching user profile:', profileError);
          throw profileError;
        }

        // Get active subscription
        const { data: subscriptions, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .in('status', ['created', 'authenticated', 'active', 'trialing'])
          .is('deleted_at', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError);
          throw subscriptionError;
        }

        const activeSubscription =
          subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;

        // Transform subscription data for the component
        let subscriptionInfo = null;
        if (activeSubscription) {
          subscriptionInfo = {
            currentTier: activeSubscription.subscription_tier as any,
            status: activeSubscription.status as any,
            nextBillingDate: activeSubscription.next_billing_date,
            planAmount: activeSubscription.plan_amount,
            planCurrency: activeSubscription.plan_currency,
            planName: activeSubscription.plan_name,
            paymentMethod: activeSubscription.payment_method,
            isCancelled: activeSubscription.status === 'cancelled',
            accessUntilDate: activeSubscription.cancellation_date,
            renewalAmount: activeSubscription.plan_amount,
            billingCycle: activeSubscription.plan_period as any,
            remainingCount: activeSubscription.remaining_count,
          };
        }

        setSubscriptionData({
          userProfile,
          subscription: subscriptionInfo,
          isLoading: false,
          error: null,
          user,
        });
      } catch (error) {
        console.error('Error in fetchSubscriptionData:', error);
        setSubscriptionData({
          userProfile: null,
          subscription: null,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Failed to load subscription data',
          user,
        });
      }
    };

    fetchSubscriptionData();
  }, [user, authLoading, router]);

  // Show loading state during authentication check
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="border-primary-600 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while fetching subscription data
  if (subscriptionData.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="text-center">
          <div className="border-primary-600 mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2"></div>
          <p className="text-gray-600">Loading subscription data...</p>
        </div>
      </div>
    );
  }

  // Render the subscription management content
  return <SubscriptionManagementContent {...subscriptionData} />;
}
