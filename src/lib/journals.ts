// Everything about journals that more than one page needs, in one place:
// how to load them in grid order, and how to turn a journal into a URL.
import { getCollection, type CollectionEntry } from 'astro:content';

export type JournalData = Extract<CollectionEntry<'grid'>['data'], { type: 'journal' }>;
export type Journal = JournalData & { slug: string; href: string };

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

/** All journals (promo cards excluded), in grid order, with their page URL attached.
 *  Unsold journals always sort before sold ones — within each of those two
 *  groups, `order` still applies — so a journal selling out moves itself to
 *  the back of the grid instead of needing its `order` hand-edited. */
export async function getJournals(): Promise<Journal[]> {
  const entries = await getCollection('grid');
  return entries
    .filter((e): e is CollectionEntry<'grid'> & { data: JournalData } => e.data.type === 'journal')
    .sort((a, b) => {
      if (a.data.sold !== b.data.sold) return a.data.sold ? 1 : -1;
      return a.data.order - b.data.order;
    })
    .map((e) => {
      const slug = e.data.slug ?? slugify(e.data.name);
      return { ...e.data, slug, href: `/journals/${slug}/` };
    });
}

/** The URL for a journal's page, from its frontmatter (used by the grid cards). */
export const journalHref = (data: JournalData) => `/journals/${data.slug ?? slugify(data.name)}/`;

// Media naming convention (written by scripts/prepare-product-media.mjs):
// every "x.webp" has an "x-thumb.webp" next to it, and a video "x.mp4" has
// its poster at "x-poster.webp".
export const thumbOf = (src: string) => src.replace(/\.webp$/, '-thumb.webp');
export const posterOf = (video: string) => video.replace(/\.mp4$/, '-poster.webp');
