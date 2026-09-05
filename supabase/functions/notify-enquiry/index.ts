/**
 * Emails the admin when a visitor submits the contact form.
 *
 * The caller sends nothing but the id of a row it has just inserted; the body
 * of the mail is read back from the database with the service_role key. That
 * is the point of the indirection — the anon key is public, so anything the
 * client could put in the request is something a stranger could put in the
 * admin's inbox.
 *
 * Deploy:  npx supabase functions deploy notify-enquiry
 * Secrets: npx supabase secrets set RESEND_API_KEY=... ADMIN_EMAIL=...
 *          (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected by the
 *          platform and must not be set by hand.)
 */
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { type EnquiryCartLine, type EnquiryRow, renderEnquiryEmail } from './email.ts';

const RESEND_ENDPOINT = 'https://api.resend.com/emails';

/**
 * Resend's sandbox sender needs no DNS setup but only delivers to the address
 * that owns the Resend account. Override with a verified domain via the
 * RESEND_FROM secret once centralcatering.bg is verified.
 */
const DEFAULT_FROM = 'Central Catering <onboarding@resend.dev>';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

/** Every exit carries CORS, or the browser reports an opaque network error. */
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/**
 * Lines saved before the enquiry snapshot carried an image have none. The
 * admin panel falls back to a live menu lookup (admin-enquiries-page
 * .component.ts:100-113); do the same here so old rows still get thumbnails.
 */
async function withImages(
  // deno-lint-ignore no-explicit-any
  db: any,
  lines: EnquiryCartLine[],
): Promise<EnquiryCartLine[]> {
  const missing = lines.filter((line) => !line.image_path).map((line) => line.id);
  if (!missing.length) return lines;

  const { data, error } = await db.from('menu_items').select('id, image_path').in('id', missing);
  if (error || !data) {
    // A thumbnail is not worth losing the notification over.
    console.error('menu_items lookup failed:', error);
    return lines;
  }

  const byId = new Map<string, string | null>(
    (data as { id: string; image_path: string | null }[]).map((item) => [item.id, item.image_path]),
  );
  return lines.map((line) =>
    line.image_path ? line : { ...line, image_path: byId.get(line.id) ?? null }
  );
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);

  const apiKey = Deno.env.get('RESEND_API_KEY');
  const to = Deno.env.get('ADMIN_EMAIL');
  if (!apiKey || !to) {
    console.error('RESEND_API_KEY or ADMIN_EMAIL is not set');
    return json({ error: 'notifications are not configured' }, 500);
  }

  let id: unknown;
  try {
    ({ id } = await request.json());
  } catch {
    return json({ error: 'expected a JSON body' }, 400);
  }
  // Shape-checked here so a malformed id is a 400 rather than a uuid cast
  // error surfacing from Postgres as a 500.
  if (typeof id !== 'string' || !UUID.test(id)) return json({ error: 'expected { id }' }, 400);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const db = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
    auth: { persistSession: false },
  });

  const { data, error } = await db.from('enquiries').select().eq('id', id).maybeSingle();
  if (error) {
    console.error('enquiry read failed:', error);
    return json({ error: 'could not read the enquiry' }, 500);
  }
  if (!data) return json({ error: 'no such enquiry' }, 404);

  const row = data as EnquiryRow;
  row.cart_lines = await withImages(db, row.cart_lines ?? []);

  // The prices in cart_lines are the visitor's snapshot, not a fresh lookup
  // against menu_items — the email reports what they were quoted, which is
  // also what /admin/requests shows for the same row.
  const { subject, html, text } = renderEnquiryEmail(row, { supabaseUrl });

  const response = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: Deno.env.get('RESEND_FROM') || DEFAULT_FROM,
      to: [to],
      subject,
      html,
      text,
      // Replying to the notification answers the customer directly.
      reply_to: row.email,
    }),
    // The caller is fire-and-forget, but the function still pays for the wait.
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) {
    const detail = await response.text();
    console.error(`Resend rejected the message (${response.status}):`, detail);
    return json({ error: 'send failed', status: response.status }, 502);
  }

  return json({ ok: true });
});
