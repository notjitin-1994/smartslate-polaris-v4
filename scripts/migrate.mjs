import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env.production' });

const sql = postgres(process.env.DATABASE_URL);

async function run() {
  await sql`
    create table if not exists public.user_profiles (
      user_id uuid primary key references auth.users(id) on delete cascade,
      full_name text null,
      avatar_url text null,
      preferences jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  await sql`
    create table if not exists public.notification_preferences (
      user_id uuid primary key references auth.users(id) on delete cascade,
      email_updates boolean not null default true,
      marketing_emails boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    );
  `;
  console.log("Migration successful");
  process.exit(0);
}
run().catch(console.error);