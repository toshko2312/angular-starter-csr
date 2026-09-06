/**
 * Renders the admin notification for a submitted enquiry.
 *
 * Kept apart from index.ts so the template can be exercised with `deno test`
 * without a network call, and so the transport stays a dozen lines.
 */

export interface EnquiryCartLine {
  id: string;
  name: string;
  qty: number;
  price: number;
  unit: string;
  image_path?: string | null;
}

export interface EnquiryRow {
  id: string;
  created_at: string;
  name: string;
  email: string;
  phone: string | null;
  event_date: string | null;
  event_time: string | null;
  event_time_unknown: boolean;
  guests: number | null;
  event_type: string | null;
  location: string | null;
  message: string;
  cart_lines: EnquiryCartLine[];
}

export interface RenderOptions {
  /** Storage origin that a thumbnail URL must sit under. See safeImage(). */
  supabaseUrl: string;
  /** Public site origin, no trailing slash. Used for the admin deep link. */
  siteUrl: string;
}

export interface RenderedEmail {
  subject: string;
  html: string;
  text: string;
}

// ---------------------------------------------------------------- formatting
//
// Deliberate duplicates of src/app/shared/utils/money.ts. An edge function is
// Deno and cannot import from the Angular sources, so the two have to be kept
// in step by hand — change one, change the other.

/** 12.5 -> "12,50 €". Mirrors money() in src/app/shared/utils/money.ts. */
function money(value: number): string {
  return value.toFixed(2).replace('.', ',') + '\u00A0\u20AC';
}

/** '€/бр.' -> '/бр.'. Mirrors unitSuffix() in src/app/shared/utils/money.ts. */
function unitSuffix(unit: string): string {
  const trimmed = (unit || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('\u20AC')) return trimmed.slice(1).trimStart();
  return '\u00A0' + trimmed;
}

/** Mirrors priceWithUnit() in src/app/shared/utils/money.ts. */
function priceWithUnit(value: number, unit: string): string {
  return money(value) + unitSuffix(unit);
}

/**
 * cart_lines is client-written JSON — a visitor controls every field in it,
 * image_path included. Anything that is not a public object in this project's
 * own storage is dropped, so a submitter cannot plant a tracking pixel or an
 * arbitrary remote image in the admin's inbox.
 */
function safeImage(value: unknown, supabaseUrl: string): string | null {
  if (typeof value !== 'string' || !value) return null;
  const prefix = `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/`;
  return value.startsWith(prefix) ? value : null;
}

