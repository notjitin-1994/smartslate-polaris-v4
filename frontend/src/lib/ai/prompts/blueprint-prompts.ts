/**
 * Gemini Prompt Templates for Blueprint Generation
 * Strict prompt formatting according to PRD specifications
 */

import { readFileSync } from 'fs';
import { join } from 'path';

export interface BlueprintContext {
  blueprintId: string;
  userId: string;
  staticAnswers: Record<string, any>;
  dynamicAnswers: Record<string, any>;
  organization: string;
  role: string;
  industry: string;
  learningObjectives: string[];
}

/**
 * Load system prompt for blueprint generation from disk
 */
export function loadBlueprintSystemPrompt(): string {
  try {
    const promptPath = join(process.cwd(), 'src', 'lib', 'ai', 'prompts', 'blueprint-system-v1.txt');
    return readFileSync(promptPath, 'utf8');
  } catch (error) {
    console.error('Failed to load blueprint system prompt:', error);
    throw new Error('Failed to load blueprint system prompt file');
  }
}

/**
 * Detect if the input contains test/placeholder data
 */
function isTestInput(context: BlueprintContext): boolean {
  const testPhrases = [
    'this is a test',
    'test data',
    'assume values',
    'placeholder',
    'sample data',
    'testing the',
    'demo data',
    'example data',
    'test input',
  ];

  const textToCheck = [
    context.organization?.toLowerCase() || '',
    context.role?.toLowerCase() || '',
    context.staticAnswers?.section_3_learning_gap?.learning_gap_description?.toLowerCase() || '',
    JSON.stringify(context.staticAnswers).toLowerCase().substring(0, 500),
  ].join(' ');

  return testPhrases.some((phrase) => textToCheck.includes(phrase));
}

/**
 * Build user prompt for blueprint generation
 * Enhanced version with test detection and structured data presentation
 */
