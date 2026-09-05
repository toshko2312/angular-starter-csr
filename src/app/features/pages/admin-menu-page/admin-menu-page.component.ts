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
import { CONSTANTS } from '@shared/constants';
import { clampPage, pageSlice } from '@shared/utils/paginate';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { priceWithUnit } from '@shared/utils/money';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../components/admin/confirm-dialog/confirm-dialog.component';
import { MenuItemDialogComponent } from '../../components/admin/menu-item-dialog/menu-item-dialog.component';
import { MenuService } from '../../services/menu.service';

@Component({
  selector: 'app-admin-menu-page',
  imports: [SharedModule, MenuItemDialogComponent, ConfirmDialogComponent],
  templateUrl: './admin-menu-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminMenuPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private menuService = inject(MenuService);

  readonly CONSTANTS = CONSTANTS;

  readonly menuItems = signal<MenuItemModel[]>([]);
  readonly page = signal(1);
  readonly visibleItems = computed(() => pageSlice(this.menuItems(), this.page()));
  readonly deleting = signal(false);

  readonly menuDialog = signal<{ item: MenuItemModel | null } | null>(null);
  readonly pendingDelete = signal<MenuItemModel | null>(null);

  constructor() {
    // A delete on the last page, or a shorter list after a reload, would
    // otherwise leave the view on a page with nothing on it.
    effect(() => this.page.update((page) => clampPage(page, this.menuItems().length)));
  }

  ngOnInit(): void {
    this.load();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Always the live rows — the cached reads would hide edits made here. */
  load(): void {
    this.menuService
      .fetch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => this.menuItems.set(items));
  }

  priceLabel(item: MenuItemModel): string {
    return priceWithUnit(item.price, item.unit);
  }

  onDialogSaved(): void {
    this.menuDialog.set(null);
    this.load();
  }

  confirmDelete(): void {
    const item = this.pendingDelete();
    if (!item) return;

    this.deleting.set(true);
    this.menuService.remove(item.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.load();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deleting.set(false);
        this.pendingDelete.set(null);
      },
    });
  }
}
