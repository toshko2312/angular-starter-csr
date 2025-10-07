import { ChangeDetectionStrategy, Component, type OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';
import { MenuItem } from 'primeng/api';
import { NgOptimizedImage } from "@angular/common";

@Component({
  selector: 'app-navbar',
  imports: [SharedModule, NgOptimizedImage],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit {
  CONSTANTS = CONSTANTS;
  items: MenuItem[] = [];

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.initItems();
  }

  initItems() {
    this.items = [
      {
        label: this.translateService.instant(CONSTANTS.NAVBAR_HOME),
        icon: 'pi pi-home',
        styleClass: 'glass navbar-icons',
        iconStyle: { marginRight: '0.3rem' },
        routerLink: CONSTANTS.HOME_PAGE,
      },
      {
        label: this.translateService.instant(CONSTANTS.NAVBAR_MENU),
        icon: 'pi pi-book',
        styleClass: 'glass navbar-icons',
        iconStyle: { marginRight: '0.3rem' },
        routerLink: CONSTANTS.MENU_PAGE
      },
      {
        label: this.translateService.instant(CONSTANTS.NAVBAR_CONTACT),
        icon: 'pi pi-envelope',
        styleClass: 'glass navbar-icons',
        iconStyle: { marginRight: '0.3rem' },
        routerLink: CONSTANTS.CONTACTS_PAGE,
      },
    ];
  }
}
