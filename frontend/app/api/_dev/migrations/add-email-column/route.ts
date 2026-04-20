import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    console.log('[Admin] Testing email column existence...');

    // Test if email column exists by trying to select it
    const { data: testData, error: testError } = await supabase
      .from('user_profiles')
      .select('email')
      .limit(1);

    if (testError) {
      console.log('[Admin] Email column does not exist, error:', testError.message);

      // Check if it's specifically the "column does not exist" error
      if (
        testError.message?.includes('column "email" does not exist') ||
        testError.code === 'PGRST116'
      ) {
        console.log('[Admin] Confirmed: email column is missing');

        // Since we can't execute DDL directly via the JS client,
        // return a specific message with instructions
        return NextResponse.json(
          {
            error: 'Email column does not exist in remote database',
            details: {
              message:
                'The email column needs to be added manually to the remote Supabase database',
              sql: `ALTER TABLE public.user_profiles ADD COLUMN IF NOT EXISTS email TEXT;
                     CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles(email);
                     COMMENT ON COLUMN public.user_profiles.email IS 'User email address for Razorpay integration';`,
              errorCode: testError.code,
              fixRequired: true,
            },
          },
          { status: 422 } // Unprocessable Entity - indicating schema fix needed
        );
      }
    } else {
      console.log('[Admin] Email column exists and is accessible');
      return NextResponse.json(
        { message: 'Email column already exists and is working' },
        { status: 200 }
      );
    }

    return NextResponse.json({ message: 'Email column test completed' }, { status: 200 });
  } catch (error) {
    console.error('[Admin] Error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
