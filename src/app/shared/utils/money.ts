/**
 * Formats a number as euro, e.g. 12.5 -> "12,50 €".
 * Comma decimal separator and trailing symbol, per Bulgarian/EU convention.
 * The space is non-breaking so the amount never wraps away from the symbol.
 */
export function money(value: number): string {
  return value.toFixed(2).replace('.', ',') + '\u00A0\u20AC';
}
