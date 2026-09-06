import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CONSTANTS } from '@shared/constants';
import { SharedModule } from '@shared/shared.module';

/**
 * Site-wide contact block. The phone number used to live only on the landing
 * page, which meant four of the six routes had no way to reach the business
 * except the enquiry form.
 *
 * No social links here on purpose: the navbar already renders
 * <app-social-links />, whose anchors carry hardcoded element ids, so a second
 * instance would duplicate them in the DOM.
 */
@Component({
  selector: 'app-footer',
  imports: [SharedModule],
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  readonly CONSTANTS = CONSTANTS;
}
