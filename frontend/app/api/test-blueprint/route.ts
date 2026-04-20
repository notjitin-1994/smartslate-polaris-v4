/**
 * Test Blueprint Creation API
 * Creates a test blueprint with filled static and dynamic answers for UX development
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServiceLogger } from '@/lib/logging';

const logger = createServiceLogger('api');

export const dynamic = 'force-dynamic';

/**
 * POST /api/test-blueprint
 * Creates a test blueprint with complete static and dynamic answers
 */
export async function POST(request: NextRequest): Promise<Response> {
  try {
    // Get authenticated user
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.info('test_blueprint.create.start', 'Creating test blueprint', {
      userId: user.id,
    });

    // Test static answers (V2.0 format)
    const staticAnswers = {
      section_1_role_experience: {
        current_role: 'Learning & Development Manager',
        years_of_experience: '5-10 years',
        industries_worked: ['Technology', 'Healthcare', 'Finance'],
        team_size_range: '11-50',
        budget_available: {
          currency: 'USD',
          amount: 150000,
        },
        technical_skills: [
          'LMS Administration',
          'SCORM/xAPI',
          'Instructional Design Tools',
          'Video Production',
          'Data Analytics',
        ],
      },
      section_2_organization: {
        organization_name: 'TechCorp Learning Solutions',
        organization_size: '1000-5000',
        industry_sector: 'Technology',
        global_regions: ['North America', 'Europe', 'Asia Pacific'],
        compliance_requirements: 'Industry-Specific',
        data_sharing_policy: 'Internal & Partners',
      },
      section_3_learning_gap: {
        gap_description:
          'Upskilling engineering teams on cloud architecture and microservices design patterns',
        total_learners_range: '51-200',
        current_knowledge_level: 3,
        hours_per_week: '6-10',
        learning_location: ['Office/Workplace', 'Home'],
        devices_used: ['Desktop Computer', 'Laptop', 'Tablet'],
        motivation_factors: ['Career Advancement', 'Performance Improvement', 'Industry Trend'],
        learning_deadline: '2025-12-31',
      },
    };

    // Test dynamic questions (10 sections as generated)
    const dynamicQuestions = [
      {
        id: 's1',
        order: 1,
        title: 'Learning Objectives & Outcomes',
        description: 'Define specific, measurable learning outcomes aligned with TechCorp context',
        questions: [
          {
            id: 's1_q1',
            type: 'checkbox_cards',
            label: 'What are your primary learning objectives for this upskilling initiative?',
            options: [
              {
                value: 'knowledge',
                label: 'Knowledge Acquisition',
                description: 'Build understanding of cloud architecture principles',
              },
              {
                value: 'skills',
                label: 'Technical Skills',
                description: 'Hands-on proficiency with AWS/Azure/GCP platforms',
              },
              {
                value: 'performance',
                label: 'Performance Improvement',
                description: 'Measurable improvements in system design quality',
              },
              {
                value: 'innovation',
                label: 'Innovation Capability',
                description: 'Ability to architect novel solutions',
              },
            ],
            required: true,
            helpText: 'Select all objectives that align with your team goals',
            validation: [
              { rule: 'minSelections', value: 1, message: 'Select at least one objective' },
            ],
            metadata: {},
          },
          {
            id: 's1_q2',
            type: 'radio_pills',
            label: "What Bloom's taxonomy level should objectives target?",
            options: [
              { value: 'understand', label: 'Understand', icon: '💡' },
              { value: 'apply', label: 'Apply', icon: '🔧' },
              { value: 'analyze', label: 'Analyze', icon: '🔍' },
              { value: 'evaluate', label: 'Evaluate', icon: '⚖️' },
              { value: 'create', label: 'Create', icon: '🎨' },
            ],
            required: true,
            helpText: 'Choose the cognitive complexity for your learners',
            validation: [{ rule: 'required', value: true, message: 'Select a level' }],
            metadata: {},
          },
          {
            id: 's1_q3',
            type: 'textarea',
            rows: 4,
            maxLength: 500,
            label: 'Describe the specific performance improvements you expect to see',
            placeholder: 'Example: 30% reduction in system design review cycles...',
            required: true,
            helpText: 'Provide measurable outcomes',
            validation: [
              { rule: 'minLength', value: 50, message: 'Provide at least 50 characters' },
              { rule: 'maxLength', value: 500, message: 'Maximum 500 characters' },
            ],
            metadata: {},
          },
        ],
      },
      {
        id: 's2',
        order: 2,
        title: 'Target Audience Analysis',
        description: 'Deep dive into your learner characteristics',
        questions: [
          {
            id: 's2_q1',
            type: 'scale',
            label: 'What is the average technical proficiency level of your learners?',
            scaleConfig: {
              min: 1,
              max: 10,
              step: 1,
              minLabel: 'Beginner',
              maxLabel: 'Expert',
            },
            required: true,
            helpText: 'Rate from 1-10 based on current cloud architecture knowledge',
            validation: [{ rule: 'range', value: [1, 10], message: 'Select 1-10' }],
            metadata: {},
          },
          {
            id: 's2_q2',
            type: 'checkbox_pills',
            label: 'Which learning preferences best represent your team?',
            options: [
              { value: 'visual', label: 'Visual (Videos, Diagrams)' },
              { value: 'reading', label: 'Reading (Documentation)' },
              { value: 'hands_on', label: 'Hands-On (Labs, Projects)' },
              { value: 'discussion', label: 'Discussion (Collaboration)' },
            ],
            required: true,
            helpText: 'Select all that apply',
            validation: [
              { rule: 'minSelections', value: 1, message: 'Select at least one preference' },
            ],
            metadata: {},
          },
        ],
      },
      {
        id: 's3',
        order: 3,
        title: 'Content Scope & Structure',
        description: 'Define content breadth and organization',
        questions: [
          {
            id: 's3_q1',
            type: 'checkbox_cards',
            label: 'Which cloud platforms should be covered in the curriculum?',
            options: [
              {
                value: 'aws',
                label: 'Amazon Web Services (AWS)',
                description: 'EC2, S3, Lambda, RDS, and core services',
              },
              {
                value: 'azure',
                label: 'Microsoft Azure',
                description: 'VMs, Blob Storage, Azure Functions, SQL Database',
              },
              {
                value: 'gcp',
                label: 'Google Cloud Platform',
                description: 'Compute Engine, Cloud Storage, Cloud Functions',
              },
            ],
            required: true,
            helpText: 'Select platforms relevant to your organization',
            validation: [
              { rule: 'minSelections', value: 1, message: 'Select at least one platform' },
            ],
            metadata: {},
          },
          {
            id: 's3_q2',
            type: 'labeled_slider',
            label: 'How many hours per week should be dedicated to hands-on labs?',
            sliderConfig: {
              min: 0,
              max: 10,
              step: 1,
              unit: 'hours',
              markers: [2, 4, 6, 8],
            },
            required: true,
            helpText: 'Adjust based on your team availability',
            validation: [{ rule: 'range', value: [0, 10], message: 'Select 0-10 hours' }],
            metadata: {},
          },
        ],
      },
      {
        id: 's4',
        order: 4,
        title: 'Instructional Strategy',
        description: 'Select pedagogical approaches',
        questions: [
          {
            id: 's4_q1',
            type: 'radio_cards',
            label: 'What content sequencing approach works best for your team?',
            options: [
              {
                value: 'linear',
                label: 'Linear Progression',
                description: 'Step-by-step from basics to advanced',
              },
              {
                value: 'modular',
                label: 'Modular Units',
                description: 'Self-contained topics, flexible order',
              },
              {
                value: 'adaptive',
                label: 'Adaptive Pathways',
                description: 'Personalized based on assessment results',
              },
            ],
            required: true,
            helpText: 'Choose structure that fits your learning model',
            validation: [{ rule: 'required', value: true, message: 'Select one approach' }],
            metadata: {},
          },
        ],
      },
      {
        id: 's5',
        order: 5,
        title: 'Learning Activities',
        description: 'Design engaging interactions',
        questions: [
          {
            id: 's5_q1',
            type: 'toggle_switch',
            label: 'Will you include certification exams in the program?',
            options: [
              { value: 'no', label: 'No' },
              { value: 'yes', label: 'Yes' },
            ],
            required: true,
            helpText: 'Certification adds credibility but increases program duration',
            validation: [{ rule: 'required', value: true, message: 'Select Yes or No' }],
            metadata: {},
          },
        ],
      },
      {
        id: 's6',
        order: 6,
        title: 'Assessment & Evaluation',
        description: 'Plan measurement strategies',
        questions: [
          {
            id: 's6_q1',
            type: 'text',
            label: 'What is the minimum passing score for knowledge assessments?',
            maxLength: 20,
            placeholder: '80%',
            required: true,
            helpText: 'Specify as percentage or point value',
            validation: [{ rule: 'required', value: true, message: 'Provide passing criteria' }],
            metadata: {},
          },
        ],
      },
      {
        id: 's7',
        order: 7,
        title: 'Resources & Budget',
        description: 'Identify learning resources and budget allocation',
        questions: [
          {
            id: 's7_q1',
            type: 'currency',
            currencySymbol: '$',
            min: 0,
            max: 150000,
            label: 'What is the maximum per-learner budget for this initiative?',
            required: true,
            helpText: 'Consider platform costs, instructor time, and materials',
            validation: [
              { rule: 'min', value: 0, message: 'Must be >= 0' },
              { rule: 'max', value: 150000, message: 'Cannot exceed total budget' },
            ],
            metadata: {},
          },
        ],
      },
      {
        id: 's8',
        order: 8,
        title: 'Technology & Platform',
        description: 'Define technical infrastructure',
        questions: [
          {
            id: 's8_q1',
            type: 'number_spinner',
            min: 1,
            max: 52,
            step: 1,
            label: 'How many weeks is the planned program duration?',
            required: true,
            helpText: 'Consider team availability and project timelines',
            validation: [
              { rule: 'min', value: 1, message: 'At least 1 week' },
              { rule: 'max', value: 52, message: 'Maximum 52 weeks (1 year)' },
            ],
            metadata: {},
          },
        ],
      },
      {
        id: 's9',
        order: 9,
        title: 'Implementation & Rollout',
        description: 'Plan deployment strategy',
        questions: [
          {
            id: 's9_q1',
            type: 'checkbox_pills',
            label: 'What communication channels will you use for program announcements?',
            options: [
              { value: 'email', label: 'Email' },
              { value: 'slack', label: 'Slack/Teams' },
              { value: 'intranet', label: 'Company Intranet' },
              { value: 'meetings', label: 'Team Meetings' },
            ],
            required: true,
            helpText: 'Select all channels you will utilize',
            validation: [
              { rule: 'minSelections', value: 1, message: 'Select at least one channel' },
              { rule: 'maxSelections', value: 4, message: 'Select at most 4 channels' },
            ],
            metadata: {},
          },
        ],
      },
      {
        id: 's10',
        order: 10,
        title: 'Success Metrics',
        description: 'Establish KPIs and continuous improvement',
        questions: [
          {
            id: 's10_q1',
            type: 'checkbox_pills',
            label: 'Which KPIs will you track to measure program success?',
            options: [
              { value: 'completion', label: 'Completion Rate' },
              { value: 'engagement', label: 'Learner Engagement' },
              { value: 'performance', label: 'On-the-Job Performance' },
              { value: 'satisfaction', label: 'Learner Satisfaction' },
              { value: 'certification', label: 'Certification Achievement' },
            ],
            required: true,
            helpText: 'Select metrics aligned with business objectives',
            validation: [{ rule: 'minSelections', value: 2, message: 'Select at least 2 KPIs' }],
            metadata: {},
          },
          {
            id: 's10_q2',
            type: 'textarea',
            rows: 5,
            maxLength: 600,
            label: 'Describe your long-term sustainability plan for this learning program',
            placeholder:
              'Example: Quarterly content reviews, annual technology updates, continuous learner feedback integration...',
            required: true,
            helpText: 'Outline processes for maintaining program quality over time',
            validation: [
              { rule: 'minLength', value: 100, message: 'Provide at least 100 characters' },
              { rule: 'maxLength', value: 600, message: 'Maximum 600 characters' },
            ],
            metadata: {},
          },
        ],
      },
    ];

    // Test dynamic answers (matching the questions above)
    const dynamicAnswers = {
      // Section 1
      s1_q1: ['knowledge', 'skills', 'performance'],
      s1_q2: 'apply',
      s1_q3:
        'We expect to see a 30% reduction in system design review cycles, 40% improvement in code quality metrics for cloud-native applications, and 25% faster deployment times for microservices architectures within 6 months of program completion.',

      // Section 2
      s2_q1: 6,
      s2_q2: ['visual', 'hands_on', 'discussion'],

      // Section 3
      s3_q1: ['aws', 'azure'],
      s3_q2: 4,

      // Section 4
      s4_q1: 'modular',

      // Section 5
      s5_q1: 'yes',

      // Section 6
      s6_q1: '80%',

      // Section 7
      s7_q1: 750,

      // Section 8
      s8_q1: 12,

      // Section 9
      s9_q1: ['email', 'slack', 'intranet'],

      // Section 10
      s10_q1: ['completion', 'engagement', 'performance', 'satisfaction'],
      s10_q2:
        'Our sustainability plan includes quarterly content audits to ensure materials reflect current best practices, annual technology stack reviews to update platform-specific content, bi-annual learner surveys for continuous improvement feedback, dedicated L&D team member assigned for ongoing maintenance, integration with quarterly performance reviews to track long-term impact, and partnership with cloud vendors for access to latest training resources and certification programs.',
    };

    // Insert test blueprint
    const { data: blueprint, error: insertError } = await supabase
      .from('blueprint_generator')
      .insert({
        user_id: user.id,
        title: '[TEST] Cloud Architecture Upskilling Program',
        status: 'answering',
        static_answers: staticAnswers,
        dynamic_questions: dynamicQuestions,
        dynamic_answers: dynamicAnswers,
        questionnaire_version: 2,
        completed_steps: {
          static_completed: true,
          dynamic_generated: true,
          dynamic_completed: false,
        },
      })
      .select()
      .single();

    if (insertError) {
      logger.error('test_blueprint.create.error', 'Failed to insert test blueprint', {
        error: insertError.message,
        userId: user.id,
      });
      return NextResponse.json(
        { error: 'Failed to create test blueprint', details: insertError.message },
        { status: 500 }
      );
    }

    logger.info('test_blueprint.create.success', 'Test blueprint created successfully', {
      blueprintId: blueprint.id,
      userId: user.id,
      sectionCount: dynamicQuestions.length,
      answerCount: Object.keys(dynamicAnswers).length,
    });

    return NextResponse.json({
      success: true,
      blueprintId: blueprint.id,
      message: 'Test blueprint created successfully',
      urls: {
        staticQuestionnaire: `/app/(auth)/static-wizard?blueprintId=${blueprint.id}`,
        dynamicQuestionnaire: `/app/(auth)/dynamic-questionnaire/${blueprint.id}`,
        dashboard: `/app/(auth)/dashboard`,
      },
    });
  } catch (error) {
    logger.error('test_blueprint.create.error', 'Unexpected error creating test blueprint', {
      error: error instanceof Error ? error.message : String(error),
    });

    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
