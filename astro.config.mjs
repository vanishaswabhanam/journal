// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
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
