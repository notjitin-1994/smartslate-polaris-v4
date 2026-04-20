# Load Testing Guide

## Overview

This guide covers load testing the Polaris v3 application using the built-in load testing framework. The tool is designed to stress test API endpoints and measure performance under concurrent load.

## Prerequisites

1. **Application Running**: Ensure the application is running and accessible
2. **Environment Setup**: Development or staging environment (never production)
3. **System Resources**: Sufficient CPU/memory to handle concurrent testing

## Installation

The load testing framework is included in the project dependencies. Ensure you have the required packages:

```bash
npm install
```

## Quick Start

### Health Check

Run a quick health check to verify the application is responding:

```bash
npm run load-test:health
```

### Preset Load Tests

Run predefined load test scenarios:

```bash
# Pricing page load test (100 concurrent users, 2 minutes)
npm run load-test:pricing

# Subscription creation load test (50 concurrent users, 3 minutes)
npm run load-test:subscriptions

# Blueprint generation load test (20 concurrent users, 5 minutes)
npm run load-test:blueprints
```

### Custom Load Tests

Run custom load tests with specific parameters:

```bash
# Basic custom test
npm run load-test run --endpoint /api/test --concurrency 50 --duration 120

# POST request with body
npm run load-test run --endpoint /api/subscriptions/create \
  --method POST \
  --body '{"tier":"navigator","billingCycle":"monthly"}' \
  --concurrency 25 \
  --duration 180

# Save results to file
npm run load-test run --preset pricingPage --output load-test-results.md
```

## Available Presets

### 1. Pricing Page Test
- **Purpose**: Test pricing page API performance
- **Concurrency**: 100 users
- **Duration**: 2 minutes
- **Ramp-up**: 30 seconds
- **Think Time**: 500ms

```bash
npm run load-test:pricing
```

### 2. Subscription Creation Test
- **Purpose**: Test subscription endpoint under load
- **Concurrency**: 50 users
- **Duration**: 3 minutes
- **Ramp-up**: 60 seconds
- **Think Time**: 2 seconds

```bash
npm run load-test:subscriptions
```

### 3. Blueprint Generation Test
- **Purpose**: Test AI blueprint generation performance
- **Concurrency**: 20 users
- **Duration**: 5 minutes
- **Ramp-up**: 60 seconds
- **Think Time**: 5 seconds

```bash
npm run load-test:blueprints
```

### 4. Health Check Test
- **Purpose**: Quick health check with light load
- **Concurrency**: 200 users
- **Duration**: 1 minute
- **Ramp-up**: 10 seconds
- **Think Time**: 100ms

```bash
npm run load-test:health
```

## Command Line Options

### Basic Options

```bash
npm run load-test run [options]
```

- `-c, --concurrency <number>`: Number of concurrent users (default: 10)
- `-d, --duration <seconds>`: Test duration in seconds (default: 60)
- `-r, --ramp-up <seconds>`: Ramp-up time in seconds (default: 10)
- `-e, --endpoint <url>`: Target endpoint URL
- `-m, --method <method>`: HTTP method (GET, POST, PUT, DELETE)
- `-b, --body <json>`: Request body as JSON string
- `-t, --think-time <ms>`: Think time between requests (default: 0)
- `--timeout <ms>`: Request timeout in milliseconds (default: 30000)

### Output Options

