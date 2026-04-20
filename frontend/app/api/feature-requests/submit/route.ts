/**
 * Feature Request Submission API Route
 *
 * POST /api/feature-requests/submit
 *
 * Handles feature request submissions:
 * 1. Validates authentication
 * 2. Validates input data
 * 3. Saves to database
 * 4. Sends email notification to admin
 *
 * @requires Authentication
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { featureRequestSubmissionSchema } from '@/lib/schemas/feedbackSchemas';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
  try {
    // ========================================================================
    // 1. Authenticate user
    // ========================================================================
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required. Please sign in to submit a feature request.',
        },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. Parse and validate request body
    // ========================================================================
    const body = await request.json();
    const validatedData = featureRequestSubmissionSchema.parse(body);

    // ========================================================================
    // 3. Insert feature request into database
    // ========================================================================
    const { data: featureRequest, error: dbError } = await supabase
      .from('feature_requests')
      .insert({
        user_id: user.id,
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        priority_from_user: validatedData.priorityFromUser,
        user_email: validatedData.userEmail || null,
        user_agent: validatedData.userAgent || request.headers.get('user-agent') || null,
        status: 'submitted',
        vote_count: 0,
      })
      .select('id')
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to save feature request. Please try again.',
        },
        { status: 500 }
      );
    }

    // ========================================================================
    // 4. Send email notification (non-blocking)
    // ========================================================================
    const emailData = {
      requestId: featureRequest.id,
      userId: user.id,
      userEmail: user.email,
      title: validatedData.title,
      description: validatedData.description,
      category: validatedData.category,
      priority: validatedData.priorityFromUser,
      contactEmail: validatedData.userEmail,
      timestamp: new Date().toISOString(),
    };

    // Send email asynchronously (don't await to avoid blocking response)
    fetch(`${request.nextUrl.origin}/api/feature-requests/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({ error: 'Unknown error' }));
          console.error('[FEATURE REQUEST] Email API returned error:', res.status, errorData);
        } else {
          const successData = await res.json();
          console.log('[FEATURE REQUEST] Email sent successfully:', successData);
        }
      })
      .catch((error) => {
        console.error('[FEATURE REQUEST] Failed to call email API:', error);
        // Don't fail the request if email fails
      });

    // ========================================================================
    // 5. Return success response
    // ========================================================================
    return NextResponse.json(
      {
        success: true,
        data: {
          id: featureRequest.id,
          message:
            'Thank you for your feature request! We review all requests and prioritize based on community feedback.',
        },
      },
      { status: 201 }
    );
  } catch (error) {
    // ========================================================================
    // Error handling
    // ========================================================================
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid input data',
          details: error.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        },
        { status: 400 }
      );
    }

    console.error('Unexpected error in feature request submission:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred. Please try again later.',
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// OPTIONS handler for CORS preflight
// ============================================================================
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200 });
}
