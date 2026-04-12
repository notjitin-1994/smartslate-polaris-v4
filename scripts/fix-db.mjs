import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres.hxxvxsmengeoazuywpjm:Vtvt%21123jitin@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL);

async function run() {
  console.log("Re-creating chat_messages table...");
  await sql`DROP TABLE IF EXISTS "chat_messages" CASCADE`;
  await sql`
    CREATE TABLE IF NOT EXISTS "chat_messages" (
      "id" text PRIMARY KEY NOT NULL,
      "starmap_id" uuid NOT NULL,
      "role" text NOT NULL,
      "parts" jsonb NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL,
      CONSTRAINT "chat_messages_starmap_id_starmaps_id_fk" FOREIGN KEY ("starmap_id") REFERENCES "public"."starmaps"("id") ON DELETE cascade ON UPDATE no action
    );
  `;
  console.log("Migration successful");
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
