/**
 * Security Headers Middleware
 *
 * Implements comprehensive security headers for Next.js applications
 * following OWASP and security best practices.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

interface SecurityHeaderConfig {
  name: string;
  value: string;
  description: string;
  enabled: boolean;
  environments?: string[]; // If specified, only enabled in these environments
}

/**
 * Security header configurations
 */
const securityHeaders: SecurityHeaderConfig[] = [
  // Content Security Policy (CSP) - Prevent XSS and data injection
  {
    name: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://cdn.jsdelivr.net https://js.stripe.com https://checkout.razorpay.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://api.anthropic.com https://api.razorpay.com https://*.supabase.co",
      "frame-src 'self' https://js.stripe.com https://checkout.razorpay.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      'upgrade-insecure-requests',
    ].join('; '),
    description: 'Content Security Policy to prevent XSS and data injection',
    enabled: true,
    environments: ['production'],
  },

  // X-Content-Type-Options - Prevent MIME type sniffing
  {
    name: 'X-Content-Type-Options',
    value: 'nosniff',
    description: 'Prevents MIME-type sniffing by browsers',
    enabled: true,
  },

  // X-Frame-Options - Prevent clickjacking
  {
    name: 'X-Frame-Options',
    value: 'DENY',
    description: 'Prevents clickjacking by disallowing iframe embedding',
    enabled: true,
  },

  // X-XSS-Protection - Legacy XSS protection (for older browsers)
  {
    name: 'X-XSS-Protection',
    value: '1; mode=block',
    description: 'Enables XSS protection in older browsers',
    enabled: true,
  },

  // Referrer Policy - Control referrer information leakage
  {
    name: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
    description: 'Controls how much referrer information is sent',
    enabled: true,
  },

  // Permissions Policy - Control browser feature access
  {
    name: 'Permissions-Policy',
    value: [
      'camera=()',
      'microphone=()',
      'geolocation=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
      'gyroscope=()',
      'accelerometer=()',
      'autoplay=(self)',
      'encrypted-media=(self)',
      'fullscreen=(self)',
      'picture-in-picture=(self)',
    ].join(', '),
    description: 'Controls access to browser features and APIs',
    enabled: true,
  },

  // Strict-Transport-Security (HSTS) - Enforce HTTPS
  {
    name: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
    description: 'Enforces HTTPS and prevents protocol downgrade attacks',
    enabled: true,
    environments: ['production'],
  },

  // Cross-Origin Embedder Policy - Control cross-origin resource loading
  {
    name: 'Cross-Origin-Embedder-Policy',
    value: 'require-corp',
    description: 'Controls how cross-origin resources are loaded',
    enabled: false, // Disabled due to potential conflicts with external scripts
    environments: ['production'],
  },

  // Cross-Origin Resource Policy - Control cross-origin resource sharing
  {
    name: 'Cross-Origin-Resource-Policy',
    value: 'same-origin',
    description: 'Controls cross-origin resource access',
    enabled: true,
  },

  // Cross-Origin Opener Policy - Control cross-origin window access
  {
    name: 'Cross-Origin-Opener-Policy',
    value: 'same-origin',
    description: 'Controls cross-origin window access',
    enabled: false, // May interfere with OAuth flows
    environments: ['production'],
  },
];

/**
 * Determine if a security header should be enabled in current environment
 */
function shouldEnableHeader(config: SecurityHeaderConfig): boolean {
  if (!config.enabled) {
    return false;
  }

  if (config.environments) {
    const currentEnv = process.env.NODE_ENV || 'development';
    return config.environments.includes(currentEnv);
  }

  return true;
}

/**
 * Add security headers to response
 */
export function addSecurityHeaders(response: NextResponse): NextResponse {
  for (const headerConfig of securityHeaders) {
    if (shouldEnableHeader(headerConfig)) {
      response.headers.set(headerConfig.name, headerConfig.value);
    }
  }

  // Add custom security headers
  response.headers.set('X-Application-Name', 'Polaris v3');
  response.headers.set('X-API-Version', '1.0.0');

  // Add timing headers for monitoring
  response.headers.set('X-Response-Time', Date.now().toString());

  return response;
}

