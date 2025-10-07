import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { CONSTANTS } from './shared/constants';
import { NavbarComponent } from './core/components/navbar/navbar.component';
import { injectSpeedInsights } from '@vercel/speed-insights';


@Component({
  selector: 'app-root',
  imports: [RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  CONSTANTS = CONSTANTS
  title = 'angular-starter-csr';
  isTranslationLoaded: boolean = false

  constructor(private translateService: TranslateService) {
    this.translateService.addLangs([CONSTANTS.LANGUAGE_BG]);
    this.translateService.setDefaultLang(CONSTANTS.LANGUAGE_BG);
    this.translateService.use(CONSTANTS.LANGUAGE_BG);
  }

  ngOnInit(): void {
    injectSpeedInsights();
    this.translateService.get(CONSTANTS.DEFAULT_WEBSITE_TITLE).subscribe(() => {
      this.isTranslationLoaded = true
    })
  }
}
