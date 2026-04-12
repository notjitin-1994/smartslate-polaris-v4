import { streamText, UIMessage, convertToModelMessages, generateId, smoothStream } from 'ai';
import { getModel } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { db } from '@/lib/db';
import { chatMessages as dbMessages, starmapResponses, starmaps } from '@/lib/db/schema';
import { eq, and, asc } from 'drizzle-orm';
import { STAGE_NAMES } from '@/lib/constants';

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, starmapId }: { messages: UIMessage[]; modelId?: string; starmapId?: string } = body;

    console.log(`[Chat API] Turn started. Starmap: ${starmapId}, Messages: ${messages?.length}`);
    
    // Log the last few messages to see the state
    if (messages && messages.length > 0) {
      const lastFew = messages.slice(-2);
      lastFew.forEach((m, i) => {
        console.log(`  [Message ${i}] Role: ${m.role}, Parts: ${m.parts?.length}`);
        m.parts?.forEach((p, pi) => {
          if (p.type === 'text') console.log(`    [Part ${pi}] Text: ${p.text.substring(0, 50)}...`);
          if (p.type === 'tool-invocation') console.log(`    [Part ${pi}] Tool: ${(p as any).toolName}, ID: ${(p as any).toolCallId}`);
          if (p.type === 'tool-result') console.log(`    [Part ${pi}] Result for: ${(p as any).toolName}, ID: ${(p as any).toolCallId}`);
        });
      });
    }

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

    const result = streamText({
      model: getModel(modelId),
      system: systemPrompt,
      messages: await convertToModelMessages(messages as UIMessage[]),
      experimental_transform: smoothStream({ chunking: 'word', delayInMs: 30 }),
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
      generateMessageId: () => generateId(),
      onFinish: async ({ responseMessage }) => {
        console.log(`[Chat API] Stream finished. Message: ${responseMessage.id}, Parts: ${responseMessage.parts.length}`);
        if (starmapId && responseMessage) {
          try {
            const processedParts = responseMessage.parts.map(part => {
              if (part.type === 'tool-result') {
                const toolPart = part as any;
                const isPersisted = toolPart.result?.persisted === true;
                const toolName = toolPart.toolName;
                const semanticResult = `[TOOL_RESULT tool="${toolName}" stage="${currentStage}" persisted="${isPersisted}"]\n${JSON.stringify(toolPart.result)}\n[/TOOL_RESULT]`;
                return { ...toolPart, result: semanticResult };
              }
              return part;
            });

            await db.insert(dbMessages).values({
              id: responseMessage.id,
              starmapId,
              role: responseMessage.role,
              parts: processedParts as any,
            }).onConflictDoNothing({ target: dbMessages.id });
            console.log('[Chat API] Assistant message persisted');
          } catch (err) {
            console.error('[Chat API] Persistence Error:', err);
          }
        }
      }
    });
  } catch (error) {
    console.error('[Chat API] Fatal Error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { status: 500 });
  }
}
