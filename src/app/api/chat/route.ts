import { streamText, UIMessage, convertToModelMessages, generateId } from 'ai';
import { getModel } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, modelId, starmapId }: { messages: UIMessage[]; modelId?: string; starmapId?: string } = await req.json();

    console.log('[Chat API] Request received:', { 
      modelId, 
      starmapId, 
      messageCount: messages?.length
    });

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const { db } = await import('@/lib/db');
    const { messages: dbMessages } = await import('@/lib/db/schema');

    // Save the latest user message if starmapId is provided
    if (starmapId) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.role === 'user') {
        try {
          await db.insert(dbMessages).values({
            id: lastMessage.id,
            starmapId,
            role: lastMessage.role,
            parts: lastMessage.parts as any,
          }).onConflictDoNothing({ target: dbMessages.id }); // Prevent duplicates on retries
        } catch (err) {
          console.error('[Chat API] Error saving user message:', err);
        }
      }
    }

    const result = streamText({
      model: getModel(modelId),
      system: `${DISCOVERY_SYSTEM_PROMPT}\n\nCURRENT STARMAP ID: ${starmapId || 'NOT_PROVIDED'}`,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: {
        // Generative UI Tool: asks interactive questions using forms
        askInteractiveQuestions: {
          description: 'Ask the user one or more structured questions using interactive UI elements (text, select, date, slider). Use this instead of asking text questions when you need specific, structured data.',
          inputSchema: z.object({
            questions: z.array(z.object({
              id: z.string().describe('Unique identifier for this question.'),
              type: z.enum(['text', 'textarea', 'select', 'slider', 'date']).describe('The type of UI input to render.'),
              label: z.string().describe('The question or prompt to show the user.'),
              description: z.string().optional().describe('Optional helper text.'),
              options: z.array(z.string()).optional().describe('Required if type is "select". List of options to choose from.'),
              min: z.number().optional().describe('Minimum value for a slider.'),
              max: z.number().optional().describe('Maximum value for a slider.'),
              required: z.boolean().default(true).describe('Whether the user must answer this question before submitting.'),
            })).describe('Array of questions to present to the user.'),
          }),
        },
        // Client-side tool: requests user approval before transitioning stages
        requestApproval: {
          description: 'Request user approval before proceeding to the next discovery stage.',
          inputSchema: z.object({
            summary: z.string().describe('A summary of what has been learned in the current stage.'),
            nextStage: z.string().describe('The name of the next discovery stage.'),
          }),
        },
        // Generative UI Tool: requests specific numeric/selection parameters
        setProjectParameters: {
          description: 'Request the user to set specific project parameters like budget and duration using a specialized UI slider.',
          inputSchema: z.object({
            parameterName: z.string().describe('The name of the parameter to set (e.g., budget, duration).'),
            min: z.number().default(0),
            max: z.number().default(100),
            unit: z.string().describe('The unit of measurement (e.g., USD, Weeks, Hours).'),
            currentValue: z.number().optional(),
          }),
        },
        // Server-side tool: persists discovery data
        saveDiscoveryContext: {
          description: 'Save gathered discovery data to the database.',
          inputSchema: z.object({
            starmapId: z.string().uuid().describe('The ID of the starmap to save to.'),
            data: z.record(z.string(), z.unknown()),
          }),
          execute: async ({ starmapId: toolStarmapId, data }) => {
            const { db: toolDb } = await import('@/lib/db');
            const { starmapResponses, starmaps } = await import('@/lib/db/schema');
            const { eq, and } = await import('drizzle-orm');

            try {
              // VERIFY OWNERSHIP before saving
              const starmap = await toolDb.query.starmaps.findFirst({
                where: and(
                  eq(starmaps.id, toolStarmapId),
                  eq(starmaps.userId, user.id)
                )
              });

              if (!starmap) {
                return { success: false, saved: false, error: 'Unauthorized or Starmap not found' };
              }

              // Extract a human-readable answer if present, otherwise fallback to a summary
              const readableAnswer = data.answer || data.value || data.response || JSON.stringify(data);
              const questionId = data.questionId || data.id || 'discovery_context';
              
              // Insert discovery data into database
              await toolDb.insert(starmapResponses).values({
                starmapId: toolStarmapId,
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
                await toolDb.update(starmaps)
                  .set({ 
                    context: { ...starmap.context, ...contextUpdates },
                    ...(data.title ? { title: data.title } : {}),
                    updatedAt: new Date()
                  })
                  .where(eq(starmaps.id, toolStarmapId));
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

    return result.toUIMessageStreamResponse({
      generateMessageId: () => generateId(),
      onFinish: async ({ responseMessage }) => {
        if (starmapId && responseMessage) {
          try {
            await db.insert(dbMessages).values({
              id: responseMessage.id,
              starmapId,
              role: responseMessage.role,
              parts: responseMessage.parts as any,
            }).onConflictDoNothing({ target: dbMessages.id });
          } catch (err) {
            console.error('[Chat API] Error saving assistant response:', err);
          }
        }
      }
    });
  } catch (error) {
    console.error('[Chat API] Fatal Error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
