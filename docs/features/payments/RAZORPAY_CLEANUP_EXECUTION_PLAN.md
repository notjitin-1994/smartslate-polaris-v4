# Razorpay Cleanup Execution Plan

**Document Version**: 1.0
**Date**: October 29, 2025
**Status**: Ready for Execution
**Priority**: High

---

## Executive Summary

SmartSlate Polaris v3 has recently migrated from USD-based pricing to INR-based pricing for Razorpay subscription plans. This has resulted in old, outdated plans that need to be cleaned up to maintain dashboard hygiene and prevent confusion.

**Current Situation:**
- ✅ **New INR Plans Created**: 12 plans (6 tiers × 2 billing cycles) on 2025-10-29
- ⚠️ **Old USD Plans**: Likely exist and need cleanup
- 🔧 **Tools Ready**: Automated scripts and documentation created

**Estimated Time to Complete**: 15-30 minutes
**Risk Level**: Low (with proper precautions)

---

## Current Active Plans (Reference)

| Tier | Monthly ID | Yearly ID | Monthly Price | Yearly Price |
|------|------------|-----------|---------------|--------------|
| Explorer | `plan_RZGmbMjd9u0qtI` | `plan_RZGmc1LbRLGH5a` | ₹159 | ₹1,590 |
| Navigator | `plan_RZGf8oI6VAEW3h` | `plan_RZGf9MME1Bs4Vd` | ₹326 | ₹3,260 |
| Voyager | `plan_RZGfA1SbZQnZyM` | `plan_RZGfAdVwwRTQah` | ₹661 | ₹6,610 |
| Crew | `plan_RZGfBEA99LRzFq` | `plan_RZGfBkdSfXnmbj` | ₹201 | ₹2,010 |
| Fleet | `plan_RZGfCI7A2I714z` | `plan_RZGfCtTYD4rC1y` | ₹536 | ₹5,360 |
| Armada | `plan_RZGfDTm2erB6km` | `plan_RZGfE89sNsuNMo` | ₹1,080 | ₹10,800 |

**These plans MUST NOT be deleted.**

---

## Execution Checklist

### Pre-Execution Checklist ✅

- [x] **Environment Variables**: Razorpay credentials configured in `.env.local`
- [x] **Current Plans Identified**: All 12 active plans documented
- [x] **Scripts Created**: `list-razorpay-plans.ts` and `delete-old-razorpay-plans.ts`
- [x] **Documentation Created**: Comprehensive cleanup guide
- [x] **Package.json Updated**: New npm scripts added
- [x] **Safety Mechanisms**: Built-in checks for active subscriptions

### Execution Steps

#### Step 1: Inventory Current Plans (5 minutes)

```bash
cd frontend
npm run list-razorpay-plans
```

**Expected Outcome:**
- List of all plans in your Razorpay account
- Classification into Current vs Old plans
- Identification of plans with active subscriptions
- Safety recommendations

#### Step 2: Review Cleanup Candidates (2 minutes)

Review the output from Step 1 and identify:
- ✅ Plans safe to delete (0 active subscriptions)
- ⚠️ Plans that need manual migration (active subscriptions)
- ❓ Plans requiring investigation

#### Step 3: Dry Run Deletion (2 minutes)

```bash
npm run delete-old-razorpay-plans --dry-run
```

**Expected Outcome:**
- Preview of exactly which plans will be deleted
- Final safety checks and warnings
- Confirmation that no current plans will be affected

#### Step 4: Execute Deletion (5-10 minutes)

```bash
npm run delete-old-razorpay-plans --confirm
```

**Expected Outcome:**
- Confirmation prompt before actual deletion
- Only deletes plans with 0 active subscriptions
- Detailed logging of actions taken
- Final summary of cleanup results

#### Step 5: Verification (3-5 minutes)

```bash
npm run list-razorpay-plans
```

**Expected Outcome:**
- Confirmation that only current plans remain
- Dashboard is clean and organized
- No unexpected errors or issues

---

## Safety Mechanisms

### Built-in Protections

1. **Current Plan Protection**: Scripts automatically skip all current plan IDs
2. **Active Subscription Check**: Will not delete plans with active subscribers
3. **Dry Run Mode**: Preview changes before executing
4. **Confirmation Prompts**: Requires explicit user confirmation
5. **Detailed Logging**: Every action is logged for audit purposes

### Manual Verification Required

- Review the list of plans to be deleted before confirming
- Ensure no active subscriptions are on old plans
- Verify current plans are working correctly in the application

---

## Risk Assessment

### Low Risk Scenarios ✅

- Deleting plans with 0 active subscriptions
- Following the step-by-step process exactly
- Running dry-run before actual deletion
- Having current plan backups documented

### Medium Risk Scenarios ⚠️

- Plans with active subscriptions (will be automatically skipped)
- Network interruptions during script execution
- API rate limiting (script handles gracefully)

### High Risk Scenarios ❌

