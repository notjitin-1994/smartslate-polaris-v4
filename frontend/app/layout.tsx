import type { Metadata } from 'next';
import Script from 'next/script';
import { Quicksand, Lato } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme';
import { GlobalErrorBoundary } from '@/components/error/GlobalErrorBoundary';
import { RazorpayProvider } from '@/components/providers/RazorpayProvider';
import { AuthProvider } from '@/contexts/AuthContext';
import { SidebarProvider } from '@/contexts/SidebarContext';
import { Toaster } from 'sonner';
import { InstallPrompt } from '@/components/pwa/InstallPrompt';

export const dynamicParams = true;

const quicksand = Quicksand({
  variable: '--font-quicksand',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
});

const lato = Lato({
  variable: '--font-lato',
  subsets: ['latin'],
  weight: ['300', '400', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Smartslate Polaris: AI-assisted Learning Experience Design',
  description:
    'Generate comprehensive learning blueprints in minutes with AI. Transform training needs into actionable L&D strategies—no templates, just personalized design.',
  keywords: [
    'learning experience design',
    'instructional design',
    'AI learning tools',
    'learning blueprint',
    'corporate training',
    'L&D platform',
    'learning management',
    'training design',
    'AI instructional design',
    'personalized learning',
    'learning strategy',
    'employee development',
    'training blueprint',
    'LXD platform',
    'learning needs analysis',
  ],
  authors: [{ name: 'Smartslate' }],
  creator: 'Smartslate',
  publisher: 'Smartslate',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://smartslatepolaris.com'),
  openGraph: {
    title: 'Smartslate Polaris: AI-assisted Learning Experience Design',
    description:
      'Smartslate Polaris uses AI-powered intelligent questioning to capture context and generate comprehensive learning blueprints. Cut blueprint creation from weeks to minutes with personalized L&D strategies, SMART objectives, and implementation timelines.',
    url: '/',
    siteName: 'Smartslate Polaris',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Smartslate Polaris - AI-assisted Learning Experience Design Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Smartslate Polaris: AI-assisted Learning Experience Design',
    description:
      'AI-powered learning blueprint generation. Turn training needs into comprehensive L&D strategies in minutes—personalized, not templated.',
    images: ['/twitter-image.png'],
    creator: '@smartslate',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-48x48.png', sizes: '48x48', type: 'image/png' },
      { url: '/favicon-64x64.png', sizes: '64x64', type: 'image/png' },
      { url: '/favicon-128x128.png', sizes: '128x128', type: 'image/png' },
      { url: '/logo-swirl.png', sizes: '256x256', type: 'image/png' },
    ],
    shortcut: [{ url: '/favicon.ico' }],
    apple: [
      { url: '/logo-swirl.png', sizes: '256x256', type: 'image/png' },
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/* PWA Meta Tags */}
        <meta name="application-name" content="Smartslate Polaris" />
        <meta name="theme-color" content="#3b82f6" />

        {/* Mobile optimization meta tags - Allow user scaling for accessibility/SEO */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"
        />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Polaris" />
        <meta name="format-detection" content="telephone=no" />

        {/* PWA Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/apple-touch-icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/apple-touch-icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="76x76" href="/icons/apple-touch-icon-76x76.png" />

        {/* Additional PWA Meta Tags */}
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />

        {/* Structured Data for SEO */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'SoftwareApplication',
              name: 'Smartslate Polaris',
              applicationCategory: 'BusinessApplication',
              applicationSubCategory: 'Learning Management System',
              description:
                'AI-powered learning blueprint generation platform for L&D professionals and instructional designers',
              offers: {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'USD',
                priceSpecification: {
                  '@type': 'UnitPriceSpecification',
                  priceCurrency: 'USD',
                  price: '0',
                  billingDuration: 'P1M',
                },
              },
              featureList: [
                'AI-powered dynamic question generation',
                'Comprehensive learning blueprint creation',
                'Multi-format export (PDF, Word, Markdown)',
                'Personalized learning strategies',
                'Implementation timeline planning',
              ],
              operatingSystem: 'Web Browser',
              browserRequirements: 'Requires JavaScript',
            }),
          }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Apply theme class immediately to prevent flash
              (function() {
                try {
                  // Always default to dark theme for Smartslate
                  document.documentElement.classList.remove('light', 'dark');
                  document.documentElement.classList.add('dark');
                } catch (e) {
                  // Fallback to dark if anything fails
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${quicksand.variable} ${lato.variable} antialiased`}
        suppressHydrationWarning
      >
        {/* Razorpay Checkout Script */}
        <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

        <GlobalErrorBoundary>
          <ThemeProvider defaultTheme="dark">
            <AuthProvider>
              <SidebarProvider>
                <RazorpayProvider>
                  {children}
                  <InstallPrompt />
                </RazorpayProvider>
              </SidebarProvider>
            </AuthProvider>
          </ThemeProvider>
        </GlobalErrorBoundary>
        <Toaster
          position="top-right"
          expand={false}
          richColors
          closeButton
          theme="dark"
          toastOptions={{
            style: {
              background: 'rgba(15, 23, 42, 0.95)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(148, 163, 184, 0.1)',
              color: 'rgb(224, 224, 224)',
              fontSize: '14px',
              padding: '16px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            },
            className: 'font-body',
          }}
        />
      </body>
    </html>
  );
}
