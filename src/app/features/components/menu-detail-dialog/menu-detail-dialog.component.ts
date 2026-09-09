import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  HostListener,
  inject,
  Input,
  OnDestroy,
  Output,
  type OnInit,
} from '@angular/core';
import { LanguageService } from '@core/services/language.service';
import { ScrollLockService } from '@core/services/scroll-lock.service';
import { CONSTANTS } from '@shared/constants';
import { MenuItemModel } from '@shared/models/menu-item.model';
import { SharedModule } from '@shared/shared.module';
import { localized } from '@shared/utils/localized';
import { money, unitSuffix } from '@shared/utils/money';
import { CartService } from '../../services/cart.service';

/**
 * The whole of one menu item, opened from a card in the list. The cards are
 * two to a row on a phone, which clamps the description to two lines — this is
 * where the rest of it lives, along with a full-width image and the same
 * add-to-cart control the card carries.
 */
@Component({
  selector: 'app-menu-detail-dialog',
  imports: [SharedModule],
  templateUrl: './menu-detail-dialog.component.html',
  styleUrl: './menu-detail-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuDetailDialogComponent implements OnInit, OnDestroy {
  private scrollLock = inject(ScrollLockService);
  private language = inject(LanguageService);

  readonly cart = inject(CartService);
  readonly CONSTANTS = CONSTANTS;

  @Input({ required: true }) item!: MenuItemModel;
  /** Passed in: the localised category names live in the list, not the item. */
  @Input() categoryLabel = '';
  @Output() closed = new EventEmitter<void>();

  ngOnInit(): void {
    this.scrollLock.lock();
  }

  ngOnDestroy(): void {
    this.scrollLock.release();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.closed.emit();
  }

  get name(): string {
    return localized(this.item.name, this.item.name_en, this.language.current());
  }

  get description(): string {
    return localized(this.item.description, this.item.description_en, this.language.current());
  }

  get priceLabel(): string {
    return money(this.item.price);
  }

  /** The price span already prints the symbol the unit carries. */
  get unitLabel(): string {
    return unitSuffix(this.item.unit);
  }
}
