# Leather Journal Shop

A lookbook-style shop site: fixed header nav, 3-column product grid, and a
"promo card" type that can be dropped into any grid slot.

**Adding, removing, or rearranging journals and promo cards doesn't touch
any code** — see [CONTENT.md](CONTENT.md) for the full guide. In short:
every card is one file in [`src/content/grid/`](src/content/grid/).

## Stack

[Astro](https://astro.build) with content collections (schema-validated
content — a malformed entry fails the build with a clear error instead of
silently rendering wrong). Static output, no backend.

## Commands

```sh
nvm use 22        # requires Node 22+, see package.json "engines"
npm install
npm run dev        # local dev server, http://localhost:4321
npm run build       # production build to dist/ (also validates all content)
npm run preview     # preview the production build locally
```

## Project structure

```
src/
├── content.config.ts        Content schema — see CONTENT.md
├── content/grid/*.md         The grid's content — one file per card
├── components/                Card + layout templates
├── layouts/BaseLayout.astro  Page shell (background, fonts, header offset)
└── pages/                     index (Shop), journal, contact
public/images/
├── journals/                 Web-sized product photos used by the site
└── nav/                      Journal/Shop/Contact header word images
source-assets/                 Full-resolution originals (not used by the
                                site directly — see below)
```

`source-assets/` holds the untouched, full-resolution photos the shop
owner supplied. The site actually serves smaller, web-sized copies from
`public/images/`. If you get a new product photographed, drop the
full-res original in `source-assets/journal-photos/` for the archive, and
a resized copy in `public/images/journals/` for the site to use.

## Not yet built

`journal.astro` and `contact.astro` are placeholders — this build focused
on the shop grid system. Shop scope is currently "lookbook" (no on-site
checkout).
