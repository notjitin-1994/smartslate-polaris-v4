# Razorpay Logo Configuration

## Current Setup

The Razorpay payment modal is configured to use `/icons/apple-touch-icon.png` as the logo.

## Required Logo Specifications for Optimal Display

To create a logo with a **black circle and the swirl image**, you need:

1. **Size**: 256x256 pixels (square)
2. **Background**: Black circular background
3. **Format**: PNG with transparency outside the circle
4. **Content**: White/colored swirl icon centered on the black circle

## Creating the Custom Logo

### Option 1: Use an Image Editor

1. Open the existing `/public/logo-swirl.png` in an image editor (Photoshop, GIMP, Figma, etc.)
2. Create a new 256x256px canvas
3. Draw a black circle (or rounded square) in the center
4. Place the swirl logo on top of the black background
5. Ensure good contrast between the swirl and the black background
6. Export as PNG

### Option 2: Use Online Tools

- Canva: Create a 256x256px design with black circle + swirl
- Figma: Design the logo with proper specifications
- Remove.bg: If you need to process the existing logo

## Recommended File Locations

Save your custom logo as:

- `/public/razorpay-logo.png` - Main Razorpay logo
- `/public/icons/razorpay-icon.png` - Alternative location

## Using a Custom Logo

After creating the logo, you can either:

### Method 1: Direct File Replacement

Replace `/public/icons/apple-touch-icon.png` with your custom logo

### Method 2: Environment Variable (Recommended)

Add to `.env.local`:

```
NEXT_PUBLIC_RAZORPAY_LOGO_URL=https://yourdomain.com/razorpay-logo.png
```

Or use a CDN URL if hosting the logo externally.

## Current Configuration

Location: `frontend/lib/config/razorpayConfig.ts`

The system will use the environment variable if set, otherwise falls back to:
`/icons/apple-touch-icon.png`
