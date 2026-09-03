import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { CartService } from '../../../features/services/cart.service';

@Component({
  selector: 'app-navbar',
  imports: [SharedModule],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent {
  readonly CONSTANTS = CONSTANTS;
  readonly cart = inject(CartService);
}
