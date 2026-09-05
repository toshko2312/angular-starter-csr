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
import { EnquiryCartLine, EnquiryRecord } from '@shared/models/enquiry.model';
import { SharedModule } from '@shared/shared.module';
import { money, priceWithUnit } from '@shared/utils/money';
import { Subject, takeUntil } from 'rxjs';
import { ConfirmDialogComponent } from '../../components/admin/confirm-dialog/confirm-dialog.component';
import { EnquiriesService } from '../../services/enquiries.service';
import { MenuService } from '../../services/menu.service';

type EnquiryFilter = 'open' | 'handled' | 'all';

@Component({
  selector: 'app-admin-enquiries-page',
  imports: [SharedModule, ConfirmDialogComponent],
  templateUrl: './admin-enquiries-page.component.html',
  styleUrl: './admin-enquiries-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminEnquiriesPageComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private enquiriesService = inject(EnquiriesService);
  private menuService = inject(MenuService);

  readonly CONSTANTS = CONSTANTS;

  /** Owned by the service so the navbar badge sees the same rows. */
  readonly enquiries = this.enquiriesService.rows;
  readonly loadError = signal('');
  readonly filter = signal<EnquiryFilter>('open');
  readonly expandedId = signal<string | null>(null);
  readonly deleting = signal(false);
  readonly pendingDelete = signal<EnquiryRecord | null>(null);
  /** Ids with an in-flight handled toggle, so their button can be disabled. */
  readonly updating = signal<ReadonlySet<string>>(new Set());
  /**
   * Menu item id -> image, for cart lines saved before the enquiry snapshot
   * carried one. Empty until the menu lands, and empty if the read fails.
   */
  readonly menuImages = signal<Record<string, string | null>>({});

  /** The rows the current filter admits, before paging. */
  readonly filtered = computed(() => {
    const mode = this.filter();
    const rows = this.enquiries();
    if (mode === 'all') return rows;
    return rows.filter((row) => row.handled === (mode === 'handled'));
  });

  readonly page = signal(1);
  readonly visible = computed(() => pageSlice(this.filtered(), this.page()));

  readonly openCount = this.enquiriesService.openCount;

  constructor() {
    // Paging follows the filter: page 3 of the open requests is usually not a
    // page at all once the list switches to handled. Clamps too, so deleting
    // the last row of the last page does not strand the view.
    effect(() => this.page.update((page) => clampPage(page, this.filtered().length)));
  }

  ngOnInit(): void {
    this.load();
    this.loadMenuImages();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  load(): void {
    this.loadError.set('');
    this.enquiriesService
      .load()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {},
        // Unlike the menu and project lists, a failed read is not silently an
        // empty inbox — most likely the session is gone or RLS denied it.
        error: (err) => {
          console.error('Error fetching enquiries:', err);
          this.enquiriesService.clear();
          this.loadError.set(err?.message || 'load failed');
        },
      });
  }

  /** sessionStorage-cached on a normal admin visit, so usually free. */
  private loadMenuImages(): void {
    this.menuService
      .getMenuItems()
      .pipe(takeUntil(this.destroy$))
      .subscribe((items) =>
        this.menuImages.set(
          Object.fromEntries(items.map((item) => [item.id, item.image_path]))
        )
      );
  }

  imageOf(line: EnquiryCartLine): string | null {
    return line.image_path ?? this.menuImages()[line.id] ?? null;
  }

  setFilter(mode: EnquiryFilter): void {
    this.filter.set(mode);
    this.page.set(1);
  }

  toggleExpanded(id: string): void {
    this.expandedId.set(this.expandedId() === id ? null : id);
  }

  isUpdating(id: string): boolean {
    return this.updating().has(id);
  }

  toggleHandled(row: EnquiryRecord): void {
    const handled = !row.handled;
    this.markUpdating(row.id, true);

    this.enquiriesService
      .setHandled(row.id, handled)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        // The service updates the shared rows itself, so the badge and this
        // list move together.
        next: () => this.markUpdating(row.id, false),
        error: (err) => {
          console.error('Update failed:', err);
          this.markUpdating(row.id, false);
          this.loadError.set(err?.message || 'update failed');
        },
      });
  }

  confirmDelete(): void {
    const row = this.pendingDelete();
    if (!row) return;

    this.deleting.set(true);
    this.enquiriesService.remove(row.id).subscribe({
      next: () => {
        this.deleting.set(false);
        this.pendingDelete.set(null);
      },
      error: (err) => {
        console.error('Delete failed:', err);
        this.deleting.set(false);
        this.pendingDelete.set(null);
        this.loadError.set(err?.message || 'delete failed');
      },
    });
  }

  /** Postgres returns 'HH:mm:ss'; the seconds are always zero here. */
  timeLabel(row: EnquiryRecord): string {
    return (row.event_time || '').slice(0, 5);
  }

  lineLabel(line: EnquiryCartLine): string {
    return `${line.qty} × ${priceWithUnit(line.price, line.unit)}`;
  }

  cartTotal(row: EnquiryRecord): string {
    const total = row.cart_lines.reduce((sum, line) => sum + line.price * line.qty, 0);
    return money(total);
  }

  private markUpdating(id: string, busy: boolean): void {
    this.updating.update((ids) => {
      const next = new Set(ids);
      if (busy) next.add(id);
      else next.delete(id);
      return next;
    });
  }
}
