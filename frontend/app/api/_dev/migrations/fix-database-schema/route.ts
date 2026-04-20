import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Import supabase client
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();

    console.log('[Database Fix] Attempting to fix database schema...');

    // First, let's see what columns exist in user_profiles
    const { data: columns, error: columnsError } = await supabase.rpc('exec_sql', {
      sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'user_profiles'
            AND table_schema = 'public'
          ORDER BY ordinal_position;
        `,
    });

    if (columnsError) {
      console.error('[Database Fix] Could not check columns:', columnsError);
    }

    console.log('[Database Fix] Current user_profiles columns:', columns);

    // Check if email column exists
    const emailColumnExists = columns?.some(
      (col: { column_name: string }) => col.column_name === 'email'
    );

    if (!emailColumnExists) {
      console.log('[Database Fix] Email column does not exist, adding it...');

      // Add the email column
      const { data: result, error: addError } = await supabase.rpc('exec_sql', {
        sql: `
            -- Add email column
            ALTER TABLE public.user_profiles
            ADD COLUMN IF NOT EXISTS email TEXT;

            -- Create index
            CREATE INDEX IF NOT EXISTS idx_user_profiles_email
            ON public.user_profiles(email);

            -- Add comment
            COMMENT ON COLUMN public.user_profiles.email
            IS 'User email address for Razorpay integration';
          `,
      });

      if (addError) {
        console.error('[Database Fix] Failed to add email column:', addError);
        return NextResponse.json(
          { error: 'Failed to add email column', details: addError },
          { status: 500 }
        );
      }

      console.log('[Database Fix] Email column added successfully');

      // Verify the column was added
      const { data: verifyColumns, error: verifyError } = await supabase.rpc('exec_sql', {
        sql: `
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'user_profiles'
              AND column_name = 'email'
              AND table_schema = 'public';
          `,
      });

      if (!verifyError && verifyColumns && verifyColumns.length > 0) {
        console.log('[Database Fix] Email column verification successful:', verifyColumns);
        return NextResponse.json(
          {
            message: 'Email column added successfully',
            columnInfo: verifyColumns[0],
          },
          { status: 200 }
        );
      } else {
        console.error('[Database Fix] Email column verification failed:', verifyError);
        return NextResponse.json(
          { error: 'Email column verification failed', details: verifyError },
          { status: 500 }
        );
      }
    } else {
      console.log('[Database Fix] Email column already exists');
      return NextResponse.json({ message: 'Email column already exists' }, { status: 200 });
    }
  } catch (error) {
    console.error('[Database Fix] Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error', details: error }, { status: 500 });
  }
}
