import { Blueprint, DynamicQuestions } from '@/lib/ollama/schema';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

export class BlueprintFallbackService {
  // A simple fallback blueprint template
  private static DEFAULT_FALLBACK_BLUEPRINT: Blueprint = {
    title: 'Default Learning Blueprint',
    overview:
      'This is a default learning blueprint generated due to an error. Please review and provide more specific inputs if needed.',
    learningObjectives: [
      'Understand the basic concepts of a learning path',
      'Identify key components of a structured learning program',
    ],
    modules: [
      {
        title: 'Introduction to Learning Blueprints',
        duration: 2,
        topics: ['What is a blueprint?', 'Why are they important?'],
        activities: ['Reading an article', 'Watching an introductory video'],
        assessments: ['Short quiz'],
      },
    ],
    timeline: {
      'Week 1': 'Introduction and foundational concepts',
    },
    resources: [
      { name: 'Learning Blueprint Guide', type: 'Document', url: 'https://example.com/guide' },
    ],
  };

  /**
   * Retrieves a fallback blueprint. In a more advanced system, this could use
   * aggregated answers to generate a more context-aware fallback.
   * @param aggregatedAnswers Optional. Aggregated answers to tailor the fallback.
   * @returns A Blueprint object.
   */
  public getFallbackBlueprint(aggregatedAnswers?: AggregatedAnswer): Blueprint {
    console.log('Generating fallback blueprint.');
    // In a real scenario, you might use aggregatedAnswers to dynamically create a more relevant fallback.
    // For now, we return a static default.
    return BlueprintFallbackService.DEFAULT_FALLBACK_BLUEPRINT;
  }

  /**
   * Handles Ollama connection failures by providing a fallback blueprint.
   * @returns A promise that resolves with a fallback Blueprint.
   */
  public async handleOllamaConnectionFailure(): Promise<Blueprint> {
    console.error('Ollama connection failed. Providing fallback blueprint.');
    return this.getFallbackBlueprint();
  }

