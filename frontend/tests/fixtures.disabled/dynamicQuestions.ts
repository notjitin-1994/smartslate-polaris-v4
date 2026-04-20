/**
 * Dynamic Question Test Fixtures
 * Covers all 13 input types with valid and edge case scenarios
 */

import type { Section } from '@/lib/validation/dynamicQuestionSchemas';

export const validDynamicQuestions: Section[] = [
  {
    id: 's1',
    title: 'Learning Objectives & Outcomes',
    description: 'Define your primary learning goals and expected outcomes',
    order: 1,
    questions: [
      {
        id: 'q1_s1',
        label: 'What are the top 3-5 learning objectives for this program?',
        type: 'textarea',
        required: true,
        placeholder: 'Enter each objective on a new line',
        helpText: "Be specific and measurable (e.g., 'Increase sales conversion rate by 20%')",
        validation: [
          { rule: 'required', message: 'Learning objectives are required' },
          { rule: 'minLength', value: 20, message: 'Please provide detailed objectives' },
        ],
      },
      {
        id: 'q2_s1',
        label: 'Select the primary learning domains to address',
        type: 'checkbox_pills',
        required: true,
        helpText: 'Choose all that apply',
        options: [
          { value: 'cognitive', label: 'Cognitive (Knowledge)', disabled: false, icon: '🧠' },
          { value: 'psychomotor', label: 'Psychomotor (Skills)', disabled: false, icon: '✋' },
          { value: 'affective', label: 'Affective (Attitudes)', disabled: false, icon: '❤️' },
          { value: 'interpersonal', label: 'Interpersonal (Social)', disabled: false, icon: '👥' },
        ],
        validation: [
          { rule: 'required', message: 'Select at least one learning domain' },
          { rule: 'minSelections', value: 1, message: 'Select at least one domain' },
        ],
      },
      {
        id: 'q3_s1',
        label: 'How important is measuring ROI for this program?',
        type: 'enhanced_scale',
        required: true,
        helpText: '1 = Not important, 5 = Critical',
        scaleConfig: {
          min: 1,
          max: 5,
          minLabel: 'Not Important',
          maxLabel: 'Critical',
          labels: ['1', '2', '3', '4', '5'],
          step: 1,
        },
      },
    ],
  },
  {
    id: 's2',
    title: 'Target Audience Analysis',
    description: "Understand your learners' backgrounds and needs",
    order: 2,
    questions: [
      {
        id: 'q1_s2',
        label: 'What is the primary job level of your learners?',
        type: 'radio_pills',
        required: true,
        helpText: 'Select the most common level',
        options: [
          { value: 'entry', disabled: false, label: 'Entry Level' },
          { value: 'individual', disabled: false, label: 'Individual Contributor' },
          { value: 'manager', disabled: false, label: 'Manager/Supervisor' },
          { value: 'senior', disabled: false, label: 'Senior/Executive' },
          { value: 'mixed', disabled: false, label: 'Mixed Levels' },
        ],
      },
      {
        id: 'q2_s2',
        label: 'Estimated time to complete the full program',
        type: 'labeled_slider',
        required: true,
        helpText: 'Total duration in weeks',
        sliderConfig: {
          min: 1,
          max: 52,
          step: 1,
          unit: 'weeks',
          markers: [4, 8, 12, 26, 52],
        },
      },
      {
        id: 'q3_s2',
        label: 'Will learners need accommodations?',
        type: 'toggle_switch',
        required: true,
        helpText: 'For accessibility or special needs',
        options: [
          { value: 'yes', disabled: false, label: 'Yes, accommodations needed' },
          { value: 'no', disabled: false, label: 'No accommodations needed' },
        ],
      },
    ],
  },
  {
    id: 's3',
    title: 'Content Scope & Structure',
    description: "Define what will be covered and how it's organized",
    order: 3,
    questions: [
      {
        id: 'q1_s3',
        label: 'Enter the main topic areas to cover',
        type: 'text',
        required: true,
        placeholder: 'e.g., Leadership, Communication, Technical Skills',
        helpText: 'Separate multiple topics with commas',
        validation: [
          { rule: 'required', message: 'Topic areas are required' },
          { rule: 'minLength', value: 3, message: 'Please enter valid topics' },
        ],
      },
      {
        id: 'q2_s3',
        label: 'Preferred content delivery formats',
        type: 'checkbox_cards',
        required: true,
        helpText: 'Select all formats you want to include',
        maxSelections: 5,
        options: [
          {
            value: 'video',
            disabled: false,
            label: 'Video Lectures',
            description: 'Pre-recorded or live video content',
            icon: '🎥',
          },
          {
            value: 'interactive',
            disabled: false,
            label: 'Interactive Modules',
            description: 'Self-paced interactive content',
            icon: '🖱️',
          },
          {
            value: 'reading',
            disabled: false,
            label: 'Reading Materials',
            description: 'Documents, articles, and guides',
            icon: '📚',
          },
          {
            value: 'workshop',
            disabled: false,
            label: 'Live Workshops',
            description: 'Instructor-led sessions',
            icon: '👨‍🏫',
          },
          {
            value: 'simulation',
            disabled: false,
            label: 'Simulations/Games',
            description: 'Practice in safe environments',
            icon: '🎮',
          },
        ],
        validation: [
          { rule: 'required', message: 'Select at least one format' },
          { rule: 'minSelections', value: 1, message: 'Select at least one format' },
          { rule: 'maxSelections', value: 5, message: 'Select up to 5 formats' },
        ],
      },
    ],
  },
  {
    id: 's4',
    title: 'Resources & Budget',
    description: 'Understand available resources and constraints',
    order: 4,
    questions: [
      {
        id: 'q1_s4',
        label: 'What is your total budget for this program?',
        type: 'currency',
        required: true,
        helpText: 'Include all costs: development, delivery, and tools',
        currencyConfig: {
          currencySymbol: '$',
          min: 0,
          max: 10000000,
        },
        validation: [
          { rule: 'required', message: 'Budget is required' },
          { rule: 'min', value: 0, message: 'Budget cannot be negative' },
        ],
      },
      {
        id: 'q2_s4',
        label: 'Number of subject matter experts available',
        type: 'number_spinner',
        required: true,
        helpText: 'Internal or external SMEs',
        numberConfig: {
          min: 0,
          max: 50,
          step: 1,
        },
        validation: [
          { rule: 'required', message: 'Number of SMEs is required' },
          { rule: 'min', value: 0, message: 'Cannot be negative' },
        ],
      },
      {
        id: 'q3_s4',
        label: 'Target program launch date',
        type: 'date',
        required: true,
        helpText: 'When should the program be ready?',
        validation: [{ rule: 'required', message: 'Launch date is required' }],
      },
    ],
  },
  {
    id: 's5',
    title: 'Technology & Platform',
    description: 'Technical requirements and platform preferences',
    order: 5,
    questions: [
      {
        id: 'q1_s5',
        label: 'Primary email for program communications',
        type: 'email',
        required: true,
        placeholder: 'admin@company.com',
        helpText: 'Main contact for the learning program',
        validation: [
          { rule: 'required', message: 'Email is required' },
          { rule: 'email', message: 'Please enter a valid email' },
        ],
      },
      {
        id: 'q2_s5',
        label: 'LMS or platform URL (if applicable)',
        type: 'url',
        required: false,
        placeholder: 'https://lms.company.com',
        helpText: 'Your learning management system URL',
        validation: [{ rule: 'url', message: 'Please enter a valid URL' }],
      },
      {
        id: 'q3_s5',
        label: 'Select your current LMS/platform',
        type: 'select',
        required: true,
        helpText: 'Choose your learning management system',
        options: [
          { value: 'none', disabled: false, label: 'No LMS Currently' },
          { value: 'canvas', disabled: false, label: 'Canvas' },
          { value: 'moodle', disabled: false, label: 'Moodle' },
          { value: 'blackboard', disabled: false, label: 'Blackboard' },
          { value: 'cornerstone', disabled: false, label: 'Cornerstone' },
          { value: 'successfactors', disabled: false, label: 'SAP SuccessFactors' },
          { value: 'other', disabled: false, label: 'Other Platform' },
        ],
      },
    ],
  },
  {
    id: 's6',
    title: 'Assessment Strategy',
    description: 'How learning will be measured and validated',
    order: 6,
    questions: [
      {
        id: 'q1_s6',
        label: 'Which assessment types will you use?',
        type: 'multiselect',
        required: true,
        helpText: 'Select all that apply',
        options: [
          { value: 'pre_assessment', disabled: false, label: 'Pre-assessments' },
          { value: 'formative', disabled: false, label: 'Formative (During Learning)' },
          { value: 'summative', disabled: false, label: 'Summative (End of Module)' },
          { value: 'performance', disabled: false, label: 'Performance-based' },
          { value: 'certification', disabled: false, label: 'Certification Exams' },
          { value: '360_feedback', disabled: false, label: '360-Degree Feedback' },
        ],
        validation: [
          { rule: 'required', message: 'Select at least one assessment type' },
          { rule: 'minSelections', value: 1, message: 'Select at least one type' },
        ],
      },
      {
        id: 'q2_s6',
        label: 'How frequently should progress be tracked?',
        type: 'radio_cards',
        required: true,
        options: [
          {
            value: 'daily',
            disabled: false,
            label: 'Daily',
            description: 'Track progress every day',
            icon: '📅',
          },
          {
            value: 'weekly',
            disabled: false,
            label: 'Weekly',
            description: 'Weekly progress reviews',
            icon: '📊',
          },
          {
            value: 'biweekly',
            disabled: false,
            label: 'Bi-weekly',
            description: 'Every two weeks',
            icon: '📈',
          },
          {
            value: 'monthly',
            disabled: false,
            label: 'Monthly',
            description: 'Monthly progress reports',
            icon: '📋',
          },
        ],
      },
    ],
  },
  {
    id: 's7',
    title: 'Learning Support',
    description: 'Support structures and resources for learners',
    order: 7,
    questions: [
      {
        id: 'q1_s7',
        label: 'What level of instructor support is needed?',
        type: 'scale',
        required: true,
        helpText: '1 = Self-paced only, 5 = High-touch support',
        scaleConfig: {
          min: 1,
          max: 5,
          minLabel: 'Self-paced',
          maxLabel: 'High-touch',
          step: 1,
        },
      },
      {
        id: 'q2_s7',
        label: 'Available support hours per week',
        type: 'number',
        required: true,
        placeholder: 'e.g., 20',
        helpText: 'Total instructor/facilitator hours available weekly',
        validation: [
          { rule: 'required', message: 'Support hours are required' },
          { rule: 'min', value: 0, message: 'Cannot be negative' },
          { rule: 'max', value: 168, message: 'Cannot exceed 168 hours per week' },
        ],
      },
    ],
  },
  {
    id: 's8',
    title: 'Success Metrics',
    description: 'Define how success will be measured',
    order: 8,
    questions: [
      {
        id: 'q1_s8',
        label: 'Primary success metrics for this program',
        type: 'textarea',
        required: true,
        placeholder: 'List specific, measurable success criteria',
        helpText: "E.g., '90% completion rate', '20% improvement in performance scores'",
        validation: [
          { rule: 'required', message: 'Success metrics are required' },
          { rule: 'minLength', value: 20, message: 'Please provide detailed metrics' },
          { rule: 'maxLength', value: 1000, message: 'Please keep under 1000 characters' },
        ],
      },
    ],
  },
  {
    id: 's9',
    title: 'Risk Factors',
    description: 'Identify potential challenges and mitigation strategies',
    order: 9,
    questions: [
      {
        id: 'q1_s9',
        label: 'Select potential risk factors',
        type: 'checkbox_pills',
        required: false,
        helpText: 'Choose all that might apply',
        options: [
          { value: 'engagement', disabled: false, label: 'Low Engagement Risk' },
          { value: 'technical', disabled: false, label: 'Technical Challenges' },
          { value: 'time', disabled: false, label: 'Time Constraints' },
          { value: 'budget', disabled: false, label: 'Budget Limitations' },
          { value: 'culture', disabled: false, label: 'Cultural Resistance' },
          { value: 'compliance', disabled: false, label: 'Compliance Issues' },
        ],
      },
    ],
  },
  {
    id: 's10',
    title: 'Implementation Timeline',
    description: 'Key milestones and deadlines',
    order: 10,
    questions: [
      {
        id: 'q1_s10',
        label: 'Is this implementation time-sensitive?',
        type: 'toggle_switch',
        required: true,
        helpText: 'Are there strict deadlines?',
        options: [
          { value: 'yes', disabled: false, label: 'Yes, time-sensitive' },
          { value: 'no', disabled: false, label: 'No, flexible timeline' },
        ],
      },
      {
        id: 'q2_s10',
        label: 'Preferred implementation approach',
        type: 'radio_pills',
        required: true,
        options: [
          { value: 'pilot', disabled: false, label: 'Pilot First' },
          { value: 'phased', disabled: false, label: 'Phased Rollout' },
          { value: 'full', disabled: false, label: 'Full Launch' },
          { value: 'continuous', disabled: false, label: 'Continuous Deployment' },
        ],
      },
    ],
  },
];

