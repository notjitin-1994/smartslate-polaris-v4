import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const checkEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    console.log('[check-email] API called');
    const body = await request.json();
    console.log('[check-email] Request body:', body);

    // Validate input
    const validationResult = checkEmailSchema.safeParse(body);
    if (!validationResult.success) {
      console.log('[check-email] Validation failed:', validationResult.error);
      return NextResponse.json(
        {
          error: validationResult.error.errors[0].message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;
    console.log('[check-email] Checking email:', email);

    // Use admin client to check if user exists
    const adminClient = getSupabaseAdminClient();
    console.log('[check-email] Admin client created');

    // Check if user already exists using listUsers API
    // We'll search through users to find a matching email
    // Note: This is less efficient but works with all Supabase versions
    try {
      const { data: listResult, error: listError } = await adminClient.auth.admin.listUsers({
        page: 1,
        perPage: 1000, // Get first 1000 users (should be enough for most cases)
      });

      console.log('[check-email] List users result:', {
        hasData: !!listResult,
        userCount: listResult?.users?.length || 0,
        error: listError,
      });

      if (listError) {
        console.error('[check-email] List error:', listError);
        return NextResponse.json(
          {
            error: 'Failed to check email availability',
            code: 'LOOKUP_ERROR',
            details: listError.message,
          },
          { status: 500 }
        );
      }

      // Search for matching email (case-insensitive)
      const exists =
        listResult?.users?.some((user) => user.email?.toLowerCase() === email.toLowerCase()) ||
        false;

      console.log('[check-email] Final result:', { exists, available: !exists });

      return NextResponse.json(
        {
          exists,
          available: !exists,
        },
        { status: 200 }
      );
    } catch (adminError) {
      console.error('[check-email] Admin API error:', adminError);
      return NextResponse.json(
        {
          error: 'Failed to check email availability',
          code: 'ADMIN_API_ERROR',
          details: adminError instanceof Error ? adminError.message : 'Unknown error',
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('[check-email] Unexpected error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
