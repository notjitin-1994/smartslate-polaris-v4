import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import SharedBlueprintClient from './SharedBlueprintClient';
import type { BlueprintJSON } from '@/components/features/blueprints/types';
import type { Database } from '@/types/supabase';

interface PageProps {
  params: Promise<{ token: string }>;
}

interface BlueprintData {
  id: string;
  title: string;
  created_at: string;
  blueprint_json: BlueprintJSON;
  blueprint_markdown?: string;
}

/**
 * Server-side helper to fetch blueprint for metadata generation
 * Directly queries Supabase instead of making HTTP fetch to avoid SSR issues
 */
async function getSharedBlueprintForMetadata(token: string): Promise<BlueprintData | null> {
  try {
    console.log('[Share Metadata] Fetching blueprint for token:', token);

    // Create Supabase client with anon key for public access
    const supabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Fetch blueprint by share token - same logic as API route
    const { data: blueprint, error: fetchError } = await supabase
      .from('blueprint_generator')
      .select('id, blueprint_json, blueprint_markdown, title, created_at')
      .eq('share_token', token)
      .single();

    if (fetchError) {
      console.error('[Share Metadata] Database error:', fetchError);
      return null;
    }

    if (!blueprint) {
      console.log('[Share Metadata] Blueprint not found for token:', token);
      return null;
    }

    if (!blueprint.blueprint_json) {
      console.log('[Share Metadata] Blueprint has no JSON data');
      return null;
    }

    console.log('[Share Metadata] Successfully fetched metadata for:', blueprint.title);
    return blueprint as BlueprintData;
  } catch (error) {
    console.error('[Share Metadata] Error fetching blueprint for metadata:', error);
    return null;
  }
}

/**
 * Generate metadata for SEO and Open Graph tags
 * Runs on the server to populate social media previews
 */
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;
  const blueprint = await getSharedBlueprintForMetadata(token);

  if (!blueprint) {
    return {
      title: 'Blueprint Not Found | Smartslate Polaris',
      description: 'The blueprint you are looking for does not exist or is no longer shared.',
    };
  }

  // Extract executive summary for description
  const executiveSummary =
    typeof blueprint.blueprint_json?.executive_summary === 'string'
      ? blueprint.blueprint_json.executive_summary
      : blueprint.blueprint_json?.executive_summary?.content ||
        'AI-generated learning blueprint by Smartslate Polaris';

  // Get first line of executive summary, limited to 160 characters
  const description = executiveSummary
    .split('\n')[0]
    .replace(/[#*_`]/g, '') // Remove markdown formatting
    .slice(0, 160)
    .trim();

  const title = blueprint.title || 'Learning Blueprint';
  const fullTitle = `${title} | Smartslate Polaris`;

  // Get base URL for Open Graph
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
  const url = `${baseUrl}/share/${token}`;

  return {
    title: fullTitle,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      url,
      siteName: 'Smartslate Polaris',
      locale: 'en_US',
      images: [
        {
          url: `${baseUrl}/og-image.png`, // You should create an OG image
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${baseUrl}/og-image.png`],
      creator: '@smartslate',
      site: '@smartslate',
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

/**
 * Page component - renders client-side for better reliability
 * The metadata is still generated server-side for SEO
 */
export default async function SharedBlueprintPage({ params }: PageProps) {
  const { token } = await params;

  // Simply pass the token to the client component
  // Client component will fetch the data for more reliable error handling
  return <SharedBlueprintClient token={token} />;
}