// Edge case: Questions with unusual but valid configurations
export const edgeCaseDynamicQuestions: Section[] = [
  {
    id: 's1',
    title: 'Edge Case Scenarios',
    description: 'Testing boundary conditions',
    order: 1,
    questions: [
      {
        id: 'q1_edge',
        label:
          'Very long question label that tests the UI rendering capabilities and ensures that extremely verbose questions are handled properly without breaking the layout or causing text overflow issues in the dynamic questionnaire interface',
        type: 'text',
        required: true,
        placeholder: 'This placeholder text is also quite long to test edge cases',
        helpText:
          'This help text provides extensive guidance that might span multiple lines and includes various special characters like & < > " \' and even emojis 🎯 to ensure proper escaping',
        validation: [
          { rule: 'required', message: 'This field is required' },
          { rule: 'minLength', value: 1, message: 'Minimum 1 character' },
          { rule: 'maxLength', value: 10000, message: 'Maximum 10000 characters' },
          {
            rule: 'pattern',
            value: '^[A-Za-z0-9\\s]+$',
            message: 'Only alphanumeric characters allowed',
          },
        ],
      },
      {
        id: 'q2_edge',
        label: 'Select with many options',
        type: 'multiselect',
        required: true,
        options: Array.from({ length: 50 }, (_, i) => ({
          value: `option_${i + 1}`,
          label: `Option ${i + 1}`,
          description: i % 5 === 0 ? `This is a longer description for option ${i + 1}` : undefined,
          disabled: i % 10 === 0,
        })),
        validation: [
          { rule: 'minSelections', value: 2, message: 'Select at least 2 options' },
          { rule: 'maxSelections', value: 10, message: 'Select at most 10 options' },
        ],
      },
      {
        id: 'q3_edge',
        label: 'Currency with extreme values',
        type: 'currency',
        required: true,
        currencyConfig: {
          currencySymbol: '¥',
          min: 0.01,
          max: 999999999.99,
        },
      },
      {
        id: 'q4_edge',
        label: 'Scale with non-standard configuration',
        type: 'enhanced_scale',
        required: true,
        scaleConfig: {
          min: -5,
          max: 5,
          minLabel: 'Strongly Disagree',
          maxLabel: 'Strongly Agree',
          labels: ['-5', '-4', '-3', '-2', '-1', '0', '1', '2', '3', '4', '5'],
          step: 1,
        },
      },
    ],
  },
];