/** Same reason: price and qty arrive from the client and may be anything. */
function num(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * A subject line is a mail header. Resend encodes what we send it, but a
 * newline in visitor-supplied text has no business getting that far.
 */
function headerSafe(value: string): string {
  return value.replace(/[\r\n]+/g, ' ').trim();
}

/** Everything below is free text a stranger typed into a public form. */
function escape(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** '2026-09-14' -> '14.09.2026'. Left as-is if it is not a plain ISO date. */
function formatDate(value: string | null): string {
  if (!value) return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  return match ? `${match[3]}.${match[2]}.${match[1]}` : value;
}

/** Postgres hands back 'HH:mm:ss'; the seconds are always zero here. */
function formatTime(row: EnquiryRow): string {
  if (row.event_time_unknown) return 'не е уточнен';
  return (row.event_time || '').slice(0, 5);
}

/** The admin panel recomputes this too — see cartTotal() in admin-enquiries-page. */
export function cartTotal(lines: EnquiryCartLine[]): number {
  return lines.reduce((sum, line) => sum + num(line.price) * num(line.qty), 0);
}

// -------------------------------------------------------------------- layout

const BORDER = '#e6e1d8';
const MUTED = '#6b6459';
const INK = '#2a2622';

type Field = [label: string, value: string];

/**
 * The rows worth printing. Optional fields are dropped entirely rather than
 * shown empty — a shorter email reads faster on a phone, which is where these
 * get read. Date and time stay even when blank: "not given" is information
 * when someone is trying to book a date.
 */
function fields(row: EnquiryRow): Field[] {
  const out: Field[] = [
    ['Име', row.name],
    ['Имейл', row.email],
  ];

  if (row.phone?.trim()) out.push(['Телефон', row.phone]);
  out.push(['Дата на събитието', formatDate(row.event_date) || '—']);
  out.push(['Час на събитието', formatTime(row) || '—']);
  if (row.guests != null) out.push(['Брой гости', String(row.guests)]);
  if (row.event_type?.trim()) out.push(['Тип събитие', row.event_type]);
  if (row.location?.trim()) out.push(['Локация', row.location]);

  return out;
}

function fieldRowsHtml(row: EnquiryRow): string {
  return fields(row)
    .map(([label, value]) => {
      const rendered =
        label === 'Имейл'
          ? `<a href="mailto:${escape(value)}" style="color:#8a6d3b">${escape(value)}</a>`
          : escape(value);

      return `<tr>
        <td style="padding:6px 16px 6px 0;color:${MUTED};font-size:13px;white-space:nowrap;vertical-align:top">${label}</td>
        <td style="padding:6px 0;color:${INK};font-size:14px;font-weight:600">${rendered}</td>
      </tr>`;
    })
    .join('');
}

function cartHtml(lines: EnquiryCartLine[], supabaseUrl: string): string {
  if (!lines.length) {
    return `<p style="margin:0;color:${MUTED};font-size:14px">Без прикачена количка</p>`;
  }

  const rows = lines
    .map((line) => {
      // image_path is already an absolute Supabase Storage public URL, so it
      // goes straight into the tag. Clients gate remote images behind "show
      // images"; the cell just collapses when they do.
      const image = safeImage(line.image_path, supabaseUrl);
      // Width and height as attributes as well as inline style: Outlook
      // ignores CSS-only sizing and would render the full-size upload.
      const thumb = image
        ? `<img src="${escape(image)}" width="48" height="48" alt=""
             style="display:block;width:48px;height:48px;border-radius:6px;object-fit:cover;border:1px solid ${BORDER}">`
        : '';

      return `<tr>
        <td style="padding:8px 12px 8px 0;width:48px;vertical-align:middle">${thumb}</td>
        <td style="padding:8px 12px 8px 0;color:${INK};font-size:14px;vertical-align:middle">
          ${escape(line.name)}
          <div style="color:${MUTED};font-size:12px;padding-top:2px">${num(line.qty)} × ${priceWithUnit(num(line.price), line.unit)}</div>
        </td>
        <td style="padding:8px 0;color:${INK};font-size:14px;font-weight:600;text-align:right;white-space:nowrap;vertical-align:middle">
          ${money(num(line.price) * num(line.qty))}
        </td>
      </tr>`;
    })
    .join('');

  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
    ${rows}
    <tr>
      <td colspan="2" style="padding:12px 12px 0 0;border-top:1px solid ${BORDER};color:${MUTED};font-size:13px">Ориентировъчно</td>
      <td style="padding:12px 0 0;border-top:1px solid ${BORDER};color:${INK};font-size:16px;font-weight:700;text-align:right;white-space:nowrap">
        ${money(cartTotal(lines))}
      </td>
    </tr>
  </table>`;
}

function textBody(row: EnquiryRow, adminUrl: string): string {
  const lines = fields(row).map(([label, value]) => `${label}: ${value}`);

  lines.push('', 'Съобщение:', row.message, '');

  if (row.cart_lines.length) {
    lines.push('Прикачена количка:');
    for (const line of row.cart_lines) {
      lines.push(
        `  - ${line.name} — ${num(line.qty)} × ${priceWithUnit(num(line.price), line.unit)} = ${money(num(line.price) * num(line.qty))}`,
      );
    }
    lines.push('', `Ориентировъчно: ${money(cartTotal(row.cart_lines))}`);
  } else {
    lines.push('Без прикачена количка');
  }

  lines.push('', 'Отвори заявката:', adminUrl);

  return lines.join('\n');
}

export function renderEnquiryEmail(row: EnquiryRow, options: RenderOptions): RenderedEmail {
  const total = cartTotal(row.cart_lines);
  // The total rides in the subject so the inbox list is triageable without
  // opening anything.
  const who = headerSafe(row.name);
  // row.id is a UUID the caller already matched against its own regex, so this
  // needs no encoding — it is escaped below only because every interpolated
  // value in this template is.
  const adminUrl = `${options.siteUrl}/admin/requests?id=${row.id}`;
  const subject = row.cart_lines.length
    ? `Ново запитване от ${who} — ${money(total)}`
    : `Ново запитване от ${who}`;

  const html = `<div style="margin:0;padding:24px 16px;background:#faf8f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif">
  <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid ${BORDER};border-radius:12px;border-collapse:separate">
    <tr>
      <td style="padding:24px 24px 8px">
        <div style="color:${MUTED};font-size:12px;letter-spacing:.08em;text-transform:uppercase">Запитване</div>
        <h1 style="margin:6px 0 0;color:${INK};font-size:20px;font-weight:700">Ново запитване от ${escape(row.name)}</h1>
      </td>
    </tr>
    <tr>
      <td style="padding:16px 24px 0">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse">
          ${fieldRowsHtml(row)}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0">
        <div style="color:${MUTED};font-size:13px;padding-bottom:6px">Съобщение</div>
        <div style="color:${INK};font-size:14px;line-height:1.55;background:#faf8f4;border:1px solid ${BORDER};border-radius:8px;padding:12px">
          ${escape(row.message).replace(/\r?\n/g, '<br>')}
        </div>
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 0">
        <div style="color:${MUTED};font-size:13px;padding-bottom:8px">Прикачена количка</div>
        ${cartHtml(row.cart_lines, options.supabaseUrl)}
      </td>
    </tr>
    <tr>
      <td style="padding:20px 24px 24px">
        <a href="${escape(adminUrl)}" style="display:inline-block;background:${INK};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 20px;border-radius:8px">Отвори заявката</a>
      </td>
    </tr>
  </table>
</div>`;

  return { subject, html, text: textBody(row, adminUrl) };
}
