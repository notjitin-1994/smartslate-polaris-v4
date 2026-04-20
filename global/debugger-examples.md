# Web Debugger Agent - Usage Examples

This document provides practical examples of how to use the Web Debugger Agent to solve common web development issues.

## Quick Start

Invoke the debugger agent with any web development problem:

```bash
/debug "My React component is not re-rendering when state changes"
/debug "Getting 500 error from API endpoint"
/debug "TypeScript compilation failing with confusing errors"
/debug "CSS Grid layout breaking on mobile"
```

## Frontend Debugging Examples

### React State Management Issues

**Problem**: "My React component is not updating when I change state"

**What the debugger will do**:
1. Analyze the component structure and state management
2. Check for common issues like direct state mutation
3. Examine useEffect dependencies and callback patterns
4. Verify proper state update patterns

**Example Investigation**:
```javascript
// ❌ Common mistake - direct mutation
const updateUser = (user) => {
  user.name = "New Name"; // Direct mutation
  setUsers(users); // React won't detect the change
}

// ✅ Correct approach - immutable update
const updateUser = (user) => {
  setUsers(users.map(u =>
    u.id === user.id ? { ...u, name: "New Name" } : u
  ));
}
```

### Next.js Hydration Errors

**Problem**: "Getting hydration error in Next.js app"

**Debugger Process**:
1. Identify SSR/client-side mismatch sources
2. Check for browser-only API usage
3. Examine dynamic content rendering
4. Suggest proper hydration patterns

### TypeScript Compilation Errors

**Problem**: "TypeScript showing cryptic type errors"

**Debugger Analysis**:
1. Parse TypeScript error messages
2. Identify type inference issues
3. Check for missing type declarations
4. Suggest type fixes and improvements

## Backend Debugging Examples

### API Endpoint Errors

**Problem**: "My POST endpoint returns 500 error"

**Debugging Steps**:
1. Check server logs for detailed error information
2. Examine request validation and body parsing
3. Verify database connection and queries
4. Test endpoint with various request formats

### Database Connection Issues

**Problem**: "Can't connect to PostgreSQL database"

**Investigation Areas**:
1. Connection string and credentials
2. Network connectivity and firewall rules
3. Database server status
4. Connection pool configuration

## Performance Debugging Examples

### Bundle Size Optimization

**Problem**: "My JavaScript bundle is 2MB, too large for production"

**Optimization Strategy**:
1. Analyze bundle composition with webpack-bundle-analyzer
2. Identify large dependencies and unused code
3. Implement code splitting and lazy loading
4. Optimize imports and tree shaking

### Memory Leak Detection

**Problem**: "React app memory usage keeps increasing"

**Leak Investigation**:
1. Use Chrome DevTools Memory tab for heap snapshots
2. Check for unremoved event listeners
3. Examine useEffect cleanup functions
4. Look for closure and reference issues

## Security Debugging Examples

### CORS Issues

**Problem**: "Getting CORS error when calling API from frontend"

**Resolution Process**:
1. Verify API CORS configuration
2. Check preflight request handling
3. Examine request headers and origins
4. Suggest proper CORS middleware setup

### Authentication Flow Issues

**Problem**: "Users getting logged out randomly"

**Debugging Approach**:
1. Check token expiration and refresh logic
2. Examine session storage and cookie settings
3. Verify authentication middleware
4. Test edge cases and error scenarios

## Build and Deployment Issues

### Docker Build Failures

**Problem**: "Docker build fails during npm install"

**Troubleshooting Steps**:
1. Check package.json and lock file consistency
2. Verify Node.js version compatibility
3. Examine Dockerfile layer caching
4. Test dependency installation in isolation

### Environment Configuration

**Problem**: "App works locally but fails in production"

**Environment Debugging**:
1. Compare local vs production environment variables
2. Check for missing configuration files
3. Verify build process differences
4. Test production configuration locally

## Advanced Debugging Scenarios

### Race Condition Debugging

**Problem**: "Intermittent errors that are hard to reproduce"

**Systematic Approach**:
1. Add comprehensive logging
2. Implement retry mechanisms with exponential backoff
3. Use debugging tools for race condition detection
4. Create reproduction scenarios and test cases

### Complex State Management

**Problem**: "Global state management causing inconsistent UI"

**State Debugging**:
1. Map state flow and dependencies
2. Check for state synchronization issues
3. Examine middleware and side effects
4. Implement state debugging tools

## Common Error Patterns and Solutions

### JavaScript Async Issues

```javascript
// ❌ Promise chain without error handling
fetchData()
  .then(data => processData(data))
  .then(result => updateUI(result));

// ✅ Proper async/await with error handling
try {
  const data = await fetchData();
  const result = await processData(data);
  updateUI(result);
} catch (error) {
  console.error('Operation failed:', error);
  showErrorToUser(error.message);
}
```

### React Hook Dependencies

```javascript
// ❌ Missing dependency causing stale closures
useEffect(() => {
  const interval = setInterval(() => {
    setCount(count + 1); // Stale count value
  }, 1000);
  return () => clearInterval(interval);
}, []); // Missing count dependency

// ✅ Correct dependency management
useEffect(() => {
  const interval = setInterval(() => {
    setCount(prevCount => prevCount + 1); // Use functional update
  }, 1000);
  return () => clearInterval(interval);
}, []); // No dependency needed with functional update
```

### API Error Handling

```javascript
// ❌ Incomplete error handling
async function getUser(id) {
  const response = await fetch(`/api/users/${id}`);
  const user = await response.json();
  return user;
}

// ✅ Comprehensive error handling
async function getUser(id) {
  try {
    const response = await fetch(`/api/users/${id}`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('User not found');
      } else if (response.status >= 500) {
        throw new Error('Server error, please try again later');
      } else {
        throw new Error(`Request failed with status ${response.status}`);
      }
    }

    const user = await response.json();
    return user;
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('Network error, please check your connection');
    }
    throw error; // Re-throw other errors
  }
}
```

## Debugging Best Practices

### 1. Reproduce the Issue
- Create minimal reproduction case
- Document exact steps to reproduce
- Note browser, OS, and environment details

### 2. Use Developer Tools Effectively
- Console: Check for errors and warnings
- Network: Examine API calls and responses
- Performance: Profile render and load times
- Memory: Detect leaks and optimization opportunities

### 3. Add Logging Strategically
- Log key events and state changes
- Include context and timestamps
- Use different log levels for filtering
- Remove or reduce logging in production

### 4. Test Hypotheses Systematically
- Change one variable at a time
- Document each test and its results
- Use scientific method for problem-solving
- Keep track of failed attempts

### 5. Document Findings
- Record root cause analysis
- Note solution implementation details
- Share knowledge with team
- Create preventive measures

## When to Invoke the Debugger

**Invoke the debugger agent when you encounter**:
- Cryptic error messages or stack traces
- Intermittent issues that are hard to reproduce
- Performance problems you can't explain
- Build or deployment failures
- Configuration issues across environments
- Complex state management problems
- Security vulnerabilities or concerns
- Cross-browser compatibility issues

**Before invoking**:
- Check console for basic error messages
- Try basic troubleshooting steps
- Gather relevant error logs and screenshots
- Note the exact steps to reproduce the issue

The debugger agent will guide you through a systematic analysis and provide comprehensive solutions for your web development challenges.