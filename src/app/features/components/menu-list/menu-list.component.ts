import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { JsonLdService } from '@core/services/json-ld.service';
import { LanguageService } from '@core/services/language.service';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { MenuCategoryModel } from '@shared/models/menu-category.model';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { localized } from '@shared/utils/localized';
import { money, unitSuffix } from '@shared/utils/money';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { CategoriesService } from '../../services/categories.service';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-menu-list',
  imports: [SharedModule],
  templateUrl: './menu-list.component.html',
  styleUrl: './menu-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);
  private categoriesService = inject(CategoriesService);
  private language = inject(LanguageService);
  private jsonLd = inject(JsonLdService);
  private translate = inject(TranslateService);

  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);
  readonly items = signal<MenuItemModel[]>([]);
  readonly category = signal<string>(CONSTANTS.ALL_CATEGORIES);
  /** Only for their English names — the chips themselves come from the items. */
  readonly categoryRows = signal<MenuCategoryModel[]>([]);

  /** Bulgarian category name (what menu_items stores) -> the label to show. */
  private readonly categoryLabels = computed(() => {
    const lang = this.language.current();
    return new Map(
      this.categoryRows().map((row) => [row.name, localized(row.name, row.name_en, lang)])
    );
  });

  /** Categories come from the data, so the chips stay in sync with the table. */
  readonly categories = computed(() => [
    CONSTANTS.ALL_CATEGORIES,
    ...Array.from(new Set(this.items().map((item) => item.category))).filter(Boolean),
  ]);

  readonly visibleItems = computed(() => {
    const active = this.category();
    return active === CONSTANTS.ALL_CATEGORIES
      ? this.items()
      : this.items().filter((item) => item.category === active);
  });

  constructor() {
    // Built from exactly what the page renders, so the prerendered HTML
    // carries a Menu schema that matches the visible menu.
    effect(() => {
      const sections = this.categories()
        .filter((name) => name !== CONSTANTS.ALL_CATEGORIES)
        .map((name) => ({
          '@type': 'MenuSection',
          name: this.categoryLabel(name),
          hasMenuItem: this.items()
            .filter((item) => item.category === name)
            .map((item) => ({
              '@type': 'MenuItem',
              name: this.nameOf(item),
              description: this.descriptionOf(item),
              offers: {
                '@type': 'Offer',
                price: item.price,
                priceCurrency: 'EUR',
              },
            })),
        }))
        .filter((section) => section.hasMenuItem.length > 0);

      if (!sections.length) return;

      this.jsonLd.set('menu', {
        '@context': 'https://schema.org',
        '@type': 'Menu',
        name: this.translate.instant(CONSTANTS.MENU_TITLE),
        inLanguage: this.language.current(),
        hasMenuSection: sections,
      });
    });
  }

  ngOnInit(): void {
    this.menuService
      .getMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => this.items.set(items));

    this.categoriesService
      .getCategories()
      .pipe(takeUntil(this.destroy$))
      .subscribe((rows) => this.categoryRows.set(rows));
  }

  ngOnDestroy(): void {
    this.jsonLd.remove('menu');
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** The filter still compares Bulgarian names; only the label is localised. */
  categoryLabel(name: string): string {
    return this.categoryLabels().get(name) ?? name;
  }

  nameOf(item: MenuItemModel): string {
    return localized(item.name, item.name_en, this.language.current());
  }

  descriptionOf(item: MenuItemModel): string {
    return localized(item.description, item.description_en, this.language.current());
  }

  priceLabel(item: MenuItemModel): string {
    return money(item.price);
  }

  /** The price span already prints the symbol the unit carries. */
  unitLabel(item: MenuItemModel): string {
    return unitSuffix(item.unit);
  }
}
