import {
  ChangeDetectionStrategy,
  Component,
  computed,
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
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { LanguageService } from '@core/services/language.service';
import { localized } from '@shared/utils/localized';
import { CategoriesService } from '../../../services/categories.service';
import { MenuService } from '../../../services/menu.service';
import { Observable, of, switchMap } from 'rxjs';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-menu-item-dialog',
  imports: [SharedModule],
  templateUrl: './menu-item-dialog.component.html',
  styleUrl: './menu-item-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemDialogComponent implements OnInit, OnDestroy {
  /** Null when adding, the row when editing. */
  @Input() item: MenuItemModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private categoriesService = inject(CategoriesService);
  private storage = inject(StorageService);
  private language = inject(LanguageService);
  private scrollLock = inject(ScrollLockService);

  readonly CONSTANTS = CONSTANTS;
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  /** The stored URL of an image already saved on this row. */
  readonly imagePath = signal<string | null>(null);
  /**
   * Picked but not yet stored. Nothing reaches the bucket until Save, so a
   * cancelled dialog leaves no orphaned object behind.
   */
  readonly pendingFile = signal<File | null>(null);
  /** Object URL previewing pendingFile; revoked whenever it is replaced. */
  readonly pendingPreview = signal<string | null>(null);
  readonly categories = signal<MenuCategoryModel[]>([]);
  /**
   * The Bulgarian name is the value: it is the key menu_items.category stores
   * and what the menu filter compares against. Only the label follows the
   * reader's language, and falls back when no English name is filled in.
   */
  readonly categoryOptions = computed(() =>
    this.categories().map((category) => ({
      value: category.name,
      label: localized(category.name, category.name_en, this.language.current()),
    }))
  );

  readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    // English is optional throughout: blank falls back to the Bulgarian text.
    name_en: [''],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
    description: [''],
    description_en: [''],
  });

  get isEdit(): boolean {
    return !!this.item;
  }

  ngOnInit(): void {
    this.scrollLock.lock();

    // Live rows: a category added moments ago on the categories page must be
    // offered here without a reload.
    this.categoriesService.fetch().subscribe((categories) => this.categories.set(categories));

    if (this.item) {
      // Explicit, not patchValue(this.item): the model's nullable *_en fields
      // do not match the non-nullable form controls.
      this.form.patchValue({
        name: this.item.name,
        name_en: this.item.name_en ?? '',
        category: this.item.category,
        price: this.item.price,
        unit: this.item.unit,
        description: this.item.description,
        description_en: this.item.description_en ?? '',
      });
      this.imagePath.set(this.item.image_path);
    }
  }

  ngOnDestroy(): void {
    this.scrollLock.release();
    this.revokePreview();
  }

  /** Shows the stored image, or the local preview of a picked one. */
  previewSrc(): string | null {
    return this.pendingPreview() ?? this.imagePath();
  }

  /** Name of the file waiting to be uploaded, shown next to the picker. */
  pendingName(): string {
    return this.pendingFile()?.name ?? '';
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.revokePreview();
    this.pendingFile.set(file);
    this.pendingPreview.set(URL.createObjectURL(file));
    this.error.set('');
    // Lets the same file be picked again after a Remove.
    input.value = '';
  }

  clearImage(): void {
    this.revokePreview();
    this.pendingFile.set(null);
    this.imagePath.set(null);
  }

  private revokePreview(): void {
    const url = this.pendingPreview();
    if (url) URL.revokeObjectURL(url);
    this.pendingPreview.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();

    this.busy.set(true);
    this.error.set('');

    // The picked file goes up first, and only then the row that points at it:
    // a failed upload must not leave a row with a dead image_path.
    const request = this.storedImagePath().pipe(
      switchMap((image_path) => {
        const fields = {
          ...raw,
          // Store an absent translation as null rather than '', so the column
          // reads the same whether it was never filled in or was cleared.
          name_en: raw.name_en?.trim() || null,
          description_en: raw.description_en?.trim() || null,
          image_path,
        };

        // The id is the database's to mint on insert, and must not move on update.
        return this.item
          ? this.menuService.update({ ...fields, id: this.item.id })
          : this.menuService.create(fields);
      })
    );

    request.subscribe({
      next: () => {
        this.busy.set(false);
        this.uploading.set(false);
        this.saved.emit();
      },
      error: (err) => {
        console.error('Save failed:', err);
        this.busy.set(false);
        this.uploading.set(false);
        this.error.set(err?.message || 'save failed');
      },
    });
  }

  /** Uploads the picked file if there is one, else keeps what the row had. */
  private storedImagePath(): Observable<string | null> {
    const file = this.pendingFile();
    if (!file) return of(this.imagePath());

    this.uploading.set(true);
    return this.storage.upload(file, 'menu');
  }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && field.touched;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (!this.busy() && !this.uploading()) this.cancelled.emit();
  }
}