/**
 * Create middleware function for Next.js middleware
 */
export function createSecurityHeadersMiddleware() {
  return function middleware(request: NextRequest) {
    const response = NextResponse.next();

    // Add security headers to all responses
    addSecurityHeaders(response);

    return response;
  };
}

/**
 * Security headers for API routes specifically
 */
export function addApiSecurityHeaders(response: NextResponse): NextResponse {
  // Standard security headers
  addSecurityHeaders(response);

  // API-specific headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // API rate limiting headers (will be overridden by actual rate limiting)
  response.headers.set('X-RateLimit-Limit', '1000');
  response.headers.set('X-RateLimit-Remaining', '999');
  response.headers.set('X-RateLimit-Reset', Math.ceil(Date.now() / 1000 + 3600).toString());

  // Cache control for API responses
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}

/**
 * Security headers for static assets
 */
export function addStaticAssetHeaders(
  response: NextResponse,
  assetType: 'js' | 'css' | 'image' | 'font'
): NextResponse {
  // Base security headers
  addSecurityHeaders(response);

  // Asset-specific caching headers
  switch (assetType) {
    case 'js':
    case 'css':
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      break;
    case 'image':
      response.headers.set('Cache-Control', 'public, max-age=86400');
      break;
    case 'font':
      response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      response.headers.set('Access-Control-Allow-Origin', '*');
      break;
  }

  return response;
}

/**
 * Validate security headers are properly set
 */
export function validateSecurityHeaders(response: Response): {
  valid: boolean;
  missing: string[];
  present: string[];
} {
  const enabledHeaders = securityHeaders.filter(shouldEnableHeader).map((config) => config.name);

  const present: string[] = [];
  const missing: string[] = [];

  for (const headerName of enabledHeaders) {
    if (response.headers.get(headerName)) {
      present.push(headerName);
    } else {
      missing.push(headerName);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    present,
  };
}

/**
 * Get security header configuration for monitoring
 */
export function getSecurityHeaderStatus(): {
  configured: number;
  enabled: number;
  disabled: number;
  environment: string;
  headers: Array<{
    name: string;
    enabled: boolean;
    description: string;
    environmentSpecific?: boolean;
  }>;
} {
  const currentEnv = process.env.NODE_ENV || 'development';
  const configured = securityHeaders.length;
  const enabled = securityHeaders.filter(shouldEnableHeader).length;
  const disabled = configured - enabled;

  return {
    configured,
    enabled,
    disabled,
    environment: currentEnv,
    headers: securityHeaders.map((config) => ({
      name: config.name,
      enabled: shouldEnableHeader(config),
      description: config.description,
      environmentSpecific: config.environments ? config.environments.includes(currentEnv) : false,
    })),
  };
}

/**
 * Custom CSP builder for dynamic content
 */
export function buildCSP(options: {
  allowStripe?: boolean;
  allowRazorpay?: boolean;
  allowExternalImages?: boolean;
  allowCustomScripts?: string[];
  isProduction?: boolean;
}): string {
  const baseDirectives = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline'",
    "font-src 'self'",
    "img-src 'self'",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ];

  if (options.allowStripe) {
    baseDirectives[1] += ' https://js.stripe.com';
    baseDirectives[6] += ' https://api.stripe.com';
    baseDirectives[3] += ' https://stripe.com';
  }

  if (options.allowRazorpay) {
    baseDirectives[1] += ' https://checkout.razorpay.com';
    baseDirectives[6] += ' https://api.razorpay.com';
  }

  if (options.allowExternalImages) {
    baseDirectives[4] += ' https: data:';
  }

  if (options.allowCustomScripts) {
    baseDirectives[1] += ' ' + options.allowCustomScripts.join(' ');
  }

  if (options.isProduction) {
    baseDirectives.push('upgrade-insecure-requests');
  }

  return baseDirectives.join('; ');
}

export default {
  addSecurityHeaders,
  addApiSecurityHeaders,
  addStaticAssetHeaders,
  createSecurityHeadersMiddleware,
  validateSecurityHeaders,
  getSecurityHeaderStatus,
  buildCSP,
  securityHeaders,
};
