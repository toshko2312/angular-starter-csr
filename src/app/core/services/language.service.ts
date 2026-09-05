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
 * English under /en. That is what makes the English pages indexable at all —
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

  readonly current = computed(() =>
    this.isEnglishUrl(this.url()) ? CONSTANTS.LANGUAGE_EN : CONSTANTS.LANGUAGE_BG
  );

  /** Mirrors the current page in the other language, for the navbar toggle. */
  readonly otherLanguageUrl = computed(() => this.swapLanguage(this.url()));

  constructor() {
    this.translate.addLangs([CONSTANTS.LANGUAGE_BG, CONSTANTS.LANGUAGE_EN]);
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
    return lang === CONSTANTS.LANGUAGE_EN
      ? `/${CONSTANTS.LANGUAGE_EN_PREFIX}${path}`
      : path;
  }

  /** True for a URL inside the English branch, /en included. */
  languageOf(url: string): string {
    return this.isEnglishUrl(url) ? CONSTANTS.LANGUAGE_EN : CONSTANTS.LANGUAGE_BG;
  }

  /** Applied by AppComponent on every navigation. */
  apply(lang: string): void {
    if (this.translate.currentLang !== lang) this.translate.use(lang);
    this.document.documentElement.lang = lang;
  }

  private isEnglishUrl(url: string): boolean {
    const path = url.split(/[?#]/)[0];
    return path === `/${CONSTANTS.LANGUAGE_EN_PREFIX}` ||
      path.startsWith(`/${CONSTANTS.LANGUAGE_EN_PREFIX}/`);
  }

  private swapLanguage(url: string): string {
    const [path, ...rest] = url.split(/(?=[?#])/);
    const tail = rest.join('');

    if (this.isEnglishUrl(path)) {
      const stripped = path.slice(`/${CONSTANTS.LANGUAGE_EN_PREFIX}`.length);
      return (stripped || '/') + tail;
    }
    return `/${CONSTANTS.LANGUAGE_EN_PREFIX}${path === '/' ? '' : path}` + tail;
  }
}
