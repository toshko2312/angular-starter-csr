import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { SeoService } from '@core/services/seo.service';
import { CONSTANTS } from '../../../shared/constants';
import { SharedModule } from '@shared/shared.module';
import { ProductsListComponent } from '../../../features/components/products-list/products-list.component';
import { LanguageService } from '@core/services/language.service';
import { localePath } from '@shared/utils/locale-path';

@Component({
  selector: 'app-home',
  imports: [SharedModule, ProductsListComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  CONSTANTS = CONSTANTS;

  private seo = inject(SeoService);
  private language = inject(LanguageService);

  constructor() {
    // Re-runs on a language switch so the canonical and copy follow the URL.
    effect(() => {
      this.language.current();
      this.seo.apply({
        titleKey: CONSTANTS.SEO_HOME_TITLE,
        descriptionKey: CONSTANTS.SEO_HOME_DESCRIPTION,
        page: '',
      });
    });
  }

  /** Public links must be absolute and language-scoped — see localePath(). */
  path(page: string): string {
    return localePath(page, this.language.current());
  }
}
