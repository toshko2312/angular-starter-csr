import { CONSTANTS } from '@shared/constants';

/**
 * Absolute in-app path for a public page, inside the active language branch.
 *
 * CONSTANTS.MENU_PAGE and friends are bare segments ('menu'), so binding one
 * straight to [routerLink] resolves it against the current route — which is
 * how "browse the menu" on /contacts used to navigate to /contacts/menu and
 * 404. Always route public links through here.
 */
export function localePath(page: string, lang: string): string {
  const suffix = page && page !== CONSTANTS.HOME_PAGE ? `/${page}` : '';
  return lang === CONSTANTS.LANGUAGE_EN
    ? `/${CONSTANTS.LANGUAGE_EN_PREFIX}${suffix}`
    : suffix || '/';
}
