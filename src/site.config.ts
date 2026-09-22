// Site-wide settings that more than one page needs.

export const site = {
  name: 'Leather Journals',

  // What the buy button on a product page does. The shop has no checkout
  // (it's a lookbook), so the button sends people somewhere to ask/buy.
  // Change `href` to wherever purchases should go — the contact page, an
  // email link ("mailto:you@example.com"), an Instagram DM link, an Etsy
  // listing… A journal can override this with its own `buyLink`.
  buy: {
    label: 'Inquire to buy',
    href: '/contact',
  },
};
