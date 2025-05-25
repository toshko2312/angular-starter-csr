import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { CONSTANTS } from '../../../shared/constants';
import { SharedModule } from '../../../shared/shared.module';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-home',
  imports: [SharedModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  CONSTANTS = CONSTANTS;

  constructor() {}

  ngOnInit(): void {
  }
}
