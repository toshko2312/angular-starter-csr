import { Translation } from 'primeng/api';
import { CONSTANTS } from '@shared/constants';

const INTL_LOCALE: Record<string, string> = {
  [CONSTANTS.LANGUAGE_BG]: 'bg-BG',
  [CONSTANTS.LANGUAGE_EN]: 'en-GB',
};

function names(locale: string, dates: Date[], options: Intl.DateTimeFormatOptions): string[] {
  const format = new Intl.DateTimeFormat(locale, options);
  return dates.map((date) => format.format(date));
}

/**
 * PrimeNG carries its own month/day names. Deriving them from Intl rather than
 * hardcoding two lists keeps them correct for whatever locale is active — the
 * same approach products-list.component.ts uses for its date badge.
 */
export function primeNgTranslation(lang: string, today: string, clear: string): Translation {
  const locale = INTL_LOCALE[lang] ?? INTL_LOCALE[CONSTANTS.LANGUAGE_BG];

  // Any week starting on a Sunday, and any year, will do — only the names are read.
  const week = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 7 + i));
  const months = Array.from({ length: 12 }, (_, i) => new Date(2024, i, 1));

  return {
    dayNames: names(locale, week, { weekday: 'long' }),
    dayNamesShort: names(locale, week, { weekday: 'short' }),
    dayNamesMin: names(locale, week, { weekday: 'narrow' }),
    monthNames: names(locale, months, { month: 'long' }),
    monthNamesShort: names(locale, months, { month: 'short' }),
    // Monday, per both Bulgarian and British convention.
    firstDayOfWeek: 1,
    today,
    clear,
    dateFormat: lang === CONSTANTS.LANGUAGE_EN ? 'dd/mm/yy' : 'dd.mm.yy',
  };
}
