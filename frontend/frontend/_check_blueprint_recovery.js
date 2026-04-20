const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyjslszrygcajdpwgxbe.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anNsc3pyeWdjYWpkcHdneGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE0ODI2MSwiZXhwIjoyMDcwNzI0MjYxfQ.ncU_-SZamgKWkjTtSvXCAKpft3HU-FOQMdSv8u-LssQ';

const supabase = createClient(supabaseUrl, supabaseKey);

/**
* Fetches a specific blueprint from Supabase and logs its current state, JSON content, and markdown excerpts to the console.
* @example
* checkBlueprint()
* // Promise<void> (logs blueprint details to the console)
* @returns {Promise<void>} Resolves after logging blueprint state and content.
*/
async function checkBlueprint() {
  const blueprintId = 'a141d047-c31f-426a-807b-a26b44ef9c15';

  // Check current state
  const { data, error } = await supabase
    .from('blueprint_generator')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (error) {
    console.error('Error fetching blueprint:', error);
    return;
  }

  console.log('=== BLUEPRINT CURRENT STATE ===');
  console.log('ID:', data.id);
  console.log('Status:', data.status);
  console.log('Created:', data.created_at);
  console.log('Updated:', data.updated_at);
  console.log('\n=== BLUEPRINT JSON DATA ===');

  if (data.blueprint_json) {
    const blueprint = data.blueprint_json;
    console.log('Has learning_objectives:', !!blueprint.learning_objectives);
    if (blueprint.learning_objectives) {
      console.log(
        'Learning objectives content:',
        JSON.stringify(blueprint.learning_objectives, null, 2)
      );
    } else {
      console.log('No learning_objectives found in blueprint_json');
    }
  } else {
    console.log('No blueprint_json data');
  }

  console.log('\n=== MARKDOWN DATA ===');
  if (data.blueprint_markdown) {
    const lines = data.blueprint_markdown.split('\n');
    const objectivesIndex = lines.findIndex((line) =>
      line.toLowerCase().includes('learning objective')
    );
    if (objectivesIndex !== -1) {
      console.log('Found learning objectives in markdown at line', objectivesIndex);
      console.log(
        'Excerpt:',
        lines.slice(objectivesIndex, Math.min(objectivesIndex + 20, lines.length)).join('\n')
      );
    } else {
      console.log('No learning objectives found in markdown');
    }
  } else {
    console.log('No markdown data');
  }
}

checkBlueprint()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
