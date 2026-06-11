import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Astro 5+/6 Content Layer API. This config file lives at the `src` ROOT
// (src/content.config.ts) — NOT the deprecated src/content/config.ts.
//
// ⚠️ 相容性鐵則:art-editor(Electron 內容管理器)直接對這個 repo 發佈,
// 依賴 blog / works 的「目錄路徑 + 欄位名」。這兩個 collection 只能
// additive 演進(新欄位必須 .optional() 或 .default()),不可改名搬家。
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

// 3D works/portfolio(目錄與 v1 欄位凍結;v2 只加 optional 欄位)。
// The gallery shows a lightweight GIF thumbnail; the interactive model only
// loads on the per-work detail page.
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
    // ---- v2 additive(editor 不寫這些,全部有預設/可選)----
    software: z.string().default('Blender'), // 建模軟體
    polycount: z.number().optional(), // 面數(詳情頁規格貼紙)
    date: z.coerce.date().optional(), // 顯示用;排序仍走 order
    turntable: z.boolean().default(false), // 詳情頁慢轉盤
    poster: z.string().optional(), // public/works/ 的靜態佔位圖(webp)
    accent: z.string().optional(), // viewer 底色(hex)
    featured: z.boolean().default(false), // 首頁精選
    draft: z.boolean().default(false),
  }),
});

// 2D 畫畫(v2 新)。一畫一資料夾:src/content/drawings/<slug>/index.md,
// 圖檔與 index.md 共置,image() 走 sharp 最佳化。寬高比由 image()
// metadata 提供,不存 frontmatter。
const drawings = defineCollection({
  loader: glob({ pattern: '**/index.{md,mdx}', base: './src/content/drawings' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(), // lightbox 小說明
      date: z.coerce.date(), // 排序鍵
      image: image(), // 主圖
      alt: z.string(), // 必填 a11y 描述
      extras: z
        .array(z.object({ src: image(), alt: z.string() }))
        .default([]), // WIP / 變體圖
      tools: z.array(z.string()).default([]), // 'Procreate'、'CSP'、'水彩'…
      tags: z.array(z.string()).default([]),
      featured: z.boolean().default(false),
      accent: z.string().optional(), // 卡框色(hex)
      draft: z.boolean().default(false),
    }),
});

export const collections = { blog, works, drawings };
