### Supabase Migrations

This directory contains SQL migrations for the SmartSlate Polaris v3 database schema.

Recommended usage with Supabase CLI:

1. Install CLI (local): `npm i -D supabase` (or use `npx supabase <command>` without installing)
2. Login: `npx supabase login`
3. Link project: `npx supabase link --project-ref <your-project-ref>`
4. Apply migrations: `npx supabase db push` or `npx supabase db reset` (local dev)

Note: Installing the Supabase CLI globally via npm is not supported. For a global binary, use Homebrew (`brew install supabase/tap/supabase`) or the official installer.

Production: apply SQL manually via the Supabase SQL editor or run a CI job that applies these migrations in order.

Files follow an up/down pattern to support rollbacks.


