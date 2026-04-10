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
          data: z.record(z.string(), z.unknown()),
        }),
        execute: async ({ starmapId, data }) => {
          const { db } = await import('@/lib/db');
          const { starmapResponses, starmaps } = await import('@/lib/db/schema');
          const { eq } = await import('drizzle-orm');

          try {
            // Extract a human-readable answer if present, otherwise fallback to a summary
            const readableAnswer = data.answer || data.value || data.response || JSON.stringify(data);
            const questionId = data.questionId || data.id || 'discovery_context';
            
            // Insert discovery data into database
            await db.insert(starmapResponses).values({
              starmapId,
              questionId,
              answer: String(readableAnswer),
              stage: data.stage as number || 1,
              modelMessageId: data.messageId as string,
              metadata: data,
            });

            // If the data contains high-level context, update the starmap record
            const contextUpdates: Record<string, unknown> = {};
            if (data.role) contextUpdates.role = data.role;
            if (data.goals || data.goal) contextUpdates.goals = data.goals || data.goal;
            if (data.industry) contextUpdates.industry = data.industry;
            if (data.organization || data.org) contextUpdates.organization = data.organization || data.org;
            if (data.title) contextUpdates.title = data.title;

            if (Object.keys(contextUpdates).length > 0) {
              await db.update(starmaps)
                .set({ 
                  context: contextUpdates,
                  // Also update title if provided
                  ...(data.title ? { title: data.title } : {})
                })
                .where(eq(starmaps.id, starmapId));
            }

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
