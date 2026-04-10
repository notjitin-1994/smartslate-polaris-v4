import { streamObject } from 'ai';
import { getModel } from '@/lib/ai/models';
import { z } from 'zod';
import { db } from '@/lib/db';
import { starmaps } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';

export const maxDuration = 60;

const assumptionsSchema = z.object({
  assumptions: z.array(
    z.object({
      category: z.string().describe('e.g., Target Audience, Technical Constraints, Business Goal'),
      statement: z.string().describe('The critical assumption statement'),
      riskLevel: z.enum(['low', 'medium', 'high']).describe('Risk if this assumption is incorrect'),
    })
  ).describe('A list of critical assumptions based on the discovery process.'),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
You are an expert Learning Experience Architect. Review the following discovery notes from a 7-stage interview process.
Identify the critical assumptions being made about the project, audience, technical constraints, and goals.

Discovery Context:
${JSON.stringify(starmapData.context || {})}

Interview Responses:
${gatheredContext}

Generate a concise list of critical assumptions that the user must verify before the final Strategy Blueprint is generated.
Keep the list focused on high-impact, potentially risky assumptions.
    `;

    const result = streamObject({
      model: getModel(starmapData.modelId || undefined),
      schema: assumptionsSchema,
      prompt,
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error('[API] Error generating assumptions:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
