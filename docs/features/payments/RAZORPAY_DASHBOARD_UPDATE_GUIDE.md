# Razorpay Dashboard Configuration Guide

## 🎯 **CURRENT PRICING REQUIREMENTS**

Your codebase is configured with the following pricing. Ensure your Razorpay dashboard plans match exactly.

### **Individual Plans (NEW PRICING)**

| Tier | Monthly Price | Yearly Price | Current Plan ID | Required Plan Amount |
|------|---------------|--------------|-----------------|---------------------|
| **Explorer** | ₹1,599 | ₹15,990 | `plan_RZZwywnfGJHTuw` | 159900 / 1599000 paise |
| **Navigator** | ₹3,499 | ₹34,990 | `plan_RZZx05RyiE9bz5` | 349900 / 3499000 paise |
| **Voyager** | ₹6,999 | ₹69,990 | `plan_RZZx1BzIJRZjk7` | 699900 / 6999000 paise |

### **Team Plans (PER SEAT - VERIFIED PRICING)**

| Tier | Monthly Price | Yearly Price | Current Plan ID | Required Plan Amount |
|------|---------------|--------------|-----------------|---------------------|
| **Crew** | ₹1,999 | ₹19,990 | `plan_RZGfBEA99LRzFq` | 199900 / 1999000 paise |
| **Fleet** | ₹5,399 | ₹53,990 | `plan_RZGfCI7A2I714z` | 539900 / 5399000 paise |
| **Armada** | ₹10,899 | ₹108,990 | `plan_RZGfDTm2erB6km` | 1089900 / 10899000 paise |

---

## 📋 **DASHBOARD VERIFICATION CHECKLIST**

### **Step 1: Verify Current Plan Prices**
1. **Login to Razorpay Dashboard**: https://dashboard.razorpay.com/
2. **Navigate to**: Subscriptions → Plans
3. **Check Current Plans**: Look for these plan IDs and their current pricing

### **Step 2: Verify Individual Plan Pricing**
**Verify each individual tier plan ID has the correct amount:**

#### Explorer Plans:
- **Monthly Plan**: `plan_RZZwywnfGJHTuw`
  - Edit plan → Set amount to **159900** paise (₹1,599)
- **Yearly Plan**: `plan_RZZwzXQ1PJ4ZOn`
  - Edit plan → Set amount to **1599000** paise (₹15,990)

#### Navigator Plans:
- **Monthly Plan**: `plan_RZZx05RyiE9bz5`
  - Edit plan → Set amount to **349900** paise (₹3,499)
- **Yearly Plan**: `plan_RZZx0gnrvTUTVP`
  - Edit plan → Set amount to **3499000** paise (₹34,990)

#### Voyager Plans:
- **Monthly Plan**: `plan_RZZx1BzIJRZjk7`
  - Edit plan → Set amount to **699900** paise (₹6,999)
- **Yearly Plan**: `plan_RZZx1oIMLCNQ2N`
  - Edit plan → Set amount to **6999000** paise (₹69,990)

### **Step 3: Verify Team Plan Pricing**
**Team plans should already be correct, but verify:**

- **Crew Monthly**: `plan_RZGfBEA99LRzFq` → **199900** paise (₹1,999)
- **Crew Yearly**: `plan_RZGfBkdSfXnmbj` → **1999000** paise (₹19,990)
- **Fleet Monthly**: `plan_RZGfCI7A2I714z` → **539900** paise (₹5,399)
- **Fleet Yearly**: `plan_RZGfCtTYD4rC1y` → **5399000** paise (₹53,990)
- **Armada Monthly**: `plan_RZGfDTm2erB6km` → **1089900** paise (₹10,899)
- **Armada Yearly**: `plan_RZGfE89sNsuNMo` → **10899000** paise (₹108,990)

---

## ⚠️ **CRITICAL NOTES**

### **Pricing Format**
- Razorpay uses **paise** (1 INR = 100 paise)
- Enter amounts as paise (without decimal points)
- Example: ₹1,599 = 159900 paise

### **Plan Names**
- Ensure plan names are descriptive:
  - "Explorer Plan - Monthly"
  - "Explorer Plan - Yearly"
  - "Navigator Plan - Monthly"
  - etc.

### **Existing Subscriptions**
- **DO NOT DELETE** plans with active subscriptions
- If a plan has active users, you may need to:
  - Contact them about the pricing change
  - Create new plans and migrate users
  - Or grandfather them at old pricing

### **Testing After Updates**
1. **Test Checkout Flow**: Click upgrade buttons to verify correct pricing
2. **Test Razorpay Popup**: Ensure popup shows correct amounts
3. **Test All Tiers**: Verify individual and team plan pricing

---

## 🔍 **VERIFICATION STEPS**

### **After Dashboard Updates:**

1. **Run the plan listing script** to verify:
   ```bash
   npm run list-razorpay-plans
   ```

2. **Test the pricing page**:
   - Visit `/pricing`
   - Verify all prices match new requirements

3. **Test checkout flow**:
   - Click "Upgrade" for each tier
   - Verify Razorpay popup shows correct pricing

4. **Run tests** to ensure consistency:
   ```bash
   npm test -- __tests__/integration/razorpay/razorpay-plans.test.ts
   ```

---

## 🚨 **TROUBLESHOOTING**

### **If Razorpay popup shows wrong pricing:**

1. **Check Plan ID Mapping**: Verify the plan IDs in `razorpayPlans.ts` match the dashboard
2. **Clear Browser Cache**: Clear all cached data and test again
3. **Check Environment**: Ensure you're using the correct Razorpay key (test vs live)
4. **Verify Plan Status**: Ensure plans are "active" in Razorpay dashboard

### **If tests fail:**
1. **Run tests locally** to see exact failures
2. **Update test expectations** if plan amounts changed
3. **Check for cached plan data** in localStorage

### **If users see old pricing:**
1. **Check active subscriptions** on old plans
2. **Migrate users** to new plans if necessary
3. **Clear frontend cache** if using CDN

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] Individual plan prices verified in Razorpay dashboard
- [ ] Team plan prices verified in Razorpay dashboard
- [ ] All plan names are descriptive and consistent
- [ ] Test checkout flow shows correct pricing
- [ ] Razorpay popup displays correct amounts
- [ ] All tests pass (`npm test -- razorpay-plans.test.ts`)
- [ ] No console errors related to pricing
- [ ] Production environment verified (if live)

---

## 📞 **SUPPORT**

If you encounter issues:
1. **Razorpay Support**: support@razorpay.com
2. **Documentation**: https://razorpay.com/docs/
3. **Dashboard**: https://dashboard.razorpay.com/

**IMPORTANT**: Always test in a test environment before making live changes.