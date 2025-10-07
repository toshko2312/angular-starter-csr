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

  constructor(private productsService: ProductsService) {}

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
}
