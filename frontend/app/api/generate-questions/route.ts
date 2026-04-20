/**
 * Generate Questions API - Redirect to New Implementation
 *
 * This route has been migrated to use the new dynamic question generation system.
 * The new endpoint is at /api/generate-dynamic-questions
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect all requests to the new dynamic question generation endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the request body
    const body = await request.json();

    // Forward the request to the new endpoint
    const newUrl = new URL('/api/generate-dynamic-questions', request.url);

    const response = await fetch(newUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Question generation failed', details: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Generate Questions] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Get method - return information about the migration
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'This endpoint has been migrated to the new dynamic question generation system',
    newEndpoint: '/api/generate-dynamic-questions',
    status: 'migrated',
  });
}

// Allow long-running question generation
export const maxDuration = 800;
