/**
 * Blueprint Test Fixtures
 * Expected blueprint JSON structures with all required sections and display types
 */

export interface BlueprintJSON {
  metadata: {
    title: string;
    organization: string;
    role: string;
    generated_at: string;
    version: string;
    model: string;
  };
  executive_summary: {
    content: string;
    displayType: 'markdown';
  };
  learning_objectives: {
    objectives: Array<{
      id: string;
      title: string;
      description: string;
      metric: string;
      baseline: string;
      target: string;
      due_date: string;
    }>;
    displayType: 'infographic';
    chartConfig?: {
      type: 'radar' | 'bar' | 'line';
      metrics: string[];
    };
  };
  target_audience: {
    demographics: {
      roles: string[];
      experience_levels: string[];
      department_distribution: Array<{
        department: string;
        percentage: number;
      }>;
    };
    learning_preferences: {
      modalities: Array<{
        type: string;
        percentage: number;
      }>;
    };
    displayType: 'infographic';
  };
  instructional_strategy: {
    overview: string;
    modalities: Array<{
      type: string;
      rationale: string;
      allocation_percent: number;
      tools: string[];
    }>;
    cohort_model: string;
    accessibility_considerations: string[];
    displayType: 'markdown';
  };
  content_outline: {
    modules: Array<{
      module_id: string;
      title: string;
      description: string;
      topics: string[];
      duration: string;
      delivery_method: string;
      learning_activities: Array<{
        activity: string;
        type: string;
        duration: string;
      }>;
      assessment: {
        type: string;
        description: string;
      };
    }>;
    displayType: 'timeline';
  };
  resources: {
    human_resources: Array<{
      role: string;
      fte: number;
      duration: string;
    }>;
    tools_and_platforms: Array<{
      category: string;
      name: string;
      cost_type: string;
    }>;
    budget: {
      currency: string;
      items: Array<{
        item: string;
        amount: number;
      }>;
      total: number;
    };
    displayType: 'table';
  };
  assessment_strategy: {
    overview: string;
    kpis: Array<{
      metric: string;
      target: string;
      measurement_method: string;
      frequency: string;
    }>;
    evaluation_methods: Array<{
      method: string;
      timing: string;
      weight: string;
    }>;
    displayType: 'infographic';
    chartConfig?: {
      type: 'bar' | 'radar';
      metric: string;
    };
  };
  implementation_timeline: {
    phases: Array<{
      phase: string;
      start_date: string;
      end_date: string;
      milestones: string[];
      dependencies: string[];
    }>;
    critical_path: string[];
    displayType: 'timeline';
  };
  risk_mitigation: {
    risks: Array<{
      risk: string;
      probability: string;
      impact: string;
      mitigation_strategy: string;
    }>;
    contingency_plans: string[];
    displayType: 'table';
  };
  success_metrics: {
    metrics: Array<{
      metric: string;
      current_baseline: string;
      target: string;
      measurement_method: string;
      timeline: string;
    }>;
    reporting_cadence: string;
    dashboard_requirements: string[];
    displayType: 'infographic';
  };
  sustainability_plan: {
    content: string;
    maintenance_schedule: {
      review_frequency: string;
      update_triggers: string[];
    };
    scaling_considerations: string[];
    displayType: 'markdown';
  };
  _generation_metadata?: {
    model: string;
    timestamp: string;
    fallbackUsed?: boolean;
    attempts?: number;
  };
}

