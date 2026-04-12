import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres.hxxvxsmengeoazuywpjm:Vtvt%21123jitin@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL);

async function run() {
  const id = "aa9a944b-1d9a-4a97-8c75-2fce64e3f2d0";
  console.log("Checking for starmap:", id);
  
  const starmaps = await sql`
    SELECT * FROM starmaps WHERE id = ${id}
  `;
  console.log("Starmap found:", starmaps.length > 0);
  if (starmaps.length > 0) {
    console.log("User ID:", starmaps[0].user_id);
  }

  const responses = await sql`
    SELECT count(*) FROM starmap_responses WHERE starmap_id = ${id}
  `;
  console.log("Responses count:", responses[0].count);

  const messages = await sql`
    SELECT count(*) FROM messages WHERE starmap_id = ${id}
  `;
  console.log("Messages count:", messages[0].count);
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
