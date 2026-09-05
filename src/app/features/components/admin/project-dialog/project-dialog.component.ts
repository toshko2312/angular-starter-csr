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
import { ProjectImage, ProjectModel } from '@shared/models/project.model';
import { SharedModule } from '@shared/shared.module';
import { fromIsoDate, startOfToday, toIsoDate } from '@shared/utils/date';
import { DatePicker } from 'primeng/datepicker';
import { ProductsService } from '../../../services/products.service';
import { StorageService } from '../../../services/storage.service';
import { forkJoin, map, Observable, of, switchMap } from 'rxjs';

/**
 * A gallery row is either an image already stored (image_path set) or one the
 * admin just picked, held locally until Save uploads it.
 */
interface GalleryRow {
  image_path: string | null;
  description: string;
  file?: File;
  /** Object URL previewing `file`; revoked when the row goes away. */
  preview?: string;
}

@Component({
  selector: 'app-project-dialog',
  imports: [SharedModule, DatePicker],
  templateUrl: './project-dialog.component.html',
  styleUrl: './project-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDialogComponent implements OnInit, OnDestroy {
  /** Null when adding, the row when editing. */
  @Input() project: ProjectModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private storage = inject(StorageService);
  private scrollLock = inject(ScrollLockService);

  readonly CONSTANTS = CONSTANTS;
  /** These are events already delivered, so never in the future. */
  readonly today = startOfToday();
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly images = signal<GalleryRow[]>([]);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    // English is optional: blank falls back to the Bulgarian text.
    title_en: [''],
    date: [null as Date | null],
    description: [''],
    description_en: [''],
    tags: [''],
  });

  get isEdit(): boolean {
    return !!this.project;
  }

  ngOnInit(): void {
    this.scrollLock.lock();

    if (this.project) {
      this.form.patchValue({
        title: this.project.title,
        title_en: this.project.title_en ?? '',
        date: fromIsoDate(this.project.date),
        description: this.project.description ?? '',
        description_en: this.project.description_en ?? '',
        tags: (this.project.tags ?? []).join(', '),
      });
      this.images.set([...(this.project.image ?? [])]);
    }
  }

  ngOnDestroy(): void {
    this.scrollLock.release();
    this.images().forEach((row) => this.revoke(row));
  }

  /** The stored image, or the local preview of one not yet uploaded. */
  srcOf(row: GalleryRow): string | null {
    return row.preview ?? row.image_path;
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    // Nothing is stored until Save: a cancelled dialog must leave no orphaned
    // objects in the bucket.
    this.error.set('');
    this.images.update((list) => [
      ...list,
      { image_path: null, description: '', file, preview: URL.createObjectURL(file) },
    ]);
    // Lets the same file be picked again after a removal.
    input.value = '';
  }

  setCaption(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.images.update((list) =>
      list.map((image, i) => (i === index ? { ...image, description: value } : image))
    );
  }

  removeImage(index: number): void {
    const row = this.images()[index];
    if (row) this.revoke(row);
    this.images.update((list) => list.filter((_, i) => i !== index));
  }

  private revoke(row: GalleryRow): void {
    if (row.preview) URL.revokeObjectURL(row.preview);
  }

  /** Reorders within the gallery; the card and viewer show them in this order. */
  move(index: number, delta: number): void {
    this.images.update((list) => {
      const target = index + delta;
      if (target < 0 || target >= list.length) return list;
      const next = [...list];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    const tags = raw.tags
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);

    this.busy.set(true);
    this.error.set('');

    // Every picked file goes up first — together, not one dialog at a time —
    // and only then the row that references them.
    const request = this.storedImages().pipe(
      switchMap((image) => {
        const payload = {
          title: raw.title,
          title_en: raw.title_en || null,
          date: raw.date ? toIsoDate(raw.date) : null,
          description: raw.description,
          description_en: raw.description_en || null,
          tags,
          image,
        };

        return this.project
          ? this.productsService.update({
              ...payload,
              id: this.project.id,
            } as unknown as ProjectModel)
          : this.productsService.create(payload as unknown as Omit<ProjectModel, 'id'>);
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

  /**
   * Uploads the rows still holding a File and returns the gallery in screen
   * order, shaped as the column stores it.
   */
  private storedImages(): Observable<ProjectImage[]> {
    const rows = this.images();
    const pending = rows.filter((row) => row.file);
    if (!pending.length) return of(rows.map((row) => toProjectImage(row)));

    this.uploading.set(true);
    return forkJoin(pending.map((row) => this.storage.upload(row.file as File, 'projects'))).pipe(
      map((urls) => {
        const byRow = new Map(pending.map((row, index) => [row, urls[index]]));
        return rows.map((row) => toProjectImage(row, byRow.get(row)));
      })
    );
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

/** Drops the local-only fields, taking the freshly uploaded URL when given. */
function toProjectImage(row: GalleryRow, uploadedUrl?: string): ProjectImage {
  return { image_path: uploadedUrl ?? row.image_path ?? '', description: row.description };
}
