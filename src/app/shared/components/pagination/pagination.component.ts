import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { ADMIN_PAGE_SIZE, pageCount } from '@shared/utils/paginate';

/**
 * Page picker for the admin lists. Renders nothing while everything fits on
 * one page, so a short list looks exactly as it did before.
 */
@Component({
  selector: 'app-pagination',
  imports: [TranslatePipe],
  templateUrl: './pagination.component.html',
  styleUrl: './pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaginationComponent {
  /** Rows in the whole list, not on the current page. */
  readonly total = input.required<number>();
  /** Two-way: a page writes [(page)]="page" and needs no handler of its own. */
  readonly page = model.required<number>();
  readonly size = input(ADMIN_PAGE_SIZE);

  readonly CONSTANTS = CONSTANTS;

  readonly pages = computed(() => pageCount(this.total(), this.size()));
  readonly numbers = computed(() => Array.from({ length: this.pages() }, (_, i) => i + 1));

  go(page: number): void {
    if (page < 1 || page > this.pages() || page === this.page()) return;
    this.page.set(page);
  }
}
