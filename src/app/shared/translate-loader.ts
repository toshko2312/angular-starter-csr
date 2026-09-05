import { TranslateLoader } from '@ngx-translate/core';
import { Observable, of } from 'rxjs';
import bg from '../../../public/i18n/bg.json';
import en from '../../../public/i18n/en.json';

type Translations = Record<string, unknown>;

const LOCALES: Record<string, Translations> = { bg, en };

/**
 * Serves the two locale files from the bundle instead of fetching them.
 *
 * TranslateHttpLoader asks for the relative './i18n/<lang>.json', which has no
 * meaning while prerendering in Node and would hang the build. Bundling also
 * removes a render-blocking request on the client; both files together are a
 * few kilobytes.
 */
export class StaticTranslateLoader implements TranslateLoader {
  getTranslation(lang: string): Observable<Translations> {
    return of(LOCALES[lang] ?? LOCALES['bg']);
  }
}
