#!/usr/bin/env node

/**
 * Test Redis Connection
 * Verifies that Redis is properly configured and accessible
 */

import { getRedisClient } from '../lib/cache/redis';

async function testRedisConnection() {
  console.log('🔍 Testing Redis connection...\n');

  try {
    const client = await getRedisClient();

    if (!client) {
      console.log('❌ Redis client not initialized');
      console.log('💡 This is normal for development - using memory cache instead');
      process.exit(0);
    }

    // Test basic Redis operations
    console.log('📡 Testing Redis operations...');

    // Test SET operation
    await client.set('test-key', 'Redis is working! 🚀', 'EX', 60);
    console.log('✅ SET operation successful');

    // Test GET operation
    const value = await client.get('test-key');
    console.log(`✅ GET operation successful: "${value}"`);

    // Test DEL operation
    await client.del('test-key');
    console.log('✅ DEL operation successful');

    // Get Redis info
    const info = await client.info('server');
    const lines = info.split('\r\n');
    const redisVersion = lines.find((line) => line.startsWith('redis_version:'))?.split(':')[1];

    console.log(`\n🎉 Redis connection successful!`);
    console.log(`📊 Redis Version: ${redisVersion || 'Unknown'}`);
    console.log(`🌐 Redis URL: ${process.env.REDIS_URL || 'Not configured'}`);

    await client.quit();
    console.log('\n✅ Redis test completed successfully');
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    console.error('💡 Check your Redis configuration in .env.local');
    process.exit(1);
  }
}

testRedisConnection();
