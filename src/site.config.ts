// Site-wide settings that more than one page needs.

export const site = {
  name: 'Leather Journals',

  // A journal can set its own `buyLink` to skip the cart entirely and go
  // straight to a link instead (an Etsy listing, an Instagram DM, etc.) —
  // its product-page button becomes a plain link with this label, rather
  // than "Add to cart". Most journals won't set `buyLink` and use the cart.
  buy: {
    label: 'Inquire to buy',
  },

  // Direct Venmo payment, shown as a second option alongside the cart on
  // every product page — see ProductInfo.astro. This is NOT a real payment
  // processor integration: Venmo has no checkout API for individual
  // sellers, no way for this site to confirm a payment actually happened,
  // and no buyer/seller protection on personal-account payments. It's an
  // explicit lower-trust, zero-setup alternative, not a replacement for
  // the cart's email inquiry flow. *** Replace with your real @handle
  // (no @ sign) before this does anything useful. Set to null to hide the
  // "Pay with Venmo" option everywhere. ***
  venmo: {
    username: 'vansihaswabhanam',
  },
};
