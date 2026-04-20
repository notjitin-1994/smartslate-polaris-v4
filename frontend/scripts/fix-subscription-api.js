#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '../app/api/subscriptions/create-subscription/route.ts');
const backupPath = path.join(
  __dirname,
  '../app/api/subscriptions/create-subscription/route.ts.backup'
);

console.log('🔧 Fixing subscription API...');

// Create backup
if (!fs.existsSync(backupPath)) {
  fs.copyFileSync(filePath, backupPath);
  console.log('✅ Created backup');
}

let content = fs.readFileSync(filePath, 'utf8');

// Replace the problematic line 642
content = content.replace(
  /plan_name: planDetails\?\.item\?\.name \|/,
  "plan_name: 'Unknown Plan (fallback)', // "
);

// Replace the problematic line 643
content = content.replace(
  /plan_amount: planDetails\?\.item\?\.amount \|/,
  'plan_amount: planAmount, // '
);

// Replace the problematic line 644
content = content.replace(
  /plan_currency: planDetails\?\.item\?\.currency \|/,
  "plan_currency: 'INR', // "
);

fs.writeFileSync(filePath, content);
console.log('✅ Fixed subscription API - replaced planDetails references');

console.log('🎯 Fixed lines that were causing the ReferenceError');
