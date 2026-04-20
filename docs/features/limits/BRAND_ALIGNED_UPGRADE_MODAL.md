# Brand-Aligned Upgrade Modal

## Complete Redesign

The UpgradePromptModal has been completely redesigned to match the brand's visual identity and design system.

## Brand Design Elements

### Color Palette
- **Primary**: `#a7dadb` (Cyan/Teal) - Brand signature color
- **Primary Light**: `#d0edf0`
- **Primary Dark**: `#7bc5c7`
- **Secondary**: `#4f46e5` (Indigo)
- **Background**: `#020c1b` (Dark Navy)
- **Surface**: `#0d1b2a` (Paper)
- **Text**: `#e0e0e0` (Primary), `#b0c5c6` (Secondary)

### Glass Morphism
- Uses the brand's `glass-card` class
- Semi-transparent backgrounds with backdrop blur
- Subtle gradient borders
- Layered shadows with glow effects
- Dark theme optimized

### Typography
- **Headings**: Quicksand font family
- **Body**: Lato font family
- Consistent sizing: 2xl title, base description, sm details

### Spacing & Layout
- Consistent padding: 32px (8 spacing units)
- Border radius: 1rem (16px) for main card, 0.75rem (12px) for inner elements
- Gap spacing: 12px between elements
- Max width: 512px (lg breakpoint)

## Visual Features

### 1. Animated Background Glow
```tsx
<motion.div
  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
  className="bg-primary/20 blur-3xl"
/>
```
- Two animated orbs (primary cyan, secondary indigo)
- Pulsing animation for depth
- Subtle, non-distracting

### 2. Hero Icon
- Rocket icon (brand-aligned, represents growth/launch)
- Cyan gradient background with shadow
- Animated entrance (scale + rotate)
- 64px × 64px size

### 3. Usage Progress Bar
- Shows current usage vs limit
- Animated fill from 0 to 100%
- Cyan gradient fill
- Glass morphism container

### 4. Tier Recommendation Card
- Single suggested tier (Navigator or Voyager)
- "Recommended" badge with sparkles icon
- 3-column benefits grid showing:
  - Increase multiplier (4x or 2x)
  - Monthly blueprints
  - Saved starmaps
- Feature list with bullet points
- Hover effect with border glow

### 5. Call-to-Action Buttons
- **"Maybe Later"**: Outline style, subtle background
- **"View Plans"**: Primary gradient, animated hover effect
- Both buttons equal width (flex-1)
- Arrow icon with slide animation on hover

### 6. Trust Indicator
- Small text at bottom
- "Upgrade anytime, cancel anytime"
- Sparkles icon for visual appeal

## Removed Elements

### From Old Design:
- ❌ Purple/pink gradients (not brand colors)
- ❌ Crown icons (replaced with Rocket)
- ❌ White backgrounds (changed to dark theme)
- ❌ Yellow/gold accents (not in brand palette)
- ❌ Multiple tier comparison cards (simplified to one)
- ❌ Pricing display (moved to pricing page)
- ❌ TierBadge component (simplified)
- ❌ Rollover notice cards (simplified to features list)
- ❌ Value proposition stats grid (simplified)
- ❌ Overly complex animations

## Component Props

```typescript
interface UpgradePromptModalProps {
  open: boolean;                    // Modal visibility
  onOpenChange: (open: boolean) => void;  // State setter
  currentTier: SubscriptionTier | string; // User's current tier
  limitType?: 'creation' | 'saving';      // Type of limit hit
  currentCount?: number;                  // Current usage
  limitCount?: number;                    // Maximum allowed
}
```

## Usage Example

```tsx
<UpgradePromptModal
  open={showUpgradePrompt}
  onOpenChange={setShowUpgradePrompt}
  currentTier={limits?.tier || 'explorer'}
  limitType="creation"
  currentCount={limits?.currentGenerations}
  limitCount={limits?.maxGenerationsMonthly}
/>
```

## Animation Timeline

