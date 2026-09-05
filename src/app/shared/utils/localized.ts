import { CONSTANTS } from '@shared/constants';

/**
 * The English text when there is one and English is active, the Bulgarian
 * otherwise. Content is filled in gradually, so a blank English field must
 * fall back rather than render empty.
 */
export function localized(
  bg: string | null | undefined,
  en: string | null | undefined,
  lang: string
): string {
  if (lang === CONSTANTS.LANGUAGE_EN && en?.trim()) return en.trim();
  return bg ?? '';
}
