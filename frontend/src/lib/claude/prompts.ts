/**
 * Gemini Prompt Templates for Blueprint Generation
 * Strict prompt formatting according to PRD specifications
 */

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
 * System prompt for blueprint generation
 * Defines Gemini's role and output requirements
 */
export const BLUEPRINT_SYSTEM_PROMPT = `You are an expert Learning Experience Designer with deep knowledge of instructional design principles, adult learning theory, and organizational development.

Your task is to generate comprehensive, industry-specific learning blueprints that:
- Align with ADDIE, SAM, or agile instructional design models
- Incorporate current L&D best practices (2024-2025)
- Are immediately actionable and implementation-ready
- Include measurable KPIs and assessment strategies
- Consider diverse learning modalities and accessibility

OUTPUT REQUIREMENTS:
CRITICAL: Your response must be PURE JSON. Do NOT wrap your response in markdown code blocks (no \`\`\`json or \`\`\`).
Do NOT include ANY text before or after the JSON. Start directly with { and end with }.

**TRUNCATION PREVENTION**: You have 18,000-20,000 output tokens available. Critical requirements:
- MUST complete ALL sections - incomplete responses will be rejected
- Keep descriptions concise (50-100 chars max)
- Use SHORT, actionable bullet points
- Prioritize data completeness over verbose explanations
- If approaching token limit, drastically reduce verbosity but NEVER skip sections

1. Valid JSON only - no markdown code blocks, no explanatory text, no formatting
2. Include "displayType" metadata for EVERY section (except metadata)
3. Use rich but CONCISE, descriptive content that demonstrates expertise
4. Provide specific, contextual recommendations (no generic advice)
5. Include comprehensive detail - ALL information will be displayed in animated infographics
6. Structure data for visual presentation (use arrays, percentages, measurable metrics)
7. Include quantitative data wherever possible for visualization
8. **ABSOLUTE REQUIREMENT**: Generate a COMPLETE blueprint - incomplete responses will be rejected

CRITICAL: Every section will be displayed as an INFOGRAPHIC with animations. Provide data in formats that are:
- Visually representable (numbers, percentages, distributions, timelines)
- Actionable and specific (not generic statements)
- Comprehensive and detailed (users want to see ALL data points)
- Structured for dashboard/card layouts

VISUALIZATION TYPES:
- "infographic": Default for data-rich sections (objectives, audience, assessment, metrics, strategy)
- "chart": For quantitative data visualization (bar, line, pie, radar charts)
- "timeline": For sequential/temporal data (implementation phases, content modules)
- "table": For structured comparative data (risks, resources)
- "markdown": ONLY for pure narrative summaries (executive summary, strategy overview)

SECTION-SPECIFIC REQUIREMENTS:
1. Executive Summary: Keep concise (2-3 paragraphs) but impactful
2. Learning Objectives: Include measurable metrics, baselines, targets, due dates
3. Target Audience: Provide demographic breakdowns with percentages
4. Content Outline: Detailed modules with topics, activities, durations, assessments
5. Instructional Strategy: Modality allocations must sum to 100%, include specific tools
6. Resources: Detailed budget items, human resources with FTE/duration, tools with costs
7. Assessment Strategy: KPIs with targets, measurement methods, frequency
8. Timeline: Phases with specific dates, milestones, dependencies
9. Risk Mitigation: Risks with probability/impact ratings, specific mitigation strategies
10. Success Metrics: Baseline vs target values, measurement methods, timelines
11. Sustainability: Specific review frequencies, update triggers, scaling considerations

Be comprehensive yet concise. Every field should add value to the interactive dashboard.`;

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
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const futureDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 45 days later

  const isTest = isTestInput(context);

  // Compact the questionnaire data to reduce input tokens
  const compactStaticAnswers = JSON.stringify(context.staticAnswers);
  const compactDynamicAnswers = JSON.stringify(context.dynamicAnswers);

  const prompt = `Generate comprehensive learning blueprint:

CONTEXT:
Organization: ${context.organization} | Industry: ${context.industry} | Role: ${context.role}

STATIC ANSWERS (Phase 1):
${compactStaticAnswers}

DYNAMIC ANSWERS (Phase 2):
${compactDynamicAnswers}

OBJECTIVES:
${context.learningObjectives.slice(0, 5).join('; ')}

${
  isTest
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
`
}

