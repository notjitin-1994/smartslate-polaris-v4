# Production Deployment Guide

> **Complete Deployment & Operations Manual for SmartSlate Polaris v3**
> Production-Ready | Vercel Optimized | Enterprise Grade

---

## 🚀 Executive Summary

SmartSlate Polaris v3 is architected for **production deployment** with enterprise-grade reliability, security, and scalability. This guide provides complete deployment procedures, monitoring setup, and operational best practices.

**Deployment Platform**: Vercel (Recommended) | Alternative: Self-hosted
**Infrastructure**: Serverless with auto-scaling
**Database**: Supabase PostgreSQL with RLS
**Security**: Enterprise-grade with comprehensive controls

---

## 📋 Pre-Deployment Checklist

### **Environment Preparation**
- [ ] **Domain**: Custom domain configured and SSL enabled
- [ ] **DNS**: A/AAAA records pointing to Vercel
- [ ] **SSL**: Automatic SSL certificate via Vercel
- [ ] **Environment Variables**: All required variables configured
- [ ] **Database**: Supabase migrations applied and tested
- [ ] **API Keys**: Valid and funded (Claude, Razorpay)
- [ ] **Monitoring**: Error tracking and analytics configured

### **Security Verification**
- [ ] **API Keys**: No secrets committed to repository
- [ ] **RLS Policies**: All tables have proper Row-Level Security
- [ ] **Environment**: Production environment isolated
- [ ] **Access Control**: Team access properly configured
- [ ] **Audit Logging**: Security events being logged

### **Performance Validation**
- [ ] **Bundle Analysis**: Optimized bundles under 500KB
- [ ] **Image Optimization**: Next.js Image component configured
- [ ] **CDN Configuration**: Vercel Edge Network enabled
- [ ] **Database Indexing**: Critical queries indexed
- [ ] **Caching Strategy**: Appropriate caching implemented

---

## 🌐 Vercel Production Deployment

### **1. Repository Configuration**
```bash
# Connect repository to Vercel
vercel link

# Configure project settings
vercel project add
```

### **2. Environment Variables**
Configure in Vercel Dashboard → Settings → Environment Variables:

```env
# Required Variables
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...your-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...your-service-role-key
ANTHROPIC_API_KEY=sk-ant-your-claude-key

# Application Configuration
NEXT_PUBLIC_APP_URL=https://your-domain.com
NODE_ENV=production

# Optional - Performance
NEXT_PUBLIC_ENABLE_ANALYTICS=true
VERCEL_ANALYTICS_ID=your-analytics-id
```

### **3. Build Configuration**
```json
{
  "buildCommand": "cd frontend && npm run build",
  "outputDirectory": "frontend/.next",
  "installCommand": "cd frontend && npm install",
  "framework": "nextjs"
}
```

### **4. Deployment Commands**
```bash
# Preview deployment (testing)
vercel

# Production deployment
vercel --prod

# Deploy specific branch
vercel --prod --branch main
```

---

## 🗄️ Database Production Setup

### **Supabase Production Configuration**
```bash
# Deploy migrations to production
npm run db:push

# Verify database schema
npm run db:status

# Test RLS policies
npm run db:test
```

### **Database Connection Pooling**
```sql
-- Recommended Supabase settings
ALTER SYSTEM SET max_connections = 100;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
```

### **Backup Strategy**
- **Automated Backups**: Supabase daily backups enabled
- **Point-in-Time Recovery**: 30-day retention
- **Cross-Region Replication**: Consider for critical data
- **Export Backups**: Weekly exports to secure storage

---

## 🔒 Security Production Hardening

### **Environment Security**
```env
# Secure Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://your-domain.com

# API Security
ANTHROPIC_API_KEY=sk-ant-your-production-key
SUPABASE_SERVICE_ROLE_KEY=eyJ...production-key
```

### **Access Control**
- **Team Access**: Principle of least privilege
- **API Access**: IP whitelisting where appropriate
- **Database Access**: RLS policies enforced
- **Audit Logs**: All access logged and monitored

### **Security Headers**
```javascript
// next.config.js - Security Headers
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  }
];
```

---

## 📊 Monitoring & Alerting

### **Vercel Analytics Setup**
```bash
# Enable Vercel Analytics
vercel analytics enable

# Configure custom events
npm run analytics:setup
```

### **Key Metrics to Monitor**
```typescript
interface ProductionMetrics {
  // Performance Metrics
  pageLoadTime: number;      // Target: <2s
  firstContentfulPaint: number; // Target: <1.5s
  timeToInteractive: number;  // Target: <3s

  // Business Metrics
  blueprintGenerationSuccess: number; // Target: >95%
  userSessionDuration: number;       // Target: >5 min
  conversionRate: number;            // Target: >3%

  // Technical Metrics
  errorRate: number;                 // Target: <1%
  apiResponseTime: number;           // Target: <500ms
  databaseQueryTime: number;         // Target: <100ms

  // AI Integration Metrics
  aiProviderAvailability: number;    // Target: >99%
  tokenUsageCost: number;            // Monitor trend
  fallbackTriggerRate: number;       // Target: <5%
}
```

