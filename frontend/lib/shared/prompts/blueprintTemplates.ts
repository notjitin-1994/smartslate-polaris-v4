import { z } from 'zod';
import { AggregatedAnswer } from '@/lib/services/answerAggregation';

// Define a schema for validating the prompt input data
const promptInputSchema = z.object({
  learningObjective: z.string(),
  targetAudience: z.string(),
  deliveryMethod: z.string(),
  duration: z.number(),
  assessmentType: z.string(),
  dynamicResponses: z.record(z.string(), z.any()).optional(), // Assuming dynamic responses are key-value pairs
});

export type PromptInput = z.infer<typeof promptInputSchema>;

// Base system prompt for consistent blueprint generation
const SYSTEM_PROMPT_BASE = `You are an AI assistant specialized in generating comprehensive learning blueprints.
Your goal is to create a detailed, structured, and engaging learning plan based on the user's input.
The output should be a JSON object conforming to the BlueprintSchema, followed by a Markdown representation.
Ensure the blueprint is practical, objective-driven, and tailored to the specified audience and delivery method.`;

// Function to generate the system prompt, allowing for dynamic context injection
export function generateSystemPrompt(context?: string): string {
  return context ? `${SYSTEM_PROMPT_BASE}\n\nAdditional Context: ${context}` : SYSTEM_PROMPT_BASE;
}

// Function to generate the user prompt based on aggregated answers
export function generateUserPrompt(aggregatedAnswers: AggregatedAnswer): string {
  const { staticResponses, dynamicResponses } = aggregatedAnswers;

  const staticMap = staticResponses.reduce(
    (acc, curr) => {
      acc[curr.questionId] = curr.answer;
      return acc;
    },
    {} as Record<string, any>
  );

  // Validate the static part against our known static questions schema for type safety
  const validatedStatic = promptInputSchema
    .pick({
      learningObjective: true,
      targetAudience: true,
      deliveryMethod: true,
      duration: true,
      assessmentType: true,
    })
    .parse(staticMap);

  const dynamicMap = dynamicResponses.reduce(
    (acc, curr) => {
      acc[curr.questionId] = curr.answer;
      return acc;
    },
    {} as Record<string, any>
  );

  const promptData: PromptInput = {
    ...validatedStatic,
    dynamicResponses: dynamicMap,
  };

  promptInputSchema.parse(promptData); // Final validation of the combined prompt input

  let prompt = `Generate a learning blueprint based on the following information:\n\n`;

  prompt += `Learning Objective: ${promptData.learningObjective}\n`;
  prompt += `Target Audience: ${promptData.targetAudience}\n`;
  prompt += `Delivery Method: ${promptData.deliveryMethod}\n`;
  prompt += `Duration: ${promptData.duration} hours\n`;
  prompt += `Assessment Type: ${promptData.assessmentType}\n`;

  if (Object.keys(promptData.dynamicResponses || {}).length > 0) {
    prompt += `\nDynamic Questions Responses:\n`;
    for (const [key, value] of Object.entries(promptData.dynamicResponses!)) {
      prompt += `- ${key}: ${value}\n`;
    }
  }

  prompt += `\nEnsure the output is a JSON object matching the BlueprintSchema, followed by its Markdown representation.`;

  return prompt;
}

// TODO: Implement advanced prompt features:
// - Implement prompt variations for different learning objectives or complexities.
// - Add context-aware prompt optimization based on answer complexity.
// - Create a prompt validation and testing framework (e.g., using unit tests).
// - Implement A/B testing system for prompt effectiveness.
// - Add prompt versioning for rollback capabilities.
