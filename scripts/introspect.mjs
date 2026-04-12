import postgres from 'postgres';

const DATABASE_URL = "postgresql://postgres.hxxvxsmengeoazuywpjm:Vtvt%21123jitin@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres";
const sql = postgres(DATABASE_URL);

async function run() {
  console.log("Introspecting tables...");
  const tables = await sql`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
  `;
  console.log("Tables:", tables.map(t => t.table_name));

  for (const table of ['starmaps', 'starmap_responses', 'messages']) {
    console.log(`\nColumns for ${table}:`);
    const columns = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = ${table}
    `;
    console.table(columns);
  }
  
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
