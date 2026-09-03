import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { MenuListComponent } from '../../components/menu-list/menu-list.component';

@Component({
  selector: 'app-menu-page',
  imports: [SharedModule, MenuListComponent],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent {
  readonly CONSTANTS = CONSTANTS;
}
