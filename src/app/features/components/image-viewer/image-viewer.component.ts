import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  signal,
  type OnInit,
} from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { ProjectImage } from '@shared/models/project.model';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-image-viewer',
  imports: [SharedModule],
  templateUrl: './image-viewer.component.html',
  styleUrl: './image-viewer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImageViewerComponent implements OnInit, OnDestroy {
  @Input({ required: true }) images: ProjectImage[] = [];
  @Input() title = '';
  @Input() dateLabel = '';
  @Input() startIndex = 0;
  @Output() closed = new EventEmitter<void>();

  readonly CONSTANTS = CONSTANTS;
  readonly index = signal(0);

  ngOnInit(): void {
    this.index.set(this.clamp(this.startIndex));
    document.body.style.overflow = 'hidden';
  }

  ngOnDestroy(): void {
    document.body.style.overflow = '';
  }

  get current(): ProjectImage | undefined {
    return this.images[this.index()];
  }

  get counter(): string {
    return `${this.index() + 1} / ${this.images.length}`;
  }

  step(delta: number): void {
    const len = this.images.length;
    if (!len) return;
    this.index.update((i) => (i + delta + len) % len);
  }

  select(i: number): void {
    this.index.set(this.clamp(i));
  }

  close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') this.close();
    if (event.key === 'ArrowRight') this.step(1);
    if (event.key === 'ArrowLeft') this.step(-1);
  }

  private clamp(i: number): number {
    if (!this.images.length) return 0;
    return Math.min(Math.max(i, 0), this.images.length - 1);
  }
}
