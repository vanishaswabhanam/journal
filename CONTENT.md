# Adding & arranging grid content

Everything in the shop grid — every journal and every promo card — is one
file in [`src/content/grid/`](src/content/grid/). The grid on the page is
just those files, sorted and rendered. There is no other place that needs
touching to add, remove, reorder, or restyle a card's content.

The two card *types* (journal, promo) are defined once each, in
[`src/components/JournalCard.astro`](src/components/JournalCard.astro) and
[`src/components/PromoCard.astro`](src/components/PromoCard.astro). Every
entry of a given type renders through that same template — so 50 journals
look exactly as consistent as 5.

## Adding a journal

Create a new file in `src/content/grid/`, e.g. `100-navy-quilted.md`:

```md
---
type: journal
order: 100
name: "The Something"
price: 68
image: "/images/journals/your-image.png"
description: "One sentence describing the leather and hardware."
material: "Navy quilted leather"   # optional
sold: false                         # optional, defaults to false
---
```

1. Put the product photo in `public/images/journals/` (PNG with a
   transparent background matches the existing look best).
2. Point `image` at it with a path starting `/images/journals/...`.
3. Pick an `order` number (see "Ordering" below).

That's it — no other file changes needed. If a required field is missing,
`npm run build` will fail with a clear error naming the file and field,
rather than the site quietly rendering something broken.

## Adding a promo card

Same idea, different shape:

```md
---
type: promo
order: 45
eyebrow: "THE MAKER"          # optional, small label above the heading
heading: "Hand-stitched, one at a time."
body: "One or two sentences." # optional
color: blue                   # blue | black | cream
link: "/journal"               # optional call-to-action
linkLabel: "Read our story"   # optional, defaults to "Learn more"
---
```

Drop the file in `src/content/grid/` next to everything else. It takes up
exactly one grid cell, same as a journal, and can go anywhere.

Every cell in the grid is the same fixed shape (the proportions of the
original design), journal or promo. That's what keeps the grid tidy when
you mix and move cards — but it also means a promo card's text has to fit
inside one cell. Keep the heading to a line or two and the body to a short
sentence or two; anything that doesn't fit is clipped.

To add a new background color option, add it to `colorMap` in
`PromoCard.astro` **and** to the `color` enum in `src/content.config.ts` —
the schema is what keeps a typo'd color name from silently falling through.

## Ordering, inserting, and moving cards

The grid is sorted purely by each entry's `order` number, low to high.
Existing entries are spaced 10 apart (10, 20, 30…) on purpose: it leaves
room to insert a new card between two others just by giving it a number in
between — e.g. `order: 25` slots in between `order: 20` and `order: 30` —
**without renumbering anything else**. Every card after it shifts over
automatically because the grid re-sorts on every build.

To move an existing card, just change its `order` number.

If you ever run out of room between two numbers (e.g. you need something
between 21 and 22), renumber everything back to steps of 10 — that's a
mechanical, safe find-and-replace, not a redesign.

Filenames are prefixed with the order number purely so the folder itself
is easy to scan in a file browser (`010-`, `020-`, `045-`…). Renaming a
file does **not** change its position — only the `order` field does. Try
to keep the two in sync when you touch a file, just so the folder stays
readable, but the frontmatter is the source of truth.

## Where things live

```
src/
├── content.config.ts        Schema — the rules every entry must follow
├── content/grid/*.md         One file per card (this is what you edit)
├── components/
│   ├── JournalCard.astro     How every journal renders — edit once, affects all
│   ├── PromoCard.astro       How every promo card renders — edit once, affects all
│   ├── Grid.astro            Fetches + sorts entries, lays out the 3-col grid
│   └── SiteHeader.astro      Fixed top nav (Journal / Shop / Contact)
├── layouts/BaseLayout.astro  Page shell: background color, fonts, header offset
└── pages/
    ├── index.astro           Shop (the grid) — the home page
    ├── journal.astro         Placeholder
    └── contact.astro         Placeholder
public/images/
├── journals/                 Product photos
└── nav/                      The Journal/Shop/Contact header images
```

## Running it locally

```
nvm use 22        # this project needs Node 22+ (see package.json "engines")
npm install
npm run dev        # http://localhost:4321
npm run build       # production build to dist/ — also validates all content
```
