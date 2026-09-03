import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { money } from '@shared/utils/money';
import { Subject, takeUntil } from 'rxjs';
import { CartService } from '../../services/cart.service';
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

  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);
  readonly items = signal<MenuItemModel[]>([]);
  readonly category = signal<string>(CONSTANTS.ALL_CATEGORIES);

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

  ngOnInit(): void {
    this.menuService
      .getMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => this.items.set(items));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  priceLabel(item: MenuItemModel): string {
    return money(item.price);
  }
}
