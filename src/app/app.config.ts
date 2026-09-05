import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideClientHydration } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateLoader } from '@ngx-translate/core';
import { StaticTranslateLoader } from './shared/translate-loader';
import { CONSTANTS } from './shared/constants';
import { providePrimeNG } from 'primeng/config';
import { CateringPreset } from './shared/theme/catering-preset';
import { provideAnimations } from '@angular/platform-browser/animations';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({ scrollPositionRestoration: 'top', anchorScrolling: 'enabled' })
    ),
    provideClientHydration(),
    provideHttpClient(),
    // One call: a second provideTranslateService() silently discards the
    // first, and the language switch depends on this loader being the live one.
    provideTranslateService({
      defaultLanguage: CONSTANTS.LANGUAGE_BG,
      loader: { provide: TranslateLoader, useClass: StaticTranslateLoader },
    }),
    providePrimeNG({
      theme: {
        preset: CateringPreset,
        options: {
          // PrimeNG's rules go into a cascade layer, and unlayered CSS beats
          // layered CSS unconditionally — so styles.scss overrides the widget
          // styling with no !important anywhere.
          cssLayer: true,
          darkModeSelector: false,
        },
      },
    }),
    provideAnimations(),
  ],
};