### **Alert Configuration**
```typescript
// Critical Alerts (PagerDuty)
const criticalAlerts = {
  allProvidersDown: 'P0 - All AI providers failing',
  databaseConnectionFailure: 'P0 - Database unreachable',
  errorRateAbove5Percent: 'P0 - Critical error threshold',
  paymentProcessingFailure: 'P0 - Payment system down'
};

// Warning Alerts (Slack)
const warningAlerts = {
  errorRateAbove1Percent: 'P1 - Elevated error rate',
  responseTimeAbove2Seconds: 'P1 - Performance degradation',
  aiFallbackRateAbove10Percent: 'P1 - AI provider issues',
  highMemoryUsage: 'P1 - Resource utilization'
};
```

---

## 🔧 Operational Procedures

### **Deployment Process**
```bash
# 1. Create deployment branch
git checkout -b deploy/production-$(date +%Y%m%d)

# 2. Update version numbers
# package.json, frontend/package.json

# 3. Run full test suite
npm run test:integration
npm run test:e2e

# 4. Create pull request
git push origin deploy/production-$(date +%Y%m%d)
# Create PR and get approval

# 5. Deploy to staging
vercel --env=staging

# 6. Smoke test staging
npm run smoke:test:staging

# 7. Deploy to production
vercel --prod

# 8. Post-deployment verification
npm run smoke:test:production
```

### **Rollback Procedures**
```bash
# Immediate Rollback (<5 minutes)
vercel rollback [deployment-url]

# Database Rollback (if needed)
npm run db:rollback [migration-version]

# Emergency Procedures
# 1. Disable feature flags
# 2. Switch to maintenance mode
# 3. Communicate with stakeholders
```

### **Health Checks**
```typescript
// Health Check Endpoint: GET /api/health
{
  "status": "healthy",
  "timestamp": "2025-01-07T10:00:00Z",
  "services": {
    "database": "healthy",
    "ai_providers": {
      "claude": "healthy",
      "fallback": "healthy"
    },
    "payment": "healthy"
  },
  "metrics": {
    "uptime": "99.9%",
    "responseTime": "245ms",
    "errorRate": "0.1%"
  }
}
```

---

## 🚨 Incident Response

### **Severity Levels**
- **P0 - Critical**: Complete service outage, data loss, security breach
- **P1 - High**: Major feature degradation, significant user impact
- **P2 - Medium**: Partial functionality loss, moderate user impact
- **P3 - Low**: Minor issues, limited user impact

### **Response Timeline**
```typescript
const responseSLA = {
  P0: {
    acknowledgement: '15 minutes',
    initialResponse: '1 hour',
    resolution: '4 hours',
    communication: 'Every 30 minutes'
  },
  P1: {
    acknowledgement: '30 minutes',
    initialResponse: '2 hours',
    resolution: '8 hours',
    communication: 'Every 2 hours'
  },
  P2: {
    acknowledgement: '1 hour',
    initialResponse: '4 hours',
    resolution: '24 hours',
    communication: 'Every 6 hours'
  }
};
```

### **Communication Plan**
```typescript
const communicationChannels = {
  internal: {
    engineering: '#platform-incidents',
    product: 'product@company.com',
    leadership: 'leadership@company.com'
  },
  external: {
    statusPage: 'status.company.com',
    users: 'in-app notification',
    social: 'Twitter updates'
  }
};
```

---

## 🔍 Performance Optimization

### **Frontend Optimization**
```javascript
// next.config.js - Performance Settings
const nextConfig = {
  // Bundle optimization
  experimental: {
    optimizePackageImports: ['@mui/material', 'framer-motion']
  },

  // Image optimization
  images: {
    domains: ['your-cdn.com'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30 // 30 days
  },

  // Compression
  compress: true,

  // SWC minification
  swcMinify: true
};
```

### **Database Optimization**
```sql
-- Performance Indexes
CREATE INDEX CONCURRENTLY idx_blueprint_generator_user_created
ON blueprint_generator(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_user_profiles_tier
ON user_profiles(subscription_tier);

-- Query Optimization
EXPLAIN ANALYZE
SELECT * FROM blueprint_generator
WHERE user_id = $1
ORDER BY created_at DESC
LIMIT 10;
```

### **API Optimization**
```typescript
// API Response Caching
export async function GET(request: Request) {
  const cache = caches.default;
  const cacheKey = new Request(request.url);

  let response = await cache.match(cacheKey);
  if (response) {
    return response;
  }

  // Generate response
  response = new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600'
    }
  });

  await cache.put(cacheKey, response.clone());
  return response;
}
```

---

## 📈 Scaling Considerations