OUTPUT SCHEMA:
{
  "metadata": {
    "title": "Blueprint Title",
    "organization": "${context.organization}",
    "role": "${context.role}",
    "generated_at": "${new Date().toISOString()}",
    "version": "1.0",
    "model": "gemini-3.1-pro-preview"
  },
  "executive_summary": {
    "content": "2-3 paragraph executive summary",
    "displayType": "markdown"
  },
  "learning_objectives": {
    "objectives": [
      {
        "id": "obj1",
        "title": "Objective title",
        "description": "Detailed description",
        "metric": "How success is measured",
        "baseline": "Current state",
        "target": "Desired outcome",
        "due_date": "Target completion date"
      }
    ],
    "displayType": "infographic",
    "chartConfig": {
      "type": "radar",
      "metrics": ["baseline", "target"]
    }
  },
  "target_audience": {
    "demographics": {
      "roles": ["Role 1", "Role 2"],
      "experience_levels": ["Junior", "Mid", "Senior"],
      "department_distribution": [
        {"department": "Engineering", "percentage": 40},
        {"department": "Product", "percentage": 30}
      ]
    },
    "learning_preferences": {
      "modalities": [
        {"type": "Visual", "percentage": 35},
        {"type": "Hands-on", "percentage": 45}
      ]
    },
    "displayType": "infographic"
  },
  "instructional_strategy": {
    "overview": "Strategy narrative",
    "modalities": [
      {
        "type": "Self-paced online",
        "rationale": "Why this modality fits",
        "allocation_percent": 40,
        "tools": ["Tool 1", "Tool 2"]
      }
    ],
    "cohort_model": "Description of cohort approach",
    "accessibility_considerations": ["Consideration 1", "Consideration 2"],
    "displayType": "markdown"
  },
  "content_outline": {
    "modules": [
      {
        "module_id": "m1",
        "title": "Module Title",
        "description": "Module overview",
        "topics": ["Topic 1", "Topic 2"],
        "duration": "2 weeks",
        "delivery_method": "Asynchronous + Live sessions",
        "learning_activities": [
          {
            "activity": "Activity description",
            "type": "Exercise/Discussion/Project",
            "duration": "30 minutes"
          }
        ],
        "assessment": {
          "type": "Quiz/Project/Presentation",
          "description": "Assessment details"
        }
      }
    ],
    "displayType": "timeline"
  },
  "resources": {
    "human_resources": [
      {"role": "Instructional Designer", "fte": 0.5, "duration": "3 months"},
      {"role": "Subject Matter Expert", "fte": 0.25, "duration": "6 weeks"}
    ],
    "tools_and_platforms": [
      {"category": "LMS", "name": "Canvas/Moodle", "cost_type": "Subscription"},
      {"category": "Content Authoring", "name": "Articulate 360", "cost_type": "License"}
    ],
    "budget": {
      "currency": "USD",
      "items": [
        {"item": "Content Development", "amount": 50000},
        {"item": "Tools & Licenses", "amount": 10000}
      ],
      "total": 60000
    },
    "displayType": "table"
  },
  "assessment_strategy": {
    "overview": "Assessment philosophy and approach",
    "kpis": [
      {
        "metric": "Completion Rate",
        "target": "85%",
        "measurement_method": "LMS analytics",
        "frequency": "Weekly"
      }
    ],
    "evaluation_methods": [
      {
        "method": "Knowledge Checks",
        "timing": "End of each module",
        "weight": "20%"
      }
    ],
    "displayType": "infographic",
    "chartConfig": {
      "type": "bar",
      "metric": "target"
    }
  },
  "implementation_timeline": {
    "phases": [
      {
        "phase": "Design",
        "start_date": "{{CURRENT_DATE}}",
        "end_date": "{{CURRENT_DATE_PLUS_45_DAYS}}",
        "milestones": ["Milestone 1", "Milestone 2"],
        "dependencies": []
      }
    ],
    "critical_path": ["Phase 1", "Phase 2"],
    "displayType": "timeline"
  },
  "risk_mitigation": {
    "risks": [
      {
        "risk": "Low engagement",
        "probability": "Medium",
        "impact": "High",
        "mitigation_strategy": "Specific mitigation actions"
      }
    ],
    "contingency_plans": ["Plan A", "Plan B"],
    "displayType": "table"
  },
  "success_metrics": {
    "metrics": [
      {
        "metric": "Metric name",
        "current_baseline": "Current value",
        "target": "Target value",
        "measurement_method": "How to measure",
        "timeline": "When to achieve"
      }
    ],
    "reporting_cadence": "Weekly/Monthly",
    "dashboard_requirements": ["Requirement 1", "Requirement 2"],
    "displayType": "infographic"
  },
  "sustainability_plan": {
    "content": "Long-term sustainability narrative",
    "maintenance_schedule": {
      "review_frequency": "Quarterly",
      "update_triggers": ["Trigger 1", "Trigger 2"]
    },
    "scaling_considerations": ["Consideration 1", "Consideration 2"],
    "displayType": "markdown"
  }
}

