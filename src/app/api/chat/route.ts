import { streamText, UIMessage, convertToModelMessages } from 'ai';
import { getModel } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, modelId }: { messages: UIMessage[]; modelId?: string } = await req.json();

  const result = streamText({
    model: getModel(modelId),
    system: DISCOVERY_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages as UIMessage[]),
    tools: {
      // Client-side tool: requests user approval before transitioning stages
      requestApproval: {
        description: 'Request user approval before proceeding to the next discovery stage.',
        inputSchema: z.object({
          summary: z.string().describe('A summary of what has been learned in the current stage.'),
          nextStage: z.string().describe('The name of the next discovery stage.'),
        }),
      },
      // Server-side tool: persists discovery data
      saveDiscoveryContext: {
        description: 'Save gathered discovery data to the database.',
        inputSchema: z.object({
          starmapId: z.string().uuid(),
          data: z.record(z.string(), z.any()),
        }),
        execute: async ({ starmapId, data }) => {
          const { db } = await import('@/lib/db');
          const { starmapResponses } = await import('@/lib/db/schema');

          try {
            // Insert discovery data into database
            await db.insert(starmapResponses).values({
              starmapId,
              questionId: data.questionId as string || 'discovery_context',
              answer: JSON.stringify(data),
              stage: data.stage as number || 1,
              modelMessageId: data.messageId as string,
              metadata: data.metadata as Record<string, unknown> || {},
            });

            return { success: true, saved: true };
          } catch (error) {
            console.error('[saveDiscoveryContext] Error:', error);
            return { success: false, saved: false, error: String(error) };
          }
        },
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
