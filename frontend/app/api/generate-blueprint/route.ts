/**
 * Generate Blueprint API - Redirect to Gemini Implementation
 *
 * This route has been migrated to use Gemini AI instead of Ollama.
 * The new endpoint is at /api/claude/generate-blueprint
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Redirect all requests to the new Gemini-based blueprint generation endpoint
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get the request body
    const body = await request.json();

    // Forward the request to the new Gemini endpoint
    const claudeUrl = new URL('/api/claude/generate-blueprint', request.url);

    const response = await fetch(claudeUrl.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Blueprint generation failed', details: response.statusText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('[Generate Blueprint] Error:', error);
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
    message: 'This endpoint has been migrated to use Gemini AI',
    newEndpoint: '/api/claude/generate-blueprint',
    status: 'migrated',
  });
}

// Allow long-running blueprint generation
export const maxDuration = 800;
