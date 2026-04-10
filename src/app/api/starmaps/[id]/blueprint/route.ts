import { streamObject } from 'ai';
import { getModel } from '@/lib/ai/models';
import { z } from 'zod';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const maxDuration = 120; // Generating the full blueprint takes longer

// Ensure the schema is clean and matches the expected Starmap structure
const blueprintSchema = z.object({
  title: z.string().describe('A catchy, descriptive title for the learning initiative.'),
  executiveSummary: z.string().describe('High-level summary of the strategy and intended impact.'),
  targetAudience: z.array(z.string()).describe('Key audience personas or segments.'),
  learningObjectives: z.array(z.string()).describe('Clear, measurable learning outcomes.'),
  curriculumPath: z.array(
    z.object({
      moduleName: z.string(),
      description: z.string(),
      deliveryFormat: z.string().describe('e.g., E-Learning, ILT, Microlearning, Blended'),
    })
  ).describe('High-level modular breakdown of the content.'),
  techStack: z.array(z.string()).describe('Technologies or platforms required for delivery.'),
  successMetrics: z.array(z.string()).describe('KPIs and metrics for evaluating success.'),
  risksAndMitigations: z.array(
    z.object({
      risk: z.string(),
      mitigation: z.string(),
    })
  ).describe('Identified risks and how to handle them.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { approvedAssumptions } = body;
    
    // Fetch starmap with responses to provide context to the AI
    const starmapData = await db.query.starmaps.findFirst({
      where: eq(starmaps.id, id),
      with: {
        starmapResponses: {
          orderBy: (responses, { asc }) => [asc(responses.createdAt)],
        },
      },
    });

    if (!starmapData) {
      return new Response('Starmap not found', { status: 404 });
    }

    // Format the gathered context
    const gatheredContext = starmapData.starmapResponses
      .map(r => `[Stage ${r.stage}] User Answer: ${r.answer}`)
      .join('\n\n');

    const prompt = `
You are an expert Learning Experience Architect. Synthesize the following discovery notes into a comprehensive, actionable "Strategy Blueprint" (Starmap).

Discovery Context:
${JSON.stringify(starmapData.context || {})}

Verified Assumptions:
${JSON.stringify(approvedAssumptions || [])}

Interview Responses:
${gatheredContext}

Generate a final, polished Strategy Blueprint based strictly on this information.
Ensure the tone is professional, strategic, and ready for stakeholder review.
    `;

    // Note: We use streamObject because we want the UI to see it building live.
    // However, we also need to save the final result to the database.
    // The Vercel AI SDK 6 allows us to use an `onFinish` callback to do so.
    
    const result = streamObject({
      model: getModel(starmapData.modelId || undefined),
      schema: blueprintSchema,
      prompt,
      onFinish: async ({ object }) => {
        if (object) {
          try {
            await db.update(starmaps).set({
              blueprint: object,
              status: 'completed', // Mark as completed once the blueprint is generated
              title: object.title || starmapData.title,
            }).where(eq(starmaps.id, id));
          } catch (e) {
            console.error('[Blueprint] Failed to save final blueprint to DB:', e);
          }
        }
      }
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[API] Error generating blueprint:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
