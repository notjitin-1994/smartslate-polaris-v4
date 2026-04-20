/**
 * Dynamic Answer Test Fixtures
 * Matches the dynamic questions with various answer scenarios
 */

// Valid answers matching all question types
export const validDynamicAnswers = {
  // Section 1: Learning Objectives
  q1_s1:
    "1. Increase sales team's consultative selling skills by 40%\n2. Improve customer needs analysis accuracy to 85%\n3. Enhance value proposition articulation leading to 25% higher deal sizes\n4. Develop technical product knowledge to expert level\n5. Build long-term client relationships with 90% retention rate",
  q2_s1: ['cognitive', 'interpersonal'],
  q3_s1: 4,

  // Section 2: Target Audience
  q1_s2: 'individual',
  q2_s2: 12,
  q3_s2: 'yes',

  // Section 3: Content Structure
  q1_s3:
    'Consultative Selling, Needs Analysis, Value Proposition, Technical Product Knowledge, Relationship Building',
  q2_s3: ['video', 'interactive', 'workshop'],

  // Section 4: Resources
  q1_s4: 75000,
  q2_s4: 5,
  q3_s4: '2025-06-01',

  // Section 5: Technology
  q1_s5: 'training@techcorp.com',
  q2_s5: 'https://lms.techcorp.com',
  q3_s5: 'canvas',

  // Section 6: Assessment
  q1_s6: ['pre_assessment', 'formative', 'summative', 'performance'],
  q2_s6: 'weekly',

  // Section 7: Support
  q1_s7: 3,
  q2_s7: 20,

  // Section 8: Success Metrics
  q1_s8:
    'Primary success metrics:\n- 90% learner completion rate\n- 85% pass rate on final assessment\n- 40% improvement in sales conversion rates within 90 days\n- 25% increase in average deal size\n- 95% manager satisfaction with team performance',

  // Section 9: Risk Factors
  q1_s9: ['engagement', 'time'],

  // Section 10: Implementation
  q1_s10: 'yes',
  q2_s10: 'phased',
};

// Edge case answers testing boundaries
export const edgeCaseAnswers = {
  // Maximum length text
  q1_s1: 'A'.repeat(5000), // Very long text
  q2_s1: ['cognitive', 'psychomotor', 'affective', 'interpersonal'], // All options selected
  q3_s1: 5, // Maximum scale value

  q1_s2: 'mixed',
  q2_s2: 52, // Maximum weeks
  q3_s2: 'no',

  q1_s3:
    'Topic1, Topic2, Topic3, Topic4, Topic5, Topic6, Topic7, Topic8, Topic9, Topic10, Topic11, Topic12, Topic13, Topic14, Topic15',
  q2_s3: ['video', 'interactive', 'reading', 'workshop', 'simulation'], // Maximum selections

  q1_s4: 10000000, // Maximum budget
  q2_s4: 50, // Maximum SMEs
  q3_s4: '2030-12-31', // Far future date

  q1_s5:
    'very.long.email.address.with.many.dots@extremely-long-domain-name-for-testing.company.com',
  q2_s5:
    'https://very-long-subdomain.another-subdomain.yet-another.subdomain.example.com/path/to/lms/system?param1=value1&param2=value2',
  q3_s5: 'other',

  q1_s6: [
    'pre_assessment',
    'formative',
    'summative',
    'performance',
    'certification',
    '360_feedback',
  ], // All options
  q2_s6: 'daily',

  q1_s7: 1, // Minimum support
  q2_s7: 168, // Maximum hours (24*7)

  q1_s8: 'X'.repeat(1000), // Maximum length

  q1_s9: [], // No selections (optional field)

  q1_s10: 'no',
  q2_s10: 'continuous',
};

// Invalid answers for validation testing
export const invalidAnswers = {
  // Wrong types
  q1_s1: 123, // Should be string
  q2_s1: 'cognitive', // Should be array
  q3_s1: 'high', // Should be number

  q1_s2: 'junior', // Invalid option value
  q2_s2: 100, // Exceeds maximum
  q3_s2: 'maybe', // Invalid toggle value

  q1_s3: '', // Empty required field
  q2_s3: ['invalid_format'], // Invalid option

  q1_s4: -5000, // Negative currency
  q2_s4: -1, // Negative number
  q3_s4: 'invalid-date', // Invalid date format

  q1_s5: 'not-an-email', // Invalid email
  q2_s5: 'not a url', // Invalid URL
  q3_s5: 'custom_lms', // Invalid option

  q1_s6: [], // Empty array for required multiselect
  q2_s6: 'hourly', // Invalid option

  q1_s7: 6, // Exceeds scale maximum
  q2_s7: 200, // Exceeds maximum hours

  q1_s8: '', // Empty required textarea

  q1_s9: ['unknown_risk'], // Invalid option

  q1_s10: 1, // Wrong type (should be string)
  q2_s10: ['pilot', 'phased'], // Should be single selection
};

