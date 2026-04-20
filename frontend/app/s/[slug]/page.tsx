/**
 * Public Share Access Page
 * /s/[slug] - View shared blueprints
 */

import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import ShareAccessView from '@/components/share/ShareAccessView';

interface SharePageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export async function generateMetadata({ params }: SharePageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  // Look up share link by slug or token
  const { data: shareLink } = await supabase
    .from('share_links')
    .select('*, blueprint_generator!inner(title, created_at, user_id)')
    .or(`share_slug.eq.${slug},share_token.eq.${slug}`)
    .eq('is_active', true)
    .single();

  if (!shareLink) {
    return {
      title: 'Share Not Found',
      description: 'This share link does not exist or has been revoked.',
    };
  }

  const title = shareLink.custom_title || shareLink.blueprint_generator.title;
  const description = shareLink.custom_description || `View shared blueprint: ${title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: shareLink.custom_image_url ? [shareLink.custom_image_url] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: shareLink.custom_image_url ? [shareLink.custom_image_url] : [],
    },
  };
}

export default async function SharePage({ params, searchParams }: SharePageProps) {
  const { slug } = await params;
  const search = await searchParams;
  const supabase = await createClient();

  // Look up share link by slug or token
  const { data: shareLink, error } = await supabase
    .from('share_links')
    .select(
      `
      *,
      blueprint_generator!inner(
        id,
        title,
        blueprint_markdown,
        blueprint_json,
        created_at,
        updated_at,
        user_id
      )
    `
    )
    .or(`share_slug.eq.${slug},share_token.eq.${slug}`)
    .single();

  if (error || !shareLink) {
    console.error('Share link not found:', error);
    notFound();
  }

  // Check if share link is active
  if (!shareLink.is_active) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-6xl">🔒</div>
          <h1 className="mb-2 text-2xl font-bold">Share Link Revoked</h1>
          <p className="text-gray-600">This share link has been deactivated by the owner.</p>
        </div>
      </div>
    );
  }

  // Check if expired
  if (shareLink.expires_at && new Date(shareLink.expires_at) < new Date()) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-6xl">⏰</div>
          <h1 className="mb-2 text-2xl font-bold">Share Link Expired</h1>
          <p className="text-gray-600">
            This share link expired on {new Date(shareLink.expires_at).toLocaleDateString()}.
          </p>
        </div>
      </div>
    );
  }

  // Check view count limit
  if (shareLink.max_views && shareLink.view_count >= shareLink.max_views) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg border bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-6xl">👀</div>
          <h1 className="mb-2 text-2xl font-bold">View Limit Reached</h1>
          <p className="text-gray-600">
            This share link has reached its maximum number of views ({shareLink.max_views}).
          </p>
        </div>
      </div>
    );
  }

  // Pass data to client component for password check and rendering
  return (
    <ShareAccessView
      shareLink={shareLink}
      blueprint={shareLink.blueprint_generator}
      requirePassword={!!shareLink.password_hash}
      requireEmail={shareLink.require_email}
    />
  );
}
