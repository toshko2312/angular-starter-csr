import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LanguageService } from '@core/services/language.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { localePath } from '@shared/utils/locale-path';
import { localized } from '@shared/utils/localized';
import { priceWithUnit } from '@shared/utils/money';
import { CartLine } from '@shared/models/cart.model';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-drawer',
  imports: [SharedModule],
  templateUrl: './cart-drawer.component.html',
  styleUrl: './cart-drawer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CartDrawerComponent {
  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);
  private language = inject(LanguageService);

  /** Public links must be absolute and language-scoped — see localePath(). */
  path(page: string): string {
    return localePath(page, this.language.current());
  }

  nameOf(line: CartLine): string {
    return localized(line.item.name, line.item.name_en, this.language.current());
  }

  detailOf(line: CartLine): string {
    return priceWithUnit(line.lineTotal, line.item.unit);
  }
}
