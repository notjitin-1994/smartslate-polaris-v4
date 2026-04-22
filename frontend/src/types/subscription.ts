/**
 * Subscription Management Types
 *
 * @description TypeScript interfaces and types for subscription management
 * @version 1.0.0
 * @date 2025-10-29
 */

export type SubscriptionTier =
  | 'free'
  | 'explorer'
  | 'navigator'
  | 'voyager'
  | 'crew'
  | 'fleet'
  | 'armada'
  | 'enterprise';

export type SubscriptionStatus =
  | 'created'
  | 'authenticated'
  | 'active'
  | 'halted'
  | 'cancelled'
  | 'completed'
  | 'expired'
  | 'paused'
  | 'trialing';

export type BillingCycle = 'monthly' | 'yearly';

export interface Subscription {
  subscription_id: string;
  razorpay_subscription_id: string;
  razorpay_plan_id: string;
  razorpay_customer_id: string | null;
  status: SubscriptionStatus;
  plan_name: string;
  plan_amount: number; // Amount in paise (₹1 = 100 paise)
  plan_currency: string;
  plan_period: BillingCycle;
  plan_interval: number;
  subscription_tier: SubscriptionTier;
  start_date: string | null;
  end_date: string | null;
  current_start: string | null;
  current_end: string | null;
  next_billing_date: string | null;
  charge_at: string | null;
  total_count: number;
  paid_count: number;
  remaining_count: number;
  payment_method: any | null;
  metadata: Record<string, any>;
  short_url: string | null;
  cancellation_date: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface UserProfile {
  user_id: string;
  full_name: string | null;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  subscription_tier: SubscriptionTier;
  user_role: string;
  blueprint_creation_count: number;
  blueprint_saving_count: number;
  blueprint_creation_limit: number;
  blueprint_saving_limit: number;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  payment_id: string;
  subscription_id: string;
  razorpay_payment_id: string;
  razorpay_order_id: string;
  amount: number;
  currency: string;
  status: 'created' | 'authorized' | 'captured' | 'refunded' | 'failed';
  payment_method: any;
  description: string | null;
  invoice_id: string | null;
  invoice_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaymentHistoryResponse {
  payments: Payment[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface CancellationOptions {
  cancelAtCycleEnd: boolean;
  reason?: string;
}

export interface CancellationResponse {
  success: boolean;
  data: {
    subscriptionId: string;
    cancellationDate: string;
    accessUntilDate?: string;
    cancelledAtCycleEnd: boolean;
    message: string;
  };
  requestId: string;
}

export interface SubscriptionInfo {
  currentTier: SubscriptionTier;
  status: SubscriptionStatus;
  nextBillingDate: string | null;
  planAmount: number;
  planCurrency: string;
  planName: string;
  paymentMethod: any;
  isCancelled: boolean;
  accessUntilDate?: string;
  renewalAmount?: number;
  billingCycle: BillingCycle;
  remainingCount?: number;
}

// Component Props
export interface SubscriptionInfoProps {
  subscription: SubscriptionInfo | null;
  userProfile: UserProfile | null;
  isLoading?: boolean;
  error?: string | null;
}

export interface PaymentHistoryProps {
  payments: Payment[];
  isLoading?: boolean;
  error?: string | null;
}

export interface CancelSubscriptionButtonProps {
  subscription: Subscription | null;
  isLoading?: boolean;
}

export interface SubscriptionManagementPageProps {
  user?: any; // Supabase user
  userProfile: UserProfile | null;
  subscription: SubscriptionInfo | null;
  isLoading: boolean;
  error: string | null;
}

// Utility functions
export const formatCurrency = (amount: number, currency: string = 'INR'): string => {
  const formatter = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    minimumFractionDigits: currency === 'INR' ? 0 : 2,
  });

  // Convert paise to rupees
  const amountInRupees = amount / 100;
  return formatter.format(amountInRupees);
};

export const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(dateString));
};

export const formatDateTime = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateString));
};

export const getTierDisplayName = (tier: SubscriptionTier): string => {
  switch (tier) {
    case 'free':
      return 'Free Tier Member';
    case 'explorer':
      return 'Explorer Member';
    case 'navigator':
      return 'Navigator Member';
    case 'voyager':
      return 'Voyager Member';
    case 'crew':
      return 'Crew Member';
    case 'fleet':
      return 'Fleet Member';
    case 'armada':
      return 'Armada Member';
    case 'enterprise':
      return 'Enterprise Member';
    default:
      return `${(tier as string).charAt(0).toUpperCase() + (tier as string).slice(1)} Member`;
  }
};

export const getStatusColor = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'active':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'cancelled':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'expired':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    case 'trialing':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    case 'halted':
    case 'paused':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
};

export const getStatusLabel = (status: SubscriptionStatus): string => {
  switch (status) {
    case 'created':
      return 'Created';
    case 'authenticated':
      return 'Payment Pending';
    case 'active':
      return 'Active';
    case 'halted':
      return 'Halted';
    case 'cancelled':
      return 'Cancelled';
    case 'completed':
      return 'Completed';
    case 'expired':
      return 'Expired';
    case 'paused':
      return 'Paused';
    case 'trialing':
      return 'Trial';
    default:
      return (status as string).charAt(0).toUpperCase() + (status as string).slice(1);
  }
};