export const validBlueprint: BlueprintJSON = {
  metadata: {
    title: 'Advanced Consultative Selling Skills Development Program',
    organization: 'TechCorp Solutions Inc.',
    role: 'Learning & Development Manager',
    generated_at: '2025-01-15T10:00:00Z',
    version: '1.0',
    model: 'gemini-3.1-pro-preview',
  },
  executive_summary: {
    content:
      "This comprehensive learning blueprint addresses the critical need to enhance the consultative selling capabilities of TechCorp's sales team. The program is designed to transform 51-100 sales professionals from basic product-focused selling to advanced consultative approaches, targeting a 40% improvement in sales effectiveness and a 25% increase in average deal size.\n\nThe 12-week blended learning program combines self-paced online modules, interactive workshops, and real-world practice opportunities. With a budget of $75,000 and support from 5 subject matter experts, the program will deliver measurable ROI through improved customer satisfaction, higher conversion rates, and stronger client relationships.\n\nKey success factors include strong leadership support, dedicated learning time (3-5 hours per week), and integration with existing CRM and sales processes. The phased rollout approach ensures continuous improvement and risk mitigation throughout implementation.",
    displayType: 'markdown',
  },
  learning_objectives: {
    objectives: [
      {
        id: 'obj1',
        title: 'Master Consultative Selling Methodology',
        description:
          'Develop expertise in consultative selling techniques including active listening, questioning strategies, and solution mapping',
        metric: 'Skill assessment scores',
        baseline: '45% average score',
        target: '85% average score',
        due_date: '2025-08-31',
      },
      {
        id: 'obj2',
        title: 'Improve Needs Analysis Accuracy',
        description:
          'Enhance ability to identify and document customer pain points, requirements, and decision criteria',
        metric: 'Customer requirement capture rate',
        baseline: '60% accuracy',
        target: '85% accuracy',
        due_date: '2025-07-31',
      },
      {
        id: 'obj3',
        title: 'Enhance Value Proposition Articulation',
        description: 'Communicate product value in terms of customer business outcomes and ROI',
        metric: 'Deal conversion rate',
        baseline: '20% conversion',
        target: '35% conversion',
        due_date: '2025-09-30',
      },
      {
        id: 'obj4',
        title: 'Build Technical Product Knowledge',
        description:
          'Achieve expert-level understanding of technical product features and integration capabilities',
        metric: 'Technical certification score',
        baseline: 'Not certified',
        target: '90% certified',
        due_date: '2025-07-15',
      },
      {
        id: 'obj5',
        title: 'Strengthen Client Relationships',
        description: 'Develop long-term strategic partnerships with key accounts',
        metric: 'Client retention rate',
        baseline: '75% retention',
        target: '90% retention',
        due_date: '2025-12-31',
      },
    ],
    displayType: 'infographic',
    chartConfig: {
      type: 'radar',
      metrics: ['baseline', 'target'],
    },
  },
  target_audience: {
    demographics: {
      roles: ['Sales Representative', 'Account Manager', 'Business Development Rep'],
      experience_levels: ['Junior (0-2 years)', 'Mid-level (2-5 years)', 'Senior (5+ years)'],
      department_distribution: [
        { department: 'Enterprise Sales', percentage: 40 },
        { department: 'Mid-Market Sales', percentage: 35 },
        { department: 'SMB Sales', percentage: 25 },
      ],
    },
    learning_preferences: {
      modalities: [
        { type: 'Visual Learning', percentage: 35 },
        { type: 'Hands-on Practice', percentage: 45 },
        { type: 'Collaborative Discussion', percentage: 20 },
      ],
    },
    displayType: 'infographic',
  },
  instructional_strategy: {
    overview:
      'The program employs a blended learning approach combining self-paced digital content with instructor-led workshops and peer collaboration. The strategy emphasizes practical application through role-playing, case studies, and real customer scenarios. Microlearning principles ensure content is digestible and immediately applicable.',
    modalities: [
      {
        type: 'Self-paced online modules',
        rationale:
          'Provides flexibility for busy sales professionals and ensures consistent foundational knowledge',
        allocation_percent: 40,
        tools: ['Canvas LMS', 'Articulate 360', 'Loom'],
      },
      {
        type: 'Virtual instructor-led workshops',
        rationale:
          'Enables real-time practice, feedback, and peer learning across geographic locations',
        allocation_percent: 30,
        tools: ['Zoom', 'Miro', 'Mentimeter'],
      },
      {
        type: 'On-the-job application',
        rationale:
          'Reinforces learning through immediate real-world practice with actual customers',
        allocation_percent: 20,
        tools: ['CRM integration', 'Call recording tools', 'Coaching app'],
      },
      {
        type: 'Peer coaching circles',
        rationale: 'Leverages collective experience and provides ongoing support network',
        allocation_percent: 10,
        tools: ['Slack', 'MS Teams', 'Peer feedback forms'],
      },
    ],
    cohort_model:
      'Learners progress in cohorts of 15-20 to foster collaboration and healthy competition. Each cohort includes a mix of experience levels to facilitate mentoring.',
    accessibility_considerations: [
      'All video content includes closed captions and transcripts',
      'Materials available in multiple formats (video, audio, text)',
      'Flexible scheduling options for different time zones',
      'Mobile-responsive design for all digital content',
    ],
    displayType: 'markdown',
  },
  content_outline: {
    modules: [
      {
        module_id: 'm1',
        title: 'Foundations of Consultative Selling',
        description:
          'Introduction to consultative selling methodology and mindset shift from product to solution focus',
        topics: [
          'Consultative vs. Traditional Selling',
          'Customer-Centric Mindset',
          'Building Trust and Credibility',
          'Active Listening Techniques',
        ],
        duration: '2 weeks',
        delivery_method: 'Self-paced online + 1 virtual workshop',
        learning_activities: [
          {
            activity: 'Interactive e-learning modules with scenario-based decisions',
            type: 'Self-study',
            duration: '3 hours',
          },
          {
            activity: 'Virtual workshop: Active listening practice',
            type: 'Instructor-led',
            duration: '2 hours',
          },
          {
            activity: 'Peer discussion forum on mindset challenges',
            type: 'Collaborative',
            duration: '1 hour',
          },
        ],
        assessment: {
          type: 'Knowledge check + role-play evaluation',
          description:
            'Multiple choice quiz on concepts and recorded role-play demonstrating active listening',
        },
      },
      {
        module_id: 'm2',
        title: 'Mastering Needs Analysis',
        description: 'Develop skills to uncover customer pain points and map business requirements',
        topics: [
          'Strategic Questioning Techniques',
          'Pain Point Identification',
          'Stakeholder Mapping',
          'Requirements Documentation',
        ],
        duration: '3 weeks',
        delivery_method: 'Blended online and workshop',
        learning_activities: [
          {
            activity: 'Question bank development exercise',
            type: 'Individual practice',
            duration: '2 hours',
          },
          {
            activity: 'Customer interview simulations',
            type: 'Role-play',
            duration: '3 hours',
          },
          {
            activity: 'Real customer needs analysis project',
            type: 'Field application',
            duration: '4 hours',
          },
        ],
        assessment: {
          type: 'Portfolio assessment',
          description: 'Submit 3 completed customer needs analysis documents with manager feedback',
        },
      },
      {
        module_id: 'm3',
        title: 'Value Proposition Development',
        description: 'Learn to articulate product value in terms of customer business outcomes',
        topics: [
          'ROI Calculation Methods',
          'Business Case Development',
          'Competitive Differentiation',
          'Executive Presentation Skills',
        ],
        duration: '3 weeks',
        delivery_method: 'Mixed mode with emphasis on practice',
        learning_activities: [
          {
            activity: 'ROI calculator training',
            type: 'Technical skill building',
            duration: '2 hours',
          },
          {
            activity: 'Value proposition workshop',
            type: 'Collaborative workshop',
            duration: '4 hours',
          },
          {
            activity: 'Executive pitch practice with feedback',
            type: 'Presentation practice',
            duration: '3 hours',
          },
        ],
        assessment: {
          type: 'Presentation assessment',
          description: 'Deliver value proposition presentation to panel of sales leaders',
        },
      },
      {
        module_id: 'm4',
        title: 'Technical Product Mastery',
        description: 'Deep dive into product features, architecture, and integration capabilities',
        topics: [
          'Product Architecture Overview',
          'Key Features and Benefits',
          'Integration Capabilities',
          'Common Use Cases and Solutions',
        ],
        duration: '2 weeks',
        delivery_method: 'Technical training blend',
        learning_activities: [
          {
            activity: 'Product deep-dive sessions with engineering',
            type: 'Technical briefing',
            duration: '4 hours',
          },
          {
            activity: 'Hands-on product lab exercises',
            type: 'Practice lab',
            duration: '3 hours',
          },
          {
            activity: 'Solution design challenge',
            type: 'Project work',
            duration: '4 hours',
          },
        ],
        assessment: {
          type: 'Technical certification exam',
          description: 'Comprehensive exam covering product knowledge and solution design',
        },
      },
      {
        module_id: 'm5',
        title: 'Relationship Building & Account Management',
        description: 'Strategies for developing long-term strategic partnerships',
        topics: [
          'Stakeholder Relationship Mapping',
          'Strategic Account Planning',
          'Customer Success Partnerships',
          'Renewal and Expansion Strategies',
        ],
        duration: '2 weeks',
        delivery_method: 'Case-based learning',
        learning_activities: [
          {
            activity: 'Account planning template completion',
            type: 'Strategic planning',
            duration: '3 hours',
          },
          {
            activity: 'Customer success story development',
            type: 'Case study creation',
            duration: '2 hours',
          },
          {
            activity: 'Relationship building simulation',
            type: 'Interactive simulation',
            duration: '2 hours',
          },
        ],
        assessment: {
          type: 'Account plan presentation',
          description: 'Present comprehensive account plan for key customer',
        },
      },
    ],
    displayType: 'timeline',
  },
  resources: {
    human_resources: [
      { role: 'Program Lead/Instructional Designer', fte: 0.5, duration: '4 months' },
      { role: 'Sales Training Specialists', fte: 0.25, duration: '3 months' },
      { role: 'Subject Matter Experts (Sales Leaders)', fte: 0.1, duration: '3 months' },
      { role: 'Technical Product Experts', fte: 0.15, duration: '1 month' },
      { role: 'LMS Administrator', fte: 0.1, duration: '4 months' },
    ],
    tools_and_platforms: [
      { category: 'Learning Management System', name: 'Canvas LMS', cost_type: 'Subscription' },
      { category: 'Content Development', name: 'Articulate 360', cost_type: 'License' },
      { category: 'Virtual Collaboration', name: 'Zoom + Miro', cost_type: 'Subscription' },
      { category: 'Assessment Tools', name: 'ProProfs Quiz Maker', cost_type: 'License' },
      { category: 'Analytics Platform', name: 'Tableau', cost_type: 'Existing' },
    ],
    budget: {
      currency: 'USD',
      items: [
        { item: 'Content Development', amount: 35000 },
        { item: 'Platform Licenses', amount: 12000 },
        { item: 'External Facilitation', amount: 15000 },
        { item: 'Assessment & Certification', amount: 8000 },
        { item: 'Program Management', amount: 5000 },
      ],
      total: 75000,
    },
    displayType: 'table',
  },
  assessment_strategy: {
    overview:
      'Multi-faceted assessment approach combining knowledge validation, skill demonstration, and performance measurement. Emphasis on practical application and real-world results rather than theoretical knowledge alone.',
    kpis: [
      {
        metric: 'Program Completion Rate',
        target: '90%',
        measurement_method: 'LMS tracking',
        frequency: 'Weekly',
      },
      {
        metric: 'Skill Assessment Improvement',
        target: '40% increase',
        measurement_method: 'Pre/post assessments',
        frequency: 'Module completion',
      },
      {
        metric: 'Manager Satisfaction',
        target: '4.5/5 rating',
        measurement_method: 'Quarterly survey',
        frequency: 'Quarterly',
      },
      {
        metric: 'Sales Performance Metrics',
        target: '25% improvement',
        measurement_method: 'CRM analytics',
        frequency: 'Monthly',
      },
    ],
    evaluation_methods: [
      {
        method: 'Pre-assessment Baseline',
        timing: 'Before program start',
        weight: '0% (baseline only)',
      },
      {
        method: 'Module Knowledge Checks',
        timing: 'End of each module',
        weight: '20%',
      },
      {
        method: 'Practical Skills Demonstrations',
        timing: 'Modules 2, 3, 5',
        weight: '40%',
      },
      {
        method: 'Technical Certification',
        timing: 'Module 4 completion',
        weight: '20%',
      },
      {
        method: 'Final Capstone Project',
        timing: 'Program completion',
        weight: '20%',
      },
    ],
    displayType: 'infographic',
    chartConfig: {
      type: 'bar',
      metric: 'target',
    },
  },
  implementation_timeline: {
    phases: [
      {
        phase: 'Planning & Design',
        start_date: '2025-02-01',
        end_date: '2025-03-15',
        milestones: [
          'Stakeholder alignment',
          'Content outline approval',
          'Technology setup',
          'Pilot group selection',
        ],
        dependencies: [],
      },
      {
        phase: 'Content Development',
        start_date: '2025-03-01',
        end_date: '2025-04-30',
        milestones: [
          'Module 1-2 content complete',
          'Assessment tools ready',
          'LMS configuration done',
          'Facilitator training complete',
        ],
        dependencies: ['Planning & Design'],
      },
      {
        phase: 'Pilot Launch',
        start_date: '2025-05-01',
        end_date: '2025-05-31',
        milestones: [
          'Pilot cohort launch',
          'Initial feedback collection',
          'Content refinements',
          'Success metrics validation',
        ],
        dependencies: ['Content Development'],
      },
      {
        phase: 'Full Rollout',
        start_date: '2025-06-01',
        end_date: '2025-08-31',
        milestones: [
          'Cohort 1-3 launches',
          'Ongoing facilitation',
          'Performance tracking',
          'Continuous improvement',
        ],
        dependencies: ['Pilot Launch'],
      },
      {
        phase: 'Evaluation & Optimization',
        start_date: '2025-09-01',
        end_date: '2025-09-30',
        milestones: [
          'Program evaluation',
          'ROI analysis',
          'Recommendations report',
          'Sustainability plan',
        ],
        dependencies: ['Full Rollout'],
      },
    ],
    critical_path: ['Planning & Design', 'Content Development', 'Pilot Launch', 'Full Rollout'],
    displayType: 'timeline',
  },
  risk_mitigation: {
    risks: [
      {
        risk: 'Low learner engagement due to time constraints',
        probability: 'Medium',
        impact: 'High',
        mitigation_strategy:
          'Implement flexible scheduling, microlearning modules, and manager support agreements. Track engagement weekly and intervene early with at-risk learners.',
      },
      {
        risk: 'Technology platform issues',
        probability: 'Low',
        impact: 'Medium',
        mitigation_strategy:
          'Conduct thorough platform testing, maintain backup delivery methods, and ensure 24/7 technical support during critical periods.',
      },
      {
        risk: 'Resistance to behavior change',
        probability: 'Medium',
        impact: 'Medium',
        mitigation_strategy:
          'Secure executive sponsorship, share early success stories, implement peer recognition program, and tie completion to performance reviews.',
      },
      {
        risk: 'Budget overrun',
        probability: 'Low',
        impact: 'High',
        mitigation_strategy:
          'Maintain 10% contingency fund, phase content development, monitor expenses weekly, and have pre-approved scope reduction options.',
      },
    ],
    contingency_plans: [
      'Backup facilitation resources identified',
      'Alternative content delivery methods prepared',
      'Phased rollout allows for mid-course corrections',
      'Success metrics enable early issue detection',
    ],
    displayType: 'table',
  },
  success_metrics: {
    metrics: [
      {
        metric: 'Sales Conversion Rate',
        current_baseline: '20%',
        target: '35%',
        measurement_method: 'CRM pipeline analytics',
        timeline: '6 months post-training',
      },
      {
        metric: 'Average Deal Size',
        current_baseline: '$50,000',
        target: '$62,500',
        measurement_method: 'Revenue reporting',
        timeline: '6 months post-training',
      },
      {
        metric: 'Customer Satisfaction Score',
        current_baseline: '7.5/10',
        target: '8.5/10',
        measurement_method: 'Quarterly NPS survey',
        timeline: '3 months post-training',
      },
      {
        metric: 'Time to Productivity',
        current_baseline: '6 months',
        target: '4 months',
        measurement_method: 'New hire performance tracking',
        timeline: 'Ongoing measurement',
      },
      {
        metric: 'Knowledge Retention',
        current_baseline: 'N/A',
        target: '80% retention',
        measurement_method: '90-day post-assessment',
        timeline: '3 months post-training',
      },
    ],
    reporting_cadence: 'Monthly executive dashboard, Weekly program metrics',
    dashboard_requirements: [
      'Real-time completion tracking',
      'Individual and cohort performance comparison',
      'ROI calculator integration',
      'Predictive analytics for at-risk learners',
      'Mobile-accessible reporting',
    ],
    displayType: 'infographic',
  },
  sustainability_plan: {
    content:
      "The program's long-term success depends on continuous reinforcement and evolution. Monthly refresher sessions will maintain skill currency, while quarterly advanced topics address emerging market needs. New hire onboarding will incorporate program modules within the first 90 days.\n\nA train-the-trainer model enables internal scaling, with top performers becoming peer coaches. Annual content reviews ensure relevance to changing products and market conditions. The program will expand to include specialized tracks for vertical markets and advanced certifications.\n\nSuccess metrics will be reviewed quarterly with stakeholder committees, enabling data-driven improvements. Integration with performance management systems ensures sustained behavior change and accountability.",
    maintenance_schedule: {
      review_frequency: 'Quarterly content review, Annual major update',
      update_triggers: [
        'New product launches',
        'Significant market changes',
        'Performance metric gaps',
        'Regulatory requirements',
        'Technology platform updates',
      ],
    },
    scaling_considerations: [
      'Automated enrollment for new hires',
      'Self-service manager dashboards',
      'Localization for international teams',
      'Integration with succession planning',
      'Alumni network for continued learning',
    ],
    displayType: 'markdown',
  },
  _generation_metadata: {
    model: 'gemini-3.1-pro-preview',
    timestamp: '2025-01-15T10:00:00Z',
    fallbackUsed: false,
    attempts: 1,
  },
};

