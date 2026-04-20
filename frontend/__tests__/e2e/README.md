# End-to-End Testing with Playwright

This directory contains end-to-end (E2E) tests for the Polaris v3 admin management system using [Playwright](https://playwright.dev/).

## 📁 Test Structure

```
__tests__/e2e/
├── fixtures/
│   └── auth.ts              # Authentication helpers and test user management
├── admin/
│   ├── user-management.spec.ts  # User management flow tests
│   └── analytics.spec.ts        # Analytics dashboard tests
└── README.md                # This file
```

## 🚀 Running Tests

### Prerequisites

1. **Install Playwright browsers** (first time only):

   ```bash
   npx playwright install --with-deps
   ```

2. **Environment variables** must be configured in `frontend/.env.local`:

   ```bash
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **Development server must be running** on `http://localhost:3000`:
   ```bash
   npm run dev
   ```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run all tests (unit + integration + E2E)
npm run test:all
```

### Run Specific Tests

```bash
# Run only user management tests
npx playwright test user-management

# Run only analytics tests
npx playwright test analytics

# Run a specific test file
npx playwright test __tests__/e2e/admin/user-management.spec.ts

# Run tests matching a pattern
npx playwright test --grep "should create a new user"
```

## 📝 Test Coverage

### User Management Tests (`user-management.spec.ts`)

**User List Page:**

- ✅ Display user list with correct columns
- ✅ Show user count and stats
- ✅ Filter users by role and tier
- ✅ Search users by email
- ✅ Pagination navigation
- ✅ User actions menu
- ✅ Clear all filters

**Add User Flow:**

- ✅ Navigate to add user page
- ✅ Create new user successfully
- ✅ Validation errors for invalid input
- ✅ Email format validation
- ✅ Password strength validation
- ✅ Cancel user creation

**Edit User Flow:**

- ✅ Navigate to edit user page
- ✅ Update user full name
- ✅ Update user role
- ✅ Cancel edit without saving

**View User Details:**

- ✅ View user activity log
- ✅ View user blueprints
- ✅ View user sessions

**Export Functionality:**

- ✅ Open export dialog
- ✅ Export users as CSV
- ✅ Export users as JSON
- ✅ Export with filters applied
- ✅ Cancel export

**Accessibility:**

- ✅ Keyboard navigation
- ✅ ARIA labels
- ✅ Heading hierarchy

### Analytics Dashboard Tests (`analytics.spec.ts`)

**Analytics Overview:**

- ✅ Display analytics dashboard
- ✅ Display metrics with correct format
- ✅ Show loading state

**Period Selection:**

- ✅ Change period to 7/30/90 days
- ✅ Remember selected period on reload

**Charts and Visualizations:**

- ✅ Display all chart components
- ✅ Show chart tooltips on hover
- ✅ Display chart legends
- ✅ Handle empty data gracefully

**Blueprint Statistics:**

- ✅ Display blueprint status breakdown
- ✅ Show completion rate percentage
- ✅ Display blueprint creation trend

**User Engagement Metrics:**

- ✅ Display engagement score metrics
- ✅ Show top activities list
- ✅ Display session statistics

**Tier Distribution:**

- ✅ Display tier distribution pie chart
- ✅ Show tier breakdown with counts
- ✅ Display tier percentages

**Export Analytics:**

- ✅ Export analytics data

**Responsive Design:**

- ✅ Responsive on mobile
- ✅ Responsive on tablet

**Real-time Updates:**

- ✅ Refresh button functionality
- ✅ Refresh analytics data

**Error Handling:**

- ✅ Handle API errors gracefully
- ✅ Allow retry after error

**Navigation:**

- ✅ Navigate between admin pages
- ✅ Navigate to user details from analytics

## 🔧 Configuration

### Playwright Config (`playwright.config.ts`)

Key configuration options:

- **Test directory**: `__tests__/e2e`
- **Timeout**: 30 seconds per test
- **Retries**: 2 retries in CI, 0 locally
- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:3000` (from env vars)
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On first retry

### Test Fixtures

**Authentication Helpers** (`fixtures/auth.ts`):

```typescript
// Create test user with specific role
const adminUser = await createTestUser('developer');
const regularUser = await createTestUser('explorer');

// Login to application
await login(page, email, password);

// Logout
await logout(page);

// Check if authenticated
const isAuth = await isAuthenticated(page);

// Cleanup
await deleteTestUser(userId);
```

## 🎯 Writing New Tests

### Best Practices

1. **Use data-testid attributes** for reliable element selection:

   ```tsx
   <button data-testid="add-user-button">Add User</button>
   ```

2. **Create test users in beforeAll/beforeEach**:

   ```typescript
   test.beforeAll(async () => {
     adminUser = await createTestUser('developer');
   });

   test.afterAll(async () => {
     await deleteTestUser(adminUser.id);
   });
   ```

3. **Wait for network idle** before assertions:

   ```typescript
   await page.goto('/admin/users');
   await page.waitForLoadState('networkidle');
   ```

4. **Use meaningful test descriptions**:

   ```typescript
   test('should create a new user successfully', async ({ page }) => {
     // Test implementation
   });
   ```

5. **Clean up test data**:
   ```typescript
   test.afterAll(async () => {
     // Delete test users and data
   });
   ```

### Example Test

```typescript
test('should filter users by role', async ({ page }) => {
  // Setup
  await login(page, adminUser.email, adminUser.password);
  await page.goto('/admin/users');
  await page.waitForLoadState('networkidle');

  // Action
  await page.click('[data-testid="role-filter"]');
  await page.click('[data-testid="role-option-explorer"]');
  await page.waitForTimeout(500);

  // Assertions
  expect(page.url()).toContain('role=explorer');
  const roleBadges = page.locator('[data-testid="user-role-badge"]');
  const count = await roleBadges.count();

  for (let i = 0; i < count; i++) {
    await expect(roleBadges.nth(i)).toContainText('Explorer');
  }
});
```

## 🐛 Debugging

### Visual Debugging

```bash
# Run with UI mode
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug specific test
npx playwright test --debug user-management.spec.ts
```

### Debugging Tips

1. **Use page.pause()** to stop execution:

   ```typescript
   await page.pause(); // Opens Playwright Inspector
   ```

2. **Take screenshots manually**:

   ```typescript
   await page.screenshot({ path: 'debug.png' });
   ```

3. **Console logging**:

   ```typescript
   console.log('Current URL:', page.url());
   ```

4. **Check test artifacts**:
   - Screenshots: `test-results/*/test-failed-*.png`
   - Videos: `test-results/*/video.webm`
   - Traces: `test-results/*/trace.zip`

### Common Issues

**Browser installation fails:**

```bash
# Install with sudo if needed
sudo npx playwright install --with-deps chromium
```

**Test timeouts:**

- Increase timeout in `playwright.config.ts`
- Use `page.waitForLoadState('networkidle')` before assertions
- Check if dev server is running

**Element not found:**

- Verify `data-testid` attributes exist in components
- Use Playwright Inspector to find correct selectors
- Wait for elements to be visible before interaction

## 📊 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Install Playwright
        run: npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

## 📚 Resources

- [Playwright Documentation](https://playwright.dev/)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Debugging Tests](https://playwright.dev/docs/debug)
- [CI/CD Integration](https://playwright.dev/docs/ci)
- [Writing Tests](https://playwright.dev/docs/writing-tests)

## 🤝 Contributing

When adding new tests:

1. Follow existing test structure and naming conventions
2. Add appropriate `data-testid` attributes to components
3. Clean up test data in `afterAll`/`afterEach` hooks
4. Update this README with new test coverage
5. Ensure tests pass locally before committing

## 📝 Notes

- Tests require a running development server
- Test users are created and cleaned up automatically
- Screenshots and videos are captured on failure
- Tests run on multiple browsers (Chromium, Firefox, WebKit)
- Mobile viewports are also tested
