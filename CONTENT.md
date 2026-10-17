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

Every journal automatically gets its own product page too, at
`/journals/<slug>/` (the slug is the name, lowercased with dashes) — see
"Product pages" below for adding photos, a walkthrough video, and details
to it.

## Product pages

Clicking a journal in the grid goes to `/journals/<slug>/` — a 50/50 page:
a scrollable photo pane on the left (scroll or swipe through photos, or
click a thumbnail to jump to one) and the name/price/add-to-cart/
description on the right. It's generated automatically for every journal;
with just the fields above (`name`, `price`, `image`, `description`) it
already works, just with one photo.

To add more photos, extra detail rows, or the looping walkthrough video,
a journal entry takes a few more optional fields:

```md
hero: "/images/products/the-nightwatch/hero.webp"   # bigger main image; falls back to `image`
gallery:                                              # extra photos, as thumbnails
  - "/images/products/the-nightwatch/1.webp"
  - "/images/products/the-nightwatch/2.webp"
video: "/images/products/the-nightwatch/walkthrough.mp4"   # looping clip, shown as a thumbnail with a play icon
details:                                              # extra rows under Material, in the description panel
  - label: "Closure"
    value: "Elastic cord"
buyLink: "/contact"    # override the site-wide buy link (src/site.config.ts) for just this journal
```

**These `hero`/`gallery`/`video` files are built for you, not written by
hand.** Raw photos and GIFs are big, inconsistent sizes and need cropping
— `npm run media` turns them into small, uniform web files and prints the
frontmatter above for you to paste in. See "Generating product media"
below.

The button on a product page (and the sticky mobile bar) is **"Add to
cart"** by default — see "The cart" below. A journal only gets a plain
link instead, bypassing the cart, if it sets its own `buyLink`:

```md
buyLink: "https://etsy.com/listing/..."   # or an Instagram DM link, etc.
```

That's an escape hatch for something that isn't sold the normal way (a
one-off already listed elsewhere) — most journals should leave it unset.

## The cart

There's no real payment processor anywhere on this site — it's still not
a checkout in the traditional sense. "Add to cart" → "Proceed to request"
opens a receipt-styled popup that walks through two steps:

1. **Shipping details.** Name, address, email — needed to actually ship
   these. Submitting that emails the whole order (items, total, shipping
   address) straight from the page via Web3Forms (see "Seamless forms"
   below), with the visitor's own email set as reply-to, so a reply for
   tracking/questions goes somewhere real.
2. **Payment.** Once that's landed, a "Pay with Venmo" step appears for
   the cart's total — see "Direct Venmo payment" below. A final "I've sent
   the payment" button closes things out and clears the cart; there's no
   way for this site to confirm a Venmo payment on its own, so that
   confirmation is the visitor's word, not a system check.

Every journal is one of one — there's no quantity. Adding something
already in the cart doesn't duplicate it; the button just shows "In your
cart" instead. Everything lives in one component,
[`src/components/Cart.astro`](src/components/Cart.astro): the header's
cart icon, the slide-over drawer (remove only, no qty stepper), and the
receipt popup. It's rendered once inside `SiteHeader.astro`'s persisted
header, so the cart's open/closed state survives page navigation without
flickering.

The receipt's look is deliberately built from the shop's own materials,
not a separate "stationery drawer" aesthetic: the brand line uses the same
bold display font as the JOURNAL/SHOP/CONTACT wordmarks (`--display` in
BaseLayout, self-hosted at `public/fonts/anton-latin.woff2`), and its
rules are the same hairline gray as the grid's cell borders (`--line` /
`--line-soft`). If you add to this file, keep pulling from those same
tokens rather than introducing a new color or a new typeface — that's what
keeps the cart feeling like part of the shop instead of a bolted-on widget.

The cart itself is just `localStorage` in the visitor's own browser —
nothing is sent anywhere, or visible to you, until the shipping-details
step actually submits. It never syncs between devices; clearing browser
data clears it before that point. That's the right amount of durability
for "remember what I was looking at," not a real order system.

**To make any button anywhere add-to-cart**, give it
`data-add-to-cart='{"slug":"...","name":"...","price":65,"image":"..."}'`
— `Cart.astro` listens for clicks on that attribute globally (event
delegation), so no per-page wiring is needed. `ProductInfo.astro` and the
mobile buy bar already do this; that's the pattern to copy if you add
another "add to cart" spot later (a quick-add button on the grid cards,
say).

## Seamless forms (contact + cart)

Both [`contact.astro`](src/pages/contact.astro) and the cart's shipping
step submit straight to email via [Web3Forms](https://web3forms.com) — no
backend of our own, no mailto: handoff to the visitor's own mail client.
The actual request is made by
[`src/lib/web3forms.ts`](src/lib/web3forms.ts), which both of them import.

This needs **one access key**, set as `PUBLIC_WEB3FORMS_KEY` in `.env`
(gitignored — tied to a specific inbox, see the comment in that file) and,
separately, as an environment variable in the Vercel project settings for
it to work in production. The key is created at web3forms.com against
whichever inbox you want these forms to land in — swap the key there if
you ever want them going somewhere else; nothing in this codebase needs to
change.

If `PUBLIC_WEB3FORMS_KEY` is missing, both forms fail gracefully with an
inline "this form isn't connected yet" message instead of silently losing
the submission.

## Direct Venmo payment

The cart's final checkout step (see "The cart" above and
[`Cart.astro`](src/components/Cart.astro)) shows a "Pay with Venmo" option
for the cart's total, built by
[`src/lib/venmo.ts`](src/lib/venmo.ts) — split into two entirely separate
versions depending on the device, rather than one block trying to cover
both:

