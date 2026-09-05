import { isPlatformBrowser } from '@angular/common';
import { Component, effect, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { LanguageService } from './core/services/language.service';
import { CONSTANTS } from './shared/constants';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { CartDrawerComponent } from './features/components/cart-drawer/cart-drawer.component';
import { injectSpeedInsights } from '@vercel/speed-insights';

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
    if (this.isBrowser) injectSpeedInsights();

    this.translateService.get(CONSTANTS.DEFAULT_WEBSITE_TITLE).subscribe(() => {
      this.isTranslationLoaded = true;
    });
  }
}