// Malformed data for negative testing
export const malformedDynamicQuestions = {
  sections: [
    {
      // Missing required 'id' field
      title: 'Invalid Section',
      order: 1,
      questions: [
        {
          // Missing required 'label' field
          id: 'q1_invalid',
          type: 'text',
          required: true,
        },
        {
          id: 'q2_invalid',
          label: 'Invalid type question',
          type: 'invalid_type', // Invalid input type
          required: true,
        },
        {
          id: 'q3_invalid',
          label: 'Radio without options',
          type: 'radio_pills',
          required: true,
          options: [], // Empty options array for selection type
        },
        {
          id: 'q4_invalid',
          label: 'Scale without config',
          type: 'scale',
          required: true,
          // Missing scaleConfig
        },
      ],
    },
    {
      id: 's2',
      title: 'Another Invalid Section',
      // Missing 'order' field
      // Missing 'questions' array
    },
  ],
};

// Minimal valid configuration
export const minimalDynamicQuestions: Section[] = [
  {
    id: 's1',
    title: 'Minimal Section',
    description: '',
    order: 1,
    questions: [
      {
        id: 'q1_min',
        label: 'Simple question',
        type: 'text',
        required: false,
      },
    ],
  },
];

// Export all fixtures
export const dynamicQuestionFixtures = {
  valid: validDynamicQuestions,
  edgeCase: edgeCaseDynamicQuestions,
  malformed: malformedDynamicQuestions,
  minimal: minimalDynamicQuestions,
};
