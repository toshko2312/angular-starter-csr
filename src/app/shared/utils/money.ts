/**
 * Formats a number as euro, e.g. 12.5 -> "12,50 €".
 * Comma decimal separator and trailing symbol, per Bulgarian/EU convention.
 * The space is non-breaking so the amount never wraps away from the symbol.
 */
export function money(value: number): string {
  return value.toFixed(2).replace('.', ',') + '\u00A0\u20AC';
}

/**
 * Strips the currency symbol a unit already carries, so it can sit directly
 * after a formatted price: '€/бр.' -> '/бр.'. The unit is free text the admin
 * types, so a unit written without a symbol comes back as-is, prefixed with a
 * non-breaking space to stand off the amount.
 */
export function unitSuffix(unit: string): string {
  const trimmed = (unit || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('\u20AC')) return trimmed.slice(1).trimStart();
  return '\u00A0' + trimmed;
}

/** e.g. 12.5 + '€/бр.' -> "12,50 €/бр." */
export function priceWithUnit(value: number, unit: string): string {
  return money(value) + unitSuffix(unit);
}
