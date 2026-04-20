# Share Page Production Fix

## Problem Summary

The share page (`/share/[token]`) was failing in production with the following errors:

1. **Server Components Error**: Console showed "Error: An error occurred in the Server Components render" with digest
2. **404 Cascade**: Error pages attempted to link to `/support` route which doesn't exist, causing additional 404s
3. **URL Construction Issue**: Faulty logic in `VERCEL_URL` environment variable handling

## Root Causes

### 1. URL Construction Bug (app/share/[token]/page.tsx:21-24)

**Before:**

```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
```

**Problem**: The ternary operator logic was incorrect. It evaluated as:

- `process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? ... : ...)`
- This always returned the SITE_URL if set, otherwise tried VERCEL_URL
- But the https:// prefixing was only applied to VERCEL_URL path

**After:**

```typescript
const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
```

### 2. Missing /support Route

**Problem**: Multiple pages linked to `/support` which doesn't exist:

- `app/not-found.tsx:52` - "Contact Support" link
- `app/error.tsx:79` - "contact our support team" link
- `components/features/subscription/management/SubscriptionManagementContent.tsx:302`
- `components/subscription/SubscriptionManagementContent.tsx:302`

**Impact**: When share page failed, error page tried to prefetch `/support`, causing 404 cascade

## Files Changed

### 1. app/share/[token]/page.tsx

**Lines 18-27**: Fixed `getSharedBlueprint` URL construction
**Lines 75-77**: Fixed `generateMetadata` URL construction

### 2. app/not-found.tsx

**Lines 48-58**: Replaced `/support` Link with `mailto:support@smartslate.io`

### 3. app/error.tsx

**Lines 74-85**: Replaced `/support` Link with `mailto:support@smartslate.io`

### 4. components/features/subscription/management/SubscriptionManagementContent.tsx

**Lines 301-306**: Replaced `/support` Link with `mailto:support@smartslate.io`

### 5. components/subscription/SubscriptionManagementContent.tsx

**Lines 301-306**: Replaced `/support` Link with `mailto:support@smartslate.io`

## Testing Checklist

### Local Testing

- [x] Share page loads without errors
- [x] Error page doesn't attempt /support navigation
- [x] 404 page doesn't attempt /support navigation
- [ ] Subscription management pages render correctly

### Production Testing (After Deploy)

- [ ] Share page works with real tokens
- [ ] Open Graph metadata renders correctly
- [ ] No console errors for Server Components
- [ ] No 404s for /support
- [ ] Email links open properly

## Deployment Notes

1. **Environment Variables**: Ensure `NEXT_PUBLIC_SITE_URL` is set in Vercel:

   ```
   NEXT_PUBLIC_SITE_URL=https://polaris.smartslate.io
   ```

2. **Build Check**: The build has an unrelated error in admin routes that existed before these changes

3. **Cache Clearing**: May need to clear Vercel's cache after deploy:
   ```bash
   vercel --prod --force
   ```

## Prevention

To prevent similar issues in the future:

1. **Never link to non-existent routes** - Use external links or mailto: for support
2. **Test URL construction logic** - Watch for operator precedence in ternaries
3. **Use NEXT_PUBLIC_SITE_URL first** - It's the canonical way to get the site URL
4. **Add E2E tests** - Share page should have integration tests

## Related Issues

- Razorpay checkout warning: "Unrecognized feature: 'web-share'" - Not addressed in this fix
- TypeScript errors in various API routes - Pre-existing, not caused by this change
- Build error for admin activity route - Pre-existing, not caused by this change
