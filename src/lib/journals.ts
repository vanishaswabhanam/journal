// Everything about products that more than one page needs, in one place:
// how to load them in grid order, and how to turn one into a URL.
//
// "Journal" in the names here is historical: pouches are the same kind of
// entry (same fields, same page, same cart), just with `category: pouch`,
// which puts them on the "other cool stuff" tab and under /pouches/.
import { getCollection, type CollectionEntry } from 'astro:content';

export type JournalData = Extract<CollectionEntry<'grid'>['data'], { type: 'journal' }>;
export type Journal = JournalData & { slug: string; href: string };
export type Category = JournalData['category'];

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// The URL folder each category's pages live under.
const sectionOf = (category: Category) => (category === 'pouch' ? 'pouches' : 'journals');

/** The URL for a product's page, from its frontmatter (used by the grid cards). */
export const journalHref = (data: JournalData) => `/${sectionOf(data.category)}/${data.slug ?? slugify(data.name)}/`;

/** All products in one category (promo cards excluded), in grid order, with
 *  their page URL attached. Unsold always sort before sold — within each of
 *  those two groups, `order` still applies — so something selling out moves
 *  itself to the back of the grid instead of needing its `order` hand-edited. */
export async function getProducts(category: Category): Promise<Journal[]> {
  const entries = await getCollection('grid');
  return entries
    .filter((e): e is CollectionEntry<'grid'> & { data: JournalData } => e.data.type === 'journal')
    .filter((e) => e.data.category === category)
    .sort((a, b) => {
      if (a.data.sold !== b.data.sold) return a.data.sold ? 1 : -1;
      return a.data.order - b.data.order;
    })
    .map((e) => ({ ...e.data, slug: e.data.slug ?? slugify(e.data.name), href: journalHref(e.data) }));
}

export const getJournals = () => getProducts('journal');
export const getPouches = () => getProducts('pouch');

// Media naming convention (written by scripts/prepare-product-media.mjs):
// every "x.webp" has an "x-thumb.webp" next to it, and a video "x.mp4" has
// its poster at "x-poster.webp".
export const thumbOf = (src: string) => src.replace(/\.webp$/, '-thumb.webp');
export const posterOf = (video: string) => video.replace(/\.mp4$/, '-poster.webp');
