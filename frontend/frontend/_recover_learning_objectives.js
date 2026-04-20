const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://oyjslszrygcajdpwgxbe.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im95anNsc3pyeWdjYWpkcHdneGJlIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTE0ODI2MSwiZXhwIjoyMDcwNzI0MjYxfQ.ncU_-SZamgKWkjTtSvXCAKpft3HU-FOQMdSv8u-LssQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function recoverLearningObjectives() {
  const blueprintId = 'a141d047-c31f-426a-807b-a26b44ef9c15';

  // Fetch the blueprint
  const { data, error } = await supabase
    .from('blueprint_generator')
    .select('*')
    .eq('id', blueprintId)
    .single();

  if (error) {
    console.error('Error fetching blueprint:', error);
    return;
  }

  console.log('=== EXTRACTING LEARNING OBJECTIVES FROM MARKDOWN ===\n');

  const markdown = data.blueprint_markdown;
  const lines = markdown.split('\n');

  // Find the learning objectives section
  const startIndex = lines.findIndex((line) => line.trim() === '## Learning Objectives');
  if (startIndex === -1) {
    console.error('Could not find Learning Objectives section in markdown');
    return;
  }

  // Find the next ## section (end of learning objectives)
  const endIndex = lines.findIndex((line, idx) => idx > startIndex && line.startsWith('## '));

  const objectivesSection = lines.slice(startIndex, endIndex === -1 ? undefined : endIndex);

  // Parse objectives
  const objectives = [];
  let currentObjective = null;

  for (let i = 1; i < objectivesSection.length; i++) {
    const line = objectivesSection[i].trim();

    if (line.startsWith('### ')) {
      // New objective
      if (currentObjective) {
        objectives.push(currentObjective);
      }
      currentObjective = {
        title: line.replace(/^###\s*\d+\.\s*/, '').trim(),
        description: '',
        metrics: '',
        baseline: '',
        target: '',
        dueDate: '',
      };
    } else if (currentObjective) {
      // Parse content
      if (line && !line.startsWith('**') && !line.startsWith('###')) {
        if (!currentObjective.description) {
          currentObjective.description = line;
        }
      } else if (line.startsWith('**Metric:**')) {
        currentObjective.metrics = line.replace('**Metric:**', '').trim();
      } else if (line.startsWith('**Baseline:**')) {
        const parts = line.split('|');
        currentObjective.baseline = parts[0].replace('**Baseline:**', '').trim();
        if (parts[1]) {
          currentObjective.target = parts[1].replace('**Target:**', '').trim();
        }
      } else if (line.startsWith('**Due Date:**')) {
        currentObjective.dueDate = line.replace('**Due Date:**', '').trim();
      }
    }
  }

  if (currentObjective) {
    objectives.push(currentObjective);
  }

  console.log('Extracted', objectives.length, 'learning objectives:\n');
  objectives.forEach((obj, idx) => {
    console.log(`${idx + 1}. ${obj.title}`);
    console.log(`   Description: ${obj.description}`);
    console.log(`   Due Date: ${obj.dueDate}`);
    console.log();
  });

  // Update the blueprint_json with recovered objectives
  const updatedBlueprint = {
    ...data.blueprint_json,
    learning_objectives: objectives,
  };

  console.log('\n=== UPDATING DATABASE ===\n');

  const { error: updateError } = await supabase
    .from('blueprint_generator')
    .update({
      blueprint_json: updatedBlueprint,
      updated_at: new Date().toISOString(),
    })
    .eq('id', blueprintId);

  if (updateError) {
    console.error('Error updating blueprint:', updateError);
    return;
  }

  console.log('✅ Successfully recovered and updated learning objectives!');
  console.log('\nRecovered objectives have been saved back to the database.');
}

recoverLearningObjectives()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Fatal error:', err);
    process.exit(1);
  });
