import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing Plans | Smartslate Polaris',
  description: 'Choose the perfect plan for your learning design needs. AI-assisted blueprint generation starting from $19/month. 15x faster time-to-launch.',
  openGraph: {
    title: 'Pricing Plans | Smartslate Polaris',
    description: '15x faster learning design launch with AI-powered blueprints. Explorer, Navigator, and Voyager plans tailored for L&D professionals.',
  }
};

export default function PricingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