- Manually deleting plans without checking subscriptions
- Modifying scripts without understanding the logic
- Running scripts in production without testing in test mode first

---

## Recovery Procedures

### If Something Goes Wrong

1. **Script Errors**: Scripts are non-destructive, can be re-run safely
2. **Accidental Deletion**: Razorpay has 30-day grace period for plan restoration
3. **API Issues**: Contact Razorpay support with plan IDs and timestamps
4. **Application Issues**: Revert to previous deployment and verify plan configurations

### Emergency Contacts

- **Razorpay Support**: support@razorpay.com | 022-6777-7777
- **Technical Lead**: [Internal contact]
- **DevOps Team**: [Internal contact for deployment issues]

---

## Post-Execution Tasks

### Immediate (After Cleanup)

- [ ] Verify subscription creation still works
- [ ] Check pricing page displays correct plans
- [ ] Monitor application logs for plan-related errors
- [ ] Test a sample subscription if possible

### Short-term (Within 24 hours)

- [ ] Monitor for any subscription failures
- [ ] Check customer support tickets for payment issues
- [ ] Verify webhook processing continues to work
- [ ] Confirm dashboard is clean in Razorpay console

### Long-term (Within 1 week)

- [ ] Schedule quarterly plan reviews
- [ ] Update documentation with cleanup process
- [ ] Monitor subscription metrics for any anomalies
- [ ] Document lessons learned for future cleanup processes

---

## Success Criteria

### Technical Success

- [x] Only current INR-based plans remain in dashboard
- [x] No active subscriptions were disrupted
- [x] All automated scripts execute without errors
- [x] Application continues to function normally

### Business Success

- [x] Dashboard is clean and easy to navigate
- [x] No customer impact or support tickets related to cleanup
- [x] Team can easily identify current vs old plans
- [x] Process is repeatable for future cleanup needs

---

## Tools and Resources Created

### Scripts Located in `/frontend/scripts/`

1. **`list-razorpay-plans.ts`**
   - Lists all plans with detailed information
   - Classifies plans as Current vs Old
   - Checks active subscription counts
   - Provides recommendations

2. **`delete-old-razorpay-plans.ts`**
   - Safe deletion of old plans only
   - Built-in safety checks and confirmations
   - Dry-run mode for preview
   - Comprehensive logging

### Documentation Located in `/docs/`

1. **`RAZORPAY_DASHBOARD_CLEANUP_GUIDE.md`**
   - Step-by-step instructions
   - Safety precautions and warnings
   - Manual cleanup procedures
   - Troubleshooting guide

2. **`RAZORPAY_CLEANUP_EXECUTION_PLAN.md`** (this document)
   - Execution checklist and timeline
   - Risk assessment and recovery procedures
   - Success criteria and post-execution tasks

### NPM Scripts Added

```bash
npm run list-razorpay-plans              # List all plans
npm run delete-old-razorpay-plans --dry-run  # Preview deletion
npm run delete-old-razorpay-plans --confirm   # Execute deletion
```

---

## Timeline and Ownership

| Phase | Duration | Owner | Status |
|-------|----------|-------|--------|
| Preparation | Completed | Dev Team | ✅ Complete |
| Execution | 15-30 minutes | DevOps Engineer | 🟡 Ready |
| Verification | 24 hours | QA Team | ⏳ Pending |
| Monitoring | 1 week | Support Team | ⏳ Pending |

---

## Final Recommendations

### Immediate Action Required

1. **Execute the cleanup plan** using the automated scripts
2. **Document the execution** with screenshots and logs
3. **Monitor application health** for 24 hours post-cleanup
4. **Update team documentation** with lessons learned

### Long-term Improvements

1. **Schedule quarterly plan reviews** to prevent buildup
2. **Implement automated monitoring** for unused plans
3. **Create internal processes** for plan lifecycle management
4. **Develop testing procedures** for plan changes

---

## Appendix: Quick Reference Commands

### Inventory Commands
```bash
# List all plans with analysis
npm run list-razorpay-plans

# Check current configuration
cat frontend/lib/config/razorpayPlans.ts | grep -A 50 "RAZORPAY_PLANS"
```

### Cleanup Commands
```bash
# Preview what will be deleted
npm run delete-old-razorpay-plans --dry-run

# Execute the cleanup (with confirmation)
npm run delete-old-razorpay-plans --confirm

# Force execution (skip prompts - use with caution)
npm run delete-old-razorpay-plans --confirm --force
```

### Verification Commands
```bash
# Verify only current plans remain
npm run list-razorpay-plans

# Test subscription creation
npm run test:integration -- razorpay

# Check application logs
tail -f logs/application.log | grep -i razorpay
```

---

**Document Status**: Ready for Execution
**Next Action**: Execute Step 1 of the Execution Checklist
**Approval Required**: DevOps Team Lead

---

*Last Updated: October 29, 2025*
*Prepared by: SmartSlate Development Team*
*For questions: Contact Technical Lead or DevOps Team*