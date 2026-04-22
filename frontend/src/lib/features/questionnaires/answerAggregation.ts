import { z } from 'zod';
import { useWizardStore } from '@/store/wizardStore';
import { useFormStore } from '@/lib/dynamic-form/store/formStore';
import { StaticQuestionsFormValues, FormState } from './types';

// Define schemas for static and dynamic answers. These will be more detailed later.
const staticAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.any(),
});

const dynamicAnswerSchema = z.object({
  questionId: z.string(),
  answer: z.any(),
});

// Unified data structure for aggregated answers
const aggregatedAnswerSchema = z.object({
  staticResponses: z.array(staticAnswerSchema),
  dynamicResponses: z.array(dynamicAnswerSchema),
  // Add other aggregated fields as needed
});

export type StaticAnswer = z.infer<typeof staticAnswerSchema>;
export type DynamicAnswer = z.infer<typeof dynamicAnswerSchema>;
export type AggregatedAnswer = z.infer<typeof aggregatedAnswerSchema>;

class AnswerAggregationService {
  private cache: Map<string, AggregatedAnswer>;

  constructor() {
    this.cache = new Map();
  }

  // Aggregates answers from the static questions wizard
  public async aggregateStaticAnswers(): Promise<StaticAnswer[]> {
    console.log('Aggregating static answers...');
    const staticFormValues = useWizardStore.getState().values;

    // Convert static form values to a consistent StaticAnswer[] format
    const staticResponses: StaticAnswer[] = Object.entries(staticFormValues).map(
      ([questionId, answer]) => ({
        questionId,
        answer: this.validateAndSanitize(answer),
      })
    );

    staticResponses.forEach((answer) => staticAnswerSchema.parse(answer));
    return staticResponses;
  }

  // Aggregates answers from the dynamic questions API
  public async aggregateDynamicAnswers(): Promise<DynamicAnswer[]> {
    console.log('Aggregating dynamic answers...');
    const dynamicFormData = useFormStore.getState().formData;

    // Convert dynamic form data to a consistent DynamicAnswer[] format
    const dynamicResponses: DynamicAnswer[] = Object.entries(dynamicFormData).map(
      ([questionId, answer]) => ({
        questionId,
        answer: this.validateAndSanitize(answer),
      })
    );

    dynamicResponses.forEach((answer) => dynamicAnswerSchema.parse(answer));
    return dynamicResponses;
  }

  // Combines static and dynamic answers into a unified structure
  public async getAggregatedAnswers(): Promise<AggregatedAnswer> {
    // For caching, we would ideally hash the complete state of both stores or their relevant parts
    // For simplicity, we'll skip direct caching inside this function for now.
    // Caching will be handled at a higher level if needed, or by Zustand's persistence.

    const staticResponses = await this.aggregateStaticAnswers();
    const dynamicResponses = await this.aggregateDynamicAnswers();

    const aggregated = {
      staticResponses,
      dynamicResponses,
    };

    aggregatedAnswerSchema.parse(aggregated); // Validate unified structure
    console.log('Aggregated new answers.');
    return aggregated;
  }

  // Clears the cache (if any external caching mechanism is used)
  public clearCache(): void {
    this.cache.clear(); // Clear internal cache if still used for other purposes
    console.log('Answer aggregation cache cleared and stores reset.');
  }

  // Generic data validation and sanitization (simplified for now)
  private validateAndSanitize(data: any): any {
    // Implement robust validation and sanitization logic here.
    // Examples: trim strings, parse numbers, validate dates, strip HTML tags.
    if (typeof data === 'string') {
      return data.trim();
    }
    // More complex validation/sanitization would go here
    return data;
  }
}

export const answerAggregationService = new AnswerAggregationService();
