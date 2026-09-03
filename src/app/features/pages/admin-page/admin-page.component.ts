import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
  type OnInit,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Meta } from '@angular/platform-browser';
import { AuthService } from '@core/services/auth.service';
import { CONSTANTS } from '@shared/constants';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { ProjectModel } from '@shared/models/project.model';
import { SharedModule } from '@shared/shared.module';
import { money } from '@shared/utils/money';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../components/admin/confirm-dialog/confirm-dialog.component';
import { MenuItemDialogComponent } from '../../components/admin/menu-item-dialog/menu-item-dialog.component';
import { ProjectDialogComponent } from '../../components/admin/project-dialog/project-dialog.component';
import { MenuService } from '../../services/menu.service';
import { ProductsService } from '../../services/products.service';

type PendingDelete =
  | { kind: 'menu'; item: MenuItemModel }
  | { kind: 'project'; project: ProjectModel };

@Component({
  selector: 'app-admin-page',
  imports: [SharedModule, MenuItemDialogComponent, ProjectDialogComponent, ConfirmDialogComponent],
  templateUrl: './admin-page.component.html',
  styleUrl: './admin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private fb = inject(FormBuilder);
  private menuService = inject(MenuService);
  private productsService = inject(ProductsService);
  private meta = inject(Meta);

  readonly CONSTANTS = CONSTANTS;
  readonly auth = inject(AuthService);

  readonly menuItems = signal<MenuItemModel[]>([]);
  readonly projects = signal<ProjectModel[]>([]);
  readonly loginError = signal('');
  readonly signingIn = signal(false);
  readonly deleting = signal(false);

  readonly menuDialog = signal<{ item: MenuItemModel | null } | null>(null);
  readonly projectDialog = signal<{ project: ProjectModel | null } | null>(null);
  readonly pendingDelete = signal<PendingDelete | null>(null);

  readonly loginForm = this.fb.nonNullable.group({
    username: ['admin', Validators.required],
    password: ['', Validators.required],
  });

  ngOnInit(): void {
    // Keep the panel out of search results without advertising it in robots.txt.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });

    if (this.auth.isAuthenticated()) this.load();
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
    this.destroy$.next();
    this.destroy$.complete();
  }

  signIn(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { username, password } = this.loginForm.getRawValue();
    this.signingIn.set(true);
    this.loginError.set('');

    this.auth.signIn(username, password).subscribe({
      next: () => {
        this.signingIn.set(false);
        this.loginForm.reset({ username: 'admin', password: '' });
        this.load();
      },
      error: (err) => {
        console.error('Sign-in failed:', err);
        this.signingIn.set(false);
        this.loginError.set(err?.message || 'sign-in failed');
      },
    });
  }

  signOut(): void {
    this.auth.signOut().subscribe(() => {
      this.menuItems.set([]);
      this.projects.set([]);
    });
  }

  /** Always the live rows — the cached reads would hide edits made here. */
  load(): void {
    this.menuService
      .fetch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) => this.menuItems.set(items));

    this.productsService
      .fetch()
      .pipe(takeUntil(this.destroy$))
      .subscribe((projects) => this.projects.set(projects));
  }

  priceLabel(item: MenuItemModel): string {
    return money(item.price);
  }

  imageCount(project: ProjectModel): number {
    return project.image?.length ?? 0;
  }

  onDialogSaved(): void {
    this.menuDialog.set(null);
    this.projectDialog.set(null);
    this.load();
  }

  confirmDelete(): void {
    const pending = this.pendingDelete();
    if (!pending) return;

    this.deleting.set(true);
    const request =
      pending.kind === 'menu'
        ? this.menuService.remove(pending.item.id)
        : this.productsService.remove(pending.project.id);

    request.subscribe({
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

  deleteMessage(): string {
    const pending = this.pendingDelete();
    if (!pending) return '';
    return pending.kind === 'menu' ? pending.item.name : pending.project.title;
  }
}
