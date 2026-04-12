import { streamText, UIMessage, convertToModelMessages, generateId } from 'ai';
import { getModel } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { chatMessages as dbMessages, starmapResponses, starmaps } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { STAGE_NAMES } from '@/lib/constants';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, starmapId }: { messages: UIMessage[]; modelId?: string; starmapId?: string } = body;

    console.log(`[Chat API] Turn started. Starmap: ${starmapId}, Messages: ${messages?.length}`);

    // Check authentication
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Fetch existing responses to provide as context
    let knowledgeBaseContext = '';
    let currentStage = 1;

    if (starmapId) {
      const existingResponses = await db.query.starmapResponses.findMany({
        where: eq(starmapResponses.starmapId, starmapId),
        orderBy: [asc(starmapResponses.stage)],
      });

      const starmap = await db.query.starmaps.findFirst({
        where: eq(starmaps.id, starmapId)
      });

      if (starmap?.context?.currentStage) {
        currentStage = Number(starmap.context.currentStage);
      } else if (existingResponses.length > 0) {
        currentStage = Math.max(...existingResponses.map(r => r.stage));
      }

      if (existingResponses.length > 0) {
        const knowledgeBase = existingResponses.map(r => ({
          stage: r.stage,
          key: r.questionId,
          value: r.answer
        }));
        knowledgeBaseContext = JSON.stringify(knowledgeBase, null, 2);
      }
    }

    const systemPrompt = DISCOVERY_SYSTEM_PROMPT
      .replace('[STARMAP_ID]', starmapId || 'NOT_PROVIDED')
      .replace('[STAGE_NUMBER]', currentStage.toString())
      .replace('[STAGE_NAME]', STAGE_NAMES[currentStage - 1] || 'Unknown')
      .replace('[KNOWLEDGE_BASE_JSON]', knowledgeBaseContext || '[]');

    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    const result = streamText({
      model: getModel(modelId),
      system: systemPrompt,
      messages: modelMessages,
      maxRetries: 5,
      tools: {
        askInteractiveQuestions: {
          description: 'Ask the user one or more structured questions using interactive UI elements (text, select, date, slider). During Stage 1, if you have enough info to name the project, include a "title" field in your next saveDiscoveryContext call.',
          inputSchema: z.object({
            questions: z.array(z.object({
              id: z.string(),
              type: z.enum(['text', 'textarea', 'select', 'slider', 'date']),
              label: z.string(),
              description: z.string().optional(),
              options: z.array(z.string()).optional(),
              min: z.number().optional(),
              max: z.number().optional(),
              required: z.boolean().default(true),
            })),
          }),
        },
        requestApproval: {
          description: 'Request user approval before proceeding to the next discovery stage.',
          inputSchema: z.object({
            stageNumber: z.number(),
            stageName: z.string(),
            keyFindings: z.array(z.object({
              label: z.string(),
              value: z.string(),
              icon: z.string().optional(),
            })),
            insight: z.string(),
            nextStage: z.string(),
          }),
        },
        setProjectParameters: {
          description: 'Request the user to set specific project parameters.',
          inputSchema: z.object({
            parameterName: z.string(),
            min: z.number().default(0),
            max: z.number().default(100),
            unit: z.string(),
            currentValue: z.number().optional(),
          }),
        },
        saveDiscoveryContext: {
          description: 'Save gathered discovery data to the database.',
          inputSchema: z.object({
            starmapId: z.string().uuid(),
            data: z.record(z.string(), z.unknown()),
          }),
          execute: async ({ starmapId: toolStarmapId, data }) => {
            try {
              const starmap = await db.query.starmaps.findFirst({
                where: and(eq(starmaps.id, toolStarmapId), eq(starmaps.userId, user.id))
              });

              if (!starmap) return { success: false, error: 'Unauthorized', persisted: false };

              const readableAnswer = data.answer || data.value || data.response || JSON.stringify(data);
              const questionId = data.questionId || data.id || 'discovery_context';
              
              await db.insert(starmapResponses).values({
                starmapId: toolStarmapId,
                questionId,
                answer: String(readableAnswer),
                stage: data.stage as number || 1,
                modelMessageId: data.messageId as string,
                metadata: data,
              });

              const contextUpdates: Record<string, unknown> = {};
              if (data.role) contextUpdates.role = data.role;
              if (data.goals || data.goal) contextUpdates.goals = data.goals || data.goal;
              if (data.industry) contextUpdates.industry = data.industry;
              if (data.organization || data.org) contextUpdates.organization = data.organization || data.org;
              if (data.title) contextUpdates.title = data.title;

              if (Object.keys(contextUpdates).length > 0) {
                await db.update(starmaps)
                  .set({ 
                    context: { ...starmap.context, ...contextUpdates },
                    ...(data.title ? { title: data.title } : {}),
                    updatedAt: new Date()
                  })
                  .where(eq(starmaps.id, toolStarmapId));
              }

              return { success: true, saved: true, persisted: true };
            } catch (error) {
              console.error('[saveDiscoveryContext] Error:', error);
              return { success: false, error: String(error), persisted: false };
            }
          },
        },
      },
    });

    return result.toUIMessageStreamResponse({
      originalMessages: messages,
      generateMessageId: () => generateId(),
      onFinish: async ({ messages: allMessages }) => {
        if (!starmapId) return;
        
        try {
          for (const msg of allMessages) {
            await db.insert(dbMessages).values({
              id: msg.id,
              starmapId,
              role: msg.role,
              parts: msg.parts as any,
            }).onConflictDoNothing({ target: dbMessages.id });
          }
          console.log(`[Chat API] Persisted all ${allMessages.length} messages.`);
        } catch (err) {
          console.error('[Chat API] Persistence Error:', err);
        }
      }
    });
  } catch (error) {
    console.error('[Chat API] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { status: 500 });
  }
}