- `-o, --output <file>`: Save report to file
- `-p, --preset <name>`: Use predefined test preset
- `--base-url <url>`: Base URL for endpoints (default: http://localhost:3000)

### Utility Commands

```bash
# List all available presets
npm run load-test presets

# Show help
npm run load-test --help
```

## Examples

### Custom API Endpoint Test

```bash
npm run load-test run \
  --endpoint /api/user/profile \
  --method GET \
  --concurrency 25 \
  --duration 300 \
  --ramp-up 30 \
  --think-time 1000
```

### Stress Test with High Concurrency

```bash
npm run load-test run \
  --endpoint /api/questionnaire/save \
  --method POST \
  --body '{"step":1,"answers":{}}' \
  --concurrency 200 \
  --duration 600 \
  --ramp-up 120 \
  --timeout 60000 \
  --output stress-test-results.md
```

### Test External API Integration

```bash
npm run load-test run \
  --endpoint /api/blueprints/generate \
  --method POST \
  --body '{"blueprintId":"test-id"}' \
  --concurrency 10 \
  --duration 180 \
  --think-time 5000 \
  --base-url https://your-staging-app.com
```

## Understanding Results

### Key Metrics

1. **Success Rate**: Percentage of successful requests (target: >99%)
2. **Average Response Time**: Mean response time across all requests
3. **P95 Response Time**: 95th percentile response time (target: <1000ms)
4. **Requests/Second**: Actual throughput achieved
5. **Error Distribution**: Types and frequency of errors

### Performance Assessment

- 🟢 **Excellent**: Success rate ≥99.9% and P95 ≤500ms
- 🟡 **Good**: Success rate ≥99% and P95 ≤1000ms
- 🟠 **Fair**: Success rate ≥95% and P95 ≤2000ms
- 🔴 **Poor**: Below fair thresholds

### Sample Output

```
📊 Test Results:
  Total Requests: 12,000
  Successful Requests: 11,940
  Failed Requests: 60
  Success Rate: 99.50%
  Requests/Second: 100.00

⏱️  Response Times:
  Average: 245.67ms
  Min: 45ms
  Max: 2340ms
  P50: 220ms
  P90: 380ms
  P95: 520ms
  P99: 1200ms

💡 Recommendations:
  1. P95 response time (520.00ms) exceeds 500ms target. Consider optimization or caching.
  2. Some requests exceeded 2s timeout. Review slow operations.

🎯 Performance Assessment:
  🟡 Good - Performance is acceptable with minor room for improvement
```

## Best Practices

### Test Environment

1. **Never test in production**: Use development or staging environments
2. **Consistent setup**: Ensure identical environment configuration
3. **Baseline testing**: Establish performance baselines before optimization
4. **Isolated testing**: Avoid interference from other traffic

### Test Design

1. **Realistic scenarios**: Mirror actual user behavior patterns
2. **Gradual increase**: Use appropriate ramp-up times
3. **Think time**: Include realistic delays between requests
4. **Multiple runs**: Run tests multiple times for consistency

### Monitoring During Tests

1. **System resources**: Monitor CPU, memory, and disk usage
2. **Application logs**: Check for errors and warnings
3. **Database performance**: Monitor query performance and connections
4. **External dependencies**: Watch for rate limiting or throttling

### Result Analysis

1. **Compare to baselines**: Track performance changes over time
2. **Investigate anomalies**: Look into unusual response times or errors
3. **Identify bottlenecks**: Find performance limiting factors
4. **Plan optimizations**: Prioritize improvements based on impact

## Troubleshooting

### Common Issues

1. **Connection refused**: Application not running or wrong URL
2. **High error rates**: Check application logs for errors
3. **Timeout errors**: Increase timeout or investigate slow operations
4. **Memory issues**: Reduce concurrency or check for memory leaks

### Debug Mode

Enable verbose logging by setting environment variable:

```bash
DEBUG=load-test:* npm run load-test run --endpoint /api/test
```

### Performance Issues

If you encounter performance issues during load testing:

1. **Check system resources**: Use `htop` or Task Manager
2. **Monitor database**: Check for slow queries or connection limits
3. **Review application logs**: Look for errors or warnings
4. **Reduce concurrency**: Lower concurrent user count
5. **Increase timeouts**: Allow more time for slow operations

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Load Test
on: [push, pull_request]

jobs:
  load-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Start application
        run: npm run dev &

      - name: Wait for application
        run: sleep 30

      - name: Run health check
        run: npm run load-test:health

      - name: Run load test
        run: npm run load-test:pricing --output load-test-results.md

      - name: Upload results
        uses: actions/upload-artifact@v2
        with:
          name: load-test-results
          path: load-test-results.md
```

## Performance Targets

### Primary Targets

- **API Response Time**: P95 < 500ms
- **Success Rate**: >99%
- **Concurrent Users**: Support 100+ concurrent users
- **Throughput**: 100+ requests/second for critical endpoints

### Secondary Targets

- **Database Queries**: P95 < 100ms
- **Webhook Processing**: P95 < 1000ms
- **File Uploads**: P95 < 5000ms
- **Blueprint Generation**: P95 < 20000ms

## Advanced Usage

### Custom Test Scenarios

Create custom test configurations programmatically:

```typescript
import { loadTester } from './lib/testing/loadTesting';

const customConfig = {
  concurrency: 75,
  duration: 180,
  rampUp: 45,
  endpoint: 'http://localhost:3000/api/custom/test',
  method: 'POST' as const,
  body: { customData: 'value' },
  thinkTime: 1500
};

const result = await loadTester.runLoadTest(customConfig);
console.log(loadTester.generateReport(result));
```

### Performance Monitoring Integration

Combine load testing with performance monitoring:

```bash
# Start performance monitoring
curl -X POST http://localhost:3000/api/performance/metrics \
  -H "Content-Type: application/json" \
  -d '{"action":"start"}'

# Run load test
npm run load-test:pricing

# Get performance report
curl -X GET http://localhost:3000/api/performance/metrics \
  -H "Accept: application/json" \
  -o performance-report.json
```

## Support

For issues with the load testing framework:

1. Check application logs for errors
2. Verify endpoint accessibility
3. Review system resource usage
4. Consult the troubleshooting section above

## Contributing

When adding new load test scenarios:

1. Follow the naming convention: `load-test:<scenario>`
2. Add comprehensive documentation
3. Include appropriate think times and ramp-up periods
4. Test in development environment first
5. Update this guide with new scenarios