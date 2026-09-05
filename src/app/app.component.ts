import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { CONSTANTS } from './shared/constants';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { CartDrawerComponent } from './features/components/cart-drawer/cart-drawer.component';
import { injectSpeedInsights } from '@vercel/speed-insights';
// Aliased: the bare name collides with Angular's own inject().
import { inject as injectAnalytics } from '@vercel/analytics';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent, CartDrawerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  CONSTANTS = CONSTANTS;
  title = 'angular-starter-csr';
  isTranslationLoaded: boolean = false;

  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  constructor(
    private translateService: TranslateService,
    private language: LanguageService
  ) {
    // The URL owns the language, so re-apply it after every navigation.
    // In the constructor because effect() needs an injection context.
    effect(() => this.language.apply(this.language.current()));
  }

  ngOnInit(): void {
    // Analytics needs a real browser; prerendering runs this in Node.
    // Web Analytics auto-tracks SPA route changes on its own — the script it
    // loads patches history — so the router needs no wiring here.
    if (this.isBrowser) {
      injectSpeedInsights();
      injectAnalytics();
    }

    this.translateService.get(CONSTANTS.DEFAULT_WEBSITE_TITLE).subscribe(() => {
      this.isTranslationLoaded = true;
    });
  }
}
