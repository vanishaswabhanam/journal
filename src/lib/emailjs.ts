// Sends the buyer their own order confirmation — the one thing Web3Forms
// can't do on its free plan (that always notifies whoever owns the access
// key; cc-ing anyone else needs a paid plan — see the comment in Cart.astro's
// markPaid()). EmailJS's model is the opposite: a template with its own
// "To Email" field set to a variable, so it can email whoever actually
// placed the order, for free.
//
// Uses EmailJS's own browser SDK rather than calling its REST endpoint
// directly — EmailJS blocks raw, non-browser-looking requests as an
// anti-abuse measure by default, and the SDK is what satisfies that check
// reliably from inside an actual page load.
//
// Needs PUBLIC_EMAILJS_SERVICE_ID, PUBLIC_EMAILJS_TEMPLATE_ID, and
// PUBLIC_EMAILJS_PUBLIC_KEY in .env (and in Vercel's project env vars for
// this to work in production) — see CONTENT.md. Used only by Cart.astro,
// right alongside the existing Web3Forms order email to {site.name}.
import emailjs from '@emailjs/browser';

export type EmailJsResult = { ok: true } | { ok: false; message: string };

export async function sendOrderConfirmation(templateParams: Record<string, string>): Promise<EmailJsResult> {
  const serviceId = import.meta.env.PUBLIC_EMAILJS_SERVICE_ID;
  const templateId = import.meta.env.PUBLIC_EMAILJS_TEMPLATE_ID;
  const publicKey = import.meta.env.PUBLIC_EMAILJS_PUBLIC_KEY;
  if (!serviceId || !templateId || !publicKey) {
    return { ok: false, message: 'EmailJS is not connected yet — missing a service/template/public key.' };
  }

  try {
    await emailjs.send(serviceId, templateId, templateParams, { publicKey });
    return { ok: true };
  } catch (error) {
    const message = error && typeof error === 'object' && 'text' in error ? String((error as { text: unknown }).text) : 'EmailJS request failed.';
    return { ok: false, message };
  }
}