export function buildBlueprintPrompt(context: BlueprintContext): string {
  try {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const futureDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const isTest = isTestInput(context);
    const templatePath = join(process.cwd(), 'src', 'lib', 'ai', 'prompts', 'blueprint-user-v1.txt');
    let template = readFileSync(templatePath, 'utf8');

    // Handle test mode instructions
    const testModeInstructions = isTest
      ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST MODE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

The input data contains test/placeholder text (e.g., "this is a test", "assume values", "testing").
Generate a realistic, comprehensive sample learning blueprint to demonstrate the system's capabilities.

INSTRUCTIONS FOR TEST MODE:
1. **Generate Realistic Sample Data**: Create a believable learning scenario for ${context.industry || 'Technology'} industry
2. **Use Specific Examples**: Include actual tool names (e.g., Articulate 360, Canvas LMS, Slack), methodologies (e.g., ADDIE, Kirkpatrick Model), and industry-specific terms
3. **Create Coherent Narrative**: Ensure all sections relate to a consistent learning challenge (e.g., upskilling engineers on cloud technologies, compliance training for healthcare staff, leadership development)
4. **Include Quantitative Data**: Add realistic numbers, percentages, timelines, and budget figures
5. **Show Best Practices**: Demonstrate expertise by including current L&D best practices (2024-2025)
6. **Make it Impressive**: This is a demo - showcase the full capabilities of the system with rich, detailed content

SAMPLE SCENARIO SUGGESTIONS (choose one that fits the context):
- Technology: "Upskilling 150 software engineers on cloud-native architecture and Kubernetes"
- Healthcare: "HIPAA compliance training for 500 clinical staff across 10 facilities"
- Financial Services: "Leadership development program for 40 mid-level managers"
- Manufacturing: "Safety certification training for 300 floor workers"
- Education: "Digital pedagogy training for 80 university faculty members"

Ensure the generated blueprint is:
- Comprehensive and detailed (use ALL fields in the schema)
- Industry-appropriate with specific terminology
- Actionable and implementation-ready
- Visually rich (optimized for infographic display)
- Professionally written as if created by an expert instructional designer

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
      : `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BLUEPRINT GENERATION INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Using ALL the context above, generate a comprehensive, personalized learning blueprint that:

1. **Deeply Analyzes Context**: Extract and utilize insights from both static and dynamic questionnaire responses
2. **Provides Specific Recommendations**: Reference actual tools, methodologies, and vendors appropriate for ${context.industry} industry
3. **Respects All Constraints**: Consider compliance requirements, budget limits, timeline constraints, and organizational factors from the questionnaires
4. **Maps Dynamic Responses to Blueprint Sections**: 
   - Dynamic Section 1 (Learning Objectives & Outcomes) → learning_objectives section
   - Dynamic Section 2 (Target Audience Analysis) → target_audience section
   - Dynamic Section 3 (Content Scope & Structure) → content_outline section
   - Dynamic Section 4 (Instructional Strategy & Methods) → instructional_strategy section
   - Dynamic Section 5 (Learning Activities & Interactions) → content_outline learning_activities
   - Dynamic Section 6 (Assessment & Evaluation) → assessment_strategy section
   - Dynamic Section 7 (Resources & Materials) → resources section
   - Dynamic Section 8 (Technology & Platform) → resources tools_and_platforms
   - Dynamic Section 9 (Implementation & Rollout) → implementation_timeline section
   - Dynamic Section 10 (Success Metrics & Continuous Improvement) → success_metrics section
5. **Is Quantitative**: Include specific numbers, percentages, dates, budget figures, and measurable targets throughout
6. **Is Actionable**: Provide implementation-ready guidance with concrete next steps, specific tools, and realistic timelines

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;

    const testModeReminder = isTest
      ? '\n13. REMEMBER: This is TEST MODE - generate realistic, impressive sample data that showcases best practices and full system capabilities'
      : '';

    // Replace all placeholders in the template
    return template
      .replace(/{organization}/g, context.organization || 'Unspecified')
      .replace(/{industry}/g, context.industry || 'Unspecified')
      .replace(/{role}/g, context.role || 'Unspecified')
      .replace(/{static_answers}/g, JSON.stringify(context.staticAnswers))
      .replace(/{dynamic_answers}/g, JSON.stringify(context.dynamicAnswers))
      .replace(/{objectives}/g, context.learningObjectives.slice(0, 5).join('; '))
      .replace('{test_mode_instructions}', testModeInstructions)
      .replace('{test_mode_reminder}', testModeReminder)
      .replace('{generated_at}', new Date().toISOString())
      .replace('{current_date}', currentDate)
      .replace('{future_date}', futureDate);
  } catch (error) {
    console.error('Failed to build blueprint prompt:', error);
    throw new Error('Failed to build blueprint user prompt from template');
  }
}


/**
 * Extract learning objectives from dynamic answers
 * Handles various formats of objectives in the questionnaire
 */
export function extractLearningObjectives(dynamicAnswers: Record<string, any>): string[] {
  const objectives: string[] = [];

  // Try different possible keys where objectives might be stored
  const possibleKeys = [
    'learning_objectives',
    'objectives',
    'goals',
    'learning_goals',
    'target_outcomes',
    'outcomes',
    'q1_s1',
    'q2_s1',
    'q3_s1',
    'learning_outcomes',
    'primary_objectives',
    'key_objectives',
  ];

  for (const key of possibleKeys) {
    if (dynamicAnswers[key]) {
      const value = dynamicAnswers[key];
      if (Array.isArray(value)) {
        objectives.push(...value.map((v) => String(v)));
        if (objectives.length > 0) break;
      }
      if (typeof value === 'string' && value.trim()) {
        const split = value.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
        if (split.length > 0) {
          objectives.push(...split);
          break;
        }
      }
    }
  }

  if (objectives.length === 0) {
    for (const [key, value] of Object.entries(dynamicAnswers)) {
      if ((key.toLowerCase().includes('objective') || key.toLowerCase().includes('goal')) && value) {
        if (typeof value === 'string' && value.trim()) {
          const split = value.split(/[,\n;]/).map((s) => s.trim()).filter(Boolean);
          objectives.push(...split);
          if (objectives.length > 0) break;
        } else if (Array.isArray(value)) {
          objectives.push(...value.map((v) => String(v)));
          if (objectives.length > 0) break;
        }
      }
    }
  }

  if (objectives.length === 0) {
    return ['Enhance organizational learning and development capabilities'];
  }

  return objectives;
}
