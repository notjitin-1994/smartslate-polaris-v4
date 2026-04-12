import { streamText, UIMessage, convertToModelMessages, generateId } from 'ai';
import { getModel } from '@/lib/ai/models';
import { getSystemPrompt } from '@/lib/ai/prompts';
import { z } from 'zod';
import { getSafeServerClient, getSafeAdminClient } from '@/lib/supabase/registry';
import { STAGE_NAMES } from '@/lib/constants';

export const runtime = 'edge';
export const maxDuration = 60;

export async function POST(req: Request) {
  const responseHeaders = new Headers({
    'X-Accel-Buffering': 'no',
    'Content-Encoding': 'none',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache, no-transform',
  });

  try {
    const { messages, modelId, starmapId }: { messages: UIMessage[]; modelId?: string; starmapId?: string } = await req.json();

    // 1. Safe Auth & Context
    const supabase = await getSafeServerClient();
    const admin = getSafeAdminClient();
    
    const [authResult, contextResult] = await Promise.all([
      supabase.auth.getUser(),
      starmapId 
        ? Promise.all([
            admin.from('starmap_responses').select('stage, question_id, answer').eq('starmap_id', starmapId).order('stage', { ascending: true }),
            admin.from('starmaps').select('context').eq('id', starmapId).single()
          ])
        : Promise.resolve([{ data: [] }, { data: null }])
    ]);

    const user = authResult.data?.user;
    if (!user) return new Response('Unauthorized', { status: 401 });

    const [responsesData, starmapData] = contextResult as any;
    const existingResponses = responsesData.data || [];
    const starmap = starmapData.data;

    // 2. Build Intelligent Prompt
    const currentStage = Number(starmap?.context?.currentStage || (existingResponses.length > 0 ? Math.max(...existingResponses.map((r: any) => r.stage)) : 1));
    const knowledgeBaseContext = JSON.stringify(existingResponses.map((r: any) => ({ stage: r.stage, key: r.question_id, value: r.answer })), null, 2);

    const systemPrompt = getSystemPrompt(
      starmapId || 'NEW_STARMAP',
      currentStage,
      STAGE_NAMES[currentStage - 1] || 'Unknown',
      knowledgeBaseContext
    );

    const modelMessages = await convertToModelMessages(messages);

    // 3. Ultra-Fast Inference
    const result = streamText({
      model: getModel(modelId),
      system: systemPrompt,
      messages: modelMessages,
      maxRetries: 5,
      temperature: 0.1,
      tools: {
        askInteractiveQuestions: {
          description: 'Ask structured questions via Generative UI.',
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
          description: 'Request stage confirmation.',
          inputSchema: z.object({
            stageNumber: z.number(),
            stageName: z.string(),
            keyFindings: z.array(z.object({ label: z.string(), value: z.string(), icon: z.string().optional() })),
            insight: z.string(),
            nextStage: z.string(),
          }),
        },
        saveDiscoveryContext: {
          description: 'Persist data points.',
          inputSchema: z.object({
            starmapId: z.string().uuid(),
            data: z.record(z.string(), z.unknown()),
          }),
          execute: async () => ({ success: true, pending: true })
        },
      },
    });

    return result.toUIMessageStreamResponse({
      headers: responseHeaders,
      originalMessages: messages,
      generateMessageId: () => generateId(),
      onFinish: async ({ messages: finalMessages }) => {
        if (!starmapId) return;
        try {
          // Fire-and-forget parallel persistence
          await Promise.all(finalMessages.map(msg => 
            admin.from('chat_messages').upsert({
              id: msg.id,
              starmap_id: starmapId,
              role: msg.role,
              parts: msg.parts as any,
            })
          ));
        } catch (e) {
          console.error('[Async Persistence] Failed:', e);
        }
      }
    });
  } catch (error) {
    console.error('[Chat API] Fatal Error:', error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), { status: 500 });
  }
}
