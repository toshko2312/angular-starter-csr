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
import { ProjectModel } from '@shared/models/project.model';
import { SharedModule } from '@shared/shared.module';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../components/admin/confirm-dialog/confirm-dialog.component';
import { ProjectDialogComponent } from '../../components/admin/project-dialog/project-dialog.component';
import { ProductsService } from '../../services/products.service';

@Component({
  selector: 'app-admin-projects-page',
  imports: [SharedModule, ProjectDialogComponent, ConfirmDialogComponent],
  templateUrl: './admin-projects-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminProjectsPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private productsService = inject(ProductsService);

  readonly CONSTANTS = CONSTANTS;

  readonly projects = signal<ProjectModel[]>([]);
  readonly page = signal(1);
  readonly visibleProjects = computed(() => pageSlice(this.projects(), this.page()));
  readonly deleting = signal(false);

  readonly projectDialog = signal<{ project: ProjectModel | null } | null>(null);
  readonly pendingDelete = signal<ProjectModel | null>(null);

  constructor() {
    // A delete on the last page, or a shorter list after a reload, would
    // otherwise leave the view on a page with nothing on it.
    effect(() => this.page.update((page) => clampPage(page, this.projects().length)));
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
    this.productsService
      .fetch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((projects) => this.projects.set(projects));
  }

  imageCount(project: ProjectModel): number {
    return project.image?.length ?? 0;
  }

  onDialogSaved(): void {
    this.projectDialog.set(null);
    this.load();
  }

  confirmDelete(): void {
    const project = this.pendingDelete();
    if (!project) return;

    this.deleting.set(true);
    this.productsService.remove(project.id).subscribe({
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
