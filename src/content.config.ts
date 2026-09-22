// This file defines the SHAPE every grid entry must have.
// Astro checks every file in src/content/grid/ against this schema at build
// time — if an entry is missing a required field, or has a typo'd `type`,
// the build fails with a clear error instead of silently rendering wrong.
//
// See CONTENT.md for the plain-English guide to adding/editing entries.

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// A product card in the grid.
const journalEntry = z.object({
  type: z.literal('journal'),

  // Controls where this card sits in the grid. Lower numbers come first.
  // Convention: space entries 10 apart (10, 20, 30…) so a new one can be
  // inserted between two others just by giving it a number in between,
  // without renumbering anything else. See CONTENT.md.
  order: z.number(),

  name: z.string(),
  price: z.number(),

  // Root-relative path into /public, e.g. "/images/journals/foo.png".
  image: z.string(),
  // Alt text for accessibility. Falls back to `name` if omitted.
  alt: z.string().optional(),

  description: z.string().optional(),
  material: z.string().optional(),

  // Mark true to show a "sold out" state without deleting the entry.
  sold: z.boolean().default(false),

  // ---- Product page (all optional — a journal with none of these still gets
  // a working page built from `image`, `name`, `price`, and `description`) ----

  // URL of the product page: /journals/<slug>/. Defaults to the name,
  // lowercased with dashes ("The Nightwatch" -> "the-nightwatch"). Set it
  // explicitly only if you want a URL that won't change when you rename.
  slug: z.string().optional(),

  // High-detail main product image (transparent cutout). Falls back to `image`.
  hero: z.string().optional(),
  // Extra photos, shown as thumbnails after the main image. Made by
  // `npm run media` — see CONTENT.md.
  gallery: z.array(z.string()).default([]),
  // Looping walkthrough clip (mp4). Its poster image is found next to it.
  video: z.string().optional(),

  // Extra label/value rows shown under "Material", e.g. { label: "Closure", value: "Elastic band" }.
  details: z.array(z.object({ label: z.string(), value: z.string() })).default([]),

  // Where the buy button goes for THIS journal. Falls back to the site-wide
  // default in src/site.config.ts.
  buyLink: z.string().optional(),
});

// A promo card in the grid — the "blue box" card type. Same grid, same
// sizing, but it displays a message instead of a product.
const promoEntry = z.object({
  type: z.literal('promo'),
  order: z.number(),

  eyebrow: z.string().optional(), // small label above the heading, e.g. "THE MAKER"
  heading: z.string(),
  body: z.string().optional(),

  // Background treatment. Add more options here as the palette grows.
  color: z.enum(['blue', 'black', 'cream']).default('blue'),

  // Optional call-to-action link at the bottom of the card.
  link: z.string().optional(),
  linkLabel: z.string().optional(),
});

const grid = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/grid' }),
  schema: z.discriminatedUnion('type', [journalEntry, promoEntry]),
});

export const collections = { grid };