1. **0ms**: Modal fades in, scales up (duration: 400ms)
2. **100ms**: Icon rotates and scales in (duration: 600ms)
3. **200ms**: Usage bar appears (duration: 300ms)
4. **300ms**: Progress bar fills (duration: 800ms)
5. **300ms**: Tier card slides up (duration: 400ms)
6. **400ms**: Action buttons appear (duration: 300ms)
7. **500ms**: Trust indicator fades in (duration: 300ms)

Total entrance animation: ~1.3 seconds

Background glows animate continuously with different speeds for depth.

## Accessibility Features

- ✅ Proper ARIA labels on close button
- ✅ Focus management
- ✅ Keyboard navigation (ESC to close)
- ✅ Semantic HTML (DialogHeader, DialogTitle, DialogDescription)
- ✅ High contrast text (WCAG AA compliant)
- ✅ Touch-friendly button sizes (44px+ height)
- ✅ Readable text sizes (base: 16px, small: 14px, xs: 12px)

## Responsive Design

The modal is responsive and works on all screen sizes:

- **Desktop**: Max-width 512px, centered
- **Tablet**: Same layout, scales nicely
- **Mobile**: Padding adjusts, buttons stack vertically if needed
- **Touch devices**: Glass morphism disables for performance

## Performance Optimizations

1. **AnimatePresence**: Only renders motion elements when modal is open
2. **Backdrop blur**: Uses CSS backdrop-filter (hardware accelerated)
3. **Transforms**: Uses transform instead of position changes
4. **Will-change**: Optimized for GPU acceleration
5. **Pointer-events: none**: On decorative elements to improve interaction

## Brand Consistency Checklist

- ✅ Uses brand primary color (#a7dadb)
- ✅ Uses dark navy background (#020c1b)
- ✅ Uses glass morphism (glass-card class)
- ✅ Uses brand fonts (Quicksand/Lato)
- ✅ Uses consistent spacing scale
- ✅ Uses consistent border radius
- ✅ Uses brand shadows and glows
- ✅ Uses brand-appropriate icons (Rocket, Zap, Sparkles)
- ✅ Matches Quick Actions card styling
- ✅ Matches overall app dark theme aesthetic

## Visual Comparison

### Before (Old Modal):
- Bright white background
- Purple/pink/yellow gradients
- Multiple comparison cards
- Crown and gold accents
- Light theme oriented
- Busy, cluttered layout

### After (New Modal):
- Dark navy with glass effect
- Cyan/teal brand colors
- Single recommendation card
- Rocket and cyan accents
- Dark theme optimized
- Clean, minimal layout

## Testing

To see the modal:

1. Set yourself at limit (SQL):
```sql
UPDATE user_profiles
SET blueprint_creation_count = blueprint_creation_limit
WHERE user_id = auth.uid();
```

2. Click "Create New Starmap" on landing page

3. Modal should appear with:
   - Dark background with glass effect
   - Cyan animated glows
   - Rocket icon
   - Your usage (5 of 5)
   - Recommended tier (Navigator or Voyager)
   - "Maybe Later" and "View Plans" buttons

## Files Modified

1. **`frontend/components/modals/UpgradePromptModal.tsx`**
   - Complete rewrite (290 lines → 291 lines)
   - Brand-aligned styling
   - Simplified logic
   - Better animations
   - Cleaner code structure

## Design Principles Applied

1. **Less is More**: Simplified from 2 comparison cards to 1 recommendation
2. **Brand First**: Every color, font, spacing follows brand guidelines
3. **Dark Theme**: Optimized for the app's dark aesthetic
4. **Glass Morphism**: Consistent with app's visual language
5. **Smooth Animations**: Enhance UX without being distracting
6. **Clear Hierarchy**: Title → Usage → Recommendation → Actions
7. **Trust Building**: Subtle reassurance without being pushy
8. **Performance**: Optimized animations and rendering

## Future Enhancements (Optional)

Potential improvements if needed:
- Add pricing information (requires pricing API)
- Show comparison with current tier
- Add testimonials or social proof
- Add success metrics
- Show feature comparison table
- Add "Contact Sales" for enterprise
- Add currency conversion
- Add trial period information

Current design prioritizes simplicity and brand alignment over feature completeness.
