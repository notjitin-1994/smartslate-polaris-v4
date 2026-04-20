import { Metadata } from 'next';

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ [key: string]: string[] }>;
}

export async function generateSharePageMetadata({ params }: PageProps): Promise<Metadata> {
  const { token } = await params;

  try {
    // Fetch blueprint data for metadata
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/api/blueprints/share/${token}`,
      {
        cache: 'no-store', // Ensure fresh data for metadata
      }
    );

    if (response.ok) {
      const result = await response.json();
      const blueprint = result.blueprint;

      // Parse blueprint data
      let blueprintData = null;
      if (blueprint?.blueprint_json) {
        blueprintData =
          typeof blueprint.blueprint_json === 'string'
            ? JSON.parse(blueprint.blueprint_json)
            : blueprint.blueprint_json;
      }

      const title = blueprint?.title || 'Learning Blueprint';

      // Extract executive summary for description
      let description = 'Interactive learning blueprint created with SmartSlate Polaris';
      if (blueprintData?.executive_summary?.content) {
        // Strip HTML and limit to 160 characters
        const cleanSummary = blueprintData.executive_summary.content
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim();
        description =
          cleanSummary.length > 160 ? cleanSummary.substring(0, 157) + '...' : cleanSummary;
      }

      return {
        title: `${title} - Learning Blueprint`,
        description,
        openGraph: {
          title: `${title} - Learning Blueprint`,
          description,
          type: 'article',
          url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/share/${token}`,
          siteName: 'SmartSlate Polaris',
          images: [
            {
              url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/images/og-blueprint.png`,
              width: 1200,
              height: 630,
              alt: title,
            },
          ],
        },
        twitter: {
          card: 'summary_large_image',
          title: `${title} - Learning Blueprint`,
          description,
          images: [
            `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002'}/images/og-blueprint.png`,
          ],
        },
      };
    }
  } catch (error) {
    console.error('Failed to generate metadata:', error);
  }

  // Fallback metadata
  return {
    title: 'Learning Blueprint - SmartSlate Polaris',
    description: 'Interactive learning blueprint created with SmartSlate Polaris',
  };
}
