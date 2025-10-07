import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

@Component({
  selector: 'app-contacts-page',
  imports: [SharedModule],
  templateUrl: './contacts-page.component.html',
  styleUrl: './contacts-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactsPageComponent implements OnInit {
  CONSTANTS = CONSTANTS

  ngOnInit(): void { }

}
