import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from './shared/constants';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'angular-starter-csr';

  constructor(private translateService: TranslateService) {
    this.translateService.addLangs([CONSTANTS.LANGUAGE_BG]);
    this.translateService.setDefaultLang(CONSTANTS.LANGUAGE_BG);
    this.translateService.use(CONSTANTS.LANGUAGE_BG);
  }
}
