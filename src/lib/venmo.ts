// Builds the Venmo "pay" deep link — opens the Venmo app directly to a
// pre-filled payment screen (recipient, amount, note) when tapped on a
// phone that has the app installed. It's an undocumented-but-widely-used
// URI scheme, not an official API or web checkout: there is no desktop
// equivalent — Venmo has no desktop app and no web page that accepts a
// pre-filled payment request — so on a device without the app, this link
// just does nothing. ProductInfo.astro shows the same details as plain
// text alongside it, for that case.
export function venmoPayLink(username: string, amount: number, note: string): string {
  const params = new URLSearchParams({
    txn: 'pay',
    recipients: username,
    amount: String(amount),
    note,
  });
  return `venmo://paycharge?${params.toString()}`;
}