// Minimal valid blueprint
export const minimalBlueprint: BlueprintJSON = {
  metadata: {
    title: 'Basic Training Program',
    organization: 'Small Company',
    role: 'Manager',
    generated_at: '2025-01-15T10:00:00Z',
    version: '1.0',
    model: 'gemini-3.1-pro-preview',
  },
  executive_summary: {
    content: 'A basic training program.',
    displayType: 'markdown',
  },
  learning_objectives: {
    objectives: [
      {
        id: 'obj1',
        title: 'Basic Skills',
        description: 'Learn basic skills',
        metric: 'Completion',
        baseline: '0%',
        target: '100%',
        due_date: '2025-12-31',
      },
    ],
    displayType: 'infographic',
  },
  target_audience: {
    demographics: {
      roles: ['Employee'],
      experience_levels: ['All levels'],
      department_distribution: [{ department: 'General', percentage: 100 }],
    },
    learning_preferences: {
      modalities: [{ type: 'Mixed', percentage: 100 }],
    },
    displayType: 'infographic',
  },
  instructional_strategy: {
    overview: 'Basic training approach',
    modalities: [
      {
        type: 'Online',
        rationale: 'Convenient',
        allocation_percent: 100,
        tools: ['LMS'],
      },
    ],
    cohort_model: 'Individual',
    accessibility_considerations: ['Basic accessibility'],
    displayType: 'markdown',
  },
  content_outline: {
    modules: [
      {
        module_id: 'm1',
        title: 'Module 1',
        description: 'First module',
        topics: ['Topic 1'],
        duration: '1 week',
        delivery_method: 'Online',
        learning_activities: [
          {
            activity: 'Read content',
            type: 'Self-study',
            duration: '1 hour',
          },
        ],
        assessment: {
          type: 'Quiz',
          description: 'Basic quiz',
        },
      },
    ],
    displayType: 'timeline',
  },
  resources: {
    human_resources: [{ role: 'Trainer', fte: 0.1, duration: '1 month' }],
    tools_and_platforms: [{ category: 'LMS', name: 'Basic LMS', cost_type: 'Free' }],
    budget: {
      currency: 'USD',
      items: [{ item: 'Training', amount: 1000 }],
      total: 1000,
    },
    displayType: 'table',
  },
  assessment_strategy: {
    overview: 'Basic assessment',
    kpis: [
      {
        metric: 'Completion',
        target: '100%',
        measurement_method: 'Tracking',
        frequency: 'Once',
      },
    ],
    evaluation_methods: [
      {
        method: 'Final Quiz',
        timing: 'End',
        weight: '100%',
      },
    ],
    displayType: 'infographic',
  },
  implementation_timeline: {
    phases: [
      {
        phase: 'Implementation',
        start_date: '2025-02-01',
        end_date: '2025-02-28',
        milestones: ['Launch'],
        dependencies: [],
      },
    ],
    critical_path: ['Implementation'],
    displayType: 'timeline',
  },
  risk_mitigation: {
    risks: [
      {
        risk: 'Low engagement',
        probability: 'Low',
        impact: 'Low',
        mitigation_strategy: 'Monitor progress',
      },
    ],
    contingency_plans: ['Have backup plan'],
    displayType: 'table',
  },
  success_metrics: {
    metrics: [
      {
        metric: 'Completion Rate',
        current_baseline: '0%',
        target: '100%',
        measurement_method: 'LMS tracking',
        timeline: '1 month',
      },
    ],
    reporting_cadence: 'Monthly',
    dashboard_requirements: ['Basic reporting'],
    displayType: 'infographic',
  },
  sustainability_plan: {
    content: 'Keep the training updated.',
    maintenance_schedule: {
      review_frequency: 'Annual',
      update_triggers: ['Major changes'],
    },
    scaling_considerations: ['Add more modules as needed'],
    displayType: 'markdown',
  },
};

