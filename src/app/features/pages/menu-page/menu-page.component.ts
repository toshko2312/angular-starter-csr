import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { LanguageService } from '@core/services/language.service';
import { SeoService } from '@core/services/seo.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { MenuListComponent } from '../../components/menu-list/menu-list.component';

@Component({
  selector: 'app-menu-page',
  imports: [SharedModule, MenuListComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent {
  readonly CONSTANTS = CONSTANTS;

  private seo = inject(SeoService);
  private language = inject(LanguageService);

  constructor() {
    effect(() => {
      this.language.current();
      this.seo.apply({
        titleKey: CONSTANTS.SEO_MENU_TITLE,
        descriptionKey: CONSTANTS.SEO_MENU_DESCRIPTION,
        page: CONSTANTS.MENU_PAGE,
      });
    });
  }
}
