import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://smartslatepolaris.com';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/profile', '/settings', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
