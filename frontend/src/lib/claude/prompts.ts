/**
 * Gemini Prompt Templates for Blueprint Generation
 * Enhanced with strategic context intelligence and learning science integration
 */

export interface BlueprintContext {
  blueprintId: string;
  userId: string;
  staticAnswers: Record<string, unknown>;
  dynamicAnswers: Record<string, unknown>;
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
1. Valid JSON only - no markdown, no preamble, no explanatory text
2. Include "displayType" metadata for EVERY section (except metadata)
3. Use rich, descriptive content that demonstrates expertise
4. Provide specific, contextual recommendations (no generic advice)
5. Include comprehensive detail - ALL information will be displayed in animated infographics
6. Structure data for visual presentation (use arrays, percentages, measurable metrics)
7. Include quantitative data wherever possible for visualization

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

Be comprehensive yet concise. Every field should add value to interactive dashboard.`;

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
 * Enhanced version with strategic context intelligence and learning science integration
 */
export function buildBlueprintPrompt(context: BlueprintContext): string {
  const now = new Date();
  const currentDate = now.toISOString().split('T')[0]; // YYYY-MM-DD format
  const futureDate = new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 45 days later

  const isTest = isTestInput(context);

  // Enhanced context analysis functions
  const analyzeStrategicContext = () => {
    const staticAnswers = context.staticAnswers || {};
    const _dynamicAnswers = context.dynamicAnswers || {};

    // Extract key insights from questionnaire data
    const orgSize = staticAnswers.organization_size || 'Unknown';
    const _budgetResponsibility = staticAnswers.budget_responsibility || 'Unknown';
    const teamSize = staticAnswers.team_size || 'Unknown';
    const _industry = context.industry || 'Unknown';
    const _role = context.role || 'Unknown';

    // Assess organizational maturity
    let orgMaturity = 'Startup';
    if (orgSize.includes('1000+') || orgSize.includes('Enterprise')) orgMaturity = 'Enterprise';
    else if (orgSize.includes('100-999') || orgSize.includes('Growth')) orgMaturity = 'Growth';
    else if (orgSize.includes('10-99') || orgSize.includes('Established'))
      orgMaturity = 'Established';

    // Assess learning culture readiness
    const motivationFactors = staticAnswers.motivation_factors || [];
    const learningReadiness = motivationFactors.includes('Career advancement')
      ? 'High'
      : motivationFactors.includes('Skill development')
        ? 'Medium'
        : 'Low';

    // Assess compliance complexity
    const complianceRequirements = staticAnswers.compliance_requirements || [];
    const complianceComplexity =
      complianceRequirements.length > 3
        ? 'High'
        : complianceRequirements.length > 1
          ? 'Medium'
          : 'Low';

    return {
      orgMaturity,
      learningReadiness,
      complianceComplexity,
      primaryBusinessChallenge:
        staticAnswers.learning_gap_description || 'Skill development needed',
      changeManagementCapacity: teamSize.includes('50+') ? 'High' : 'Medium',
    };
  };

  const getIndustryIntelligence = (industry: string) => {
    const industryMap: Record<
      string,
      { bestPractices: string[]; compliance: string[]; competitiveAdvantages: string[] }
    > = {
      Technology: {
        bestPractices: [
          'Agile methodologies',
          'Cloud architecture',
          'DevOps culture',
          'Continuous learning',
        ],
        compliance: ['SOC 2', 'GDPR', 'CCPA', 'Industry certifications'],
        commonGaps: ['Cloud migration skills', 'Security awareness', 'Soft skills development'],
        tools: ['AWS/Azure/GCP', 'Kubernetes', 'Jira', 'Slack', 'GitHub', 'Coursera for Business'],
      },
      Healthcare: {
        bestPractices: [
          'HIPAA compliance',
          'Clinical workflows',
          'Patient safety',
          'Evidence-based practice',
        ],
        compliance: ['HIPAA', 'HITECH', 'Joint Commission', 'State medical boards'],
        commonGaps: ['Electronic health records', 'Patient communication', 'Telehealth skills'],
        tools: ['Epic Systems', 'Cerner', 'HIPAA-compliant LMS', 'Medical simulation platforms'],
      },
      'Financial Services': {
        bestPractices: [
          'Risk management',
          'Regulatory compliance',
          'Financial modeling',
          'Audit trails',
        ],
        compliance: ['SOX', 'FINRA', 'PCI DSS', 'AML/KYC'],
        commonGaps: ['Regulatory changes', 'Digital transformation', 'Cybersecurity awareness'],
        tools: [
          'Bloomberg Terminal',
          'Regulatory compliance platforms',
          'Risk management software',
        ],
      },
      Manufacturing: {
        bestPractices: [
          'Lean manufacturing',
          'Safety protocols',
          'Quality control',
          'Continuous improvement',
        ],
        compliance: ['OSHA', 'ISO certifications', 'Environmental regulations', 'Safety standards'],
        commonGaps: ['Automation skills', 'Safety training', 'Quality management'],
        tools: ['MES systems', 'Safety training platforms', 'Quality management software'],
      },
    };

    return industryMap[industry] || industryMap['Technology'];
  };

  const getLearningScienceInsights = () => {
    const staticAnswers = context.staticAnswers || {};
    const currentKnowledge = parseInt(staticAnswers.current_knowledge_level) || 3;
    const hoursPerWeek = staticAnswers.hours_per_week || '2-4 hours';
    const motivationFactors = staticAnswers.motivation_factors || [];

    return {
      cognitiveLoad:
        currentKnowledge <= 2 ? 'High scaffolding needed' : 'Moderate complexity acceptable',
      retentionStrategy: hoursPerWeek.includes('1-2')
        ? 'Microlearning with frequent reinforcement'
        : 'Comprehensive modules with spaced repetition',
      motivationArchitecture: motivationFactors.includes('Career advancement')
        ? 'Goal-oriented with clear progression paths'
        : 'Intrinsic motivation with mastery focus',
      skillTransferContext: 'Immediate application opportunities with real-world projects',
    };
  };

  const strategicContext = analyzeStrategicContext();
  const industryIntelligence = getIndustryIntelligence(context.industry);
  const learningScience = getLearningScienceInsights();

  const prompt = `Generate a comprehensive learning blueprint based on following inputs:

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 STRATEGIC CONTEXT SYNTHESIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Primary Business Challenge: ${strategicContext.primaryBusinessChallenge}
Organizational Maturity Level: ${strategicContext.orgMaturity}
Learning Culture Readiness: ${strategicContext.learningReadiness}
Compliance Complexity: ${strategicContext.complianceComplexity}
Change Management Capacity: ${strategicContext.changeManagementCapacity}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🏭 INDUSTRY-SPECIFIC INTELLIGENCE FOR ${context.industry}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Industry Best Practices:
${industryIntelligence.bestPractices.map((practice: string) => `- ${practice}`).join('\n')}

Regulatory Compliance Requirements:
${industryIntelligence.compliance.map((req: string) => `- ${req}`).join('\n')}

Common Skill Gaps & Solutions:
${industryIntelligence.commonGaps.map((gap: string) => `- ${gap}`).join('\n')}

Industry-Standard Tools & Platforms:
${industryIntelligence.tools.map((tool: string) => `- ${tool}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧠 LEARNING SCIENCE FRAMEWORK
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Evidence-Based Design Principles:
- Cognitive Load Considerations: ${learningScience.cognitiveLoad}
- Retention Strategy: ${learningScience.retentionStrategy}
- Motivation Architecture: ${learningScience.motivationArchitecture}
- Skill Transfer Context: ${learningScience.skillTransferContext}

Neuroscience Considerations:
- Attention Span Optimization: Content chunking based on learner profile
- Memory Consolidation: Spaced repetition with increasing intervals
- Motivation Neuroscience: Dopamine-driven achievement systems
- Social Learning Integration: Peer-to-peer knowledge transfer mechanisms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 RAW INPUT DATA
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ORGANIZATION CONTEXT:
- Organization: ${context.organization}
- Industry: ${context.industry}
- Role: ${context.role}

STATIC QUESTIONNAIRE ANSWERS:
${JSON.stringify(context.staticAnswers, null, 2)}

DYNAMIC QUESTIONNAIRE ANSWERS:
${JSON.stringify(context.dynamicAnswers, null, 2)}

PRIMARY LEARNING OBJECTIVES:
${context.learningObjectives.map((obj, i) => `${i + 1}. ${obj}`).join('\n')}

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
🚀 IMPLEMENTATION INTELLIGENCE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Change Management Strategy:
- Stakeholder Mapping: Based on organizational structure and role hierarchy
- Communication Plan: Tailored to ${strategicContext.orgMaturity} organization culture
- Risk Mitigation: Address ${strategicContext.complianceComplexity} compliance complexity
- Success Metrics: Business-aligned KPIs with measurable ROI

Resource Optimization:
- Budget Allocation Strategy: Optimize for ${strategicContext.changeManagementCapacity} change management capacity
- Technology Stack Recommendations: Industry-appropriate, scalable, and compliant
- Human Resource Planning: FTE calculations based on team size and timeline
- Vendor Selection Criteria: Compliance-first with integration capabilities

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📋 BLUEPRINT GENERATION INSTRUCTIONS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Using ALL context above, generate a comprehensive, personalized learning blueprint that:

1. **Strategic Business Alignment**: Directly address the primary business challenge with measurable business impact
2. **Industry-Specific Expertise**: Apply ${context.industry} best practices, compliance requirements, and industry-standard tools
3. **Learning Science Integration**: Embed evidence-based principles for optimal knowledge retention and skill transfer
4. **Data-Driven Personalization**: Use learner analytics and predictive insights for adaptive learning paths
5. **Implementation Intelligence**: Provide change management strategies optimized for ${strategicContext.orgMaturity} organizations
6. **Quantitative Precision**: Include specific metrics, timelines, budgets, and measurable targets throughout
7. **Actionable Roadmap**: Deliver implementation-ready guidance with concrete next steps and resource requirements

SECTION MAPPING REQUIREMENTS:
- Dynamic Section 1 (Learning Objectives & Outcomes) → learning_objectives section with business-aligned metrics
- Dynamic Section 2 (Target Audience Analysis) → target_audience section with demographic insights
- Dynamic Section 3 (Content Scope & Structure) → content_outline section with learning science principles
- Dynamic Section 4 (Instructional Strategy & Methods) → instructional_strategy section with industry-specific modalities
- Dynamic Section 5 (Learning Activities & Interactions) → content_outline learning_activities with engagement strategies
- Dynamic Section 6 (Assessment & Evaluation) → assessment_strategy section with Kirkpatrick's Four Levels
- Dynamic Section 7 (Resources & Materials) → resources section with industry-standard tools
- Dynamic Section 8 (Technology & Platform) → resources tools_and_platforms with compliance considerations
- Dynamic Section 9 (Implementation & Rollout) → implementation_timeline section with change management
- Dynamic Section 10 (Success Metrics & Continuous Improvement) → success_metrics section with business ROI

QUALITY STANDARDS:
- World-Class: Demonstrate expertise comparable to top-tier L&D consultancies
- Brand-Aligned: Reflect ${context.organization} values and culture
- Industry-Leading: Incorporate cutting-edge practices and innovations
- Valuable: Deliver measurable business impact and ROI
- Relevant: Address specific organizational challenges and constraints
- Actionable: Provide immediate implementation steps with clear guidance
- Useful: Create practical solutions that solve real business problems

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`
}

OUTPUT SCHEMA:
{
  "metadata": {
    "title": "Generate a concise, professional title for this learning blueprint based on the organization, role, industry, and learning objectives. Keep it under 60 characters and make it specific and actionable.",
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
1. Return ONLY valid JSON (no markdown code fences, no explanatory text)
2. Include displayType for EVERY top-level section (except metadata)
3. Use specific, contextual content (not generic templates)
4. Include chartConfig when displayType is "chart" or "infographic" with charts
5. Ensure all dates are ISO format strings
6. All monetary amounts should be numbers
7. Percentages should be numbers (0-100)
8. Be comprehensive but avoid unnecessary verbosity${isTest ? '\n9. REMEMBER: This is TEST MODE - generate realistic, impressive sample data that showcases best practices and full system capabilities' : ''}`;

  // Replace date placeholders with actual dates
  return prompt
    .replace('{{CURRENT_DATE}}', currentDate)
    .replace('{{CURRENT_DATE_PLUS_45_DAYS}}', futureDate);
}

/**
 * Extract learning objectives from dynamic answers
 * Handles various formats of objectives in the questionnaire
 */
export function extractLearningObjectives(dynamicAnswers: Record<string, unknown>): string[] {
  const objectives: string[] = [];

  // Try different possible keys where objectives might be stored
  const possibleKeys = [
    'learning_objectives',
    'objectives',
    'goals',
    'learning_goals',
    'target_outcomes',
  ];

  for (const key of possibleKeys) {
    if (dynamicAnswers[key]) {
      const value = dynamicAnswers[key];

      // Handle array format
      if (Array.isArray(value)) {
        objectives.push(...value.map((v) => String(v)));
        break;
      }

      // Handle string format (comma or newline separated)
      if (typeof value === 'string') {
        const split = value
          .split(/[,\n]/)
          .map((s) => s.trim())
          .filter(Boolean);
        objectives.push(...split);
        break;
      }
    }
  }

  // If no objectives found, return a default
  if (objectives.length === 0) {
    return ['Improve team performance and skills'];
  }

  return objectives;
}
