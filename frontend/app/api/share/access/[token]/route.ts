/**
 * Public Share Access API with Rate Limiting and Analytics
 * POST /api/share/access/[token] - Access shared blueprint
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import { headers } from 'next/headers';
import crypto from 'crypto';
import { z } from 'zod';
import type { ValidateShareAccessResponse } from '@/types/share';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Initialize rate limiter (requires Upstash Redis)
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'), // 10 requests per minute
  analytics: true,
});

// Request validation schema
const accessSchema = z.object({
  password: z.string().optional(),
  email: z.string().email().optional(),
  visitorId: z.string().optional(),
  userAgent: z
    .object({
      browser: z.string().optional(),
      browserVersion: z.string().optional(),
      os: z.string().optional(),
      osVersion: z.string().optional(),
      deviceType: z.enum(['desktop', 'mobile', 'tablet', 'unknown']).optional(),
    })
    .optional(),
  location: z
    .object({
      countryCode: z.string().optional(),
      region: z.string().optional(),
    })
    .optional(),
  referrer: z
    .object({
      source: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
});

/**
 * Hash IP address for privacy-preserving analytics
 */
function hashIP(ip: string): string {
  return crypto
    .createHash('sha256')
    .update(ip + process.env.IP_SALT || 'default-salt')
    .digest('hex')
    .substring(0, 16);
}

/**
 * Generate visitor ID from request data
 */
function generateVisitorId(req: NextRequest): string {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || '';
  const acceptLanguage = headersList.get('accept-language') || '';

  const visitorString = `${userAgent}-${acceptLanguage}-${Date.now()}`;
  return crypto.createHash('sha256').update(visitorString).digest('hex').substring(0, 24);
}

/**
 * POST /api/share/access/[token]
 * Validate access and track analytics for shared blueprint
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
): Promise<NextResponse> {
  try {
    const { token } = await params;

    // Get client IP for rate limiting
    const headersList = headers();
    const forwardedFor = headersList.get('x-forwarded-for');
    const realIp = headersList.get('x-real-ip');
    const ip = forwardedFor?.split(',')[0] || realIp || 'unknown';

    // Apply rate limiting
    const identifier = `share_access_${ip}`;
    const { success: rateLimitOk, limit, reset, remaining } = await ratelimit.limit(identifier);

    if (!rateLimitOk) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': remaining.toString(),
            'X-RateLimit-Reset': new Date(reset).toISOString(),
          },
        }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validationResult = accessSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: validationResult.error.errors,
        },
        { status: 400 }
      );
    }

    const accessData = validationResult.data;

    // Create Supabase client with anon key for public access
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if token is a custom slug or regular token
    const isSlug = !token.includes('_') && token.length < 32;

    // Get share link
    const query = supabase
      .from('share_links')
      .select('*')
      .eq(isSlug ? 'share_slug' : 'share_token', token)
      .eq('is_active', true)
      .single();

    const { data: shareLink, error: fetchError } = await query;

    if (fetchError || !shareLink) {
      return NextResponse.json(
        { success: false, error: 'Invalid or inactive share link' },
        { status: 404 }
      );
    }

    // Check expiration
    if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
      // Mark as expired
      await supabase.from('share_links').update({ is_active: false }).eq('id', shareLink.id);

      return NextResponse.json(
        { success: false, error: 'Share link has expired' },
        { status: 403 }
      );
    }

    // Check max views
    if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
      return NextResponse.json(
        { success: false, error: 'Maximum views reached for this share link' },
        { status: 403 }
      );
    }

    // Validate password if required
    if (shareLink.password_hash) {
      if (!accessData.password) {
        return NextResponse.json(
          {
            success: false,
            requiresPassword: true,
            error: 'Password required',
          } as ValidateShareAccessResponse,
          { status: 401 }
        );
      }

      const passwordValid = await bcrypt.compare(accessData.password, shareLink.password_hash);
      if (!passwordValid) {
        return NextResponse.json({ success: false, error: 'Invalid password' }, { status: 401 });
      }
    }

    // Validate email if required
    if (shareLink.require_email) {
      if (!accessData.email) {
        return NextResponse.json(
          {
            success: false,
            requiresEmail: true,
            error: 'Email required',
          } as ValidateShareAccessResponse,
          { status: 401 }
        );
      }

      // Check email against allowed/blocked lists
      const email = accessData.email.toLowerCase();
      const domain = email.split('@')[1];

      // Check blocked emails
      if (shareLink.blocked_emails?.some((blocked: string) => blocked.toLowerCase() === email)) {
        return NextResponse.json(
          { success: false, error: 'Access denied for this email' },
          { status: 403 }
        );
      }

      // Check allowed emails (if list exists, email must be in it)
      if (shareLink.allowed_emails?.length > 0) {
        const isAllowed = shareLink.allowed_emails.some(
          (allowed: string) => allowed.toLowerCase() === email
        );
        if (!isAllowed) {
          return NextResponse.json(
            { success: false, error: 'Email not authorized' },
            { status: 403 }
          );
        }
      }

      // Check allowed domains (if list exists, domain must be in it)
      if (shareLink.allowed_domains?.length > 0) {
        const isDomainAllowed = shareLink.allowed_domains.some(
          (allowed: string) => allowed.toLowerCase() === domain
        );
        if (!isDomainAllowed) {
          return NextResponse.json(
            { success: false, error: 'Email domain not authorized' },
            { status: 403 }
          );
        }
      }
    }

    // Generate visitor ID
    const visitorId = accessData.visitorId || generateVisitorId(req);
    const ipHash = hashIP(ip);

    // Track view in analytics (via RPC function)
    const { data: trackingResult, error: trackingError } = await supabase.rpc('track_share_view', {
      p_share_token: shareLink.share_token,
      p_visitor_id: visitorId,
      p_visitor_email: accessData.email || null,
      p_ip_hash: ipHash,
      p_user_agent: accessData.userAgent || null,
      p_location: accessData.location || null,
      p_referrer: accessData.referrer || null,
    });

    if (trackingError) {
      console.error('Analytics tracking error:', trackingError);
      // Don't fail the request if analytics fails
    }

    // Parse tracking result
    const result = trackingResult as any;

    if (!result?.success) {
      return NextResponse.json(
        { success: false, error: result?.error || 'Failed to access blueprint' },
        { status: 403 }
      );
    }

    // Prepare response based on permission level
    const response: ValidateShareAccessResponse = {
      success: true,
      permissionLevel: result.permission_level,
      settings: result.settings,
      blueprint: result.blueprint,
    };

    // Set cache headers for public content
    const headers = new Headers();
    if (shareLink.permission_level === 'view' && !shareLink.password_hash) {
      // Cache for 5 minutes for public view-only shares
      headers.set('Cache-Control', 'public, max-age=300, s-maxage=300');
    } else {
      // No cache for protected or editable shares
      headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Add rate limit headers
    headers.set('X-RateLimit-Limit', limit.toString());
    headers.set('X-RateLimit-Remaining', remaining.toString());
    headers.set('X-RateLimit-Reset', new Date(reset).toISOString());

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error('Error accessing share:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
