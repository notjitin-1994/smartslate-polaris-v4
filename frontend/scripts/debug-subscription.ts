/**
 * Debug Subscription Script
 * Fetches subscription details from Razorpay to verify what the checkout modal would show
 */

import 'dotenv/config';
import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

/**
* Fetches and logs detailed subscription, customer, addons and plan info for debugging and calculates the expected checkout amount.
* @example
* debugSubscription('sub_Ff1a2b3c')
* Promise<void>
* @param {{string}} {{subscriptionId}} - The Razorpay subscription ID to fetch and inspect.
* @returns {{Promise<void>}} Resolves when all debug information has been logged.
**/
async function debugSubscription(subscriptionId: string) {
  try {
    console.log('\n🔍 Fetching subscription details...\n');

    const sub = await razorpay.subscriptions.fetch(subscriptionId);

    console.log('=== Subscription Details ===');
    console.log('ID:', sub.id);
    console.log('Plan ID:', sub.plan_id);
    console.log('Status:', sub.status);
    console.log('Quantity:', sub.quantity);
    console.log('Total Count:', sub.total_count);
    console.log('Paid Count:', sub.paid_count);
    console.log('Remaining Count:', sub.remaining_count);
    console.log('Short URL:', sub.short_url);
    console.log('\nCustomer Details:');
    console.log('Customer ID:', sub.customer_id);
    console.log('Customer Email:', (sub as any).customer_email);
    console.log('Customer Name:', (sub as any).customer_name);

    // Check for addons
    console.log('\n=== Addons (Upfront Charges) ===');
    if ((sub as any).addons && (sub as any).addons.length > 0) {
      (sub as any).addons.forEach((addon: any, index: number) => {
        console.log(`\nAddon ${index + 1}:`);
        console.log('  Name:', addon.item?.name);
        console.log('  Amount:', addon.item?.amount, 'paise (₹' + addon.item?.amount / 100 + ')');
        console.log('  Currency:', addon.item?.currency);
      });
    } else {
      console.log('❌ NO ADDONS FOUND - This is why checkout shows ₹1!');
    }

    // Fetch the plan details
    console.log('\n=== Plan Details ===');
    const plan = await razorpay.plans.fetch(sub.plan_id);

    console.log('Plan ID:', plan.id);
    console.log('Plan Name:', plan.item.name);
    console.log('Plan Amount:', plan.item.amount, 'paise (₹' + plan.item.amount / 100 + ')');
    console.log('Currency:', plan.item.currency);
    console.log('Period:', plan.period);
    console.log('Interval:', plan.interval);

    // Calculate total amount
    const planAmount = plan.item.amount;
    const addonAmount =
      (sub as any).addons?.reduce((total: number, addon: any) => {
        return total + (addon.item?.amount || 0);
      }, 0) || 0;
    const totalAmount = planAmount + addonAmount;

    console.log('\n=== Total Checkout Amount ===');
    console.log('Plan Amount:', planAmount, 'paise (₹' + planAmount / 100 + ')');
    console.log('Addon Amount:', addonAmount, 'paise (₹' + addonAmount / 100 + ')');
    console.log('TOTAL:', totalAmount, 'paise (₹' + totalAmount / 100 + ')');
    console.log('\n✅ This is what should appear in checkout: ₹' + totalAmount / 100);
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    if (error.error) {
      console.error('Error Code:', error.error.code);
      console.error('Error Description:', error.error.description);
    }
  }
}

// Get subscription ID from command line or use the one from logs
const subscriptionId = process.argv[2] || 'sub_RdaDXtL6RKVA0J';
debugSubscription(subscriptionId);
