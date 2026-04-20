#!/usr/bin/env tsx

/**
 * Vercel KV Setup Helper Script
 *
 * This script helps you verify your Vercel KV setup once you have the credentials
 * Usage: npm run setup:vercel-kv
 */

import { testRedisConnection } from './test-redis.js';

console.log('🔧 Vercel KV Setup Helper');
console.log('============================\n');

console.log('📋 Follow these steps to set up Vercel KV:');
console.log('');

console.log('1️⃣  Create Vercel KV Database:');
console.log('   - Go to https://vercel.com/dashboard');
console.log('   - Click on your project: notjitin-1994s-projects/frontend');
console.log('   - Go to "Storage" tab');
console.log('   - Click "Create Database" → "KV"');
console.log('   - Choose region and create');
console.log('');

console.log('2️⃣  Get Your Credentials:');
console.log('   - Click on your new KV database');
console.log('   - Go to ".env.local" tab');
console.log('   - Copy KV_REST_API_URL and KV_REST_API_TOKEN');
console.log('');

console.log('3️⃣  Update Environment Variables:');
console.log('   - Edit .env.local file');
console.log('   - Uncomment REDIS_URL and REDIS_TOKEN lines');
console.log('   - Replace with your actual credentials');
console.log('');

console.log('4️⃣  Add to Vercel Production:');
console.log('   - Go to Project Settings → Environment Variables');
console.log('   - Add REDIS_URL and REDIS_TOKEN');
console.log('   - Select "Production", "Preview", and "Development"');
console.log('   - Save and redeploy');
console.log('');

console.log('5️⃣  Test Your Setup:');
console.log('   - Run: npm run test:redis');
console.log('   - Or: npm run setup:vercel-kv (this script)');
console.log('');

// Test if Redis is already configured
const redisUrl = process.env.REDIS_URL;
const redisToken = process.env.REDIS_TOKEN;

if (redisUrl && redisToken) {
  console.log('🔍 Redis credentials found! Testing connection...\n');

  testRedisConnection().then((success) => {
    if (success) {
      console.log('🎉 Vercel KV setup is working perfectly!');
      console.log('📊 Your application is now using Redis for caching and rate limiting');
    } else {
      console.log('❌ Redis test failed. Please check your credentials:');
      console.log('   - Verify REDIS_URL and REDIS_TOKEN are correct');
      console.log('   - Ensure KV database is active');
      console.log('   - Check network connectivity');
    }
  });
} else {
  console.log('⚠️  Redis credentials not found in environment variables.');
  console.log('');
  console.log('📝 Update your .env.local file with:');
  console.log('   REDIS_URL=https://your-kv-id.kv.vercel-storage.com');
  console.log('   REDIS_TOKEN=your_kv_rest_api_token_here');
  console.log('');
  console.log('🔄 After updating, run this script again to test: npm run setup:vercel-kv');
}

console.log('\n📖 For detailed setup instructions, see: REDIS_URL_GUIDE.md');
console.log('🛠️  For troubleshooting, run: npm run test:redis');
