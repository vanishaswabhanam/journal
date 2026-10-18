// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // The dev toolbar (the floating Astro icon + its hover audit overlays,
  // bottom of the screen) is dev-only — astro dev injects it, a real build
  // never does. Its hover-highlight outlines flashing in and out as you
  // move the cursor around is a likely chunk of the "blinking/highlighting"
  // glitchiness reported on localhost — this never shows up in production.
  devToolbar: {
    enabled: false,
  },
  // Prefetch a page's HTML as soon as a link to it is visible on screen, so
  // by the time someone actually taps it (e.g. the product page's "← Shop"
  // link, visible immediately on load) the navigation is instant instead of
  // waiting on a fresh fetch. Pairs with the Cache-Control fix in
  // vercel.json, which was the bigger half of the "going back feels slow
  // every time" problem — see that file for why.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: 'viewport',
  },
});
