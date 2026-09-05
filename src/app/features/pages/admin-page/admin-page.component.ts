import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  type OnInit,
} from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { AuthService } from '@core/services/auth.service';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

/**
 * Shell for /admin. Holds the header and the robots tag; the login form and
 * the three management screens are child routes, and sign-out lives in the
 * navbar so it is reachable from every page.
 */
@Component({
  selector: 'app-admin-page',
  imports: [SharedModule, RouterOutlet],
  templateUrl: './admin-page.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPageComponent implements OnInit, OnDestroy {
  private meta = inject(Meta);

  readonly CONSTANTS = CONSTANTS;
  readonly auth = inject(AuthService);

  ngOnInit(): void {
    // Keep the panel out of search results without advertising it in robots.txt.
    this.meta.updateTag({ name: 'robots', content: 'noindex, nofollow' });
  }

  ngOnDestroy(): void {
    this.meta.removeTag("name='robots'");
  }
}
