# Smartslate Style Guide: The Polaris Aesthetic

Polaris v4's visual language is "Glassmorphic High-Tech." It combines the depth of Material Design with the futuristic feel of a starry, deep-space dashboard.

## 1. Color Palette

### Brand Colors
- **Primary (Teal/Cyan):** `#a7dadb` (Used for primary actions, focus rings, and accents)
- **Secondary (Indigo/Purple):** `#4F46E5` (Used for core branding and secondary actions)

### Core Gradients
- **Primary Gradient:** `#a7dadb` to `#7bc5c7`
- **Secondary Gradient:** `#4F46E5` to `#312E81`

### Base Colors (Dark Theme)
- **Background (Deep Space):** `#020C1B`
- **Surface (Glass):** `#0d1b2a` at 55% opacity with 18px blur
- **Text (High Emphasis):** `#e0e0e0`
- **Text (Muted):** `#b0c5c6`

## 2. Typography
- **Headings:** `Quicksand` (Bold, rounded, approachable yet professional)
- **Body:** `Lato` (Clean, highly readable sans-serif)
- **Monospace:** `JetBrains Mono` (For technical data and AI reasoning traces)

## 3. UI Components (Polaris v4 Standards)

### The Glass Card
- **Background:** `rgba(13, 27, 42, 0.55)`
- **Border:** `1px solid rgba(255, 255, 255, 0.1)`
- **Backdrop Blur:** `18px`
- **Shadow:** `0 8px 40px rgba(0, 0, 0, 0.4)`

### Interactive Elements
- **Buttons:** 12px border radius (Rounded-XL). High-contrast text on brand backgrounds.
- **Inputs:** Dark translucent background with a teal bottom-border or focus ring.
- **Selection:** Brand teal (`#a7dadb`) with 80% opacity for text highlights.

## 4. Animation Principles
- **Enter Transitions:** Smooth "Fade In + Slide Up" (300ms) using Framer Motion.
- **Micro-interactions:** Subtle "Scale Down" (0.98) on click/press to provide tactile feedback.
- **AI Streaming:** Cascading entrance for list items to avoid layout shift.

## 5. Logo Usage
- **Main Logo:** Located at `/public/images/logos/logo.png`. Used in headers and splash screens.
- **Logo Swirl:** Located at `/public/images/logos/logo-swirl.png`. Used as a background pattern or watermark.
- **Favicon:** Located at `/public/favicon.png`.
