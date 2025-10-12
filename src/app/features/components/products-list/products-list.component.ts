import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { ProductsService } from '../../services/products.service';
import { ProjectModel } from '@shared/models/project.model';
import { Subject, takeUntil } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ImageViewerDialogComponent } from '../image-viewer-dialog/image-viewer-dialog.component';

@Component({
  selector: 'app-products-list',
  imports: [SharedModule],
  templateUrl: './products-list.component.html',
  styleUrl: './products-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductsListComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  CONSTANTS = CONSTANTS;
  projects = signal<ProjectModel[] | null>(null);
  ref: DynamicDialogRef | undefined;

  constructor(
    private productsService: ProductsService,
    private dialogService: DialogService
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

  handleViewImage(image: any, imageTitle: string, currentIndex: any) {
    const minWidthQuery = window.matchMedia('(min-width: 760px)');
    if (!minWidthQuery.matches) {
      return;
    }

    this.ref = this.dialogService.open(ImageViewerDialogComponent, {
      header: imageTitle,
      closable: true,
      modal: true,
      closeOnEscape: true,
      dismissableMask: true,
      width: '80%',
      styleClass: 'glass',
      data: {
        image,
        imageTitle,
        currentIndex,
      },
    });
  }
}
