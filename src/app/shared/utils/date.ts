/**
 * Date <-> 'yyyy-MM-dd' using the *local* calendar day.
 *
 * Deliberately not `toISOString().slice(0, 10)`: a date picked at local
 * midnight in Bulgaria (UTC+2/+3) serialises to the previous day in UTC, so
 * the stored event date would be off by one.
 */
export function toIsoDate(value: Date | null | undefined): string {
  if (!value || isNaN(value.getTime())) return '';
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Parses 'yyyy-MM-dd' as a local date, for the same reason. */
export function fromIsoDate(value: string | Date | null | undefined): Date | null {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;

  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match) {
    const [, year, month, day] = match;
    return new Date(Number(year), Number(month) - 1, Number(day));
  }

  const parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

/** Today at local midnight — the boundary for min/max date constraints. */
export function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}
