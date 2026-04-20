# Redis URL Guide - Where to Find Your Redis Credentials

## 🚀 Vercel KV (Recommended for Vercel Deployments)

### Method 1: Vercel CLI

```bash
# Install Vercel CLI (if not already installed)
npm i -g vercel

# Login to Vercel
vercel login

# Create a new KV database
vercel kv create

# The CLI will output something like:
# ✅ KV Database created successfully!
# 📋 Database Details:
#    KV_URL: https://your-kv-id.kv.vercel-storage.com
#    KV_REST_API_URL: https://your-kv-id.kv.vercel-storage.com
#    KV_REST_API_TOKEN: your_rest_token_here
#    KV_REST_API_READ_ONLY_TOKEN: your_read_only_token_here
```

### Method 2: Vercel Dashboard

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to "Storage" tab
4. Click "Create Database" → "KV"
5. After creation, click on your KV database
6. Go to ".env.local" tab
7. Copy the values:
   ```
   KV_URL=https://your-kv-id.kv.vercel-storage.com
   KV_REST_API_URL=https://your-kv-id.kv.vercel-storage.com
   KV_REST_API_TOKEN=your_rest_token_here
   ```

**Environment Variables for Vercel KV:**

```bash
REDIS_URL=https://your-kv-id.kv.vercel-storage.com
REDIS_TOKEN=your_rest_token_here
```

---

## 🔧 Upstash Redis

### Steps to Get Upstash Credentials:

1. Go to [Upstash Console](https://console.upstash.com/)
2. Sign up or login
3. Click "Create Database"
4. Choose a region (closest to your users)
5. Give your database a name
6. Click "Create"

### Find Connection Details:

1. In your database dashboard, click on "Connect" or "Details" tab
2. You'll see connection details like:
   ```
   REST URL: https://your-db-name.upstash.io
   REST Token: your_upstash_token_here
   ```

**Environment Variables for Upstash:**

```bash
REDIS_URL=https://your-db-name.upstash.io
REDIS_TOKEN=your_upstash_token_here
```

---

## 🏗️ Self-Hosted Redis

### Local Redis Instance:

```bash
# Default local Redis URL
REDIS_URL=redis://localhost:6379

# With password
REDIS_URL=redis://:your_password@localhost:6379

# With custom host/port
REDIS_URL=redis://:your_password@your-host:port
```

### Docker Redis:

```yaml
# docker-compose.yml
version: '3.8'
services:
  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    command: redis-server --requirepass your_password
```

**Environment Variables:**

```bash
REDIS_URL=redis://:your_password@localhost:6379
```

---

## ☁️ Redis Cloud

### Steps to Get Redis Cloud Credentials:

1. Go to [Redis Cloud](https://redis.com/try-free/)
2. Sign up for free tier or login
3. Create a new database
4. Choose configuration and region
5. After creation, go to database details

### Find Connection Details:

1. In your database dashboard, look for "Connection" or "Configuration"
2. Copy the "Connection String" which looks like:
   ```
   redis-12345.c1.us-east-1-2.ec2.redislabs.com:12345
   ```

**Environment Variables for Redis Cloud:**

```bash
REDIS_URL=redis://:your_password@redis-12345.c1.us-east-1-2.ec2.redislabs.com:12345
```

---

## 🎯 Quick Setup Examples

### Vercel KV (Easiest for Vercel):

```bash
# Run this command
vercel kv create

# Add to Vercel Project Settings → Environment Variables:
REDIS_URL=https://your-kv-id.kv.vercel-storage.com
REDIS_TOKEN=your_rest_token_here
```

### Upstash (Popular Alternative):

```bash
# 1. Create database at https://console.upstash.com/
# 2. Get REST URL and REST Token from dashboard
# 3. Add to environment variables:
REDIS_URL=https://your-db.upstash.io
REDIS_TOKEN=your_upstash_token_here
```

### Local Development:

```bash
# Add to .env.local
REDIS_URL=redis://localhost:6379
```

---

## 🔍 Testing Your Redis URL

After setting up environment variables, test your Redis connection:

```bash
# Test Redis connection
npm run test:redis

# Check Redis health endpoint
curl http://localhost:3000/api/monitoring/redis-health
```

---

## 📝 Adding to Vercel Environment

1. Go to your Vercel project dashboard
2. Click "Settings" → "Environment Variables"
3. Add your Redis credentials:
   - **Name**: `REDIS_URL`
   - **Value**: `your_redis_url`
   - **Name**: `REDIS_TOKEN` (if applicable)
   - **Value**: `your_redis_token`
4. Select appropriate environments (Production, Preview, Development)
5. Click "Save"
6. Redeploy your application

---

## 🛡️ Security Notes

- **Never commit** real Redis credentials to git
- **Use different** Redis instances for different environments
- **Rotate tokens** periodically for security
- **Use TLS/SSL** connections in production (most cloud providers handle this automatically)
- **Restrict access** to Redis instance by IP if possible

---

## 🚨 Troubleshooting

### "Redis connection refused"

- Check if Redis server is running
- Verify the URL format and credentials
- Check network connectivity

### "Authentication failed"

- Verify your Redis token/password
- Ensure you're using the correct token type (REST vs regular)

### "Rate limiting fallback activated"

- Redis is not available, app is using memory cache
- Check Redis configuration and connectivity

### Need Help?

- Check the full setup guide: `REDIS_SETUP_GUIDE.md`
- Run the test script: `npm run test-redis`
- Check Vercel function logs for detailed error messages
