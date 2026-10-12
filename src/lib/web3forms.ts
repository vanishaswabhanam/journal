// Thin wrapper around the Web3Forms API — the one thing that makes both
// the contact page and the cart's "request to buy" step seamless: no
// mailto: handoff to the visitor's own mail client, no backend of our own.
// Used by contact.astro and Cart.astro.
//
// The access key lives in .env as PUBLIC_WEB3FORMS_KEY. The PUBLIC_ prefix
// is what makes Vite expose it to this client-side code at build time —
// Web3Forms' own docs call it a public key, safe to ship in the browser.
const ENDPOINT = 'https://api.web3forms.com/submit';

export type Web3FormsResult = { ok: true } | { ok: false; message: string };

export async function submitToWeb3Forms(fields: Record<string, string>): Promise<Web3FormsResult> {
  const accessKey = import.meta.env.PUBLIC_WEB3FORMS_KEY;
  if (!accessKey) {
    return { ok: false, message: "This form isn't connected yet — missing an access key." };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ access_key: accessKey, ...fields }),
    });
    const data = await response.json().catch(() => null);
    if (response.ok && data?.success) return { ok: true };
    return { ok: false, message: data?.message || 'Something went wrong sending that — please try again.' };
  } catch {
    return { ok: false, message: "Couldn't reach the server — check your connection and try again." };
  }
}
