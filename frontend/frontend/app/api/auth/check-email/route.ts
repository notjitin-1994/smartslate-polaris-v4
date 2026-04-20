import { NextResponse } from 'next/server';
import { getSupabaseAdminClient } from '@/lib/supabase/server';
import { z } from 'zod';

// Validation schema
const checkEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validationResult = checkEmailSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: validationResult.error.errors[0].message,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const { email } = validationResult.data;

    // Use admin client to check if user exists
    const adminClient = getSupabaseAdminClient();

    // Check if user already exists using admin API
    const { data: existingUserData, error: lookupError } =
      await adminClient.auth.admin.getUserByEmail(email);

    if (lookupError && lookupError.message !== 'User not found') {
      // If there's an error other than "user not found", log it
      console.error('Error checking existing user:', lookupError);
      return NextResponse.json(
        {
          error: 'Failed to check email availability',
          code: 'LOOKUP_ERROR',
        },
        { status: 500 }
      );
    }

    // Check if user exists
    const exists = !!(existingUserData && existingUserData.user);

    return NextResponse.json(
      {
        exists,
        available: !exists,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Check email API error:', error);
    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
