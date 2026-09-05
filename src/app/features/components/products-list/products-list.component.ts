import {
  ChangeDetectionStrategy,
  Component,
  computed,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { LanguageService } from '@core/services/language.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { ProductsService } from '../../services/products.service';
import { ProjectImage, ProjectModel } from '@shared/models/project.model';
import { localized } from '@shared/utils/localized';
import { Subject, takeUntil } from 'rxjs';
import { ImageViewerComponent } from '../image-viewer/image-viewer.component';

interface ViewerState {
  project: ProjectModel;
  index: number;
}

@Component({
  selector: 'app-products-list',
  imports: [SharedModule, ImageViewerComponent],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  readonly CONSTANTS = CONSTANTS;
  readonly projects = signal<ProjectModel[] | null>(null);
  readonly viewer = signal<ViewerState | null>(null);
  /** Per-card carousel position, keyed by project id. */
  private readonly slideIndex = signal<Record<number, number>>({});

  /** Recomputed on a language switch so the badge is not stuck in Bulgarian. */
  private readonly monthYear = computed(
    () =>
      new Intl.DateTimeFormat(
        this.language.current() === CONSTANTS.LANGUAGE_EN ? 'en-GB' : 'bg-BG',
        { month: 'long', year: 'numeric' }
      )
  );

  constructor(
    private productsService: ProductsService,
    private language: LanguageService
  ) {}

  ngOnInit(): void {
    this.initProducts();
  }

  initProducts() {
    this.productsService
      .getProjects()
      .pipe(takeUntil(this.destroy$))
      .subscribe((res) => {
        this.projects.set(res);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** "юни 2025" — the design's date badge. */
  dateLabel(project: ProjectModel): string {
    if (!project.date) return '';
    const date = new Date(project.date);
    return isNaN(date.getTime()) ? '' : this.monthYear().format(date);
  }

  titleOf(project: ProjectModel): string {
    return localized(project.title, project.title_en, this.language.current());
  }

  /** Falls back to the shown image's caption when the row has no description. */
  descriptionOf(project: ProjectModel): string {
    return (
      localized(project.description, project.description_en, this.language.current()) ||
      this.currentImage(project)?.description ||
      ''
    );
  }

  indexOf(project: ProjectModel): number {
    return this.slideIndex()[project.id] ?? 0;
  }

  currentImage(project: ProjectModel): ProjectImage | undefined {
    return project.image?.[this.indexOf(project)];
  }

  /** Arrows sit inside the card, which itself opens the viewer on click. */
  step(project: ProjectModel, delta: number, event: Event): void {
    event.stopPropagation();
    const len = project.image?.length ?? 0;
    if (len < 2) return;
    const next = (this.indexOf(project) + delta + len) % len;
    this.slideIndex.update((state) => ({ ...state, [project.id]: next }));
  }

  openViewer(project: ProjectModel): void {
    this.viewer.set({ project, index: this.indexOf(project) });
  }

  closeViewer(): void {
    this.viewer.set(null);
  }
}
