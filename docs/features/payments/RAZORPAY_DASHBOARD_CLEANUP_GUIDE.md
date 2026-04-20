# Razorpay Dashboard Cleanup Guide

**Document Version**: 1.0
**Date**: October 29, 2025
**Author**: SmartSlate Team
**Status**: Active

---

## Overview

This guide provides comprehensive instructions for cleaning up old and irrelevant Razorpay subscription plans from your dashboard. As SmartSlate Polaris v3 has evolved from USD-based pricing to INR-based pricing, you may have outdated plans that need to be removed to maintain a clean dashboard.

---

## Table of Contents

1. [Current vs Old Plans](#1-current-vs-old-plans)
2. [Automated Cleanup (Recommended)](#2-automated-cleanup-recommended)
3. [Manual Dashboard Cleanup](#3-manual-dashboard-cleanup)
4. [Safety Precautions](#4-safety-precautions)
5. [Verification Steps](#5-verification-steps)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Current vs Old Plans

### Current Plans (DO NOT DELETE)

These are the active INR-priced plans created on 2025-10-29:

| Tier | Plan Type | Plan ID | Amount | Status |
|------|-----------|---------|--------|---------|
| Explorer | Monthly | `plan_RZGmbMjd9u0qtI` | ₹159 | ✅ KEEP |
| Explorer | Yearly | `plan_RZGmc1LbRLGH5a` | ₹1,590 | ✅ KEEP |
| Navigator | Monthly | `plan_RZGf8oI6VAEW3h` | ₹326 | ✅ KEEP |
| Navigator | Yearly | `plan_RZGf9MME1Bs4Vd` | ₹3,260 | ✅ KEEP |
| Voyager | Monthly | `plan_RZGfA1SbZQnZyM` | ₹661 | ✅ KEEP |
| Voyager | Yearly | `plan_RZGfAdVwwRTQah` | ₹6,610 | ✅ KEEP |
| Crew | Monthly | `plan_RZGfBEA99LRzFq` | ₹201 | ✅ KEEP |
| Crew | Yearly | `plan_RZGfBkdSfXnmbj` | ₹2,010 | ✅ KEEP |
| Fleet | Monthly | `plan_RZGfCI7A2I714z` | ₹536 | ✅ KEEP |
| Fleet | Yearly | `plan_RZGfCtTYD4rC1y` | ₹5,360 | ✅ KEEP |
| Armada | Monthly | `plan_RZGfDTm2erB6km` | ₹1,080 | ✅ KEEP |
| Armada | Yearly | `plan_RZGfE89sNsuNMo` | ₹10,800 | ✅ KEEP |

### Old Plans (Candidates for Deletion)

These are typically:
- USD-priced plans (created before 2025-10-29)
- Test plans with different naming conventions
- Plans no longer referenced in `frontend/lib/config/razorpayPlans.ts`
- Plans with 0 active subscriptions

---

## 2. Automated Cleanup (Recommended)

We've created automated scripts to safely identify and clean up old plans.

### Prerequisites

Ensure you have your Razorpay credentials configured in `frontend/.env.local`:

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_XXXXXXXXXXXXX  # or rzp_live_
RAZORPAY_KEY_SECRET=your_secret_key_here
```

### Step 1: List All Plans

```bash
cd frontend
npm run list-razorpay-plans
```

This will show:
- ✅ Current plans that should be kept
- 🗑️ Old plans that can be deleted
- ⚠️ Plans with active subscriptions (cannot delete)

**Example Output:**
```
🔍 Listing Razorpay Plans for SmartSlate Polaris v3
========================================================

📊 Found 15 plan(s) in Razorpay account

✅ CURRENT PLANS (In Use):
────────────────────────────────────────────────
📋 Explorer Plan - Monthly
   ID: plan_RZGmbMjd9u0qtI
   Amount: ₹159
   Period: monthly (every 1 month)
   Active Subscriptions: 3

🗑️  OLD PLANS (Candidates for Deletion):
────────────────────────────────────────────────
📋 Explorer Plan - Monthly (USD)
   ID: plan_OldExplorer123
   Amount: $19
   Period: monthly (every 1 month)
   Status: ✅ No active subscriptions - Safe to delete

📈 SUMMARY:
────────────────────────────────
Current Plans: 12
Old Plans: 3
Plans with Active Subscriptions: 5

🎯 RECOMMENDATIONS:
   • Safe to delete immediately: 2 plan(s)
   • Cannot delete (active subscriptions): 1 plan(s)
```

### Step 2: Dry Run Deletion

Preview what would be deleted without actually deleting anything:

```bash
npm run delete-old-razorpay-plans --dry-run
```

This shows exactly which plans would be deleted and any safety concerns.

### Step 3: Confirm Deletion

After reviewing the dry run, proceed with actual deletion:

```bash
npm run delete-old-razorpay-plans --confirm
```

The script will:
1. Ask for confirmation before proceeding
2. Only delete plans with 0 active subscriptions
3. Skip plans that have active subscriptions
4. Log all actions taken

**Note:** Razorpay automatically hides unused plans after deletion. Plans are permanently deleted after 30 days of inactivity.

---

## 3. Manual Dashboard Cleanup

If you prefer to clean up manually via the Razorpay dashboard:

### Step 1: Access Plans Dashboard

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Products** → **Subscriptions** → **Plans**

### Step 2: Identify Old Plans

Look for plans that match these criteria:
- **Created before**: October 29, 2025
- **Currency**: USD (instead of INR)
- **Naming**: Different from current naming convention
- **Status**: No active subscribers

### Step 3: Check Active Subscriptions

For each plan, click on it and check:
- **Subscriptions tab**: Should show 0 active subscribers
- **Usage**: No recent subscription activity

⚠️ **WARNING**: Never delete a plan with active subscribers. This will break their subscriptions.

### Step 4: Delete Old Plans

For each plan that meets the deletion criteria:

1. Click the **three dots (⋯)** next to the plan
2. Select **Delete Plan**
3. Confirm the deletion in the modal
4. Take note of the plan ID for your records

### Step 5: Verify Deletion

After deletion:
- The plan should disappear from your active plans list
- It may appear in an "archived" or "deleted" section temporarily
- After 30 days, it will be permanently removed

---

## 4. Safety Precautions

### Before Deleting Any Plan

1. ✅ **Check Active Subscriptions**: Never delete plans with active subscribers
2. ✅ **Backup Plan IDs**: Keep a record of what you're deleting
3. ✅ **Test in Test Mode**: Always clean up test mode first
4. ✅ **Verify Configuration**: Ensure plan IDs aren't referenced in code

### What Happens When You Delete a Plan

- ✅ **No Active Subscriptions**: Plan is immediately hidden from dashboard
- ✅ **30-Day Grace Period**: Plan can be restored within 30 days if needed
- ✅ **Permanent Deletion**: After 30 days, plan is permanently removed
- ❌ **Cannot Delete**: Plans with active subscriptions will show an error

### Emergency Recovery

If you accidentally delete a plan:
1. Contact Razorpay support within 30 days
2. Provide the plan ID and deletion date
3. Explain the situation and request restoration

---

## 5. Verification Steps

### After Automated Cleanup

Run the list command again to verify cleanup:

```bash
npm run list-razorpay-plans
```

You should see:
- ✅ Only current plans listed
- 🗑️ No old plans with 0 subscribers
- ⚠️ Any remaining old plans have active subscribers

### After Manual Cleanup

1. **Refresh the dashboard** to see updated plan list
2. **Check application** to ensure current plans work:
   ```bash
   # Test subscription creation
   npm run test:integration -- razorpay
   ```
3. **Monitor logs** for any plan-related errors

### Code Verification

Ensure `frontend/lib/config/razorpayPlans.ts` contains only current plan IDs:

```typescript
export const RAZORPAY_PLANS: RazorpayPlanMapping = {
  explorer: {
    monthly: 'plan_RZGmbMjd9u0qtI', // ✅ Current
    yearly: 'plan_RZGmc1LbRLGH5a',   // ✅ Current
  },
  // ... other current plans
};
```

---

## 6. Troubleshooting

### Common Issues

#### Issue: "Cannot delete plan" error
**Cause**: Plan has active subscriptions
**Solution**:
1. Migrate subscribers to new plans first
2. Wait for subscriptions to be cancelled
3. Then delete the plan

#### Issue: "Plan not found" in scripts
**Cause**: API credentials or permissions issue
**Solution**:
1. Verify `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
2. Ensure you're using the correct mode (test vs live)
3. Check that your account has the necessary permissions

#### Issue: Script hangs or times out
**Cause**: Network issues or API rate limiting
**Solution**:
1. Check internet connection
2. Wait a few minutes and retry
3. Run with smaller batch sizes if modifying the script

### Getting Help

If you encounter issues:

1. **Check Logs**: Scripts provide detailed error messages
2. **Verify Credentials**: Ensure API keys are correct and active
3. **Contact Support**: For Razorpay-specific issues, contact their support
4. **Rollback**: If something goes wrong, restore from your backup

### Monitoring After Cleanup

For the first week after cleanup:
- Monitor subscription creation success rates
- Check for any plan-related errors in logs
- Verify billing processes work correctly
- Keep an eye on customer support tickets

---

## Best Practices

### Ongoing Plan Management

1. **Regular Cleanup**: Review and clean up unused plans quarterly
2. **Documentation**: Keep plan IDs and purposes documented
3. **Testing**: Always test new plans in a separate test environment
4. **Backup**: Maintain a backup of critical plan configurations

### Naming Conventions

Use consistent naming for future plans:
```
{Tier} Plan - {Billing Cycle} ({Currency})
Examples:
- "Explorer Plan - Monthly (INR)"
- "Navigator Plan - Yearly (INR)"
```

### Version Control

Track plan changes in your development process:
1. Update plan IDs in `razorpayPlans.ts`
2. Test with new plans before going live
3. Keep old plans until migration is complete
4. Document all changes for team reference

---

## Emergency Contacts

### Razorpay Support
- **Email**: support@razorpay.com
- **Phone**: 022-6777-7777 (India)
- **Help Center**: https://razorpay.com/support/

### Internal Team
- **Technical Lead**: Contact for script issues
- **Product Manager**: Contact for plan configuration questions
- **DevOps**: Contact for deployment and environment issues

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2025-10-29 | Initial creation | SmartSlate Team |

---

**Last Updated**: October 29, 2025
**Next Review**: After first cleanup execution
**Maintainer**: SmartSlate Development Team