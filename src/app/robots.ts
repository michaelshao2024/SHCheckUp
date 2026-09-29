import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/login', '/register', '/forgot-password', '/reset-password'],
      },
      // Explicitly welcome major AI / answer-engine crawlers (GEO).
      ...['GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'PerplexityBot', 'Perplexity-User', 'Google-Extended', 'Bingbot', 'Applebot', 'Amazonbot', 'Meta-ExternalAgent', 'cohere-ai', 'DuckAssistBot', 'YouBot'].map(
        (bot) => ({
          userAgent: bot,
          allow: '/',
          disallow: ['/admin', '/api'],
        })
      ),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