- **Touch devices** (phones/tablets, detected via the `pointer: coarse`
  media feature): a one-tap button that opens the Venmo app directly,
  pre-filled with the amount and a note. This only actually does anything
  on a phone that has the app installed.
- **Mouse/trackpad devices**: plain instructions instead (handle, amount,
  note) — there's nothing for a button to open on desktop, since Venmo has
  no desktop app or web checkout at all.

**This is explicitly not a real payment integration** — there's no API,
no way for this site to know a payment actually went through, and no
buyer/seller protection (Venmo's own terms don't cover using a personal
account for goods/services this way). The cart only clears once the
visitor clicks "I've sent the payment" — that's a manual confirmation,
not a verified one. Mark the journal `sold: true` by hand once the
payment is actually confirmed on your end.

Set your real handle in `site.venmo.username` (`src/site.config.ts`).

## Generating product media

Raw product photos/videos go in `source-assets/product-photos/<folder>/`
(full-resolution originals, gitignored — they're too big and too raw to
publish directly). `scripts/product-media.json` maps each journal's slug
to its raw files; `npm run media` reads that, and for each journal:

- crops each photo to a consistent 4:5, full-size + thumbnail
- turns the transparent cutout into the hero image
- crops the walkthrough GIF to a wide band (just the journal, not the
  desk it's sitting on), cleans up the GIF dithering, and re-encodes it
  as a small looping .mp4 with a poster frame

Output goes to `public/images/products/<slug>/`, and the frontmatter to
paste into that journal's file prints at the end. Requires `ffmpeg` on
your PATH (`brew install ffmpeg`) and the `sharp` package (already a
devDependency — `npm install` gets it).

```
npm run media                       # rebuild every journal's media
npm run media -- the-nightwatch     # just one, by slug
npm run media -- --force             # rebuild even if outputs look current
```

To add a new journal's media: add its photos/GIF under
`source-assets/product-photos/`, add an entry to
`scripts/product-media.json` keyed by the journal's slug, run
`npm run media`, then paste the printed fields into that journal's file.

If a GIF's walkthrough crop is off (too much desk, or cuts off the top of
a closed cover), add `"videoBand": { "y": 0.2, "h": 0.5 }` to that
journal's entry in `product-media.json` (fractions of the GIF's height —
`y` where the band starts, `h` how tall it is) and rerun.

## Adding a promo card

Same idea, different shape:

```md
---
type: promo
order: 45
eyebrow: "THE MAKER"          # optional, small label above the heading
heading: "Hand-stitched, one at a time."
body: "One or two sentences." # optional
color: blue                   # blue | black | cream | green
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
├── site.config.ts           Site-wide settings: the buyLink fallback label
├── lib/
│   ├── journals.ts           Shared helpers: grid order, slugs, product-page URLs
│   └── web3forms.ts          Submits contact/cart requests straight to email — see "Seamless forms"
├── content/grid/*.md         One file per card (this is what you edit)
├── components/
│   ├── JournalCard.astro     How every journal renders in the grid — links to its product page
│   ├── PromoCard.astro       How every promo card renders — edit once, affects all
│   ├── Grid.astro            Fetches + sorts entries, lays out the 3-col grid
│   ├── SiteHeader.astro      Fixed top nav (Journal / Shop / Contact) + the cart icon
│   ├── Cart.astro            Cart drawer + the receipt-style "request to buy" popup
│   ├── ProductGallery.astro  Product-page scrollable photo/video pane + thumbnails
│   ├── ProductInfo.astro     Product-page name/price/add-to-cart/description panel
│   └── Moodboard.astro       The /journal page's draggable photo collage
├── layouts/BaseLayout.astro  Page shell: background color, fonts, header offset, favicon/meta
└── pages/
    ├── index.astro           Shop (the grid) — the home page
    ├── journals/[slug].astro One product page per journal, generated automatically
    ├── journal.astro         Behind-the-scenes photo moodboard
    └── contact.astro         Contact form — submits via Web3Forms
public/images/
├── journals/                 Grid photos (small, already web-ready)
├── products/<slug>/          Product-page media, built by `npm run media`
├── moodboard/                 Photos for the /journal page's collage
└── nav/                      The Journal/Shop/Contact header images
public/
├── favicon.svg, favicon.png, apple-touch-icon.png   Tab/home-screen icon
public/fonts/
├── anton-latin.woff2         The bold display font (`--display`) — self-hosted, one file
└── special-elite-latin.woff2 The typewriter/stamp font (`--mono`) — promo cards, cart receipt
scripts/
├── product-media.json        Maps each journal's slug to its raw photos/GIF
└── prepare-product-media.mjs Builds public/images/products/ — see "Generating product media"
source-assets/
└── product-photos/           Raw photos/GIFs (gitignored — see README)
```

## Running it locally

```
nvm use 22        # this project needs Node 22+ (see package.json "engines")
npm install
npm run dev        # http://localhost:4321
npm run build       # production build to dist/ — also validates all content 
```
