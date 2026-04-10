import { streamText, tool } from 'ai';
import { getModel, providerOptions } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, modelId } = await req.json();

  const result = streamText({
    model: getModel(modelId),
    system: DISCOVERY_SYSTEM_PROMPT,
    messages,
    tools: {
      requestApproval: tool({
        description: 'Request user approval before proceeding to the next discovery stage.',
        parameters: z.object({
          summary: z.string().description('A summary of what has been learned in the current stage.'),
          nextStage: z.string().description('The name of the next discovery stage.'),
        }),
        // Human-in-the-Loop: this tool requires explicit client-side interaction
      }),
      saveDiscoveryContext: tool({
        description: 'Save gathered discovery data to the database.',
        parameters: z.object({
          starmapId: z.string().uuid(),
          data: z.record(z.any()),
        }),
        execute: async ({ starmapId, data }) => {
          // Implementation for database saving
          return { success: true };
        }
      })
    },
    // Prompt caching for supported models
    experimental_providerMetadata: {
      anthropic: providerOptions.anthropic,
    },
  });

  return result.toDataStreamResponse();
}
