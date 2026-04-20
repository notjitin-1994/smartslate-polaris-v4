# Redis Setup Guide for Production

This guide covers setting up Redis for your Polaris v3 application in production environment.

## 🚀 Option 1: Vercel KV (Recommended for Vercel Deployments)

### Step 1: Create Vercel KV Database

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Create a new KV database
vercel kv create

# Note the KV_ID and KV_URL from the output
```

### Step 2: Update Environment Variables

In your Vercel project dashboard, add these environment variables:

```bash
# In Vercel Dashboard → Project Settings → Environment Variables
REDIS_URL=kv_rest_url_from_step_1
REDIS_TOKEN=kv_rest_token_from_step_1
```

### Step 3: Update Local Environment

Create/update your `.env.local` file:

```bash
# Redis Configuration (for local development)
REDIS_URL=redis://localhost:6379
# OR for Vercel KV in production
# REDIS_URL=https://your-kv-id.kv.vercel-storage.com
# REDIS_TOKEN=your_rest_token
```

## 🔧 Option 2: Upstash Redis (Easy Managed Redis)

### Step 1: Create Upstash Account

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up/login
3. Click "Create Database"
4. Choose a region (preferably closest to your users)

### Step 2: Get Connection Details

After creating the database, you'll get:

- **REST URL**: `https://your-db-name.upstash.io`
- **REST Token**: Your authentication token

### Step 3: Configure Environment Variables

```bash
# Add to your environment variables
REDIS_URL=https://your-db-name.upstash.io
REDIS_TOKEN=your_rest_token
```

## 🏗️ Option 3: Self-Hosted Redis

### Step 1: Install Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# macOS (using Homebrew)
brew install redis

# Start Redis service
sudo systemctl start redis-server  # Linux
brew services start redis             # macOS
```

### Step 2: Configure Redis

Edit `/etc/redis/redis.conf`:

```bash
# Security settings
requirepass your_secure_password
bind 127.0.0.1

# Performance settings
maxmemory 256mb
maxmemory-policy allkeys-lru

# Persistence settings
save 900 1
save 300 10
save 60 10000
```

### Step 3: Start Redis

```bash
redis-server /etc/redis/redis.conf
```

### Step 4: Configure Environment Variables

```bash
# Add to your environment variables
REDIS_URL=redis://:your_secure_password@localhost:6379
```

## 🔒 Option 4: Redis Cloud (Enterprise)

### Step 1: Create Redis Cloud Account

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free tier
3. Create a new database

### Step 2: Get Connection Details

From your Redis Cloud dashboard:

- Copy the **Connection String**
- Note the **Password**

### Step 3: Configure Environment Variables

```bash
# Format: redis://:password@host:port
REDIS_URL=redis://:your_password@your-redis-cloud-host:port
```

## 🛠️ Configuration Verification

### Test Redis Connection

Create a test script to verify your Redis setup:

```typescript
// test-redis.ts
import { getRedisClient } from '@/lib/cache/redis';

async function testRedis() {
  try {
    const client = await getRedisClient();
    if (!client) {
      console.log('❌ Redis not available');
      return;
    }

    // Test basic operations
    await client.set('test-key', 'test-value');
    const value = await client.get('test-key');

    console.log('✅ Redis connection successful!');
    console.log('Test value:', value);

    // Clean up
    await client.del('test-key');
  } catch (error) {
    console.error('❌ Redis test failed:', error);
  }
}

testRedis();
```

### Test in Development

```bash
npm run dev
# Test the Redis connection
node -r tsx test-redis.ts
```

## 📊 Performance Monitoring

### Redis Health Check Endpoint

The application includes a health check endpoint:

```typescript
// GET /api/monitoring/status
// This will show Redis connection status
```

### Monitoring Commands

```bash
# Redis CLI commands
redis-cli ping                    # Check connection
redis-cli info memory             # Memory usage
redis-cli info stats              # General statistics
redis-cli info clients            # Connected clients
```

## 🔧 Environment-Specific Configuration

### Development (.env.local)

```bash
# Local Redis instance
REDIS_URL=redis://localhost:6379
```

### Production (Vercel)

```bash
# Vercel KV
REDIS_URL=https://your-kv-id.kv.vercel-storage.com
REDIS_TOKEN=your_rest_token

# Or Upstash
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_rest_token
```

### Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

volumes:
  redis_data:
```

## 🚀 Deployment Steps

### 1. Update Environment Variables

```bash
# In Vercel Dashboard → Project Settings → Environment Variables
# Add your Redis configuration
```

### 2. Deploy Application

```bash
# Your application will automatically use Redis
git push origin main
# Or deploy manually via Vercel CLI
vercel --prod
```

### 3. Verify Deployment

1. Visit your application
2. Check `/api/monitoring/status` endpoint
3. Monitor Vercel function logs for Redis connection status

## 🛡️ Security Best Practices

### 1. Use TLS/SSL

Always use secure Redis connections:

- `rediss://` for TLS connections
- Avoid plain `redis://` in production

### 2. Authentication

- Always set a strong password for self-hosted Redis
- Use REST tokens for cloud services
- Never commit credentials to git

### 3. Network Security

- Use VPC/private networks when possible
- Restrict access to your Redis instance
- Configure firewall rules

### 4. Data Encryption

- Enable encryption at rest for sensitive data
- Consider Redis Enterprise for advanced security features

## 🔧 Troubleshooting

### Common Issues

#### "Redis connection refused"

```bash
# Check if Redis is running
redis-cli ping

# Check configuration
redis-cli config get "*"
```

#### "Authentication failed"

```bash
# Verify credentials
REDIS_URL=redis://:password@host:port
```

#### "Rate limiting fallback activated"

```bash
# Check Redis health
curl https://your-app.com/api/monitoring/status
```

### Debug Mode

Enable detailed Redis logging:

```typescript
// In your Redis client configuration
const client = new Redis(redisUrl, {
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  commandTimeout: 5000,
  connectTimeout: 10000,
  // Enable debug logging
  showFriendlyErrorStack: true,
});
```

## 📈 Performance Optimization

### Redis Configuration

```bash
# In redis.conf
maxmemory 256mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### Application Optimization

1. **Cache Key Strategy**: Use meaningful, hierarchical keys
2. **TTL Management**: Set appropriate expiration times
3. **Connection Pooling**: Reuse Redis connections
4. **Pipeline Operations**: Batch multiple Redis commands

## 📚 Additional Resources

- [Redis Documentation](https://redis.io/documentation/)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Upstash Documentation](https://upstash.com/docs)
- [Redis Cloud Documentation](https://redis.com/docs/latest/operate/)

---

## 🎯 Quick Start Summary

1. **Choose your Redis provider** (Vercel KV recommended)
2. **Create Redis database** and get connection details
3. **Add environment variables** to your project
4. **Deploy your application** with Redis enabled
5. **Test the connection** using the health check endpoint

Your Polaris v3 application will automatically use Redis for:

- Rate limiting
- Session caching
- API response caching
- Performance optimization
