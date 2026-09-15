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
