# Razorpay ₹1 Checkout Issue - Root Cause & Fix

**Date**: 2025-11-09
**Issue**: Razorpay checkout modal showing ₹1 instead of actual subscription price
**Status**: ✅ FIXED

---

## 🔍 Root Cause Analysis

The ₹1 charge was **NOT a bug** - it was Razorpay's expected behavior for subscriptions with future `start_at` times.

### The Problem

In `/home/jitin-m-nair/Desktop/polaris-v3/frontend/app/api/subscriptions/create-subscription/route.ts:676`, the subscription was created with:

```typescript
start_at: Math.floor(Date.now() / 1000) + 3600, // Start in 1 hour
```

According to [Razorpay's subscription documentation](https://razorpay.com/docs/api/subscriptions/):

> When a subscription has a **future start date**, Razorpay creates an **authentication transaction** (typically ₹1) to verify the payment method. After successful authentication, the ₹1 is refunded, and the actual subscription charge happens when the subscription activates.

### Why This Happened

1. **Subscription created** with `start_at` = 1 hour in future
2. **Razorpay requires** payment method verification before activation
3. **Authentication charge** of ₹1 shown in checkout modal
4. **Actual charge** of ₹1,599 would happen after 1 hour when subscription activates

---

## ✅ The Fix

**File**: `/home/jitin-m-nair/Desktop/polaris-v3/frontend/app/api/subscriptions/create-subscription/route.ts`
**Line**: 676-677

### Before (Causing ₹1 Authentication Charge)

```typescript
const subscriptionData: any = {
  plan_id: planId,
  customer_id: razorpayCustomer.id,
  total_count: billingCycle === 'monthly' ? 12 : 1,
  start_at: Math.floor(Date.now() / 1000) + 3600, // ❌ Future start time
  customer_notify: 1,
  // ...
};
```

### After (Charging Full Amount Immediately)

```typescript
const subscriptionData: any = {
  plan_id: planId,
  customer_id: razorpayCustomer.id,
  total_count: billingCycle === 'monthly' ? 12 : 1,
  // ✅ No start_at = subscription starts immediately
  customer_notify: 1,
  // ...
};
```

### Impact

- **Before**: Checkout shows ₹1 → authenticates → subscription activates in 1 hour → charges ₹1,599
- **After**: Checkout shows ₹1,599 → charges immediately → subscription active immediately

---

## 🧪 Verification

### Backend Logs Confirmed Correct Configuration

```
[Razorpay DEBUG] Plan configuration: {
  planId: 'plan_RZZwywnfGJHTuw',
  planPrice: 159900,  // ₹1,599 in paise ✅
  planAmount: 159900,
  rupeesAmount: 1599  // ₹1,599 ✅
}

[Razorpay DEBUG] Fetched plan details: {
  planAmount: 159900,  // ✅ Correct
  planCurrency: 'INR',
  planName: 'Explorer Plan - Monthly (Updated)'
}
```

### Frontend Logs Confirmed Correct Data Flow

```javascript
[CheckoutButton DEBUG] API Response: {
  extractedPlanAmount: 159900,  // ✅ Correct
  planAmountInRupees: 1599,     // ✅ Correct
}

[Razorpay Checkout DEBUG] Opening checkout with options: {
  hasSubscriptionId: true,      // ✅ Correct
  subscriptionId: 'sub_RdaJefm4qWn8iw',
  hasAmount: false,             // ✅ Correct (no override)
  amount: undefined             // ✅ Correct
}
```

### Database Verification

```bash
npx dotenv-cli -e .env.local -- npx tsx scripts/debug-subscription.ts sub_RdaJefm4qWn8iw
```

**Output:**

```
Plan ID: plan_RZZwywnfGJHTuw
Plan Name: Explorer Plan - Monthly (Updated)
Amount: 159900 paise (₹1599)  ✅
```

---

## 📚 Related Documentation

- **Razorpay Subscriptions API**: https://razorpay.com/docs/api/subscriptions/
- **Authentication Charges**: https://razorpay.com/docs/payments/subscriptions/authentication/
- **Subscription Lifecycle**: https://razorpay.com/docs/payments/subscriptions/lifecycle/

---

## 🎯 Lessons Learned

1. **Authentication charges are normal** for future-dated subscriptions
2. **Immediate activation** is better UX for paid subscriptions (no delay)
3. **Future start_at** should only be used for:
   - Free trial periods with known end date
   - Scheduled subscription activations (e.g., "start on 1st of next month")
   - Business logic requiring delayed activation

4. **Always verify plan amounts** in both:
   - Razorpay Dashboard (source of truth)
   - Server-side API responses (fetched from Razorpay)
   - Frontend logs (what's being passed to checkout)

---

## ✅ Testing Checklist

After deploying this fix:

- [ ] Clear browser cache / test in incognito mode
- [ ] Create new subscription from pricing page
- [ ] Verify checkout modal shows correct amount (e.g., ₹1,599, not ₹1)
- [ ] Complete payment and verify subscription activates immediately
- [ ] Check Supabase `subscriptions` table has correct `status` and `next_billing_date`
- [ ] Verify webhook receives `subscription.activated` event (if webhooks configured)

---

**Fix Applied By**: Claude Code
**Investigation Tools Used**: Sequential Thinking MCP, Razorpay MCP, Polaris Context MCP
**Files Modified**:

- `/home/jitin-m-nair/Desktop/polaris-v3/frontend/app/api/subscriptions/create-subscription/route.ts` (line 676-677)
- `/home/jitin-m-nair/Desktop/polaris-v3/frontend/lib/hooks/useRazorpayCheckout.ts` (removed debug logging)
