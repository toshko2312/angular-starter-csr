import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { computed, effect, inject, Injectable, PLATFORM_ID, signal } from '@angular/core';
import { CONSTANTS } from '@shared/constants';

export type Theme = 'light' | 'dark';

/**
 * Light or dark, chosen by the reader and remembered.
 *
 * `prefers-color-scheme` is deliberately not consulted: light is the design's
 * default and the switch is explicit. The attribute this writes is also set by
 * a small inline script in index.html, so a returning reader never sees a
 * white frame before Angular boots.
 */
@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly document = inject(DOCUMENT);

  private readonly state = signal<Theme>(this.restore());
  readonly theme = this.state.asReadonly();
  readonly isDark = computed(() => this.state() === 'dark');

  constructor() {
    effect(() => this.apply(this.state()));
  }

  toggle(): void {
    this.state.update((theme) => (theme === 'dark' ? 'light' : 'dark'));
  }

  private restore(): Theme {
    if (!this.isBrowser) return 'light';
    try {
      return localStorage.getItem(CONSTANTS.THEME_KEY) === 'dark' ? 'dark' : 'light';
    } catch {
      // Storage unavailable (private mode, quota) — the default still holds.
      return 'light';
    }
  }

  private apply(theme: Theme): void {
    if (!this.isBrowser) return;

    const root = this.document.documentElement;
    if (theme === 'dark') root.setAttribute('data-theme', 'dark');
    else root.removeAttribute('data-theme');

    // Keeps the mobile browser chrome from staying light behind a dark page.
    this.document
      .querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme === 'dark' ? '#14120f' : '#a8412a');

    try {
      localStorage.setItem(CONSTANTS.THEME_KEY, theme);
    } catch {
      // The choice simply does not survive the tab.
    }
  }
}
