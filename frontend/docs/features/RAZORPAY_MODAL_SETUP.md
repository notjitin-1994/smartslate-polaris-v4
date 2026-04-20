# Razorpay Modal Setup Guide

## Summary of Changes

### 1. ✅ Text Updates

**File**: `frontend/lib/hooks/useRazorpayCheckout.ts`

- **Name Field**: "Smartslate Polaris: [Tier]" (e.g., "Smartslate Polaris: Explorer")
  - Tier name is automatically capitalized
- **Description Field**: "[Monthly/Yearly] Subscription"

### 2. ✅ Logo URL Fix

**Files**:

- `frontend/lib/hooks/useRazorpayCheckout.ts`
- `frontend/lib/config/razorpayConfig.ts`

**Problem**: Logo was showing as white rectangle because Razorpay requires absolute HTTPS URLs

**Solution**:

- Automatically converts relative paths (`/icons/apple-touch-icon.png`) to absolute URLs (`https://yourdomain.com/icons/apple-touch-icon.png`)
- Added comprehensive logging to debug

### 3. 🎨 Custom Logo Creator

**File**: `frontend/public/create-razorpay-logo.html`

**Features**:

- Creates 256x256px logo with dark blue circular background (`#020c1b`)
- Swirl fills entire circle (240px size)
- Matches website branding perfectly

**How to use**:

1. Open `http://localhost:3000/create-razorpay-logo.html`
2. Logo will auto-load from `/logo-swirl.png`
3. Click "Download Logo"
4. Save as `/public/razorpay-logo.png`
5. Update `.env.local`:
   ```bash
   NEXT_PUBLIC_RAZORPAY_LOGO_URL=/razorpay-logo.png
   ```

## Debugging

### Check Console Logs

When opening the Razorpay checkout, check browser console for:

```javascript
[useRazorpayCheckout] Final Razorpay checkout options: {
  key: "***1234",
  name: "Smartslate Polaris: Explorer",
  description: "Monthly Subscription",
  image: "https://yourdomain.com/icons/apple-touch-icon.png",
  subscription_id: "sub_xxx",
  hasHandler: true,
  hasModal: true
}
```

### Description Not Showing?

**Known Issue**: Razorpay subscription checkouts may not display the `description` field in the modal. This appears to be a Razorpay limitation for subscription-based checkouts (as opposed to one-time payment checkouts).

**Why this happens**:

- Subscription checkouts use `subscription_id` parameter
- Regular payment checkouts use `order_id` or `amount` parameters
- Razorpay may have different UI rendering for subscription vs payment modals

**Workarounds**:

1. ✅ Include billing info in the name field (current approach)
2. Contact Razorpay support to enable description for subscriptions
3. Use dashboard settings to customize checkout appearance

## Current Modal Display

```
┌─────────────────────────────────────┐
│                                     │
│         [Blue Circle Logo]          │
│                                     │
│   Smartslate Polaris: Explorer      │
│                                     │
│   Monthly Subscription  ← May not   │
│                           show      │
│                                     │
│   Total Amount                      │
│   ₹ 1,599                          │
│                                     │
│   [Contact Details Form]            │
│                                     │
│   [Pay using Card]                  │
│                                     │
└─────────────────────────────────────┘
```

## Environment Variables

### Required

```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxx
```

### Optional Customization

```bash
# Custom logo (use absolute URL or path from /public)
NEXT_PUBLIC_RAZORPAY_LOGO_URL=https://cdn.yoursite.com/logo.png
# or
NEXT_PUBLIC_RAZORPAY_LOGO_URL=/razorpay-logo.png

# Custom name (defaults to "Smartslate")
NEXT_PUBLIC_RAZORPAY_NAME=Smartslate

# Theme color (defaults to #6366f1)
NEXT_PUBLIC_RAZORPAY_THEME_COLOR=#020c1b
```

## Logo Specifications

### Requirements

- **Size**: 256x256px minimum (square)
- **Format**: PNG, JPG, or JPEG
- **Max Size**: 1MB
- **URL**: Must be absolute HTTPS URL (http://localhost works for testing)

### Recommended Design

- **Background**: Dark blue circle (#020c1b)
- **Icon**: White/cyan swirl centered
- **Size**: Icon should fill 90-95% of circle
- **Format**: PNG with transparency outside circle

## Testing Checklist

- [ ] Logo appears correctly (not white rectangle)
- [ ] Logo has correct colors (dark blue background)
- [ ] Name shows tier: "Smartslate Polaris: [Tier]"
- [ ] Tier name is capitalized
- [ ] Amount displays correctly
- [ ] Console logs show all parameters correctly
- [ ] Image URL is absolute (starts with http:// or https://)

## Troubleshooting

### Logo still appears as white rectangle

1. Check console logs for image URL
2. Verify URL is absolute (not relative)
3. Ensure image is accessible (try opening URL in browser)
4. Check image file size (must be < 1MB)
5. Verify image is 256x256px

### Description not visible

- This is likely a Razorpay limitation for subscription checkouts
- Verify in console logs that description is being passed
- Consider including billing info in name field instead

### Colors don't match website

1. Check `app/globals.css` for current color values
2. Update `create-razorpay-logo.html` fillStyle values
3. Regenerate logo
4. Clear browser cache

## Need Help?

1. Check browser console for error messages
2. Verify all environment variables are set
3. Test with Razorpay test mode first
4. Contact Razorpay support for subscription-specific issues
