import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  signal,
  type OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ScrollLockService } from '@core/services/scroll-lock.service';
import { CONSTANTS } from '@shared/constants';
import { MenuCategoryModel } from '@shared/models/menu-category.model';
import { SharedModule } from '@shared/shared.module';
import { CategoriesService } from '../../../services/categories.service';

@Component({
  selector: 'app-category-dialog',
  imports: [SharedModule],
  templateUrl: './category-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoryDialogComponent implements OnInit, OnDestroy {
  /** Null when adding, the row when editing. */
  @Input() category: MenuCategoryModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private categoriesService = inject(CategoriesService);
  private scrollLock = inject(ScrollLockService);

  readonly CONSTANTS = CONSTANTS;
  readonly busy = signal(false);
  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    // Optional: blank falls back to the Bulgarian name.
    name_en: [''],
    sort_order: [0, Validators.required],
  });

  get isEdit(): boolean {
    return !!this.category;
  }

  ngOnInit(): void {
    this.scrollLock.lock();
    if (this.category) {
      this.form.patchValue({
        name: this.category.name,
        name_en: this.category.name_en ?? '',
        sort_order: this.category.sort_order,
      });
    }
  }

  ngOnDestroy(): void {
    this.scrollLock.release();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const fields = this.form.getRawValue();
    this.busy.set(true);
    this.error.set('');

    // Renaming cascades to menu_items.category in a database trigger.
    const request = this.category
      ? this.categoriesService.update({ ...fields, id: this.category.id })
      : this.categoriesService.create(fields);

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.saved.emit();
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.busy.set(false);
        this.error.set(err?.message || 'save failed');
      },
    });
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy()) this.cancelled.emit();
  }
}
