// app/sitemap.ts
import { MetadataRoute } from 'next';
import { BIBLE_BOOKS } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://aidu.app';

  // 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/settings`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // 动态圣经章节页面 (66卷书 × 各章节数)
  const biblePages: MetadataRoute.Sitemap = BIBLE_BOOKS.flatMap(book =>
    Array.from({ length: book.chapters }, (_, i) => ({
      url: `${baseUrl}/?book=${book.id}&chapter=${i + 1}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))
  );

  return [...staticPages, ...biblePages];
}