# Pricing Page

This is an exact replica of the pricing page from the smartslate-final folder, built from the ground up.

## Structure

```
pricing/
├── page.tsx                          # Main pricing page component
├── components/
│   ├── landing/
│   │   ├── styles/
│   │   │   └── LandingStyles.tsx   # Styled components for landing page
│   │   └── DemoModal.tsx           # Demo request modal
│   ├── pricing/
│   │   └── CurrencyToggle.tsx      # Currency selection component
│   ├── providers/
│   │   └── ModalProvider.tsx        # Modal state management provider
│   └── ui/
│       ├── FormField.tsx            # Reusable form field component
│       ├── Modal.tsx                # Base modal component
│       └── StandardHero.tsx         # Hero section component
├── contexts/
│   └── CurrencyContext.tsx         # Currency state management context
├── hooks/
│   ├── useCurrencyExchange.ts       # Currency exchange rate hook
│   └── useModalManager.ts          # Modal management hook
├── utils/
│   └── formatPrice.ts              # Price formatting utilities
├── package.json                    # Dependencies and scripts
└── README.md                      # This file
```

## Features

- **Product Tabs**: Navigate between different Solara products (Polaris, Constellation, Nova, Orbit, Nebula, Spectrum)
- **Currency Toggle**: Switch between USD and INR with real-time exchange rates
- **Billing Toggle**: Choose between monthly and annual billing with 20% discount
- **Individual Plans**: Explorer, Navigator, and Voyager tiers with different features and limits
- **Team Plans**: Crew, Fleet, and Armada tiers for teams and organizations
- **Coming Soon**: Display for products not yet released
- **Interactive Elements**: Hover effects, animations, and transitions
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Dependencies

- React 18+
- Next.js 14+
- Material-UI 5+
- Framer Motion 10+
- TypeScript 5+

## Usage

To use this pricing page in your Next.js application:

1. Copy the entire `pricing` folder to your project
2. Install dependencies: `npm install`
3. Import and use the pricing page in your app

```tsx
import PricingPage from './pricing/page';

export default function App() {
  return <PricingPage />;
}
```

## Customization

The pricing page is fully customizable:

- Modify pricing plans in the `polarisPricing` and `teamPricing` arrays
- Update product information in the `productTabs` array
- Adjust styling in the `LandingStyles.tsx` file
- Change colors and themes through Material-UI theme provider