// Partial answers for auto-save testing
export const partialAnswers = {
  q1_s1: 'Objective 1: Improve sales skills',
  q2_s1: ['cognitive'],
  // Missing q3_s1 and many other required fields

  q1_s2: 'individual',
  // Missing other fields

  q1_s3: 'Sales Training',
  // Incomplete section
};

// Answers with special characters and international content
export const internationalAnswers = {
  q1_s1:
    '目标1：提高销售技能\nObjectif 2: Améliorer les compétences\nZiel 3: Vertriebsfähigkeiten verbessern\nObjetivo 4: Mejorar las habilidades de ventas',
  q2_s1: ['cognitive', 'affective'],
  q3_s1: 5,

  q1_s2: 'manager',
  q2_s2: 8,
  q3_s2: 'yes',

  q1_s3: 'Vente Consultative, 需求分析, Wertversprechen, Propuesta de Valor',
  q2_s3: ['video', 'interactive'],

  q1_s4: 50000,
  q2_s4: 3,
  q3_s4: '2025-07-15',

  q1_s5: 'formation@société.fr',
  q2_s5: 'https://lms.公司.cn',
  q3_s5: 'moodle',

  q1_s6: ['formative', 'summative'],
  q2_s6: 'biweekly',

  q1_s7: 4,
  q2_s7: 15,

  q1_s8: 'Métricas de éxito:\n• 成功率 90%\n• Verbesserung um 40%\n• ROI של 300%',

  q1_s9: ['culture', 'technical'],

  q1_s10: 'yes',
  q2_s10: 'pilot',
};

// Answers simulating common user mistakes
export const commonMistakeAnswers = {
  // Entering labels instead of values
  q1_s1: 'Learning objectives here',
  q2_s1: ['Cognitive (Knowledge)', 'Interpersonal (Social)'], // Labels instead of values
  q3_s1: 3,

  q1_s2: 'Individual Contributor', // Label instead of value
  q2_s2: 10,
  q3_s2: 'Yes, accommodations needed', // Label instead of value

  // Mixed case and extra spaces
  q1_s3: '  Sales Training  ,  Customer Service  ,  Product Knowledge  ',
  q2_s3: ['Video Lectures', 'Live Workshops'], // Labels

  // Currency with symbols
  q1_s4: '$75,000', // Should be number only
  q2_s4: '5 SMEs', // Should be number only
  q3_s4: 'June 1st, 2025', // Wrong date format

  // Common email/URL mistakes
  q1_s5: 'training@company', // Missing domain extension
  q2_s5: 'lms.company.com', // Missing protocol
  q3_s5: 'Canvas LMS', // Label instead of value

  // Selection mistakes
  q1_s6: 'Pre-assessments, Formative, Summative', // String instead of array
  q2_s6: 'Weekly progress reviews', // Description instead of value

  q1_s7: 'Medium', // Text instead of number
  q2_s7: '20 hours per week', // Text instead of number

  q1_s8: 'See attached document', // Insufficient detail

  q1_s9: ['Low Engagement Risk', 'Time Constraints'], // Labels

  q1_s10: 'Yes', // Capitalized
  q2_s10: 'Phased Rollout', // Label
};

// Empty answers (all fields missing)
export const emptyAnswers = {};

// Answers for testing sanitization
export const answersToBeSanitized = {
  q1_s1: 'Valid objectives text',
  q2_s1: ['COGNITIVE', 'Interpersonal'], // Mixed case
  q3_s1: 4,

  q1_s2: 'INDIVIDUAL', // Uppercase
  q2_s2: 12,
  q3_s2: 'YES', // Uppercase

  q1_s3: 'Training Topics',
  q2_s3: ['VIDEO', 'interactive', 'WORKSHOP'], // Mixed case

  q1_s4: 75000,
  q2_s4: 5,
  q3_s4: '2025-06-01',

  q1_s5: 'TRAINING@TECHCORP.COM', // Uppercase email
  q2_s5: 'HTTPS://LMS.TECHCORP.COM', // Uppercase URL
  q3_s5: 'Canvas', // Different case

  q1_s6: ['Pre_assessment', 'FORMATIVE', 'summative'], // Various cases
  q2_s6: 'WEEKLY',

  q1_s7: 3,
  q2_s7: 20,

  q1_s8: 'Success metrics here',

  q1_s9: ['ENGAGEMENT', 'time'], // Mixed case

  q1_s10: 'Yes', // Different case
  q2_s10: 'PHASED',
};

// Export all answer fixtures
export const dynamicAnswerFixtures = {
  valid: validDynamicAnswers,
  edgeCase: edgeCaseAnswers,
  invalid: invalidAnswers,
  partial: partialAnswers,
  international: internationalAnswers,
  commonMistakes: commonMistakeAnswers,
  empty: emptyAnswers,
  toBeSanitized: answersToBeSanitized,
};
