import type { APIRoute } from 'astro';

// ─── Apollonia Space — Newsletter Subscribe (Astro API route) ───
// Lives inside your app and is compiled by the @astrojs/cloudflare adapter,
// so it works whether the adapter is in "advanced" or "directory" mode.
// The matching client form is in src/components/SiteFooter.astro.
//
// ⚠️ This calls Substack's UNDOCUMENTED /api/v1/free endpoint. It is not
//    supported and can break or get gated behind a captcha at any time.
//    Test it after deploy. If it stops working, swap in the iframe embed
//    (supported fallback) — see the note at the bottom of this file.
//
// What the guards actually do (honest version):
//   • Origin/Referer check — blocks casual cross-site calls from browsers.
//     Bypassable by a non-browser client; it's a deterrent, not a wall.
//   • Honeypot — catches naive bots that auto-fill hidden fields.
//   • Email validation + length cap — rejects malformed/oversized input.
//   • Content-Type + body-size cap — rejects junk payloads.
//   • Fetch timeout — stops the route hanging on a slow Substack.
//   • Security headers + generic errors — no internal details leaked.
//
// Real rate limiting / bot protection is NOT done in code here — it belongs
// in the Cloudflare dashboard: add a Rate Limiting Rule on /api/subscribe,
// or enable Turnstile.

// IMPORTANT: forces this route to be server-rendered (needed when your
// astro.config output is 'static' — the rest of the site stays static).
export const prerender = false;

const PUBLICATION = 'apolloniaspace.substack.com';

// Allowed origins — add preview/staging domains if you use them.
const ALLOWED_ORIGINS = [
  'https://apolloniaspace.com',
  'https://www.apolloniaspace.com',
  'http://localhost:4321', // Astro dev
  'http://localhost:3000',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_BODY_BYTES = 2048;

function securityHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}

function json(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), { status, headers: securityHeaders() });
}

export const POST: APIRoute = async ({ request }) => {
  // 1. Origin / Referer check
  const origin = request.headers.get('origin') || '';
  const referer = request.headers.get('referer') || '';
  const ok = (v: string) => ALLOWED_ORIGINS.some((o) => v.startsWith(o));
  if (!ok(origin) && !ok(referer)) {
    return json({ error: 'Forbidden.' }, 403);
  }

  // 2. Content-Type check
  const ct = (request.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return json({ error: 'Invalid content type.' }, 415);
  }

  // 3. Body size check
  const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
  if (contentLength > MAX_BODY_BYTES) {
    return json({ error: 'Payload too large.' }, 413);
  }

  // Parse body
  let body: { email?: unknown; website?: unknown };
  try {
    const raw = await request.text();
    if (raw.length > MAX_BODY_BYTES) {
      return json({ error: 'Payload too large.' }, 413);
    }
    body = JSON.parse(raw);
  } catch {
    return json({ error: 'Invalid request.' }, 400);
  }

  // 4. Honeypot — bots fill the hidden field; return 200 so they don't retry
  if (body.website) {
    return json({ ok: true }, 200);
  }

  // 5. Email validation
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
  if (!email || email.length > 254 || !EMAIL_RE.test(email)) {
    return json({ error: 'Please provide a valid email address.' }, 400);
  }

  // 6. POST to Substack with timeout
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(`https://${PUBLICATION}/api/v1/free`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        first_url: `https://${PUBLICATION}`,
        first_referrer: '',
        current_url: `https://${PUBLICATION}`,
        current_referrer: '',
        referral_code: '',
        source: 'embed',
      }),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      return json({ error: 'Subscription service unavailable. Please try again later.' }, 502);
    }
    return json({ ok: true }, 200);
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      return json({ error: 'Request timed out. Please try again.' }, 504);
    }
    return json({ error: 'Something went wrong. Please try again later.' }, 500);
  }
};

// Any non-POST method → 405
export const GET: APIRoute = () => json({ error: 'Method not allowed.' }, 405);
export const ALL: APIRoute = () => json({ error: 'Method not allowed.' }, 405);

// ─── SUPPORTED FALLBACK ───
// If the endpoint above stops working, delete the .news-form block in
// SiteFooter.astro and paste this instead (ugly but Substack-supported):
//
// <iframe src="https://apolloniaspace.substack.com/embed"
//   width="100%" height="150" style="border:none;max-width:480px;"
//   frameborder="0" scrolling="no"></iframe>