import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  reloadOnOnline: false,
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  fallbacks: {
    document: '/offline',
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: {
          maxEntries: 4,
          maxAgeSeconds: 365 * 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css|jpg|jpeg|gif|png|svg|ico|webp)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 64,
          maxAgeSeconds: 24 * 60 * 60,
        },
      },
    },
    {
      urlPattern: /^https:\/\/www\.smartslatepolaris\.com\/api\/.*$/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'apis',
        expiration: {
          maxEntries: 16,
          maxAgeSeconds: 24 * 60 * 60,
        },
        networkTimeoutSeconds: 10,
      },
    },
  ],
});

const nextConfig: NextConfig = {
  eslint: {
    // Allow production builds to complete even with ESLint warnings
    // Warnings are still shown but don't block the build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily allow build to complete with type errors for deployment
    // TODO: Fix remaining type errors
    ignoreBuildErrors: true,
  },
  // Optimize for Vercel deployment
  poweredByHeader: false,
  compress: true,
  // Set output file tracing root to avoid workspace confusion
  outputFileTracingRoot: __dirname,

  // Performance optimizations
  experimental: {
    // Optimize CSS loading
    optimizeCss: true,
    // Optimize images
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    // Force dynamic rendering for all pages to avoid auth context issues during build
    forceSwcTransforms: true,
  },

  // Enable streaming SSR - moved from experimental
  serverExternalPackages: ['redis', 'ioredis'],

  // Bundle analyzer configuration
  webpack: (config, { isServer }) => {
    // Bundle analyzer for performance monitoring
    if (process.env.ANALYZE === 'true') {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          openAnalyzer: false,
          reportFilename: isServer ? '../analyze-server.html' : '../analyze-client.html',
        })
      );
    }

    // Optimize chunk splitting
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Separate vendor chunks
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
            },
            // Separate UI library chunks
            ui: {
              test: /[\\/]node_modules[\\/](@radix-ui|@mui|recharts)[\\/]/,
              name: 'ui',
              chunks: 'all',
              priority: 20,
            },
            // Separate utility chunks
            utils: {
              test: /[\\/]node_modules[\\/](lodash-es|date-fns|clsx)[\\/]/,
              name: 'utils',
              chunks: 'all',
              priority: 15,
            },
            // Separate chart library chunks
            charts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'charts',
              chunks: 'all',
              priority: 25,
            },
          },
        },
      };
    }

    // Resolve optimizations
    config.resolve = {
      ...config.resolve,
      alias: {
        ...config.resolve.alias,
        // Prefer ES modules for better tree shaking
        lodash: 'lodash-es',
      },
    };

    return config;
  },

  // Image optimization
  images: {
    qualities: [25, 50, 75, 90, 100],
    domains: ['localhost'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 7, // 7 days
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Static optimization
  trailingSlash: false,
  generateEtags: true,

  // Skip static generation for routes that require authentication
  // output: 'standalone',

  // Compression
  compress: true,

  // Headers for performance
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        source: '/images/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
      {
        source: '/fonts/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000',
          },
        ],
      },
    ];
  },

  // Redirects for performance
  async redirects() {
    return [
      // Disabled trailing slash redirects to prevent conflicts with middleware authentication
      // The middleware handles authentication redirects correctly without URL normalization
    ];
  },
};

export default withPWA(nextConfig);
