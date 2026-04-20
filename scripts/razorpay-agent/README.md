 # 🚀 Razorpay Expert Agent

A comprehensive, context-aware diagnostic and fix agent for Razorpay payment gateway integration in SmartSlate Polaris v3.

## 🎯 Features

### Core Capabilities
- **Complete Integration Diagnostics**: Analyzes entire Razorpay implementation
- **Webhook Health Monitoring**: Specialized webhook diagnostics and fixes
- **Automatic Issue Detection**: Identifies configuration, security, and implementation issues
- **Smart Fix Generation**: Generates and applies fixes for common problems
- **MCP Integration**: Uses multiple MCPs for contextual awareness
- **Performance Analysis**: Identifies bottlenecks and optimization opportunities

### Diagnostic Coverage
- ✅ Environment configuration validation
- ✅ API key verification
- ✅ Webhook endpoint testing
- ✅ Database schema validation
- ✅ Security implementation checks
- ✅ Idempotency verification
- ✅ Error handling analysis
- ✅ Performance metrics
- ✅ Rate limiting checks
- ✅ Event processing pipeline

## 📦 Installation

```bash
# Navigate to the agent directory
cd scripts/razorpay-agent

# Install dependencies
npm install

# Make scripts executable
chmod +x *.ts
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the agent directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Razorpay Configuration
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_or_live_key
RAZORPAY_KEY_SECRET=your_key_secret
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_ENABLE_PAYMENTS=true
```

## 🚀 Usage

### 1. Complete System Diagnostics

Run a comprehensive diagnostic scan of your entire Razorpay integration:

```bash
# Basic scan
./razorpay-expert-agent.ts

# Verbose output
./razorpay-expert-agent.ts --verbose

# Auto-fix issues
./razorpay-expert-agent.ts --auto-fix

# Test mode (dry run)
./razorpay-expert-agent.ts --test
```

### 2. Webhook-Specific Diagnostics

Focus on webhook implementation issues:

```bash
./webhook-diagnostics.ts
```

### 3. Interactive Mode

Use with MCP integration for contextual fixes:

```bash
# Start interactive agent
tsx razorpay-expert-agent.ts --interactive
```

## 📊 Diagnostic Categories

### 1. Configuration Issues
- Missing environment variables
- Invalid API keys
- Test vs Live mode detection
- Webhook secret validation

### 2. Database Issues
- Missing tables
- Schema validation
- RLS policies
- Migration status
- Index optimization

### 3. Security Issues
- Webhook signature validation
- API key exposure
- Input validation
- XSS/SQL injection prevention
- Rate limiting

### 4. Implementation Issues
- Event handler coverage
- Idempotency implementation
- Error handling
- Logging completeness
- Retry logic

### 5. Performance Issues
- Slow processing times
- High error rates
- Database query optimization
- Caching opportunities
- Rate limiting configuration

## 🔍 Understanding Reports

### Health Score
```
🎯 Integration Health Score: 85%
```
- **90-100%**: Excellent - Production ready
- **70-89%**: Good - Minor improvements needed
- **50-69%**: Fair - Several issues to address
- **0-49%**: Poor - Critical issues present

### Issue Severity
- 🔴 **CRITICAL**: Must fix immediately
- 🟠 **HIGH**: Fix before production
- 🔵 **MEDIUM**: Should fix soon
- ⚪ **LOW**: Nice to have improvements

## 🛠️ Auto-Fix Capabilities

The agent can automatically fix:

### Database Issues
- Create missing tables
- Add missing columns
- Create indexes
- Generate migrations

### Configuration Issues
- Generate .env template
- Create missing config files
- Update TypeScript types

### Implementation Issues
- Create webhook handler boilerplate
- Add idempotency module
- Implement error handling
- Add logging

### Security Issues
- Add signature validation
- Implement rate limiting
- Add input validation

## 📈 Metrics & Monitoring

### Webhook Metrics
```
Total Events: 1,234
Processed: 1,200 (97.2%)
Failed: 30 (2.4%)
Duplicates: 4 (0.3%)
Avg Processing Time: 1.2s
```

### Performance Indicators
- Average processing time
- Error rate trends
- Duplicate detection rate
- Database query performance

## 🔗 MCP Integrations

The agent leverages multiple MCPs:

1. **Razorpay MCP**: Direct API access
2. **Filesystem MCP**: Code analysis
3. **Polaris Context MCP**: Codebase awareness
4. **Context7 MCP**: Documentation access

## 🐛 Troubleshooting

### Common Issues

#### "Cannot connect to Razorpay API"
- Check API keys are correct
- Verify network connectivity
- Ensure keys match environment (test/live)

#### "Database checks skipped"
- Verify Supabase configuration
- Check service role key permissions

#### "Webhook endpoint not accessible"
- Ensure development server is running
- Check port 3000 is available

### Debug Mode
```bash
# Enable debug logging
DEBUG=razorpay:* ./razorpay-expert-agent.ts --verbose
```

## 📝 Example Output

```
🔍 Razorpay Expert Agent - Complete Diagnostics

📋 Checking Environment Configuration...
  ✓ NEXT_PUBLIC_RAZORPAY_KEY_ID is configured
  ✓ RAZORPAY_KEY_SECRET is configured
  ⚠ Razorpay is in TEST mode

🔑 Validating Razorpay Keys...
  ✓ Razorpay API keys are valid and working

🔗 Checking Webhook Configuration...
  ✓ Webhook secret is configured
  ✓ Webhook signature validation implemented

🗄️ Checking Database Schema...
  ✓ Table 'subscriptions' exists
  ✓ Table 'payments' exists
  ✗ Table 'razorpay_webhook_events' does not exist

📊 Diagnostic Report Summary
  ✓ Passed: 12
  ✗ Failed: 1
  ⚠ Warnings: 2
  ℹ Info: 3
  Total checks: 18

🎯 Integration Health Score: 78%

🔧 Proposed Fixes:
  [CRITICAL] Missing table: razorpay_webhook_events
  Fix: Run migration to create missing table
  ✓ Auto-fix available
```

## 🤝 Contributing

Feel free to enhance the agent with:
- Additional diagnostic checks
- More auto-fix capabilities
- Performance optimizations
- New MCP integrations

## 📄 License

Part of SmartSlate Polaris v3 - Internal Use Only

## 🆘 Support

For issues or questions:
- Check the diagnostic output first
- Review webhook logs in Supabase
- Contact the development team

---

**Version**: 1.0.0
**Last Updated**: November 9, 2025
**Maintainer**: SmartSlate Development Team