/**
 * Dynamic Open Graph Image Generation
 * Generates custom social media preview images for shared blueprints
 */

import { ImageResponse } from 'next/og';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const alt = 'Smartslate Polaris - Learning Blueprint';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function Image({ params }: Props) {
  try {
    const { token } = await params;

    // Create Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Check if token is a slug or regular token
    const isSlug = !token.includes('_') && token.length < 32;

    // Fetch share link data
    const { data: shareLink } = await supabase
      .from('share_links')
      .select('custom_title, custom_description, custom_image_url, blueprint_id')
      .eq(isSlug ? 'share_slug' : 'share_token', token)
      .eq('is_active', true)
      .single();

    // Fetch blueprint data if share link found
    let blueprintData = null;
    if (shareLink?.blueprint_id) {
      const { data } = await supabase
        .from('blueprint_generator')
        .select('title, blueprint_json')
        .eq('id', shareLink.blueprint_id)
        .single();
      blueprintData = data;
    }

    // Extract data for the image
    const title = shareLink?.custom_title || blueprintData?.title || 'Learning Blueprint';

    // Safely extract description from executive_summary
    let description =
      shareLink?.custom_description ||
      'AI-powered learning blueprint created with Smartslate Polaris';
    if (!description && blueprintData?.blueprint_json) {
      const executiveSummary = (blueprintData.blueprint_json as any)?.executive_summary;
      if (typeof executiveSummary === 'string') {
        description = executiveSummary.substring(0, 200);
      } else if (executiveSummary && typeof executiveSummary === 'object') {
        // If it's an object, try to extract text from common properties
        description =
          executiveSummary.text ||
          executiveSummary.content ||
          executiveSummary.summary ||
          JSON.stringify(executiveSummary).substring(0, 200);
      }
    }

    // Parse blueprint JSON for additional metadata
    let metadata = {
      modules: 0,
      duration: 'Custom',
      level: 'Professional',
    };

    if (blueprintData?.blueprint_json) {
      const json = blueprintData.blueprint_json as any;
      metadata.modules = json.modules?.length || json.content_outline?.modules?.length || 0;
      metadata.duration = json.timeline?.duration || json.metadata?.duration || 'Custom';
      metadata.level = json.metadata?.level || 'Professional';
    }

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#0a0e1a',
            backgroundImage: 'linear-gradient(135deg, #0a0e1a 0%, #1a2332 100%)',
            position: 'relative',
            fontFamily: 'Inter, sans-serif',
          }}
        >
          {/* Background Pattern */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `
                radial-gradient(circle at 20% 50%, rgba(167, 218, 219, 0.15) 0%, transparent 50%),
                radial-gradient(circle at 80% 50%, rgba(167, 218, 219, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 50% 100%, rgba(167, 218, 219, 0.05) 0%, transparent 70%)
              `,
            }}
          />

          {/* Content Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              height: '100%',
              padding: '60px',
              position: 'relative',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
              {/* Logo */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a7dadb 0%, #6bc5c7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '30px',
                  fontWeight: 'bold',
                  color: '#0a0e1a',
                }}
              >
                S
              </div>

              {/* Brand */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <div style={{ color: '#a7dadb', fontSize: '24px', fontWeight: '600' }}>
                  Smartslate Polaris
                </div>
                <div style={{ color: '#64748b', fontSize: '16px' }}>
                  AI-Powered Learning Blueprints
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px',
                flex: 1,
                justifyContent: 'center',
              }}
            >
              {/* Title */}
              <h1
                style={{
                  color: '#ffffff',
                  fontSize: '48px',
                  fontWeight: '700',
                  lineHeight: '1.2',
                  margin: 0,
                  maxWidth: '900px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {title}
              </h1>

              {/* Description */}
              <p
                style={{
                  color: '#94a3b8',
                  fontSize: '20px',
                  lineHeight: '1.5',
                  margin: 0,
                  maxWidth: '800px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {description}
              </p>

              {/* Metadata Pills */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '12px' }}>
                {metadata.modules > 0 && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '999px',
                      border: '1px solid rgba(167, 218, 219, 0.3)',
                      backgroundColor: 'rgba(167, 218, 219, 0.1)',
                    }}
                  >
                    <div style={{ color: '#a7dadb', fontSize: '16px', fontWeight: '600' }}>
                      {metadata.modules}
                    </div>
                    <div style={{ color: '#64748b', fontSize: '16px' }}>Modules</div>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: '1px solid rgba(167, 218, 219, 0.3)',
                    backgroundColor: 'rgba(167, 218, 219, 0.1)',
                  }}
                >
                  <div style={{ color: '#a7dadb', fontSize: '16px' }}>{metadata.duration}</div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '999px',
                    border: '1px solid rgba(167, 218, 219, 0.3)',
                    backgroundColor: 'rgba(167, 218, 219, 0.1)',
                  }}
                >
                  <div style={{ color: '#a7dadb', fontSize: '16px' }}>{metadata.level}</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* CTA */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 24px',
                  borderRadius: '999px',
                  backgroundColor: '#a7dadb',
                  color: '#0a0e1a',
                  fontSize: '18px',
                  fontWeight: '600',
                }}
              >
                View Blueprint →
              </div>

              {/* Powered by */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ color: '#64748b', fontSize: '14px' }}>Powered by</div>
                <div style={{ color: '#fbbf24', fontSize: '14px', fontWeight: '600' }}>
                  Solara Learning Engine
                </div>
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div
            style={{
              position: 'absolute',
              top: '60px',
              right: '60px',
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              border: '2px solid rgba(167, 218, 219, 0.2)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '100px',
              right: '100px',
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              backgroundColor: 'rgba(167, 218, 219, 0.05)',
            }}
          />
        </div>
      ),
      {
        ...size,
        // In production, load custom fonts
        // fonts: [
        //   {
        //     name: 'Inter',
        //     data: fontData,
        //     style: 'normal',
        //   },
        // ],
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0a0e1a',
            backgroundImage: 'linear-gradient(135deg, #0a0e1a 0%, #1a2332 100%)',
          }}
        >
          <div
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}
          >
            <div
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #a7dadb 0%, #6bc5c7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '48px',
                fontWeight: 'bold',
                color: '#0a0e1a',
              }}
            >
              S
            </div>
            <div style={{ color: '#ffffff', fontSize: '32px', fontWeight: '600' }}>
              Smartslate Polaris
            </div>
            <div style={{ color: '#64748b', fontSize: '20px' }}>AI-Powered Learning Blueprints</div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  }
}
