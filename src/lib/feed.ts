// 首頁「最新」的取數 helpers。
// 刻意不做跨 collection 的合併 feed:works 沒有可靠日期
// (art-editor 不寫 date),首頁三個區塊各自取數即可。
import { getCollection, type CollectionEntry } from 'astro:content';

export async function latestDrawings(n: number): Promise<CollectionEntry<'drawings'>[]> {
  const all = await getCollection('drawings', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.date.getTime() - a.data.date.getTime()).slice(0, n);
}

export async function latestPosts(n: number): Promise<CollectionEntry<'blog'>[]> {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  return all.sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime()).slice(0, n);
}

/** featured 優先,其餘補 order 升冪 */
export async function featuredWorks(n: number): Promise<CollectionEntry<'works'>[]> {
  const all = await getCollection('works', ({ data }) => !data.draft);
  return all
    .sort((a, b) => {
      if (a.data.featured !== b.data.featured) return a.data.featured ? -1 : 1;
      return a.data.order - b.data.order;
    })
    .slice(0, n);
}
