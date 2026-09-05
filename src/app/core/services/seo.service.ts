import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { LanguageService } from './language.service';

export interface SeoPage {
  /** Translation key for the <title>. */
  titleKey: string;
  /** Translation key for the meta description. */
  descriptionKey: string;
  /** Bulgarian path, without the /en prefix: '', 'menu', 'contacts'. */
  page: string;
}

/**
 * Per-page title, description, canonical, Open Graph and hreflang.
 *
 * Every page must declare its own canonical and both hreflang alternates,
 * otherwise the Bulgarian and English versions look like duplicates.
 */
@Injectable({
  providedIn: 'root',
})
export class SeoService {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);
  private readonly translate = inject(TranslateService);
  private readonly language = inject(LanguageService);
  private readonly document = inject(DOCUMENT);

  apply(config: SeoPage): void {
    const lang = this.language.current();
    const title = this.translate.instant(config.titleKey);
    const description = this.translate.instant(config.descriptionKey);
    const canonical = this.absolute(this.pathFor(config.page, lang));
    const image = CONSTANTS.SITE_ORIGIN + CONSTANTS.OG_IMAGE;

    this.title.setTitle(title);
    this.meta.updateTag({ name: 'description', content: description });

    this.meta.updateTag({ property: 'og:title', content: title });
    this.meta.updateTag({ property: 'og:description', content: description });
    this.meta.updateTag({ property: 'og:url', content: canonical });
    this.meta.updateTag({ property: 'og:image', content: image });
    this.meta.updateTag({ property: 'og:type', content: 'website' });
    this.meta.updateTag({
      property: 'og:locale',
      content: lang === CONSTANTS.LANGUAGE_EN ? 'en_GB' : 'bg_BG',
    });

    this.meta.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
    this.meta.updateTag({ name: 'twitter:title', content: title });
    this.meta.updateTag({ name: 'twitter:description', content: description });
    this.meta.updateTag({ name: 'twitter:image', content: image });

    this.setLink('canonical', canonical);
    this.setAlternate(
      CONSTANTS.LANGUAGE_BG,
      this.absolute(this.pathFor(config.page, CONSTANTS.LANGUAGE_BG))
    );
    this.setAlternate(
      CONSTANTS.LANGUAGE_EN,
      this.absolute(this.pathFor(config.page, CONSTANTS.LANGUAGE_EN))
    );
    // Bulgarian is the default for anyone Google cannot place.
    this.setAlternate('x-default', this.absolute(this.pathFor(config.page, CONSTANTS.LANGUAGE_BG)));
  }

  private pathFor(page: string, lang: string): string {
    const suffix = page ? `/${page}` : '';
    return lang === CONSTANTS.LANGUAGE_EN
      ? `/${CONSTANTS.LANGUAGE_EN_PREFIX}${suffix}`
      : suffix || '/';
  }

  private absolute(path: string): string {
    return CONSTANTS.SITE_ORIGIN + (path === '/' ? '/' : path);
  }

  private setLink(rel: string, href: string): void {
    const head = this.document.head;
    let link = head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', rel);
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }

  private setAlternate(hreflang: string, href: string): void {
    const head = this.document.head;
    const selector = `link[rel="alternate"][hreflang="${hreflang}"]`;
    let link = head.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = this.document.createElement('link');
      link.setAttribute('rel', 'alternate');
      link.setAttribute('hreflang', hreflang);
      head.appendChild(link);
    }
    link.setAttribute('href', href);
  }
}
