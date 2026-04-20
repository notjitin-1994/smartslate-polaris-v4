#!/usr/bin/env tsx

/**
 * Create a clean version of the subscription API to replace the broken one
 * This will temporarily fix the planDetails scope issue
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const currentFilePath = join(__dirname, 'app/api/subscriptions/create-subscription/route.ts');
const backupFilePath = join(__dirname, 'app/api/subscriptions/create-subscription/route.ts.backup');

console.log('Creating backup and fixing subscription API...');

// Create backup
try {
  const currentContent = readFileSync(currentFilePath, 'utf8');
  writeFileSync(backupFilePath, currentContent);
  console.log('✅ Backup created at route.ts.backup');
} catch (error) {
  console.error('❌ Failed to create backup:', error);
  process.exit(1);
}

// Simple fix - just remove the problematic duplicate database storage code
const content = readFileSync(currentFilePath, 'utf8');

// Remove the duplicate database storage section that references planDetails outside the try block
const duplicateSection = `
    // Store subscription in database
    console.log('[Razorpay] Storing subscription in database', {
      requestId,
      razorpaySubscriptionId: razorpaySubscription.id,
      userId,
      customerId: razorpayCustomer.id,
    });

    try {`;

// Find the problematic section and replace it
const startIndex = content.indexOf(duplicateSection);
if (startIndex !== -1) {
  // Find the end of the duplicate section (before the final catch block)
  const endIndex = content.indexOf('} catch (error: unknown) {', startIndex);

  if (endIndex !== -1) {
    const beforeDuplicate = content.substring(0, startIndex);
    const afterDuplicate = content.substring(endIndex);

    const fixedContent = beforeDuplicate + afterDuplicate;

    writeFileSync(currentFilePath, fixedContent);
    console.log('✅ Fixed subscription API - removed duplicate database storage code');
  } else {
    console.log('❌ Could not find end of duplicate section');
  }
} else {
  console.log('❌ Could not find duplicate section to remove');
}

console.log('🔧 Subscription API fix complete');