### **Auto-Scaling Configuration**
```json
{
  "scaling": {
    "minInstances": 1,
    "maxInstances": 100,
    "targetCPUPercent": 70,
    "targetMemoryPercent": 80,
    "concurrency": 1000
  }
}
```

### **Database Scaling**
- **Connection Pooling**: Supabase managed pooling
- **Read Replicas**: Consider for read-heavy workloads
- **Caching Layer**: Redis for frequently accessed data
- **Query Optimization**: Regular performance reviews

### **CDN Configuration**
```javascript
// Static asset caching
const cacheConfig = {
  // Static assets - 1 year
  '/_next/static/': 'public, max-age=31536000, immutable',

  // Images - 30 days
  '/images/': 'public, max-age=2592000',

  // API responses - 5 minutes
  '/api/': 'public, max-age=300, stale-while-revalidate=600'
};
```

---

## 🛠️ Maintenance Procedures

### **Regular Maintenance Tasks**
```bash
# Daily
- Check error logs and metrics
- Monitor AI provider costs
- Verify backup completion

# Weekly
- Review performance trends
- Update dependencies
- Security scan results

# Monthly
- Database maintenance
- Performance optimization review
- Cost analysis and optimization

# Quarterly
- Security audit and penetration testing
- Disaster recovery testing
- Capacity planning review
```

### **Dependency Updates**
```bash
# Security updates (immediate)
npm audit fix
npm update

# Feature updates (monthly)
npm outdated
npm update [package]

# Major version updates (quarterly)
# Plan and test thoroughly before deployment
```

---

## 📋 Post-Deployment Verification

### **Smoke Tests**
```typescript
// Critical User Paths
const smokeTests = {
  userRegistration: 'POST /api/auth/signup',
  userLogin: 'POST /api/auth/signin',
  questionnaireProgress: 'GET /api/questionnaire/save',
  aiQuestionGeneration: 'POST /api/generate-dynamic-questions',
  blueprintGeneration: 'POST /api/blueprints/generate',
  exportFunctionality: 'GET /api/blueprints/[id]/export',
  paymentProcessing: 'POST /api/payments/create'
};
```

### **Performance Validation**
```typescript
const performanceThresholds = {
  pageLoad: {
    target: '<2s',
    critical: '>4s'
  },
  apiResponse: {
    target: '<500ms',
    critical: '>2s'
  },
  aiGeneration: {
    target: '<30s',
    critical: '>60s'
  },
  databaseQuery: {
    target: '<100ms',
    critical: '>500ms'
  }
};
```

---

## 🔄 Disaster Recovery

### **Backup Strategy**
```typescript
const backupStrategy = {
  database: {
    automated: 'Daily at 2 AM UTC',
    retention: '30 days',
    pointInTimeRecovery: 'Yes',
    crossRegion: 'Optional for enterprise'
  },
  application: {
    codeRepository: 'GitHub with multiple maintainers',
    deploymentHistory: 'Vercel retains 30 days',
    configuration: 'Version controlled and documented'
  },
  assets: {
    userUploads: 'Supabase Storage with replication',
    staticAssets: 'Vercel Edge Network',
    criticalData: 'Daily export to secure storage'
  }
};
```

### **Recovery Procedures**
```bash
# Database Recovery
supabase db restore --timestamp "2025-01-07T02:00:00Z"

# Application Recovery
vercel rollback [deployment-id]

# Complete Recovery Process (estimated time)
# 1. Assess impact (15 minutes)
# 2. Initiate recovery (5 minutes)
# 3. Verify systems (30 minutes)
# 4. Communicate status (ongoing)
```

---

## 📞 Emergency Contacts

### **On-Call Rotation**
- **Primary On-Call**: [Name] - [Phone] - [Slack]
- **Secondary On-Call**: [Name] - [Phone] - [Slack]
- **Engineering Lead**: [Name] - [Phone] - [Email]
- **VP Engineering**: [Name] - [Phone] - [Email]

### **External Services**
- **Vercel Support**: support@vercel.com
- **Supabase Support**: support@supabase.io
- **Claude API Support**: support@anthropic.com
- **Razorpay Support**: support@razorpay.com

---

## 📊 Compliance & Auditing

### **Security Compliance**
- **SOC 2 Type II**: Annual audit
- **GDPR Compliance**: Privacy controls and data handling
- **CCPA Compliance**: California privacy requirements
- **Data Processing Agreements**: All subprocessors documented

### **Audit Trail**
```typescript
// Comprehensive logging
interface AuditLog {
  timestamp: string;
  userId?: string;
  action: string;
  resource: string;
  ip: string;
  userAgent: string;
  result: 'success' | 'failure';
  details?: any;
}
```

---

**Document Status**: Production Ready | **Last Updated**: January 2025
**Next Review**: Monthly or after major changes | **Owner**: DevOps Team
**Approval**: Engineering Leadership, Security Team

---

> **Note**: This guide should be updated after each major deployment or infrastructure change. All team members responsible for production operations should be familiar with these procedures.