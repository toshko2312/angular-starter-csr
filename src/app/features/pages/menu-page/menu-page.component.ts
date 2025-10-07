import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-menu-page',
  imports: [SharedModule],
  templateUrl: './menu-page.component.html',
  styleUrl: './menu-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuPageComponent implements OnInit {
  CONSTANTS = CONSTANTS

  ngOnInit(): void { }

}
