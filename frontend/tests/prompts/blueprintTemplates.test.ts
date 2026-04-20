import { describe, it, expect } from 'vitest';
import { generateSystemPrompt, generateUserPrompt } from '@/lib/prompts/blueprintTemplates';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

describe('blueprintTemplates', () => {
  it('should generate a basic system prompt', () => {
    const systemPrompt = generateSystemPrompt();
    expect(systemPrompt).toContain(
      'You are an AI assistant specialized in generating comprehensive learning blueprints.'
    );
  });

  it('should generate a system prompt with additional context', () => {
    const context = 'Focus on agile methodologies.';
    const systemPrompt = generateSystemPrompt(context);
    expect(systemPrompt).toContain(context);
  });

  it('should generate a user prompt from aggregated answers', () => {
    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [
        { questionId: 'learningObjective', answer: 'Build a web app' },
        { questionId: 'targetAudience', answer: 'Beginner developers' },
        { questionId: 'deliveryMethod', answer: 'online' },
        { questionId: 'duration', answer: 40 },
        { questionId: 'assessmentType', answer: 'Project-based' },
      ],
      dynamicResponses: [{ questionId: 'preferredStack', answer: 'React and Node.js' }],
    };

    const userPrompt = generateUserPrompt(aggregatedAnswers);
    expect(userPrompt).toContain('Learning Objective: Build a web app');
    expect(userPrompt).toContain('Target Audience: Beginner developers');
    expect(userPrompt).toContain('- preferredStack: React and Node.js');
    expect(userPrompt).toContain(
      'Ensure the output is a JSON object matching the BlueprintSchema, followed by its Markdown representation.'
    );
  });

  it('should handle aggregated answers with only static responses', () => {
    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [
        { questionId: 'learningObjective', answer: 'Learn Unit Testing' },
        { questionId: 'targetAudience', answer: 'Junior QA' },
        { questionId: 'deliveryMethod', answer: 'in-person' },
        { questionId: 'duration', answer: 8 },
        { questionId: 'assessmentType', answer: 'Written exam' },
      ],
      dynamicResponses: [],
    };

    const userPrompt = generateUserPrompt(aggregatedAnswers);
    expect(userPrompt).toContain('Learning Objective: Learn Unit Testing');
    expect(userPrompt).not.toContain('Dynamic Questions Responses:');
  });

  it('should handle aggregated answers with no responses gracefully', () => {
    const aggregatedAnswers: AggregatedAnswer = {
      staticResponses: [
        { questionId: 'learningObjective', answer: '' },
        { questionId: 'targetAudience', answer: '' },
        { questionId: 'deliveryMethod', answer: 'online' },
        { questionId: 'duration', answer: 0 },
        { questionId: 'assessmentType', answer: '' },
      ],
      dynamicResponses: [],
    };

    const userPrompt = generateUserPrompt(aggregatedAnswers);
    expect(userPrompt).toContain('Learning Objective: ');
    expect(userPrompt).not.toContain('Dynamic Questions Responses:');
  });
});