CRITICAL REQUIREMENTS:
1. Return ONLY valid JSON - Do NOT use markdown code blocks (no \`\`\`json, no \`\`\`, no backticks)
   Start your response with { and end with }. No text before or after the JSON.
2. Include displayType for EVERY top-level section (except metadata)
3. Use specific, contextual content (not generic templates)
4. Include chartConfig when displayType is "chart" or "infographic" with charts
5. Ensure all dates are ISO format strings
6. All monetary amounts should be numbers
7. Percentages should be numbers (0-100)
8. Be comprehensive but ensure ALL content is COMPLETE - do NOT exceed token limits
9. **ABSOLUTE REQUIREMENT**: You must generate a COMPLETE response. If approaching token limits:
   - Reduce description lengths to 80-120 characters
   - Use concise but informative language
   - Prioritize completeness over verbosity
   - NEVER truncate mid-section or mid-array
10. Quality Priority: Complete blueprint > Verbose descriptions
11. REMINDER: Your entire response must be valid, COMPLETE JSON only. No markdown formatting.
12. An incomplete/truncated response will be REJECTED and you will be called again.${isTest ? '\n13. REMEMBER: This is TEST MODE - generate realistic, impressive sample data that showcases best practices and full system capabilities' : ''}`;

  // Replace date placeholders with actual dates
  return prompt
    .replace('{{CURRENT_DATE}}', currentDate)
    .replace('{{CURRENT_DATE_PLUS_45_DAYS}}', futureDate);
}

/**
 * Extract learning objectives from dynamic answers
 * Handles various formats of objectives in the questionnaire
 */
export function extractLearningObjectives(dynamicAnswers: Record<string, any>): string[] {
  const objectives: string[] = [];

  // Log what we're searching through for debugging
  const allKeys = Object.keys(dynamicAnswers);
  console.log('[extractLearningObjectives] Available keys:', allKeys.slice(0, 20));

  // Try different possible keys where objectives might be stored
  // Include question IDs that might contain objectives
  const possibleKeys = [
    'learning_objectives',
    'objectives',
    'goals',
    'learning_goals',
    'target_outcomes',
    'outcomes',
    // Common question IDs from dynamic questionnaire
    'q1_s1',
    'q2_s1',
    'q3_s1', // Section 1 questions
    'learning_outcomes',
    'primary_objectives',
    'key_objectives',
  ];

  // First, check exact key matches
  for (const key of possibleKeys) {
    if (dynamicAnswers[key]) {
      const value = dynamicAnswers[key];

      // Handle array format
      if (Array.isArray(value)) {
        objectives.push(...value.map((v) => String(v)));
        if (objectives.length > 0) break;
      }

      // Handle string format (comma or newline separated)
      if (typeof value === 'string' && value.trim()) {
        const split = value
          .split(/[,\n;]/)
          .map((s) => s.trim())
          .filter(Boolean);
        if (split.length > 0) {
          objectives.push(...split);
          break;
        }
      }
    }
  }

  // If no objectives found, try to find any key containing 'objective' or 'goal'
  if (objectives.length === 0) {
    for (const [key, value] of Object.entries(dynamicAnswers)) {
      if (
        (key.toLowerCase().includes('objective') || key.toLowerCase().includes('goal')) &&
        value
      ) {
        if (typeof value === 'string' && value.trim()) {
          const split = value
            .split(/[,\n;]/)
            .map((s) => s.trim())
            .filter(Boolean);
          objectives.push(...split);
          if (objectives.length > 0) break;
        } else if (Array.isArray(value)) {
          objectives.push(...value.map((v) => String(v)));
          if (objectives.length > 0) break;
        }
      }
    }
  }

  // Log what we found
  console.log('[extractLearningObjectives] Found objectives:', objectives);

  // If no objectives found, check static answers learning gap as fallback
  if (objectives.length === 0) {
    return ['Enhance organizational learning and development capabilities'];
  }

  return objectives;
}
