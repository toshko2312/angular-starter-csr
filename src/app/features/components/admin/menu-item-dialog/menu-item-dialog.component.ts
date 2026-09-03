import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  Output,
  signal,
  type OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { CONSTANTS } from '@shared/constants';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { MenuService } from '../../../services/menu.service';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-menu-item-dialog',
  imports: [SharedModule],
  templateUrl: './menu-item-dialog.component.html',
  styleUrl: './menu-item-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuItemDialogComponent implements OnInit {
  /** Null when adding, the row when editing. */
  @Input() item: MenuItemModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private storage = inject(StorageService);

  readonly CONSTANTS = CONSTANTS;
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly imagePath = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    id: ['', Validators.required],
    name: ['', Validators.required],
    category: ['', Validators.required],
    price: [0, [Validators.required, Validators.min(0)]],
    unit: ['', Validators.required],
    description: [''],
  });

  get isEdit(): boolean {
    return !!this.item;
  }

  ngOnInit(): void {
    if (this.item) {
      this.form.patchValue(this.item);
      // The primary key identifies the row being updated; changing it would
      // rename a different record instead of this one.
      this.form.controls.id.disable();
      this.imagePath.set(this.item.image_path);
    }
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');
    this.storage.upload(file, 'menu').subscribe({
      next: (url) => {
        this.imagePath.set(url);
        this.uploading.set(false);
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.error.set(err?.message || 'upload failed');
        this.uploading.set(false);
      },
    });
  }

  clearImage(): void {
    this.imagePath.set(null);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const payload: MenuItemModel = {
      ...(this.form.getRawValue() as Omit<MenuItemModel, 'image_path'>),
      image_path: this.imagePath(),
    };

    this.busy.set(true);
    this.error.set('');

    const request = this.isEdit
      ? this.menuService.update(payload)
      : this.menuService.create(payload);

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
    if (!this.busy() && !this.uploading()) this.cancelled.emit();
  }
}
