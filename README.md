# Leather Journal Shop

A lookbook-style shop site: fixed header nav, 3-column product grid, a
"promo card" type that can be dropped into any grid slot, a product page
for every journal (scrollable photo/video pane + add-to-cart), and a cart
whose "checkout" is a plain email — no payment processing anywhere.

**Adding, removing, or rearranging journals and promo cards doesn't touch
any code** — see [CONTENT.md](CONTENT.md) for the full guide. In short:
every card is one file in [`src/content/grid/`](src/content/grid/), and
every journal gets its product page for free.

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
npm run media       # build product-page photos/video from source-assets/ — see CONTENT.md
```

`npm run media` also needs `ffmpeg` on your PATH (`brew install ffmpeg`).

## Heads up: don't keep this folder in iCloud

If this project lives under `~/Documents` or `~/Desktop` with iCloud Drive
sync on, `node_modules` gets synced file-by-file. That made installs and
builds crawl (a build took ~20 minutes) and caused random `ETIMEDOUT`
read errors. Keep the project somewhere unsynced, e.g. `~/Developer/`.

## Project structure

See [CONTENT.md](CONTENT.md#where-things-live) for the full tree. Briefly:
grid content and its schema live in `src/content/`; a journal's product-page
media is built from raw files in `source-assets/product-photos/` (gitignored
— too large and too raw to publish) into `public/images/products/` by
`npm run media`.

`source-assets/` holds untouched, full-resolution originals — photos and
product-page photos/GIFs. The site only ever serves the smaller, web-ready
copies generated into `public/images/`.

## Before going live

Set `PUBLIC_WEB3FORMS_KEY` in `.env` (and in the Vercel project's
environment variables) — both the contact page and the cart's "Send
request" step need it to actually deliver email. See
[CONTENT.md](CONTENT.md#seamless-forms-contact--cart).

Set `site.venmo.username` in `src/site.config.ts` to your real Venmo
handle — it ships with a placeholder. See
[CONTENT.md](CONTENT.md#direct-venmo-payment).

## Not yet built

There's a cart (see [CONTENT.md](CONTENT.md#the-cart)), but no real
checkout — "buying" ends in an email, on purpose, not a payment.
