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
};
