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
import { ProjectImage, ProjectModel } from '@shared/models/project.model';
import { SharedModule } from '@shared/shared.module';
import { ProductsService } from '../../../services/products.service';
import { StorageService } from '../../../services/storage.service';

@Component({
  selector: 'app-project-dialog',
  imports: [SharedModule],
  templateUrl: './project-dialog.component.html',
  styleUrl: './project-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDialogComponent implements OnInit {
  /** Null when adding, the row when editing. */
  @Input() project: ProjectModel | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private productsService = inject(ProductsService);
  private storage = inject(StorageService);

  readonly CONSTANTS = CONSTANTS;
  readonly busy = signal(false);
  readonly uploading = signal(false);
  readonly error = signal('');
  readonly images = signal<ProjectImage[]>([]);

  readonly form = this.fb.nonNullable.group({
    title: ['', Validators.required],
    date: [''],
    description: [''],
    tags: [''],
  });

  get isEdit(): boolean {
    return !!this.project;
  }

  ngOnInit(): void {
    if (this.project) {
      this.form.patchValue({
        title: this.project.title,
        date: this.toDateInput(this.project.date),
        description: this.project.description ?? '',
        tags: (this.project.tags ?? []).join(', '),
      });
      this.images.set([...(this.project.image ?? [])]);
    }
  }

  private toDateInput(value: Date | string | undefined): string {
    if (!value) return '';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    this.uploading.set(true);
    this.error.set('');
    this.storage.upload(file, 'projects').subscribe({
      next: (url) => {
        this.images.update((list) => [...list, { image_path: url, description: '' }]);
        this.uploading.set(false);
        input.value = '';
      },
      error: (err) => {
        console.error('Upload failed:', err);
        this.error.set(err?.message || 'upload failed');
        this.uploading.set(false);
      },
    });
  }

  setCaption(index: number, event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.images.update((list) =>
      list.map((image, i) => (i === index ? { ...image, description: value } : image))
    );
  }

  removeImage(index: number): void {
    this.images.update((list) => list.filter((_, i) => i !== index));
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

    const payload = {
      title: raw.title,
      date: raw.date || null,
      description: raw.description,
      tags,
      image: this.images(),
    };

    this.busy.set(true);
    this.error.set('');

    const request = this.project
      ? this.productsService.update({ ...payload, id: this.project.id } as unknown as ProjectModel)
      : this.productsService.create(payload as unknown as Omit<ProjectModel, 'id'>);

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
