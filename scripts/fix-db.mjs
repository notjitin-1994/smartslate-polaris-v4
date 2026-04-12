import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres.hxxvxsmengeoazuywpjm:Vtvt%21123jitin@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL);

async function run() {
  console.log("Creating messages table...");
  await sql`
    CREATE TABLE IF NOT EXISTS "messages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "starmap_id" uuid NOT NULL,
      "role" text NOT NULL,
      "parts" jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "messages_starmap_id_starmaps_id_fk" FOREIGN KEY ("starmap_id") REFERENCES "public"."starmaps"("id") ON DELETE cascade ON UPDATE no action
    );
  `;
  console.log("Migration successful");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
