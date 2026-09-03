import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { money } from '@shared/utils/money';
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

  detailOf(line: CartLine): string {
    return `${money(line.lineTotal)} · ${line.item.unit}`;
  }
}