  /**
   * Provides fallback dynamic questions when Ollama is not available.
   * @returns A DynamicQuestions object with sample questions.
   */
  public getFallbackDynamicQuestions(): DynamicQuestions {
    console.log('Generating fallback dynamic questions.');
    return {
      sections: [
        {
          title: 'Learning Objectives & Outcomes',
          description: 'Define intended results and success measures.',
          questions: [
            {
              id: 'Q1',
              question_text:
                'What are the top 3 outcomes you expect this learning initiative to achieve?',
              input_type: 'multi_select',
              options: [
                'Skill Improvement',
                'Compliance',
                'Leadership Development',
                'Productivity Gains',
                'Other',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q2',
              question_text: 'On a scale of 1 to 10, how urgent is closing this learning gap?',
              input_type: 'slider',
              validation: { required: true, data_type: 'number' },
            },
            {
              id: 'Q3',
              question_text: 'What specific skills or knowledge gaps need to be addressed?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q4',
              question_text: 'How will you measure the success of this learning initiative?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q5',
              question_text: 'What is the expected timeline for achieving these outcomes?',
              input_type: 'calendar',
              validation: { required: true, data_type: 'date' },
            },
            {
              id: 'Q6',
              question_text: 'What is the priority level of this learning initiative?',
              input_type: 'single_select',
              options: ['Critical', 'High', 'Medium', 'Low'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q7',
              question_text: 'What budget range is allocated for this learning initiative?',
              input_type: 'currency',
              validation: { required: true, data_type: 'currency' },
            },
          ],
        },
        {
          title: 'Learner Profile & Audience Context',
          description:
            'Understand learner strengths, experience, motivation, and learning preferences.',
          questions: [
            {
              id: 'Q8',
              question_text: 'What is the primary role of the target learners?',
              input_type: 'single_select',
              options: [
                'Individual Contributors',
                'Managers',
                'Executives',
                'Students',
                'Mixed Roles',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q9',
              question_text: 'What is the current experience level of the target audience?',
              input_type: 'single_select',
              options: ['Beginner', 'Intermediate', 'Advanced', 'Mixed Levels'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q10',
              question_text: 'What are the preferred learning styles of your audience?',
              input_type: 'multi_select',
              options: ['Visual', 'Auditory', 'Kinesthetic', 'Reading/Writing', 'Mixed'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q11',
              question_text: 'What motivates your learners to participate in this learning?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q12',
              question_text: 'How many learners will participate in this initiative?',
              input_type: 'slider',
              validation: { required: true, data_type: 'number' },
            },
            {
              id: 'Q13',
              question_text: 'What are the main challenges your learners face?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q14',
              question_text: 'What technology comfort level does your audience have?',
              input_type: 'single_select',
              options: ['Low', 'Medium', 'High', 'Mixed'],
              validation: { required: true, data_type: 'string' },
            },
          ],
        },
        {
          title: 'Resources, Tools, & Support Systems',
          description: 'Identify available personnel, technology, content, and budgets.',
          questions: [
            {
              id: 'Q15',
              question_text: 'What learning management system or platform will be used?',
              input_type: 'single_select',
              options: ['LMS', 'Custom Platform', 'Video Conferencing', 'In-Person', 'Mixed'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q16',
              question_text: 'What instructional design resources are available?',
              input_type: 'multi_select',
              options: [
                'Instructional Designer',
                'Subject Matter Expert',
                'Graphic Designer',
                'Video Producer',
                'External Vendor',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q17',
              question_text: 'What is the available budget for content development?',
              input_type: 'currency',
              validation: { required: true, data_type: 'currency' },
            },
            {
              id: 'Q18',
              question_text: 'What existing content or materials can be leveraged?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q19',
              question_text: 'What technology infrastructure is available?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q20',
              question_text: 'What support staff will be available during the learning initiative?',
              input_type: 'multi_select',
              options: [
                'Facilitator',
                'Technical Support',
                'Administrative Support',
                'Peer Mentors',
                'External Consultants',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q21',
              question_text: 'What is the budget for ongoing support and maintenance?',
              input_type: 'currency',
              validation: { required: true, data_type: 'currency' },
            },
          ],
        },
        {
          title: 'Timeline, Constraints, & Delivery Conditions',
          description: 'Define timeframes, priorities, delivery modes, and potential blockers.',
          questions: [
            {
              id: 'Q22',
              question_text: 'What is the target start date for this learning initiative?',
              input_type: 'calendar',
              validation: { required: true, data_type: 'date' },
            },
            {
              id: 'Q23',
              question_text: 'What is the target completion date?',
              input_type: 'calendar',
              validation: { required: true, data_type: 'date' },
            },
            {
              id: 'Q24',
              question_text: 'What are the main delivery constraints?',
              input_type: 'multi_select',
              options: [
                'Time Constraints',
                'Budget Limitations',
                'Technology Limitations',
                'Geographic Distribution',
                'Regulatory Requirements',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q25',
              question_text: 'What is the preferred delivery method?',
              input_type: 'single_select',
              options: [
                'In-Person',
                'Online Synchronous',
                'Online Asynchronous',
                'Blended',
                'Self-Paced',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q26',
              question_text: 'What are the main risks or blockers to success?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q27',
              question_text: 'How flexible is the timeline?',
              input_type: 'single_select',
              options: ['Very Flexible', 'Somewhat Flexible', 'Fixed', 'Very Tight'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q28',
              question_text: 'What is the maximum duration per learning session?',
              input_type: 'slider',
              validation: { required: true, data_type: 'number' },
            },
          ],
        },
        {
          title: 'Evaluation, Success Metrics & Long-Term Impact',
          description: 'Define success measurement, feedback loops, and sustainability.',
          questions: [
            {
              id: 'Q29',
              question_text: 'How will you measure the immediate impact of this learning?',
              input_type: 'multi_select',
              options: [
                'Knowledge Tests',
                'Skill Assessments',
                'Performance Reviews',
                'Feedback Surveys',
                'Observations',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q30',
              question_text: 'What are the key performance indicators (KPIs) for success?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q31',
              question_text: 'How will you measure long-term impact (3-6 months)?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q32',
              question_text: 'What feedback mechanisms will be in place?',
              input_type: 'multi_select',
              options: [
                'Regular Surveys',
                'Focus Groups',
                'One-on-One Interviews',
                'Peer Reviews',
                'Manager Feedback',
              ],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q33',
              question_text: 'How will you ensure the learning is sustained over time?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q34',
              question_text: 'What is the expected ROI timeline?',
              input_type: 'single_select',
              options: ['Immediate', '1-3 months', '3-6 months', '6-12 months', 'Long-term'],
              validation: { required: true, data_type: 'string' },
            },
            {
              id: 'Q35',
              question_text: 'How will you track and report progress to stakeholders?',
              input_type: 'text',
              validation: { required: true, data_type: 'string' },
            },
          ],
        },
      ],
    };
  }

  /**
   * Handles Ollama connection failures for dynamic questions.
   * @returns A promise that resolves with fallback DynamicQuestions.
   */
  public async handleOllamaDynamicQuestionsFailure(): Promise<DynamicQuestions> {
    console.error('Ollama connection failed. Providing fallback dynamic questions.');
    return this.getFallbackDynamicQuestions();
  }
}

export const blueprintFallbackService = new BlueprintFallbackService();
