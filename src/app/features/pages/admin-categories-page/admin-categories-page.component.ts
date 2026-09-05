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
import { MenuCategoryModel } from '@shared/models/menu-category.model';
import { SharedModule } from '@shared/shared.module';
import { Subject, takeUntil } from 'rxjs';
import { CategoryDialogComponent } from '../../components/admin/category-dialog/category-dialog.component';
import { ConfirmDialogComponent } from '../../components/admin/confirm-dialog/confirm-dialog.component';
import { CategoriesService } from '../../services/categories.service';

@Component({
  selector: 'app-admin-categories-page',
  imports: [SharedModule, CategoryDialogComponent, ConfirmDialogComponent],
  templateUrl: './admin-categories-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoriesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private categoriesService = inject(CategoriesService);

  readonly CONSTANTS = CONSTANTS;

  readonly categories = signal<MenuCategoryModel[]>([]);
  readonly page = signal(1);
  readonly visibleCategories = computed(() => pageSlice(this.categories(), this.page()));
  readonly deleting = signal(false);

  readonly error = signal('');
  readonly categoryDialog = signal<{ category: MenuCategoryModel | null } | null>(null);
  readonly pendingDelete = signal<MenuCategoryModel | null>(null);

  constructor() {
    // A delete on the last page, or a shorter list after a reload, would
    // otherwise leave the view on a page with nothing on it.
    effect(() => this.page.update((page) => clampPage(page, this.categories().length)));
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
    this.categoriesService
      .fetch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((categories) => this.categories.set(categories));
  }

  onDialogSaved(): void {
    this.categoryDialog.set(null);
    this.error.set('');
    this.load();
  }

  /**
   * menu_items.category holds the name, so deleting a category that is still
   * in use would leave those items pointing at nothing. Checked before the
   * confirm dialog opens so the admin gets the reason, not a silent failure.
   */
  askDelete(category: MenuCategoryModel): void {
    this.error.set('');
    this.categoriesService
      .countItems(category.name)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (count) => {
          if (count > 0) {
            this.error.set(`${category.name} — ${count}`);
            return;
          }
          this.pendingDelete.set(category);
        },
        error: (err) => {
          console.error('Category usage check failed:', err);
          this.error.set(err?.message || 'check failed');
        },
      });
  }

  confirmDelete(): void {
    const category = this.pendingDelete();
    if (!category) return;

    this.deleting.set(true);
    this.categoriesService.remove(category.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.load();
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.error.set(err?.message || 'delete failed');
      },
    });
  }
}
