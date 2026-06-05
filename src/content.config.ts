import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Astro 5+/6 Content Layer API. This config file lives at the `src` ROOT
// (src/content.config.ts) — NOT the deprecated src/content/config.ts.
const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  // Callback form so image() is available for the hero image.
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string(),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      tags: z.array(z.string()).default([]),
      heroImage: image().optional(),
      heroImageAlt: z.string().optional(),
      draft: z.boolean().default(false),
      // 私密文章:內文以 AES-GCM 加密放在 cipher(密語不存在任何地方)。
      private: z.boolean().default(false),
      cipher: z.string().optional(),
    }),
});

// 3D works/portfolio. The gallery shows a lightweight GIF thumbnail; the
// interactive model only loads on the per-work detail page.
const works = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/works' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    model: z.string(), // .glb filename in public/models/
    thumb: z.string(), // .gif/.png/.webp filename in public/works/
    environment: z
      .enum([
        'apartment',
        'city',
        'dawn',
        'forest',
        'lobby',
        'night',
        'park',
        'studio',
        'sunset',
        'warehouse',
      ])
      .default('city'),
    order: z.number().default(0),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog, works };
