import { DOCUMENT } from '@angular/common';
import { computed, effect, inject, Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { PrimeNG } from 'primeng/config';
import { filter, map } from 'rxjs';
import { primeNgTranslation } from '@shared/utils/primeng-translation';

/**
 * The URL is the single source of truth for language: Bulgarian at the root,
 * every other language under its own prefix (/en, /tr, /el). That is what makes the English pages indexable at all —
 * a localStorage toggle is invisible to a crawler — and it removes any chance
 * of the prerendered HTML disagreeing with what the browser then renders.
 */
@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly router = inject(Router);
  private readonly document = inject(DOCUMENT);
  private readonly primeng = inject(PrimeNG);

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly current = computed(() => this.languageOf(this.url()));

  constructor() {
    this.translate.addLangs(CONSTANTS.LANGUAGES);
    this.translate.setDefaultLang(CONSTANTS.LANGUAGE_BG);
    this.apply(this.current());

    // PrimeNG keeps its own month/day names, so the calendar has to be
    // re-labelled whenever the URL language changes.
    effect(() => {
      const lang = this.current();
      this.primeng.setTranslation(
        primeNgTranslation(
          lang,
          this.translate.instant(CONSTANTS.CONTACTS_DATE_TODAY),
          this.translate.instant(CONSTANTS.CONTACTS_DATE_CLEAR)
        )
      );
    });
  }

  /**
   * Prefixes an absolute in-app path with the active language branch, so a
   * link written once ('/admin/menu') stays inside the language the visitor
   * is reading. Pass a language explicitly where the URL being decided is
   * not the one the router has navigated to yet, such as inside a guard.
   */
  localize(path: string, lang: string = this.current()): string {
    const prefix = CONSTANTS.LANGUAGE_PREFIXES[lang];
    return prefix ? `/${prefix}${path}` : path;
  }

  /** The language branch a URL sits in; Bulgarian when it has no prefix. */
  languageOf(url: string): string {
    const path = url.split(/[?#]/)[0];
    const match = Object.entries(CONSTANTS.LANGUAGE_PREFIXES).find(
      ([, prefix]) => path === `/${prefix}` || path.startsWith(`/${prefix}/`)
    );
    return match ? match[0] : CONSTANTS.LANGUAGE_BG;
  }

  /** Mirrors a URL in another language, for the navbar's language dropdown. */
  urlFor(url: string, lang: string): string {
    const [path, ...rest] = url.split(/(?=[?#])/);
    const tail = rest.join('');

    const prefix = CONSTANTS.LANGUAGE_PREFIXES[this.languageOf(path)];
    const stripped = prefix ? path.slice(`/${prefix}`.length) || '/' : path;
    const target = this.localize(stripped === '/' ? '' : stripped, lang);
    return (target || '/') + tail;
  }

  /** Applied by AppComponent on every navigation. */
  apply(lang: string): void {
    if (this.translate.currentLang !== lang) this.translate.use(lang);
    this.document.documentElement.lang = lang;
  }
}