// Blueprint with missing sections (for error testing)
export const incompleteBlueprint = {
  metadata: {
    title: 'Incomplete Blueprint',
    organization: 'Test Org',
    role: 'Test Role',
    generated_at: '2025-01-15T10:00:00Z',
    version: '1.0',
    model: 'test',
  },
  executive_summary: {
    content: 'This blueprint is missing several required sections',
    displayType: 'markdown',
  },
  // Missing many required sections
  learning_objectives: {
    objectives: [],
    displayType: 'infographic',
  },
};

// Blueprint with wrong display types
export const invalidDisplayTypeBlueprint = {
  ...minimalBlueprint,
  executive_summary: {
    ...minimalBlueprint.executive_summary,
    displayType: 'infographic' as any, // Wrong type for executive summary
  },
  learning_objectives: {
    ...minimalBlueprint.learning_objectives,
    displayType: 'markdown' as any, // Wrong type for objectives
  },
  content_outline: {
    ...minimalBlueprint.content_outline,
    displayType: 'table' as any, // Wrong type for timeline
  },
};

// Export all blueprint fixtures
export const blueprintFixtures = {
  valid: validBlueprint,
  minimal: minimalBlueprint,
  incomplete: incompleteBlueprint,
  invalidDisplayType: invalidDisplayTypeBlueprint,
};
