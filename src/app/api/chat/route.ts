import { streamText, UIMessage, convertToModelMessages, generateId } from 'ai';
import { getModel } from '@/lib/ai/models';
import { DISCOVERY_SYSTEM_PROMPT } from '@/lib/ai/prompts';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { STAGE_NAMES } from '@/lib/constants';

// Vercel Edge Runtime for absolute speed and proximity
export const runtime = 'edge';

// Allow streaming responses up to 60 seconds
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, modelId, starmapId }: { messages: UIMessage[]; modelId?: string; starmapId?: string } = body;

    // 1. Initial Handshake & Auth (Parallelized)
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // 2. Fetch Context using Edge-Safe HTTP Client (Admin for speed and bypassing RLS complexity)
    const admin = createAdminClient();
    
    const [responsesData, starmapData] = await Promise.all([
      starmapId 
        ? admin.from('starmap_responses').select('*').eq('starmap_id', starmapId).order('stage', { ascending: true })
        : Promise.resolve({ data: [] }),
      starmapId
        ? admin.from('starmaps').select('*').eq('id', starmapId).single()
        : Promise.resolve({ data: null })
    ]);

    const existingResponses = responsesData.data || [];
    const starmap = starmapData.data;

    let currentStage = 1;
    let knowledgeBaseContext = '[]';

    if (starmap?.context?.currentStage) {
      currentStage = Number(starmap.context.currentStage);
    } else if (existingResponses.length > 0) {
      currentStage = Math.max(...existingResponses.map(r => r.stage));
    }

    if (existingResponses.length > 0) {
      const knowledgeBase = existingResponses.map(r => ({
        stage: r.stage,
        key: r.question_id, // Map database snake_case to KB camelCase if needed
        value: r.answer
      }));
      knowledgeBaseContext = JSON.stringify(knowledgeBase, null, 2);
    }

    const systemPrompt = DISCOVERY_SYSTEM_PROMPT
      .replace('[STARMAP_ID]', starmapId || 'NOT_PROVIDED')
      .replace('[STAGE_NUMBER]', currentStage.toString())
      .replace('[STAGE_NAME]', STAGE_NAMES[currentStage - 1] || 'Unknown')
      .replace('[KNOWLEDGE_BASE_JSON]', knowledgeBaseContext);

    const modelMessages = await convertToModelMessages(messages as UIMessage[]);

    const result = streamText({
      model: getModel(modelId),
      system: systemPrompt,
      messages: modelMessages,
      maxRetries: 5,
      tools: {
        askInteractiveQuestions: {
          description: 'Ask the user structured questions using interactive UI. ZERO prose preambles.',
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
          description: 'Request approval for stage transition. ZERO prose preambles.',
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
          description: 'Save gathered discovery data.',
          inputSchema: z.object({
            starmapId: z.string().uuid(),
            data: z.record(z.string(), z.unknown()),
          }),
          execute: async ({ starmapId: toolStarmapId, data }) => {
            try {
              // Verify ownership via admin client
              const { data: starmapRef } = await admin.from('starmaps').select('*').eq('id', toolStarmapId).eq('user_id', user.id).single();

              if (!starmapRef) return { success: false, error: 'Unauthorized', persisted: false };

              const readableAnswer = data.answer || data.value || data.response || JSON.stringify(data);
              const questionId = data.questionId || data.id || 'discovery_context';
              
              // Persist response
              await admin.from('starmap_responses').insert({
                starmap_id: toolStarmapId,
                question_id: questionId,
                answer: String(readableAnswer),
                stage: data.stage as number || 1,
                model_message_id: data.messageId as string,
                metadata: data,
              });

              // Update context
              const contextUpdates: Record<string, unknown> = {};
              if (data.role) contextUpdates.role = data.role;
              if (data.goals || data.goal) contextUpdates.goals = data.goals || data.goal;
              if (data.industry) contextUpdates.industry = data.industry;
              if (data.organization || data.org) contextUpdates.organization = data.organization || data.org;
              if (data.title) contextUpdates.title = data.title;

              if (Object.keys(contextUpdates).length > 0) {
                await admin.from('starmaps').update({ 
                  context: { ...starmapRef.context, ...contextUpdates },
                  ...(data.title ? { title: data.title } : {}),
                  updated_at: new Date().toISOString()
                }).eq('id', toolStarmapId);
              }

              return { success: true, saved: true, persisted: true };
            } catch (error) {
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
          // Parallelized Edge-Safe Persistence
          await Promise.all(allMessages.map(msg => 
            admin.from('chat_messages').upsert({
              id: msg.id,
              starmap_id: starmapId,
              role: msg.role,
              parts: msg.parts as any,
            })
          ));
        } catch (err) {
          console.error('[Chat API] Persistence Error:', err);
        }
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Internal Server Error' }), { status: 500 });
  }
}
